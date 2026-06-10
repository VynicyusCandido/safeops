# Modelo de Dados — SafeOps

**Projeto:** P05-B — Ocorrências Operacionais  
**Sistema:** SafeOps  
**Disciplina:** Segurança da Informação — Avaliação N3  
**Responsável:** João Angelico  
**Data:** 09/06/2026

---

## 1. Justificativa do modelo

O modelo foi construído a partir dos requisitos de segurança, não das funcionalidades.
As decisões centrais são:

- **UUID como PK em todas as entidades:** impede enumeração de registros via URL. Um
  atacante não consegue deduzir IDs sequenciais para acessar ocorrências de outros usuários.
- **`solicitante_id` como chave de posse do recurso:** toda verificação de acesso no
  back-end parte dessa coluna. A regra de dono do recurso é estrutural, não opcional.
- **`LOG_AUDITORIA` como entidade imutável separada:** logs não podem ser alterados pela
  aplicação. Separar em entidade própria facilita aplicar permissão de escrita apenas ao
  back-end e leitura apenas ao ADMINISTRADOR.
- **`senha_hash` nunca retornada pela API:** a coluna existe no banco, mas nenhum
  endpoint deve serializá-la. Isso é garantido por DTOs que excluem o campo
  explicitamente.
- **Comentários imutáveis:** não existe endpoint de edição de `COMENTARIO`. Isso
  preserva a integridade da linha do tempo da ocorrência como evidência auditável.

---

## 2. Perfis de usuário

A coluna `perfil` da entidade `USUARIO` determina o que cada ator pode acessar.
São três perfis distintos, com responsabilidades e permissões diferentes:

| Perfil            | Responsabilidade                                                         |
|-------------------|--------------------------------------------------------------------------|
| SOLICITANTE       | Abre ocorrências e visualiza apenas as próprias. Pode comentar.          |
| ANALISTA          | Visualiza ocorrências sob sua responsabilidade, altera status, comenta.  |
| ADMINISTRADOR     | Gerencia usuários, visualiza todos os registros e acessa logs de auditoria. |

---

## 3. Entidades e atributos

### 3.1 USUARIO

Armazena os atores do sistema. A coluna `perfil` define o que cada usuário pode
acessar — é a base do RBAC implementado no back-end.

| Atributo       | Tipo         | Classificação    | Justificativa de segurança                              |
|----------------|--------------|------------------|---------------------------------------------------------|
| id             | UUID (PK)    | Interno          | UUID v4 impede enumeração                               |
| nome           | VARCHAR(120) | **Confidencial** | Dado pessoal identificável (LGPD)                       |
| email          | VARCHAR(150) | **Confidencial** | Dado pessoal; usado como credencial de login            |
| senha_hash     | VARCHAR(255) | **Restrito**     | BCrypt; nunca exposta em resposta de API                |
| perfil         | ENUM         | Interno          | SOLICITANTE / ANALISTA / ADMINISTRADOR                  |
| ativo          | BOOLEAN      | Interno          | Permite desativar conta sem excluir histórico           |
| criado_em      | TIMESTAMP    | Interno          | Trilha de auditoria de criação                          |
| atualizado_em  | TIMESTAMP    | Interno          | Detecta modificações inesperadas                        |

---

### 3.2 OCORRENCIA

Entidade principal do sistema. O campo `solicitante_id` é o ponto de controle de
posse: toda leitura ou escrita deve verificar se o usuário autenticado é o dono ou
tem perfil que permite acesso amplo.

Ao concluir o cadastro, o sistema exibe um alerta de confirmação na tela — não há
re-autenticação por senha. A ação é registrada em `LOG_AUDITORIA`.

| Atributo        | Tipo         | Classificação    | Justificativa de segurança                                    |
|-----------------|--------------|------------------|---------------------------------------------------------------|
| id              | UUID (PK)    | Interno          | UUID v4 impede enumeração via URL                             |
| titulo          | VARCHAR(200) | Interno          | Resumo sem dados sensíveis                                    |
| descricao       | TEXT         | **Confidencial** | Pode conter detalhes operacionais internos                    |
| status          | ENUM         | Interno          | ABERTA / EM_ANALISE / RESOLVIDA / ENCERRADA                   |
| prioridade      | ENUM         | Interno          | BAIXA / MEDIA / ALTA / CRITICA                                |
| solicitante_id  | UUID (FK)    | Interno          | **Chave de posse do recurso** — verificada em toda requisição |
| analista_id     | UUID (FK)    | Interno          | Nullable; atribuído pelo ANALISTA ou ADMINISTRADOR            |
| criado_em       | TIMESTAMP    | Interno          | Imutável após criação                                         |
| atualizado_em   | TIMESTAMP    | Interno          | Atualizado automaticamente pelo ORM                           |
| encerrado_em    | TIMESTAMP    | Interno          | Nullable; preenchido ao encerrar                              |

---

### 3.3 COMENTARIO

Permite comunicação entre SOLICITANTE e ANALISTA dentro da ocorrência. O acesso é
restrito: SOLICITANTE só vê comentários da própria ocorrência; ANALISTA vê os de
ocorrências sob sua responsabilidade; ADMINISTRADOR vê todos.

| Atributo       | Tipo        | Classificação    | Justificativa de segurança                              |
|----------------|-------------|------------------|---------------------------------------------------------|
| id             | UUID (PK)   | Interno          | UUID v4                                                 |
| ocorrencia_id  | UUID (FK)   | Interno          | Herda as restrições de acesso da ocorrência             |
| autor_id       | UUID (FK)   | Interno          | Identifica o autor; impede falsificação de autoria      |
| conteudo       | TEXT        | **Confidencial** | Pode conter informações operacionais sensíveis          |
| criado_em      | TIMESTAMP   | Interno          | Imutável; comentários não são editáveis                 |

---

### 3.4 LOG_AUDITORIA

Entidade central de rastreabilidade. Registra todas as ações relevantes do sistema.
Nenhum endpoint da aplicação permite edição ou exclusão dessa entidade — somente
inserção. O acesso de leitura é exclusivo do ADMINISTRADOR.

| Atributo     | Tipo        | Classificação    | Justificativa de segurança                                    |
|--------------|-------------|------------------|---------------------------------------------------------------|
| id           | UUID (PK)   | Interno          | UUID v4                                                       |
| usuario_id   | UUID (FK)   | Interno          | Nullable — permite registrar tentativas de acesso anônimas    |
| acao         | VARCHAR(80) | Interno          | Código da ação: LOGIN, CRIAR_OCORRENCIA, ACESSO_NEGADO etc.   |
| entidade     | VARCHAR(60) | Interno          | Nome da entidade afetada: Ocorrencia, Usuario etc.            |
| entidade_id  | UUID        | Interno          | ID do registro afetado (nullable para ações globais)          |
| detalhe      | TEXT        | **Confidencial** | Contexto adicional; nunca deve conter senhas ou tokens        |
| ip_origem    | VARCHAR(45) | **Confidencial** | Endereço de origem; dado de auditoria                         |
| criado_em    | TIMESTAMP   | Interno          | Imutável; gerado pelo banco com `DEFAULT NOW()`               |

---

## 4. Relacionamentos

| De         | Para          | Cardinalidade | Via                     | Tipo de restrição             |
|------------|---------------|---------------|-------------------------|-------------------------------|
| USUARIO    | OCORRENCIA    | 1 : N         | solicitante_id          | Dono do recurso               |
| USUARIO    | OCORRENCIA    | 1 : N         | analista_id (nullable)  | Atribuição de responsável     |
| USUARIO    | COMENTARIO    | 1 : N         | autor_id                | Autoria imutável              |
| USUARIO    | LOG_AUDITORIA | 1 : N         | usuario_id (nullable)   | Rastreabilidade de ações      |
| OCORRENCIA | COMENTARIO    | 1 : N         | ocorrencia_id           | Herança de controle de acesso |

---

## 5. Ações registradas em log

| Ação                  | Gatilho                                               |
|-----------------------|-------------------------------------------------------|
| LOGIN                 | Autenticação bem-sucedida                             |
| LOGIN_FALHO           | Credenciais incorretas                                |
| CRIAR_OCORRENCIA      | Solicitante confirma alerta e cadastro é persistido   |
| ALTERAR_STATUS        | Analista ou Admin altera status de ocorrência         |
| ADICIONAR_COMENTARIO  | Qualquer perfil adiciona comentário                   |
| ATRIBUIR_ANALISTA     | Admin ou Analista assume ocorrência                   |
| ACESSO_NEGADO         | Requisição bloqueada por falta de permissão           |
| CRIAR_USUARIO         | Admin cria novo usuário                               |
| EDITAR_USUARIO        | Admin altera perfil ou dados                          |
| VISUALIZAR_LOGS       | Admin acessa painel de auditoria                      |

---

*Ver diagrama ER em `docs/diagrama-er.png`.*
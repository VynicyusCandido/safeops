# Tabela de Ativos — SafeOps

**Projeto:** P05-B — Ocorrências Operacionais  
**Sistema:** SafeOps  
**Disciplina:** Segurança da Informação — Avaliação N3  
**Responsável:** João Angelico  
**Data:** 09/06/2026

---

## 1. Critérios de classificação

| Nível           | Critério de enquadramento                                                        |
|-----------------|----------------------------------------------------------------------------------|
| **Restrito**    | Exposição causa comprometimento direto de autenticação ou integridade do sistema. Acesso somente por processos automatizados do back-end. |
| **Confidencial**| Exposição viola privacidade de usuários ou revela informações operacionais internas. Acesso apenas a perfis autorizados com necessidade específica. |
| **Interno**     | Circula dentro do sistema sem restrição entre perfis autorizados. Não divulgado publicamente. |
| **Público**     | Pode ser divulgado sem restrição.                                                |

---

## 2. Tabela de ativos

| # | Ativo                          | Tipo            | Classificação    | Onde fica                                    | Risco principal se exposto                              | Valor   |
|---|--------------------------------|-----------------|------------------|----------------------------------------------|---------------------------------------------------------|---------|
| 1 | Hashes de senha dos usuários   | Dado            | **Restrito**     | Tabela `usuario`, coluna `senha_hash`        | Ataque de dicionário ou brute-force sobre os hashes     | Alto    |
| 2 | Chave secreta JWT              | Configuração    | **Restrito**     | Variável de ambiente `JWT_SECRET`            | Permite forjar tokens válidos para qualquer usuário     | Alto    |
| 3 | Credenciais do banco de dados  | Configuração    | **Restrito**     | Variável de ambiente `DB_PASSWORD` e afins   | Acesso direto ao banco sem passar pela aplicação        | Alto    |
| 4 | Arquivo `.env`                 | Configuração    | **Restrito**     | Servidor de aplicação — fora do repositório  | Exposição simultânea de todos os segredos de produção   | Alto    |
| 5 | JWT em cookie                  | Dado            | **Restrito**     | Navegador (Cookie)                           | Sequestro de sessão sem necessidade de senha            | Alto    |
| 6 | E-mails dos usuários           | Dado            | **Confidencial** | Tabela `usuario`, coluna `email`             | Exposição de dado pessoal identificável (LGPD art. 5º)  | Alto    |
| 7 | Nomes dos usuários             | Dado            | **Confidencial** | Tabela `usuario`, coluna `nome`              | Dado pessoal identificável (LGPD)                       | Médio   |
| 8 | Descrições de ocorrências      | Dado            | **Confidencial** | Tabela `ocorrencia`, coluna `descricao`      | Acesso indevido a informações operacionais internas     | Médio   |
| 9 | Conteúdo de comentários        | Dado            | **Confidencial** | Tabela `comentario`, coluna `conteudo`       | Exposição de comunicação interna entre usuários         | Médio   |
|10 | IPs de origem das requisições  | Dado            | **Confidencial** | Tabela `log_auditoria`, coluna `ip_origem`   | Identificação de usuários por endereço de rede          | Médio   |
|11 | Logs de auditoria              | Dado            | **Confidencial** | Tabela `log_auditoria`                       | Alteração ou exclusão elimina rastreabilidade de ações  | Médio   |
|12 | Banco de dados PostgreSQL      | Infraestrutura  | **Restrito**     | Container Docker, rede interna               | Acesso direto expõe todos os dados sem controle de perfil | Alto  |
|13 | Código-fonte da aplicação      | Infraestrutura  | **Interno**      | Repositório GitHub                           | Engenharia reversa de regras de negócio e pontos fracos | Médio   |
|14 | Perfis e permissões            | Dado            | **Interno**      | Tabela `usuario`, coluna `perfil`            | Escalada de privilégio se alterado diretamente no banco | Médio   |
|15 | Status das ocorrências         | Dado            | **Interno**      | Tabela `ocorrencia`, coluna `status`         | Impacto baixo isolado; relevante em conjunto com outros | Baixo   |

---

## 3. Hierarquia de valor

```
ALTO — comprometimento causa impacto imediato e sistêmico
├── Hashes de senha               → BCrypt como controle primário
├── Chave secreta JWT             → variável de ambiente; rotação em incidente
├── Credenciais do banco          → variável de ambiente; rede Docker fechada
├── Arquivo .env                  → .gitignore obrigatório; .env.example no repo
├── JWT em cookie                 → HTTPS obrigatório; expiração curta
├── E-mails dos usuários          → excluídos de DTOs de resposta pública
└── Banco de dados (acesso direto)→ exposto apenas na rede interna Docker

MÉDIO — impacto significativo, exige controle de acesso por perfil
├── Nomes dos usuários
├── Descrições de ocorrências
├── Conteúdo de comentários
├── IPs de origem
├── Logs de auditoria
├── Código-fonte
└── Perfis e permissões

BAIXO — impacto limitado isoladamente
└── Status das ocorrências
```

---

## 4. Relação ativo × controle implementado

| Ativo                         | Controle                                                         |
|-------------------------------|------------------------------------------------------------------|
| Hashes de senha               | BCrypt com fator de custo ≥ 12; nunca retornado pela API         |
| Chave secreta JWT             | Variável de ambiente; revogação exige reinicialização da aplicação |
| Credenciais do banco          | Variável de ambiente; banco exposto apenas na rede Docker interna |
| Arquivo `.env`                | `.gitignore` configurado; `.env.example` sem valores reais no repo |
| JWT em cookie                 | TLS obrigatório; expiração configurável (padrão: 30 min)         |
| E-mails e nomes de usuários   | DTOs excluem campos sensíveis; acesso restrito por perfil        |
| Descrições e comentários      | Autorização por dono do recurso verificada no back-end           |
| Logs de auditoria             | Sem endpoint de edição ou exclusão; leitura restrita ao ADMINISTRADOR |
| IPs de origem                 | Armazenados apenas em `log_auditoria`; não expostos em API       |
| Banco de dados                | Rede Docker isolada; porta não exposta externamente              |

---

*Tabela derivada do modelo de dados em `docs/modelo-dados.md`.*
# Relatório de Achados e Limitações — SafeOps

**Projeto:** P05-B — Ocorrências Operacionais  
**Sistema:** SafeOps  
**Disciplina:** Segurança da Informação — Avaliação N3  
**Responsável:** João Angelico  
**Data:** 16/06/2026  
**Status:** Esqueleto — evidências a preencher após sistema em execução

---

## 1. Metodologia

A identificação dos achados foi realizada por autoauditoria do modelo de dados,
das regras de acesso definidas na matriz de permissões e da arquitetura do sistema.
Os achados são classificados em três severidades:

| Severidade | Critério |
|------------|----------|
| **Alta**   | Compromete autenticação, autorização ou integridade de dados sensíveis |
| **Média**  | Reduz rastreabilidade ou expõe informações internas indevidamente |
| **Baixa**  | Impacto limitado isoladamente; relevante em conjunto com outros achados |

---

## 2. Achados

### A01 — Acesso indevido a ocorrência por manipulação de ID na URL

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Alta |
| **Categoria**  | Autorização — controle de dono do recurso |
| **Descrição**  | Um SOLICITANTE autenticado poderia tentar acessar a ocorrência de outro usuário substituindo o UUID na URL da requisição. Se o back-end não verificar que `solicitante_id` corresponde ao usuário autenticado, o recurso é retornado indevidamente. |
| **Evidência**  | *(preencher: teste manual trocando o UUID na rota `/api/ocorrencias/{id}` com usuário sem permissão)* |
| **Risco**      | Exposição de dados operacionais confidenciais de outro usuário |
| **Controle aplicado** | Verificação de `solicitante_id === usuarioAutenticado.id` no serviço do back-end antes de retornar o recurso |
| **Recomendação** | Garantir que todo endpoint que recebe um ID de ocorrência valide a posse do recurso na camada de serviço, não apenas na camada de rota |
| **Status**     | Controle planejado — a verificar após implementação |

---

### A02 — Tentativas de acesso negado não registradas em log

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Média |
| **Categoria**  | Auditoria — rastreabilidade de eventos de segurança |
| **Descrição**  | Se um usuário tentar acessar um recurso sem permissão e o sistema retornar apenas HTTP 403, sem registrar o evento em `LOG_AUDITORIA`, não há evidência rastreável da tentativa. Em uma investigação de incidente, a ausência desse registro impede reconstruir a linha do tempo. |
| **Evidência**  | *(preencher: teste de acesso ao painel administrativo com perfil SOLICITANTE; verificar se a tabela `log_auditoria` registra o evento `ACESSO_NEGADO`)* |
| **Risco**      | Falta de rastreabilidade de tentativas de escalada de privilégio |
| **Controle aplicado** | Ação `ACESSO_NEGADO` definida no plano de logs; deve ser disparada pelo handler de exceções de autorização do Spring Security |
| **Recomendação** | Implementar interceptor global que registre IP, `usuario_id`, rota tentada e timestamp sempre que uma requisição for bloqueada por falta de permissão |
| **Status**     | Controle planejado — a verificar após implementação |

---

### A03 — Ausência de limite de tentativas de login

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Alta |
| **Categoria**  | Autenticação — proteção contra brute-force |
| **Descrição**  | Sem rate limiting no endpoint de login, um atacante pode tentar credenciais indefinidamente. O BCrypt reduz a velocidade de cada tentativa, mas não impede automação em volume. |
| **Evidência**  | *(preencher: verificar se o endpoint `/api/auth/login` aceita N requisições seguidas sem bloqueio)* |
| **Risco**      | Brute-force de senhas, especialmente de contas com senhas fracas |
| **Controle aplicado** | BCrypt com fator de custo ≥ 12 reduz velocidade por tentativa |
| **Recomendação** | Implementar bloqueio temporário de IP ou de conta após N tentativas falhas consecutivas; registrar cada `LOGIN_FALHO` em `LOG_AUDITORIA` com IP de origem |
| **Status**     | Limitação conhecida — sem controle completo na versão atual |

---

### A04 — Tokens JWT sem mecanismo de revogação

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Média |
| **Categoria**  | Autenticação — gestão de sessão |
| **Descrição**  | JWT é stateless por natureza. Se um token válido for comprometido (ex.: interceptação, vazamento de dispositivo), ele permanece válido até expirar. Não há como invalidá-lo antes do vencimento sem uma lista de revogação. |
| **Evidência**  | *(preencher: verificar se existe endpoint de logout que invalida o token no servidor)* |
| **Risco**      | Sequestro de sessão com token interceptado válido por até 1h |
| **Controle aplicado** | Expiração curta do token (padrão: 1h); uso de HTTPS impede interceptação em trânsito |
| **Recomendação** | Implementar blocklist de tokens revogados em Redis ou na própria tabela do banco; ou adotar refresh token com rotação |
| **Status**     | Limitação conhecida — mitigada parcialmente pela expiração curta |

---

### A05 — Comentários visíveis para analistas sem vínculo com a ocorrência

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Média |
| **Categoria**  | Autorização — granularidade de acesso |
| **Descrição**  | Se a autorização de ANALISTA for implementada como "ver todas as ocorrências em aberto", um analista sem vínculo com uma ocorrência específica poderia ler os comentários dela. O vínculo deveria ser via `analista_id` da ocorrência. |
| **Evidência**  | *(preencher: teste com dois ANALISTAs — verificar se ANALISTA B acessa comentários de ocorrência atribuída ao ANALISTA A)* |
| **Risco**      | Exposição de comunicação interna entre solicitante e analista responsável |
| **Controle aplicado** | `COMENTARIO.ocorrencia_id` herda as restrições da ocorrência; acesso de ANALISTA deve ser filtrado por `analista_id` |
| **Recomendação** | No back-end, o filtro de ocorrências para ANALISTA deve incluir `WHERE analista_id = :usuarioAutenticado` ou `WHERE status = ABERTA AND analista_id IS NULL` para triagem |
| **Status**     | Controle planejado — depende da implementação da query de listagem |

---

### A06 — Logs de auditoria sem proteção contra exclusão administrativa

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Média |
| **Categoria**  | Auditoria — integridade dos registros |
| **Descrição**  | O perfil ADMINISTRADOR tem acesso amplo ao sistema. Se o banco não tiver restrição explícita de `DELETE` na tabela `log_auditoria`, um administrador mal-intencionado ou comprometido pode apagar rastros de ações. |
| **Evidência**  | *(preencher: verificar permissões do usuário de aplicação no PostgreSQL sobre a tabela `log_auditoria`)* |
| **Risco**      | Destruição de evidências em caso de incidente interno |
| **Controle aplicado** | Nenhum endpoint da aplicação expõe `DELETE` em `LOG_AUDITORIA`; acesso de leitura restrito ao ADMINISTRADOR |
| **Recomendação** | Revogar `DELETE` e `UPDATE` na tabela `log_auditoria` diretamente no PostgreSQL para o usuário da aplicação: `REVOKE DELETE, UPDATE ON log_auditoria FROM safeops_app;` |
| **Status**     | Limitação conhecida — controle parcial via ausência de endpoint |

---

### A07 — Ausência de validação de força de senha no cadastro

| Campo        | Descrição |
|--------------|-----------|
| **Severidade** | Baixa |
| **Categoria**  | Autenticação — qualidade de credenciais |
| **Descrição**  | Se o back-end não validar complexidade mínima da senha no cadastro, usuários podem definir senhas triviais (ex.: `123456`), reduzindo a eficácia do BCrypt contra dicionário. |
| **Evidência**  | *(preencher: tentar cadastrar usuário com senha `123` — verificar se o back-end rejeita)* |
| **Risco**      | Senhas fracas facilitam brute-force mesmo com hash BCrypt |
| **Controle aplicado** | BCrypt dificulta ataques em volume |
| **Recomendação** | Adicionar validação no back-end: mínimo 8 caracteres, ao menos uma letra maiúscula, uma minúscula e um número |
| **Status**     | Limitação conhecida — controle não implementado na versão atual |

---

## 3. Resumo dos achados

| ID  | Achado                                              | Severidade | Status do controle        |
|-----|-----------------------------------------------------|------------|---------------------------|
| A01 | Acesso indevido por manipulação de ID               | Alta       | Planejado                 |
| A02 | Tentativas negadas sem registro em log              | Média      | Planejado                 |
| A03 | Sem limite de tentativas de login                   | Alta       | Limitação conhecida       |
| A04 | JWT sem mecanismo de revogação                      | Média      | Mitigado parcialmente     |
| A05 | Comentários visíveis para analistas sem vínculo     | Média      | Planejado                 |
| A06 | Logs sem proteção contra exclusão administrativa    | Média      | Limitação conhecida       |
| A07 | Sem validação de força de senha                     | Baixa      | Limitação conhecida       |

---

## 4. Instrução para preenchimento das evidências

Após o sistema estar em execução, preencher o campo **Evidência** de cada achado com:

- print da requisição e resposta (Postman, Insomnia ou curl)
- ou print da tabela `log_auditoria` antes e depois do teste
- ou trecho de código que implementa o controle

As evidências serão incorporadas ao relatório técnico final (entrega 29/06).

---

*Documento derivado do modelo de dados em `docs/modelo-dados.md` e da matriz de permissões em `docs/matriz-permissoes.md`.*

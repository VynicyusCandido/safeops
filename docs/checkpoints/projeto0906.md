# Planejamento da Entrega — Checkpoint 08/06 (+ adiantamento 15/06)

**Data do planejamento:** 09/06/2026  
**Prazo de envio:** hoje (09/06), até o fim do dia  
**Formato de entrega:** PDF único ("Relatório de fundação técnica") enviado no Teams

---

## 1. Contexto

O professor alterou o formato da entrega: em vez de itens soltos no Teams, a entrega passa a ser **um PDF** cobrindo as atividades dos encontros de 08/06 e 15/06, em duas partes:

- **Parte 1 — enviar hoje:** Relatório de fundação técnica: arquitetura inicial, matriz de permissões, modelo de dados, tecnologias escolhidas, README inicial, primeiros commits e planejamento técnico do sistema.
- **Parte 2 — fazer agora, enviar somente em 15/06:** arquitetura revisada, relatório-base iniciado, ativos, riscos, plano de logs, plano de controles e início funcional do sistema.

### Diretrizes do adendo (critérios de avaliação)

O adendo (`si-projeto-adendo.pdf`) define o que será avaliado de fato:

1. **Raciocínio de segurança acima de funcionalidades** — identificação de ativos, análise de riscos, definição de controles e rastreabilidade entre eles.
2. **Justificativa técnica para toda escolha** — familiaridade prévia, popularidade ou tutoriais **não** são justificativas válidas. Cada decisão deve mapear para um requisito funcional ou de segurança.
3. **Definição formal do domínio** abrindo o relatório: função principal do sistema, atores, modelo de negócios, necessidade prática endereçada e valor entregue.
4. **Security by Design** — RBAC, MFA, logs de auditoria, backup/DR, TLS e criptografia em repouso devem aparecer desde a arquitetura, não como camada final.

---

## 2. Divisão de tarefas

### João Angelico — Modelagem de dados e ativos

| Parte | Tarefa | Entregável |
|---|---|---|
| 1 (hoje) | Modelo de dados: entidades, atributos, relacionamentos, diagrama ER. Marcar campos sensíveis (senha, dados pessoais). | `docs/modelo-dados.md` + seção do PDF |
| 2 (adiantar) | Tabela de ativos com hierarquia de valor e classificação da informação (deriva do modelo de dados). | `docs/ativos.md` |

### Alisson Anderle — Permissões, domínio, riscos e controles

| Parte | Tarefa | Entregável |
|---|---|---|
| 1 (hoje) | Matriz de permissões (perfis × ações × recursos) + definição do domínio (as 5 perguntas do adendo) para abrir o relatório. | `docs/matriz-permissoes.md` + seção de domínio do PDF |
| 2 (adiantar) | Tabela de riscos (ameaça × vulnerabilidade × impacto) + plano de controles, cada controle apontando para o risco que mitiga. | `docs/riscos-e-controles.md` |

### Gustavo Taques — Arquitetura, justificativa de stack e backend

| Parte | Tarefa | Entregável |
|---|---|---|
| 1 (hoje) | Arquitetura inicial (diagrama + descrição: camadas, TLS, JWT, BCrypt) + justificativa técnica da stack (cada tecnologia → requisito/risco) + planejamento técnico. | `docs/arquitetura.md` + seções do PDF |
| 2 (adiantar) | Scaffold do backend Spring Boot (Security, JPA, PostgreSQL) + `docker-compose.yml` do banco + uma rota verificável (ex.: `/api/health` ou login). | código no repo |

### Vynicyus Candido — Consolidação, envio e frontend

| Parte | Tarefa | Entregável |
|---|---|---|
| 1 (hoje) | Atualizar README; montar o PDF consolidando as partes de todos; enviar no Teams; garantir acesso do professor e commits de todos os integrantes. | PDF enviado + README |
| 2 (adiantar) | Scaffold do frontend Next.js (Tailwind/Shadcn) + plano de logs de auditoria (eventos, campos, retenção) + esqueleto do relatório-base para 15/06. | código no repo + `docs/plano-logs.md` |

---

## 3. Sequência da noite

1. **Chamada de alinhamento (~15 min, todos):** fechar a lista de entidades principais (Usuario, Ocorrencia, Comentario, LogAuditoria) — modelo de dados, matriz de permissões, ativos e arquitetura dependem dela.
2. **Produção da Parte 1:** cada um escreve sua seção e **commita no repositório com a própria conta** (gera a evidência de commits de 4 autores).
3. **Consolidação:** Vyni monta o PDF e envia no Teams.
4. **Parte 2:** o tempo restante da noite vai para os itens de adiantamento. **Não submeter a Parte 2** — guardar para 15/06.

## 4. Dependências e riscos

- **Matriz de permissões ↔ modelo de dados:** as ações da matriz referenciam as entidades. Resolvido pela chamada de alinhamento inicial.
- **Carga do Vyni:** consolidação + frontend + plano de logs pode ficar pesado. Mitigação: se necessário, o plano de logs migra para o Alisson, que já estará trabalhando em controles.
- **Prazo curto:** prioridade absoluta é a Parte 1. Itens da Parte 2 que não saírem hoje ficam para a semana — o prazo real deles é 15/06.

## 5. Critérios de pronto (Parte 1)

- [ ] PDF contém: domínio, descrição do sistema, stack com justificativas, perfis, matriz de permissões, modelo de dados, arquitetura, planejamento técnico.
- [ ] README atualizado no repositório.
- [ ] Commits de cada um dos 4 integrantes após 01/06.
- [ ] Professor com acesso confirmado ao repositório.
- [ ] PDF enviado no Teams dentro do prazo.
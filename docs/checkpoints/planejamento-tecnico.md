# Planejamento Técnico — SafeOps

## 1. Roadmap por Checkpoint

| Marco | Entregas técnicas | Responsáveis |
|---|---|---|
| **Até 15/06** — checkpoint conceitual | Scaffolds de backend e frontend integrados; entidades JPA criadas; banco persistindo via Docker; login em desenvolvimento; tela inicial verificável; tabelas de ativos e riscos; planos de logs e controles; relatório-base iniciado | Backend: Gustavo · Frontend: Vyni · Ativos: João · Riscos/controles: Alisson · Logs: Vyni |
| **Até 22/06** — checkpoint de implementação | Sistema executável de ponta a ponta: login com JWT em cookie httpOnly; BCrypt; 3 perfis com usuários de teste; CRUD de ocorrências com regra de dono do recurso; exemplo de ação bloqueada (HTTP 403); logs de auditoria gravando; `.env` fora do Git; README com instruções de execução; plano de backup | Todos (frentes definidas no plano de divisão) |
| **Até 29/06** — entrega final e defesa | MFA TOTP para ADMINISTRADOR; dashboard administrativo; evidências de segurança (testes e capturas); relatório técnico final; ensaio da defesa e do incidente simulado | Todos |

## 2. Ordem de Implementação do Backend

Cada etapa entrega algo demonstrável, na ordem em que os checkpoints cobram:

1. Entidades e migrations (`Usuario`, `Ocorrencia`, `Comentario`, `LogAuditoria`);
2. Autenticação: registro, login, emissão do JWT em cookie httpOnly;
3. RBAC nos endpoints (perfis SOLICITANTE, ANALISTA, ADMINISTRADOR);
4. CRUD de ocorrências com checagem de dono do recurso;
5. Auditoria: registro automático de ações sensíveis;
6. MFA (TOTP) para o perfil ADMINISTRADOR.

## 3. Fluxo de Trabalho no Git

- Uma branch por funcionalidade; merge em `main` via Pull Request;
- Commits pequenos e frequentes, **cada integrante com a própria conta**.

Justificativa: a defesa final inclui perguntas individuais ("onde está sua
contribuição no GitHub?") — o histórico de commits é evidência avaliada de
participação, não burocracia de processo.

## 4. Evoluções de Segurança Previstas

| Evolução | Risco residual que mitiga | Janela |
|---|---|---|
| Refresh token com rotação | Janela de validade do access token (hoje limitada à expiração de ~30 min) | Após 22/06, havendo folga |
| Rate limiting no endpoint de login | Força bruta de credenciais | Após 22/06, havendo folga |

## 5. Riscos do Cronograma

- **Integração front↔back tardia.** Mitigação: rota `/api/health` e CORS testados
  com o frontend já até 15/06.
- **Dependência do modelo de dados.** A matriz de permissões, a arquitetura e as
  entidades JPA referenciam as mesmas entidades. Mitigação: alinhamento de
  entidades feito pelo grupo em 09/06.

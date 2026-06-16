# Design — Parte do Gustavo: Fundação Técnica (Checkpoint 08/06 + adiantamento 15/06)

**Data:** 09/06/2026
**Responsável:** Gustavo Taques
**Referência:** [2026-06-09-divisao-entrega-checkpoint-0806-design.md](2026-06-09-divisao-entrega-checkpoint-0806-design.md)

## Escopo

Fatia do Gustavo no plano de divisão:

- **Parte 1 (enviar hoje, vira seções do PDF):** três documentos — `docs/arquitetura.md`,
  `docs/stack.md` e `docs/planejamento-tecnico.md`.
- **Parte 2 (adiantar, não submeter):** scaffold do backend Spring Boot +
  `docker-compose.yml` do PostgreSQL + uma rota verificável.

Os documentos são de autoria exclusiva do Gustavo; tocam o trabalho dos demais apenas
por referência (roadmap cita marcos do grupo; a tabela de decisões de segurança é insumo
para o plano de controles do Alisson; as entidades do diagrama seguem o modelo do João).

## Decisões de arquitetura fechadas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Entrega do JWT | Cookie httpOnly + Secure + SameSite, access token de vida curta (~30 min) | Mitiga roubo de sessão via XSS (OWASP A03/A07); decisão arquitetural rastreável a risco, alinhada ao Security by Design do adendo. Refresh token com rotação fica documentado como evolução prevista. |
| MFA | TOTP obrigatório apenas para o perfil ADMINISTRADOR | Controle proporcional ao risco: é o ator com acesso a usuários e logs de auditoria. Viável até 29/06 com biblioteca TOTP no Spring. |
| Comunicação front↔back | SPA Next.js chama a API REST do Spring Boot diretamente, com CORS restrito à origem do frontend e cookies com credenciais | Três camadas claras (cliente → API → banco), cada controle visível na fronteira. BFF/proxy descartado por YAGNI. |
| Formato do diagrama | Mermaid dentro de `docs/arquitetura.md` | Renderiza no GitHub, versionado junto do texto; Vyni exporta imagem para o PDF. |

## Documento 1 — `docs/arquitetura.md`

1. **Visão geral** — 3 camadas: Cliente (Next.js SPA) → API REST (Spring Boot) →
   PostgreSQL (Docker). A separação permite aplicar controles em cada fronteira.
2. **Diagrama Mermaid** — browser com SPA; fronteira TLS/HTTPS; API com camadas
   internas (Controllers → Services → Repositories) e filtro de segurança (JWT + RBAC)
   na entrada; PostgreSQL; fluxo de auditoria (ações sensíveis → tabela de logs).
   Entidades conforme alinhamento com o João (Usuario, Ocorrencia, Comentario,
   LogAuditoria).
3. **Decisões de segurança incorporadas ao design** — tabela decisão → risco mitigado:
   - JWT em cookie httpOnly/Secure/SameSite → roubo de sessão via XSS
   - BCrypt para senhas → exposição de credenciais em vazamento do banco
   - RBAC (3 perfis) + checagem de dono do recurso → acesso indevido / escalação de privilégio
   - MFA TOTP para ADMINISTRADOR → comprometimento da conta de maior privilégio
   - TLS em produção → interceptação de dados em trânsito
   - Validação no backend + JPA parametrizado → injeção de SQL e dados malformados
   - Logs de auditoria imutáveis → falta de rastreabilidade / repúdio
4. **Evoluções previstas** — refresh token com rotação (risco residual: janela de
   validade do access token); rate limiting no login (força bruta).

## Documento 2 — `docs/stack.md`

1. **Critérios de escolha** declarados antes das escolhas: suporte nativo a controles de
   segurança, maturidade do ecossistema, integridade dos dados, capacidade de auditar o
   código que entra no projeto. (Blinda contra a crítica de "familiaridade" do adendo.)
2. **Tabela tecnologia → papel → justificativa → requisito/risco atendido:**
   - Java 21 + Spring Boot 3 → tipagem forte, ecossistema corporativo maduro → base de autenticação e RBAC
   - Spring Security → filtros de referência, JWT, BCrypt, method security → autenticação robusta, RBAC, hash
   - JPA/Hibernate → queries parametrizadas por padrão → mitiga SQL injection (A03)
   - PostgreSQL → ACID, constraints rígidas, roles no banco → integridade e confidencialidade em repouso
   - Next.js + React + TypeScript → escape automático de output, tipagem estática → mitiga XSS, reduz defeitos
   - Tailwind + Shadcn UI → código copiado para o repo, auditável, sem dependência opaca → risco de supply chain (A06)
   - Docker (PostgreSQL) → paridade de ambiente entre 4 devs, isolamento → reprodutibilidade e disponibilidade
3. **Alternativas consideradas** — 3–4 linhas: Node/Express, MySQL, sessões server-side
   vs JWT — o que foi descartado e por quê (análise comparativa exigida pelo adendo).

## Documento 3 — `docs/planejamento-tecnico.md`

1. **Roadmap por checkpoint** (marco, entregas técnicas, responsáveis):
   - **Até 15/06:** scaffolds integrados, entidades JPA, banco persistindo via Docker,
     login em desenvolvimento, tela inicial verificável.
   - **Até 22/06:** sistema executável de ponta a ponta — login JWT/cookie, BCrypt,
     3 perfis + usuários de teste, CRUD de ocorrências com dono do recurso, exemplo de
     403, logs de auditoria gravando, `.env` fora do Git, README com instruções,
     plano de backup.
   - **Até 29/06:** MFA TOTP do admin, dashboard administrativo, evidências de
     segurança, relatório final, ensaio da defesa e do incidente simulado.
2. **Ordem de implementação do backend:** entidades/migrations → autenticação
   (registro, login, cookie) → RBAC nos endpoints → CRUD ocorrências + dono do recurso
   → auditoria → MFA. Cada etapa entrega algo demonstrável.
3. **Fluxo de trabalho Git:** branch por funcionalidade, PR para `main`, commits
   pequenos com a conta de cada integrante — o histórico é evidência avaliada na defesa
   individual.
4. **Evoluções de segurança previstas:** refresh token com rotação e rate limiting,
   posicionadas no tempo ("após 22/06, se houver folga"), cada uma com o risco residual
   que mitiga.
5. **Riscos do cronograma:** integração front↔back tardia (mitigação: `/api/health` +
   CORS testados até 15/06); dependência do modelo de dados do João (mitigação:
   alinhamento de entidades hoje).

## Parte 2 — Scaffold do backend (adiantamento, não submeter)

- Projeto Spring Boot 3.x (Java 21) com dependências: Web, Security, Data JPA,
  PostgreSQL Driver, Validation.
- `docker-compose.yml` com PostgreSQL, credenciais via `.env` (já existe `.env.example`).
- Rota verificável `/api/health` respondendo sem autenticação (liberada explicitamente
  na configuração do Security), provando app + banco no ar.
- Estrutura de pacotes espelhando as camadas do diagrama: `controller`, `service`,
  `repository`, `entity`, `config/security`.

## Critérios de pronto

- [ ] Três documentos escritos em `docs/`, em português, prontos para o Vyni montar o PDF.
- [ ] Diagrama Mermaid renderizando corretamente no GitHub.
- [ ] Toda decisão nos documentos rastreável a um requisito ou risco (checklist do adendo).
- [ ] Scaffold do backend rodando localmente com `/api/health` respondendo e banco via Docker.
- [ ] Commits do Gustavo no repositório cobrindo documentos e scaffold.

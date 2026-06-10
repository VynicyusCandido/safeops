# Tecnologias Escolhidas e Justificativas — SafeOps

## 1. Critérios de Escolha

As tecnologias foram selecionadas a partir de quatro critérios definidos **antes**
das escolhas: (1) suporte nativo a controles de segurança exigidos pelo projeto
(autenticação, RBAC, hash de senhas); (2) maturidade do ecossistema e histórico de
correção de vulnerabilidades; (3) garantias de integridade dos dados; e
(4) capacidade da equipe de auditar o código que entra no projeto. Cada escolha
abaixo está mapeada ao requisito funcional ou risco de segurança que atende.

## 2. Stack e Justificativas

| Tecnologia | Papel | Justificativa técnica | Requisito/risco atendido |
|---|---|---|---|
| Java 21 + Spring Boot 3.x | Plataforma do backend | Tipagem forte e ecossistema maduro para aplicações corporativas, com ciclo de patches de segurança previsível | Base para autenticação, RBAC e validação |
| Spring Security | Autenticação e autorização | Implementação de referência de filtros de segurança: suporte nativo a JWT, `BCryptPasswordEncoder` e method security (`@PreAuthorize`) | Autenticação robusta; RBAC; hash de senhas |
| JPA/Hibernate | Persistência | Queries parametrizadas por padrão eliminam concatenação de SQL na camada de dados | Mitiga injeção de SQL (OWASP A03) |
| PostgreSQL 16 | Banco de dados | Transações ACID e constraints rígidas garantem integridade dos registros de ocorrência; controle de acesso por roles no próprio banco | Integridade e confidencialidade dos dados em repouso |
| Next.js + React + TypeScript | Frontend SPA | React escapa output por padrão (reduz XSS); TypeScript elimina classes de erro em tempo de compilação | Mitiga XSS (OWASP A03); reduz defeitos |
| Tailwind CSS + Shadcn UI | Camada de UI | Shadcn copia os componentes para o repositório — código auditável pela equipe, sem dependência opaca de terceiros | Reduz superfície de supply chain (OWASP A06) |
| Docker (PostgreSQL) | Infraestrutura local | Paridade de ambiente entre os 4 desenvolvedores e isolamento do banco em container | Reprodutibilidade; disponibilidade no desenvolvimento |

## 3. Alternativas Consideradas

- **Node.js/Express (backend):** descartado — a pilha de segurança (autenticação,
  RBAC, validação) precisaria ser montada manualmente a partir de bibliotecas
  avulsas, ampliando a superfície de erro de configuração frente ao Spring Security.
- **MySQL (banco):** descartado — o PostgreSQL oferece conformidade SQL mais
  estrita e constraints mais rígidas, relevantes para a integridade exigida pelos
  registros de ocorrência e logs.
- **Sessões server-side (autenticação):** alternativa válida; optou-se por JWT
  stateless em cookie httpOnly para manter a API sem estado de sessão, simplificando
  o deploy, sem expor o token a JavaScript (mesma proteção XSS da sessão clássica).

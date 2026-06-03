# SafeOps - Sistema de Ocorrências Operacionais

Projeto desenvolvido para a disciplina de **Segurança da Informação (Avaliação N3)** - Centro Universitário.

## 1. Identificação do Projeto (Checkpoint 01/06)
- **Código:** P05-B – Ocorrências Internas (Ocorrências Operacionais)
- **Nome do Sistema:** SafeOps
- **Integrantes:** 
  - Alisson Anderle
  - Gustavo Taques
  - João Angelico
  - Vynicyus Candido

## 2. Descrição Curta
Sistema web para registro, controle e monitoramento de ocorrências operacionais internas. Focado em garantir a integridade dos dados, restrição de acesso baseada em perfis e rastreabilidade total via logs de auditoria.

## 3. Stack Tecnológica
- **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Shadcn UI.
- **Backend:** Java 21, Spring Boot 3.x, Spring Security, JPA/Hibernate.
- **Banco de Dados:** PostgreSQL (Docker).

## 4. Perfis de Usuário
- **SOLICITANTE:** Registra e visualiza suas próprias ocorrências.
- **ANALISTA:** Analisa e altera status de ocorrências.
- **ADMINISTRADOR:** Gerencia usuários e audita logs do sistema.

## 5. Funcionalidades Planejadas
- Autenticação JWT e Hash de senhas (BCrypt).
- CRUD de Ocorrências com controle de dono do recurso.
- Logs de Auditoria para ações sensíveis.
- Dashboard Administrativo.

---
*Professor: Edson Vaz Lopes*

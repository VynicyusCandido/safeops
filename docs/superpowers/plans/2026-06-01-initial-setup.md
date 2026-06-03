# SafeOps - Checkpoint 01/06 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the project repository with mandatory documentation and configuration for the first checkpoint (01/06).

**Architecture:** Monorepo-style structure containing both Backend (Spring Boot) and Frontend (Next.js) directories with shared documentation.

**Tech Stack:** Next.js, Spring Boot, Java 21, PostgreSQL, Docker.

---

### Task 1: Project Documentation (README)

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create the main README with project details**

```markdown
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
```

### Task 2: Git Configuration

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create a comprehensive .gitignore for Java, Node, and IDEs**

```text
# IDEs
.vscode/
.idea/
*.swp
*.swo

# Node / Frontend
node_modules/
.next/
out/
build/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Java / Backend
target/
!.mvn/wrapper/maven-wrapper.jar
*.class
*.jar
*.war
*.ear
*.log

# Database / Secrets
.env
docker-data/
```

### Task 3: Secrets Template

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example with necessary environment variables**

```text
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/safeops
DB_USERNAME=admin
DB_PASSWORD=secret_password

# JWT Security
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres
JWT_EXPIRATION=3600000

# Application
SERVER_PORT=8080
```

### Task 4: Local Git Initialization and First Push

**Files:**
- Modify: Local repository state

- [ ] **Step 1: Initialize git and add files**

Run:
```bash
git init
git add .
git commit -m "feat: initial project structure for checkpoint 01/06"
```

- [ ] **Step 2: Link to remote and push**

Run:
```bash
git remote add origin https://github.com/VynicyusCandido/safeops.git
git branch -M main
git push -u origin main
```

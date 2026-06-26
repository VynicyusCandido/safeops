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

## 5. Funcionalidades

**Implementadas:**
- Autenticação JWT via cookie `session-token` (httpOnly, SameSite=Strict, HS256).
- Hash de senhas com BCrypt.
- Logs de Auditoria com 10 eventos rastreados (`AuditAction`).
- Controle de acesso por perfil (`@PreAuthorize`) com `SOLICITANTE`, `ANALISTA`, `ADMINISTRADOR`.
- CRUD de Ocorrências com controle de dono do recurso (ocorrências são imutáveis — sem exclusão).
- Usuários de teste criados automaticamente via Liquibase (troca de senha obrigatória no primeiro acesso).

**Em desenvolvimento:**
- Dashboard Administrativo.

---

## 6. Como Executar Localmente

### Pré-requisitos

- [Docker](https://www.docker.com/) (para subir o banco de dados)
- Java 21
- Node.js 18+

### Passo a passo

**1. Clonar o repositório**

```bash
git clone https://github.com/VynicyusCandido/safeops.git
cd safeops
```

**2. Configurar as variáveis de ambiente**

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha os valores:

```
DB_URL=jdbc:postgresql://localhost:5432/safeops
DB_USERNAME=admin
DB_PASSWORD=sua_senha

JWT_SECRET=          # gere com: openssl rand -base64 32
COOKIE_SECURE=false  # false em dev local (sem HTTPS)

SERVER_PORT=8080
```

> **Atenção:** `JWT_SECRET` deve ser uma string **base64 válida** que decodifica para no mínimo 32 bytes. Gere com `openssl rand -base64 32`.

**3. Subir o banco de dados**

```bash
docker compose up -d
```

Isso inicializa o container `safeops-db` com PostgreSQL 16 na porta 5432.

**4. Rodar o backend**

```bash
cd backend
set -a && source ../.env && set +a
./mvnw spring-boot:run
```

No Windows:

```bash
cd backend
mvnw.cmd spring-boot:run
```

> O backend lê as configurações do ambiente. No Windows, defina as variáveis do `.env` manualmente ou use um terminal WSL/Git Bash com o comando acima.

Na primeira subida, o sistema cria automaticamente o usuário administrador com as credenciais definidas em `ADMIN_EMAIL` e `ADMIN_SENHA`. **A troca de senha é obrigatória antes do primeiro acesso.**

#### Primeiro acesso: troca de senha obrigatória

Como o administrador inicial não possui sessão ativa, a troca de senha usa um fluxo sem autenticação:

```bash
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@safeops.com",
    "senhaAtual": "Admin@1234",
    "novaSenha": "SuaNovaSenha@123"
  }'
```

A resposta inclui o cookie `session-token` — o administrador já fica autenticado após a troca. Para logins subsequentes, use `POST /api/auth/login` normalmente (sem o campo `email` no body).

**5. Rodar o frontend**

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

**6. Verificar que o backend está no ar**

```bash
curl http://localhost:8080/api/health
```

Resposta esperada:

```json
{"status":"UP"}
```

---
*Professor: Edson Vaz Lopes*

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
DB_USERNAME=safeops
DB_PASSWORD=sua_senha
JWT_SECRET=sua_chave_secreta_com_minimo_32_caracteres
JWT_EXPIRATION=3600000
SERVER_PORT=8080
```

> **Atenção:** `JWT_SECRET` deve ter **no mínimo 32 caracteres**.

**3. Subir o banco de dados**

```bash
docker compose up -d
```

Isso inicializa o container `safeops-db` com PostgreSQL 16 na porta 5432.

**4. Rodar o backend**

```bash
cd backend
./mvnw spring-boot:run
```

No Windows:

```bash
cd backend
mvnw.cmd spring-boot:run
```

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

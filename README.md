# SafeOps - Sistema de Ocorrências Operacionais

Projeto desenvolvido para a disciplina de **Segurança da Informação (Avaliação N3)** - Centro Universitário.

## 1. Identificação do Projeto
- **Código:** P05-B – Ocorrências Internas (Ocorrências Operacionais)
- **Nome do Sistema:** SafeOps
- **Integrantes:** 
  - Alisson Anderle
  - Gustavo Taques
  - João Angelico
  - Vynicyus Candido

## 2. Descrição
Sistema web para registro, controle e monitoramento de ocorrências operacionais internas. Focado em garantir a integridade dos dados, restrição de acesso baseada em perfis e rastreabilidade total via logs de auditoria.

## 3. Stack Tecnológica
| Camada | Tecnologias |
|---|---|
| **Frontend** | Next.js (React), TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | Java 21, Spring Boot 3.x, Spring Security, JPA/Hibernate |
| **Banco de Dados** | PostgreSQL 16 (via Docker) |
| **Autenticação** | JWT (cookie httpOnly), BCrypt, TOTP (MFA) |

## 4. Perfis de Usuário
| Perfil | Permissões |
|---|---|
| **SOLICITANTE** | Registra e visualiza suas próprias ocorrências |
| **ANALISTA** | Analisa e altera status de ocorrências |
| **ADMINISTRADOR** | Gerencia usuários e audita logs do sistema |

## 5. Funcionalidades
- Autenticação JWT via cookie `session-token` (httpOnly, SameSite=Strict, HS256).
- Autenticação em Dois Fatores (MFA/TOTP) obrigatória com QR Code no primeiro acesso.
- Hash de senhas com BCrypt.
- Logs de Auditoria com 10 eventos rastreados.
- Controle de acesso por perfil (`@PreAuthorize`).
- CRUD de Ocorrências com controle de dono do recurso (ocorrências são imutáveis — sem exclusão).
- Troca de senha obrigatória no primeiro acesso.
- Dashboard Administrativo.

---

## 6. Como Executar a Aplicação (Passo a Passo)

### Pré-requisitos

Antes de começar, certifique-se de que você tem instalado na sua máquina:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — para rodar o banco de dados PostgreSQL
- [Java 21 (JDK)](https://adoptium.net/) — para compilar e rodar o backend
- [Node.js 18+](https://nodejs.org/) — para rodar o frontend
- [Git](https://git-scm.com/) — para clonar o repositório

---

### Passo 1 — Clonar o repositório

Abra o terminal e execute:

```bash
git clone https://github.com/VynicyusCandido/safeops.git
cd safeops
```

---

### Passo 2 — Configurar as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Abra o arquivo `.env` com qualquer editor de texto e preencha os valores:

```env
# Configuração do Banco de Dados
DB_URL=jdbc:postgresql://localhost:5432/safeops
DB_USERNAME=admin
DB_PASSWORD=coloque_uma_senha_forte_aqui

# Segurança JWT (gere a chave com: openssl rand -base64 32)
JWT_SECRET=cole_aqui_a_chave_gerada
COOKIE_SECURE=false

# Porta da aplicação
SERVER_PORT=8080
```

> ⚠️ **Importante:** O `JWT_SECRET` deve ser uma string Base64 de no mínimo 32 bytes. Gere com o comando `openssl rand -base64 32` no terminal. **Nunca compartilhe essa chave.**

---

### Passo 3 — Subir o Banco de Dados

Com o Docker Desktop aberto, execute na raiz do projeto:

```bash
docker compose up -d
```

Isso vai criar e iniciar o container `safeops-db` com o PostgreSQL 16 na porta `5432`. Você pode verificar se está rodando com `docker ps`.

---

### Passo 4 — Rodar o Backend (API)

Abra um terminal na pasta `backend` e execute:

**Linux / macOS / Git Bash:**
```bash
cd backend
set -a && source ../.env && set +a
./mvnw spring-boot:run
```

**Windows (PowerShell / CMD):**
```bash
cd backend
mvn spring-boot:run
```

> No Windows, as variáveis do `.env` são carregadas automaticamente pelo `application.yml` do Spring Boot.

Na primeira execução, o Liquibase criará todas as tabelas e os usuários de teste automaticamente. O backend ficará acessível em `http://localhost:8080`.

---

### Passo 5 — Rodar o Frontend

Abra **outro terminal** na pasta `frontend` e execute:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em `http://localhost:3000`.

---

## 7. Primeiro Acesso (Login)

Com o backend e o frontend rodando, siga estes passos:

### 7.1 — Abra o navegador

Acesse `http://localhost:3000`. Você será redirecionado para a tela de login.

### 7.2 — Credenciais dos usuários de teste

Os seguintes usuários são criados automaticamente no banco:

| Perfil | E-mail | Senha inicial |
|---|---|---|
| ADMINISTRADOR | `admin@safeops.com` | `Admin@1234` |
| ANALISTA | `analista@safeops.com` | `Analista@1234` |
| SOLICITANTE | `solicitante@safeops.com` | `Solicitante@1234` |

### 7.3 — Trocar a senha obrigatória

No primeiro login com qualquer um dos usuários acima, o sistema exigirá a **troca de senha**. Isso é obrigatório por segurança — as senhas de teste não podem ser usadas para acessar o sistema.

1. Digite o e-mail e a senha inicial na tela de login.
2. O sistema redirecionará para a tela de **troca de senha**.
3. Informe a senha atual (a inicial) e crie uma nova senha (mínimo 8 caracteres).
4. Clique em "Alterar Senha".

### 7.4 — Configurar a Autenticação em Dois Fatores (MFA)

Após trocar a senha, ao fazer login com a nova senha, o sistema exibirá um **QR Code** na tela. Este é o momento de vincular sua conta a um aplicativo autenticador.

1. Instale no celular um app autenticador como o **Google Authenticator** ou **Microsoft Authenticator** (disponível na App Store e Play Store).
2. No app, toque em "+" e selecione "Escanear QR Code".
3. Escaneie o QR Code exibido na tela do sistema.
4. O app começará a gerar códigos de 6 dígitos que mudam a cada 30 segundos.
5. Digite o código de 6 dígitos exibido no app e clique em "Verificar".
6. Pronto! Você será logado no sistema.

> 💡 **O QR Code é exibido apenas uma vez**, no momento da configuração inicial. Nos próximos logins, o sistema pedirá apenas o código de 6 dígitos gerado pelo seu aplicativo autenticador.

### 7.5 — Logins seguintes

Nos acessos posteriores, o fluxo de login será:

1. Digitar e-mail e senha → Clicar em "Entrar".
2. Digitar o código de 6 dígitos do aplicativo autenticador → Clicar em "Verificar".
3. Acesso liberado ao Dashboard.

---

## 8. Verificar que o Backend está no ar

```bash
curl http://localhost:8080/api/health
```

Resposta esperada:

```json
{"status":"UP"}
```

---
*Professor: Edson Vaz Lopes*

# Proposta de Projeto - Avaliação N3 (Segurança da Informação)

**Data de Entrega:** 01/06/2026
**Professor:** Edson Vaz Lopes

---

### 1. Projeto do Grupo
**Código:** P05-B
**Variação:** Ocorrências Internas — Ocorrências Operacionais

### 2. Nome Provisório do Sistema
**SafeOps**

### 3. Nomes dos Integrantes
1. Alisson Anderle
2. Gustavo Taques
3. João Angelico
4. Vynicyus Candido

### 4. Link do Repositório GitHub
[https://github.com/VynicyusCandido/safeops.git](https://github.com/VynicyusCandido/safeops.git)

### 5. Confirmação de Acesso do Professor
O professor possui acesso ao repositório (via repositório público ou convite).

### 6. Descrição Curta do Sistema
O **SafeOps** é um sistema web projetado para o registro, controle e monitoramento de ocorrências operacionais internas. O sistema foca na garantia da confidencialidade e integridade dos registros através de autenticação robusta, autorização baseada em perfis (RBAC) e uma trilha de auditoria completa para todas as ações críticas.

### 7. Stack Pretendida
- **Frontend:** React, TypeScript, Next.js, Tailwind CSS, Shadcn UI.
- **Backend:** Java 21, Spring Boot 3.x, Spring Security, JPA/Hibernate.
- **Banco de Dados:** PostgreSQL rodando em Docker.

### 8. Perfis de Usuário Previstos
- **Solicitante (Colaborador):** Registra ocorrências e visualiza exclusivamente os seus próprios envios.
- **Analista Operacional:** Responsável por analisar, comentar e alterar o status das ocorrências sob sua gestão.
- **Administrador/Gestor:** Gerencia usuários, permissões, dashboards gerenciais e possui acesso total aos logs de auditoria.

### 9. Funcionalidades Mínimas Previstas
- Autenticação segura com JWT.
- Armazenamento de senhas com Hash BCrypt.
- CRUD completo de ocorrências com lógica de "Dono do Recurso".
- Sistema de Auditoria (Logs) para login, criação e mudanças de status.
- Validação de dados rigorosa no Backend.

### 10. Registro Inicial do Projeto
O repositório já contém a estrutura inicial de documentação (README, .gitignore e Plano de Design) para dar suporte ao desenvolvimento.

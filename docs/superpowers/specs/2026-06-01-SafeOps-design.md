# Design Document - SafeOps

**Projeto:** P05-B – Ocorrências Internas (Ocorrências Operacionais)  
**Data:** 01/06/2026  
**Status:** Em Revisão (Aguardando Aprovação do Usuário)

---

## 1. Visão Geral
O **SafeOps** é um sistema web desenvolvido para a disciplina de Segurança da Informação (Avaliação N3). O objetivo é gerenciar ocorrências operacionais internas de forma segura, garantindo autenticação, autorização por perfil (RBAC), auditoria completa (logs) e proteção de dados sensíveis.

## 2. Arquitetura e Stack Tecnológica
O sistema seguirá uma arquitetura desacoplada (Frontend e Backend separados).

- **Frontend:**
  - Framework: Next.js (React) + TypeScript.
  - Estilização: Tailwind CSS + Shadcn UI.
  - Comunicação: Axios/Fetch para API REST.
- **Backend:**
  - Linguagem: Java 21.
  - Framework: Spring Boot 3.x.
  - Segurança: Spring Security + JWT.
- **Persistência e Infraestrutura:**
  - Banco de Dados: PostgreSQL.
  - Containerização: Docker + Docker Compose.

## 3. Perfis de Usuário (RBAC)
1. **SOLICITANTE:** 
   - Pode registrar novas ocorrências.
   - Pode visualizar apenas as suas próprias ocorrências.
2. **ANALISTA:** 
   - Visualiza todas as ocorrências de sua área/responsabilidade.
   - Pode alterar status (ex: "Em Análise", "Resolvido").
   - Adiciona comentários técnicos.
3. **ADMINISTRADOR:** 
   - Gerencia usuários e permissões.
   - Acesso total aos logs de auditoria.
   - Visão gerencial (dashboards).

## 4. Requisitos de Segurança
- **Autenticação:** JWT com expiração curta e Refresh Token.
- **Senhas:** Armazenamento utilizando Hash BCrypt.
- **Autorização:** Verificação de perfil e "Dono do Recurso" no Backend.
- **Gestão de Segredos:** Uso de variáveis de ambiente (`.env`) e exclusão de segredos do GitHub.
- **Auditoria:** Logs de eventos (Login, Logout, Criação, Alteração de Status, Acesso Negado).

## 5. Modelo de Dados (Principais Entidades)
- **User:** id, nome, email, senha_hash, perfil (Enum), status.
- **Ocorrencia:** id, titulo, descricao, data_criacao, status, solicitante_id, analista_id.
- **AuditLog:** id, usuario_id, acao, timestamp, ip, detalhes.

## 6. Plano de Implementação (Fases)
1. **Fase 1 (01/06):** Definição e Setup (README, Git, Proposta).
2. **Fase 2 (08/06):** Fundação Técnica (Modelo de Dados e Matriz de Permissões).
3. **Fase 3 (15/06):** Desenvolvimento do Core (Auth e CRUD Base).
4. **Fase 4 (22/06):** Segurança e Logs (Implementação final dos controles).
5. **Fase 5 (29/06):** Entrega Final e Defesa.

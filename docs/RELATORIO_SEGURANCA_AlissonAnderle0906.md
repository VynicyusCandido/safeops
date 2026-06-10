# RELATÓRIO DE SEGURANÇA: SAFEOPS
## Projeto P05-B — Ocorrências Internas

**Integrantes:** Alisson Anderle, Gustavo Taques, João Angelico, Vynicyus Candido  
**Instituição:** Centro Universitário  
**Disciplina:** Segurança da Informação (Avaliação N3)  
**Professor:** Edson Vaz Lopes  
**Data:** 2026

---

## SUMÁRIO
1. [Introdução](#1-introdução)
2. [Definição do Domínio e Matriz de Permissões](#2-definição-do-domínio-e-matriz-de-permissões)
   - 2.1 [Definição do Domínio (As 5 Perguntas)](#21-definição-do-domínio-as-5-perguntas)
   - 2.2 [Matriz de Permissões (RBAC)](#22-matriz-de-permissões-rbac)
3. [Análise de Riscos e Plano de Controles](#3-análise-de-riscos-e-plano-de-controles)
   - 3.1 [Tabela de Riscos](#31-tabela-de-riscos)
   - 3.2 [Plano de Controles e Rastreabilidade](#32-plano-de-controles-e-rastreabilidade)
4. [Conclusão](#4-conclusão)

---

## 1. INTRODUÇÃO
O presente relatório detalha as estratégias de segurança implementadas e planejadas para o sistema **SafeOps**. O foco principal é a garantia da integridade, confidencialidade e disponibilidade dos dados de ocorrências operacionais internas, utilizando práticas recomendadas de segurança da informação e arquitetura de software moderna.

---

## 2. DEFINIÇÃO DO DOMÍNIO E MATRIZ DE PERMISSÕES

### 2.1 Definição do Domínio (As 5 Perguntas)
A seguir, são apresentadas as respostas às cinco perguntas fundamentais que definem o domínio de segurança do projeto SafeOps.

1. **O que deve ser protegido?**  
   Devem ser protegidos os registros de ocorrências operacionais (dados sensíveis do negócio), as credenciais de acesso dos usuários (armazenadas via hash seguro) e a integridade dos logs de auditoria.

2. **De quem deve ser protegido?**  
   Deve ser protegido contra atacantes externos (tentativas de injeção e bypass de autenticação) e contra usuários internos que tentem exceder seus privilégios (escalação horizontal ou vertical).

3. **Por que deve ser protegido?**  
   Para garantir a continuidade operacional, a confiabilidade das informações gerenciais e a conformidade com as diretrizes de auditoria interna.

4. **Quem é o responsável pela proteção?**  
   A equipe técnica (SafeOps Team) é responsável pela implementação e manutenção dos controles lógicos, enquanto o Administrador é responsável pela gestão de políticas e monitoramento.

5. **Como a proteção será feita?**  
   Através de uma arquitetura multicamadas envolvendo autenticação JWT, controle de acesso baseado em perfis (RBAC), criptografia de dados em repouso e trânsito, e trilhas de auditoria exaustivas.

### 2.2 Matriz de Permissões (RBAC)
Abaixo, a matriz de permissões cruzando perfis de usuário, recursos e ações permitidas.

| Recurso | Ação | SOLICITANTE | ANALISTA | ADMINISTRADOR |
| :--- | :--- | :---: | :---: | :---: |
| Ocorrência | Criar | Sim | Não | Sim |
| Ocorrência | Visualizar (Própria) | Sim | Sim | Sim |
| Ocorrência | Visualizar (Todas) | Não | Sim | Sim |
| Ocorrência | Editar Status | Não | Sim | Sim |
| Ocorrência | Excluir | Não | Não | Sim |
| Usuários | Gerenciar (CRUD) | Não | Não | Sim |
| Logs | Visualizar Auditoria | Não | Não | Sim |
| Dashboards | Visualizar | Não | Sim | Sim |

---

## 3. ANÁLISE DE RISCOS E PLANO DE CONTROLES

### 3.1 Tabela de Riscos
A tabela descreve os principais riscos identificados, suas vulnerabilidades associadas e o impacto esperado.

| ID | Ameaça | Vulnerabilidade | Impacto | Gravidade |
| :--- | :--- | :--- | :--- | :---: |
| **R1** | Acesso não autorizado por força bruta | Ausência de limite de tentativas de login | Vazamento de dados e comprometimento de contas | Alta |
| **R2** | Injeção de código (SQL Injection) | Falta de sanitização de inputs no backend | Perda de integridade e acesso total ao banco | Crítica |
| **R3** | Escalação de privilégios | Falha na validação do token JWT ou RBAC | Ações administrativas por usuários comuns | Alta |
| **R4** | Interceptação de dados | Comunicação via HTTP sem criptografia | Exposição de credenciais e dados | Alta |
| **R5** | Alteração indevida de registros | Falta de trilha de auditoria para edições | Perda de confiabilidade e rastreabilidade | Média |

### 3.2 Plano de Controles e Rastreabilidade
Esta seção vincula os controles implementados aos riscos mitigados, garantindo a rastreabilidade exigida.

| Controle | Descrição Técnica | Risco Mitigado |
| :--- | :--- | :---: |
| **C1: BCrypt** | Armazenamento de senhas com Hash BCrypt + Salt. | R1 |
| **C2: JWT** | Tokens com expiração curta e Refresh Tokens. | R3, R4 |
| **C3: RBAC** | Filtros de segurança via Spring Security. | R3 |
| **C4: JPA** | Consultas parametrizadas (anti-SQL Injection). | R2 |
| **C5: Logs** | Auditoria automatizada de todas as alterações. | R5 |
| **C6: HTTPS** | Criptografia TLS para trânsito de dados. | R4 |

---

## 4. CONCLUSÃO
A estratégia de segurança adotada para o SafeOps cobre os principais vetores de ataque identificados na análise de riscos. A implementação rigorosa do modelo RBAC e a rastreabilidade via logs de auditoria garantem que o sistema atenda aos requisitos da disciplina e forneça um ambiente seguro para a gestão de ocorrências operacionais.

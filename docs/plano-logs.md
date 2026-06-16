# Plano de Logs e Trilhas de Auditoria — SafeOps

**Projeto:** P05-B — Ocorrências Operacionais  
**Sistema:** SafeOps  
**Disciplina:** Segurança da Informação — Avaliação N3  
**Responsável:** Alisson Anderle  
**Data:** 16/06/2026

---

## 1. Objetivo

Definir quais eventos do sistema SafeOps serão registrados em log de auditoria,
onde cada registro é capturado na arquitetura, quais campos são obrigatórios, quem
pode consultar os registros e quais limitações existem na versão atual.

Os logs de auditoria são um controle de segurança da categoria **Detectar** (NIST
CSF): permitem identificar atividade suspeita, reconstruir a sequência de um
incidente e produzir evidências íntegras para investigação.

---

## 2. Arquitetura de captura

O sistema possui dois pontos de captura de eventos:

### Ponto 1 — Camada de serviço (captura manual)

Cada service chama `auditService.log(...)` explicitamente após ações sensíveis.
Cobre 8 dos 10 eventos definidos.

A captura manual é uma decisão de AppSec: log de auditoria é um controle de
segurança e deve ser visível em revisão de código. A alternativa por AOP (`@Aspect`)
foi descartada porque self-invocation em beans Spring bypassa o proxy
silenciosamente, podendo produzir ausência de log sem erro aparente.

### Ponto 2 — Filtro de segurança (Spring Security)

Dois handlers registrados no `SecurityConfig` capturam eventos rejeitados antes
de atingir qualquer controller ou service:

- `LOGIN_FALHO` → `AuthenticationFailureHandler`
- `ACESSO_NEGADO` → `AccessDeniedHandler` + `AuthenticationEntryPoint`

### Fluxo resumido

```
Requisição
  └── Filtro de Segurança (Spring Security)
        ├── [rejeitada] → Handler de segurança → auditService.log(LOGIN_FALHO | ACESSO_NEGADO)
        └── [aprovada]  → Controller → Service
                                          └── auditService.log(evento de negócio)
                                          └── persiste entidade principal
```

---

## 3. Contrato do `AuditService`

### 3.1 Ações registradas (enum)

```java
public enum AuditAction {
    LOGIN,               // autenticação bem-sucedida
    LOGIN_FALHO,         // credenciais incorretas
    CRIAR_OCORRENCIA,    // nova ocorrência registrada
    ALTERAR_STATUS,      // status de ocorrência alterado
    ADICIONAR_COMENTARIO,// comentário adicionado à ocorrência
    ATRIBUIR_ANALISTA,   // analista atribuído à ocorrência
    CRIAR_USUARIO,       // novo usuário criado pelo admin
    EDITAR_USUARIO,      // dados ou perfil de usuário alterados
    ACESSO_NEGADO,       // requisição bloqueada por falta de permissão
    VISUALIZAR_LOGS      // painel de auditoria acessado pelo admin
}
```

### 3.2 Interface do serviço

Dois overloads: um para eventos com usuário autenticado identificado, outro para
eventos anônimos (sem sessão ativa).

```java
public interface AuditService {

    // Eventos com usuário autenticado
    void log(AuditAction acao,
             UUID usuarioId,
             String entidade,
             UUID entidadeId,
             String detalhe,
             HttpServletRequest request);

    // Eventos anônimos (sem sessão ativa)
    void log(AuditAction acao,
             String detalhe,
             HttpServletRequest request);
}
```

### 3.3 Regras de preenchimento dos campos

| Campo | Regra |
|---|---|
| `ip_origem` | Extraído de `request.getRemoteAddr()` pelo próprio serviço — nunca passado pelo caller |
| `criado_em` | Gerado pelo banco (`DEFAULT NOW()`) — a aplicação não passa o valor |
| `detalhe` | Nunca contém senha, hash, token ou conteúdo completo de ocorrências |
| `entidade` / `entidadeId` | Nullable nos eventos sem recurso-alvo (ex: `ACESSO_NEGADO`, `VISUALIZAR_LOGS`) |

---

## 4. Tabela de eventos

| Evento | Camada | `entidade` | `entidadeId` | Conteúdo do `detalhe` |
|---|---|---|---|---|
| `LOGIN` | Service (`AuthService`) | `Usuario` | id do usuário | `"email: x@y.com"` |
| `LOGIN_FALHO` | SecurityFilter | `null` | `null` | `"tentativa com email: x@y.com"` |
| `CRIAR_OCORRENCIA` | Service (`OcorrenciaService`) | `Ocorrencia` | id criado | `"titulo: '...'"` |
| `ALTERAR_STATUS` | Service (`OcorrenciaService`) | `Ocorrencia` | id da ocorrência | `"de: ABERTA → para: EM_ANALISE"` |
| `ADICIONAR_COMENTARIO` | Service (`ComentarioService`) | `Comentario` | id do comentário | `"ocorrencia_id: ..."` |
| `ATRIBUIR_ANALISTA` | Service (`OcorrenciaService`) | `Ocorrencia` | id da ocorrência | `"analista_id: ..."` |
| `CRIAR_USUARIO` | Service (`UsuarioService`) | `Usuario` | id criado | `"email: x@y.com, perfil: ANALISTA"` |
| `EDITAR_USUARIO` | Service (`UsuarioService`) | `Usuario` | id do usuário | `"campos alterados: perfil"` |
| `ACESSO_NEGADO` | SecurityFilter | `null` | `null` | `"rota: /api/admin/..., perfil: SOLICITANTE"` |
| `VISUALIZAR_LOGS` | Service (`LogAuditoriaService`) | `null` | `null` | `"filtro: data=2026-06-15"` |

**Restrição:** o campo `detalhe` nunca deve conter senha, hash, token ou conteúdo
completo de campos confidenciais — apenas identificadores e metadados operacionais.

---

## 5. Acesso e retenção

### 5.1 Controle de acesso

- Leitura restrita ao perfil `ADMINISTRADOR` via `GET /api/admin/logs`
- Nenhum endpoint de `UPDATE` ou `DELETE` exposto pela aplicação
- `AuditService` injeta apenas `LogAuditoriaRepository.save()` — `delete()` e
  `update()` não são chamados em nenhum ponto
- Acesso indevido ao endpoint de logs por `ANALISTA` ou `SOLICITANTE` gera
  automaticamente um evento `ACESSO_NEGADO` no log

### 5.2 Retenção

Indefinida na versão atual — todos os registros permanecem no banco.

Esta é uma limitação documentada: a ausência de política de expiração e
arquivamento é um achado de segurança a ser incluído no relatório final.

### 5.3 Visão do ADMINISTRADOR

| Campo exibido | Campo no banco | Observação |
|---|---|---|
| Data/hora | `criado_em` | Formato `dd/MM/yyyy HH:mm:ss` |
| Ação | `acao` | Label legível (ex: "Login com falha") |
| Usuário | `usuario_id` → join `usuario.nome` | "Anônimo" quando `null` |
| Recurso | `entidade` + `entidadeId` | Ex: `Ocorrencia #<uuid-curto>` |
| Detalhe | `detalhe` | Texto livre |
| IP de origem | `ip_origem` | Visível apenas para ADMINISTRADOR |

Filtros disponíveis na tela: por ação, por período e por usuário.

O próprio acesso ao painel registra `VISUALIZAR_LOGS` com o filtro aplicado no
campo `detalhe`.

---

## 6. Mapeamento com categorias de segurança (NIST CSF)

| Categoria | Contribuição dos logs |
|---|---|
| **Detectar** | `LOGIN_FALHO` e `ACESSO_NEGADO` permitem identificar tentativas de ataque |
| **Responder** | Trilha completa permite reconstruir a sequência de qualquer incidente |
| **Recuperar** | Logs imutáveis garantem evidência íntegra após contenção do incidente |

---

## 7. Limitações conhecidas

| Limitação | Risco | Recomendação futura |
|---|---|---|
| Sem política de retenção | Crescimento ilimitado da tabela de logs | Expiração após 90 dias ou arquivamento externo |
| `ip_origem` pode ser IP de proxy reverso | Identificação imprecisa da origem real | Validar header `X-Forwarded-For` com lista de proxies confiáveis |
| Sem alerta automático em padrões suspeitos | `LOGIN_FALHO` repetido não dispara notificação | Rate limiting + alerta por threshold de falhas consecutivas |
| Logs no mesmo banco dos dados operacionais | Comprometimento do banco expõe logs junto | Separar storage de logs em etapa futura |

---

*Ver modelo da entidade `LOG_AUDITORIA` em [`modelo-dados.md`](modelo-dados.md).*  
*Ver arquitetura completa em [`arquitetura.md`](arquitetura.md).*

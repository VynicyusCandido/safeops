# Design — Plano de Logs e Trilhas de Auditoria (SafeOps)

**Data:** 16/06/2026  
**Responsável pelo documento:** Alisson Anderle  
**Referências:** `docs/modelo-dados.md` (entidade `LOG_AUDITORIA`), `docs/arquitetura.md`

---

## Escopo

Documento de planejamento e contrato de implementação dos logs de auditoria do SafeOps.
Cobre: arquitetura de captura, contrato do `AuditService`, tabela de eventos com campos
obrigatórios, política de acesso e retenção, e visão do ADMINISTRADOR na interface.

Entregável para o checkpoint de 15/06 e guia de implementação para o checkpoint de 22/06.

---

## 1. Arquitetura de captura

O sistema possui **dois pontos de captura**, necessários porque alguns eventos são
rejeitados pelo Spring Security antes de atingir qualquer controller ou service.

### Ponto 1 — Service Layer (captura manual)

Cada service chama `auditService.log(...)` explicitamente após ações sensíveis.
Cobre 8 dos 10 eventos. A chamada manual é deliberada: log de auditoria é um
controle de segurança — deve ser visível em code review, não escondido em AOP.

AOP com `@Aspect` foi descartado porque self-invocation em beans Spring bypassa o
proxy silenciosamente, produzindo ausência de log sem erro aparente.

### Ponto 2 — Security Filter Layer (captura via handlers)

Dois handlers registrados no `SecurityConfig` capturam eventos que nunca chegam
aos services:

- `LOGIN_FALHO` → `AuthenticationFailureHandler`
- `ACESSO_NEGADO` → `AccessDeniedHandler` + `AuthenticationEntryPoint`

### Fluxo

```
Request
  └── SecurityFilter
        ├── [rejeitado] → AccessDeniedHandler / AuthenticationEntryPoint
        │                   └── auditService.log(ACESSO_NEGADO | LOGIN_FALHO)
        └── [passa]     → Controller → Service
                                          └── auditService.log(evento)
                                          └── persiste entidade
```

---

## 2. Contrato do `AuditService`

### 2.1 Enum de ações

```java
public enum AuditAction {
    LOGIN,
    LOGIN_FALHO,
    CRIAR_OCORRENCIA,
    ALTERAR_STATUS,
    ADICIONAR_COMENTARIO,
    ATRIBUIR_ANALISTA,
    CRIAR_USUARIO,
    EDITAR_USUARIO,
    ACESSO_NEGADO,
    VISUALIZAR_LOGS
}
```

Tipagem forte — elimina string mágica no código e garante que todo evento seja
rastreável estaticamente.

### 2.2 Interface

Dois overloads porque eventos anônimos (`LOGIN_FALHO`, `ACESSO_NEGADO` sem sessão
ativa) não possuem `usuarioId` identificado:

```java
public interface AuditService {

    // Eventos com usuário autenticado identificado
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

### 2.3 Regras de preenchimento

| Campo | Regra |
|---|---|
| `ip_origem` | Sempre extraído de `request.getRemoteAddr()` pelo próprio serviço — nunca passado pelo caller |
| `criado_em` | Gerado pelo banco (`DEFAULT NOW()`) — a aplicação não passa o valor |
| `detalhe` | Nunca contém senha, hash, token ou conteúdo completo de ocorrências — apenas identificadores e metadados operacionais |
| `entidade` / `entidadeId` | Nullable nos eventos sem recurso-alvo (ex: `ACESSO_NEGADO`, `VISUALIZAR_LOGS`) |

---

## 3. Tabela de eventos

Para cada evento: camada de captura, campos `entidade`/`entidadeId` e conteúdo
esperado no campo `detalhe`.

| Evento | Camada | `entidade` | `entidadeId` | `detalhe` |
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

**Restrição de segurança no `detalhe`:** nunca incluir senha, hash, token, ou
conteúdo completo de campos confidenciais — apenas identificadores e contexto
operacional mínimo.

---

## 4. Acesso, retenção e visão do ADMINISTRADOR

### 4.1 Controle de acesso

- Leitura restrita ao perfil `ADMINISTRADOR` — endpoint `GET /api/admin/logs`
- Nenhum endpoint de `UPDATE` ou `DELETE` exposto pela aplicação
- `AuditService` só injeta `LogAuditoriaRepository.save()` — os métodos `delete()`
  e `update()` não são chamados em nenhum ponto da aplicação
- Tentativa de acesso por `ANALISTA` ou `SOLICITANTE` ao endpoint de logs gera
  um evento `ACESSO_NEGADO` no próprio log

### 4.2 Retenção

Indefinida na versão atual — todos os registros permanecem no banco sem expiração.

**Limitação documentada:** ausência de política de expiração e arquivamento é um
achado de segurança a ser registrado no relatório final (seção de riscos residuais).

### 4.3 O que o ADMINISTRADOR vê

Tela de logs com os seguintes campos e filtros mínimos:

| Campo exibido | Campo no banco | Observação |
|---|---|---|
| Data/hora | `criado_em` | Formato `dd/MM/yyyy HH:mm:ss` |
| Ação | `acao` | Label legível (ex: "Login com falha") |
| Usuário | `usuario_id` → join `usuario.nome` | Exibe "Anônimo" quando `null` |
| Recurso | `entidade` + `entidadeId` | Ex: `Ocorrencia #<uuid-curto>` |
| Detalhe | `detalhe` | Texto livre |
| IP de origem | `ip_origem` | Exibido apenas para ADMINISTRADOR |

**Filtros mínimos na tela:** por `acao`, por período (`criado_em` entre datas),
por usuário.

O acesso ao painel de logs registra automaticamente `VISUALIZAR_LOGS` com o filtro
aplicado no campo `detalhe`.

---

## 5. Mapeamento com categorias de segurança (NIST CSF)

| Categoria | Como os logs contribuem |
|---|---|
| **Detectar** | `LOGIN_FALHO` e `ACESSO_NEGADO` permitem identificar tentativas de ataque |
| **Responder** | Trilha completa de ações permite reconstruir sequência de um incidente |
| **Recuperar** | Logs imutáveis garantem evidência íntegra após contenção |

---

## 6. Limitações conhecidas

| Limitação | Risco | Recomendação futura |
|---|---|---|
| Sem política de retenção | Crescimento ilimitado da tabela | Implementar expiração após 90 dias ou arquivamento |
| `ip_origem` pode ser IP de proxy | Identificação imprecisa de origem real | Considerar header `X-Forwarded-For` com validação |
| Sem alerta automático para padrões suspeitos | `LOGIN_FALHO` repetido não gera notificação | Rate limiting + alerta por threshold de falhas |
| Logs em banco relacional junto aos dados | Comprometimento do banco expõe logs | Separar storage de logs em etapa futura |

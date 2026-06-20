# Spec: Auth & Security Layer — SafeOps Backend

**Data:** 20/06/2026  
**Responsável:** Gustavo Taques  
**Checkpoint alvo:** 22/06/2026  
**Escopo:** Camada de segurança transversal do backend Spring Boot

---

## 1. Contexto e fronteiras

Esta spec cobre exclusivamente a camada de segurança transversal do backend. Nenhum domínio de negócio (ocorrências, comentários, gestão de usuários admin) entra aqui.

**O que esta spec entrega:**

```
pom.xml
  └── spring-boot-starter-oauth2-resource-server (Nimbus)

config/
  ├── SecurityConfig.java
  ├── JwtAuthFilter.java
  └── DataSeeder.java

entity/
  ├── Usuario.java
  └── LogAuditoria.java

repository/
  ├── UsuarioRepository.java
  └── LogAuditoriaRepository.java

service/
  ├── AuditAction.java
  ├── AuditService.java
  └── AuditServiceImpl.java

controller/
  └── AuthController.java
```

**O que não entra aqui:** `UsuarioService`/`UsuarioController` (CRUD admin — Alisson), `OcorrenciaService`, `ComentarioService` (João).

**Contrato com o time:**
- Alisson chama `auditService.log(...)` usando a interface e o enum — não depende do `Impl`
- João e Alisson usam `@AuthenticationPrincipal Usuario usuario` nos controllers — o `JwtAuthFilter` popula o `SecurityContext` com o `Usuario` como principal
- `@EnableMethodSecurity` habilitado nesta spec — `@PreAuthorize` nos controllers dos outros passa a funcionar

---

## 2. Decisões de design

| Decisão | Escolha | Justificativa |
|---|---|---|
| Biblioteca JWT | Nimbus via `spring-boot-starter-oauth2-resource-server` | Algoritmo fixo em `MacAlgorithm.HS256` — sem vulnerabilidade `alg=none`. Validação de `exp`/`nbf` automática. |
| Estratégia de token | Token único, 2h, sem refresh | Escopo adequado ao prazo. Limitação documentada como achado de segurança. |
| CSRF | Desabilitado | Cookie `SameSite=Strict` + `HttpOnly` — browser não envia cookie em requisições cross-origin. Decisão consciente, não descuido. |
| Senha padrão | Default com `trocar_senha_no_proximo_login = true` | Endereça CWE-1392. Usuário não recebe JWT até trocar a senha — estruturalmente impossível esquecer. |
| Transação de auditoria | `REQUIRES_NEW` | Log persiste mesmo se a transação principal sofre rollback. Falha de negócio não apaga evidência. |
| `subject` do JWT | UUID do usuário | Não expõe email (dado pessoal) no token. Desacopla autenticação de mudança de email. |

---

## 3. Dependência

Adicionar ao `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

---

## 4. Configuração (`application.yml`)

```yaml
security:
  jwt:
    secret: ${JWT_SECRET}
    expiration-minutes: 120

admin:
  email: ${ADMIN_EMAIL:admin@safeops.com}
  senha: ${ADMIN_SENHA:Admin@1234}

server:
  servlet:
    session:
      cookie:
        secure: ${COOKIE_SECURE:true}
```

Adicionar ao `.env.example`:

```
JWT_SECRET=                    # mínimo 32 chars (256 bits para HS256)
ADMIN_EMAIL=admin@safeops.com
ADMIN_SENHA=Admin@1234
COOKIE_SECURE=false            # false em dev local (sem HTTPS)
```

---

## 5. Entidades JPA

### 5.1 `Usuario`

Implementa `UserDetails` diretamente — elimina uma classe `UserDetailsService` separada e permite usar `@AuthenticationPrincipal Usuario` tipado nos controllers.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `UUID` (PK, gerado) | UUID v4 — impede enumeração |
| `nome` | `VARCHAR(120)` | não nulo |
| `email` | `VARCHAR(150)` | não nulo, único — usado como username |
| `senha_hash` | `VARCHAR(255)` | BCrypt — nunca serializado em resposta de API |
| `perfil` | `ENUM(STRING)` | `SOLICITANTE` / `ANALISTA` / `ADMINISTRADOR` |
| `ativo` | `BOOLEAN` | default `true` — desativar sem deletar histórico |
| `trocar_senha_no_proximo_login` | `BOOLEAN` | default `false` — `true` no DataSeeder |
| `criado_em` | `TIMESTAMP` | `updatable = false` |
| `atualizado_em` | `TIMESTAMP` | atualizado pelo ORM |

`UserDetails`:
- `getUsername()` → `email`
- `getPassword()` → `senhaHash`
- `getAuthorities()` → `[ROLE_<perfil>]`
- `isEnabled()` → `ativo`

### 5.2 `LogAuditoria`

Entidade insert-only. Nenhum endpoint da aplicação expõe `update()` ou `delete()`.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `UUID` (PK, gerado) | UUID v4 |
| `usuario_id` | `UUID` (nullable) | nullable — permite eventos anônimos |
| `acao` | `ENUM(STRING)` | `AuditAction` |
| `entidade` | `VARCHAR(60)` | nullable |
| `entidade_id` | `UUID` | nullable |
| `detalhe` | `TEXT` | nunca contém senha, hash ou token |
| `ip_origem` | `VARCHAR(45)` | extraído do request pelo service — nunca passado pelo caller |
| `criado_em` | `TIMESTAMP` | `insertable = false`, `columnDefinition = "TIMESTAMP DEFAULT NOW()"` — gerado pelo banco |

---

## 6. JWT: JwtEncoder + JwtDecoder

Beans declarados no `SecurityConfig`:

```java
@Bean
public JwtDecoder jwtDecoder() {
    SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    return NimbusJwtDecoder
        .withSecretKey(key)
        .macAlgorithm(MacAlgorithm.HS256)  // algoritmo fixo
        .build();
}

@Bean
public JwtEncoder jwtEncoder() {
    SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    return new NimbusJwtEncoder(new ImmutableSecret<>(key));
}

@Bean
public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

**Emissão de token (`AuthService`):**

```java
private String emitirToken(Usuario usuario) {
    Instant agora = Instant.now();
    JwtClaimsSet claims = JwtClaimsSet.builder()
        .subject(usuario.getId().toString())   // UUID, não email
        .claim("perfil", usuario.getPerfil().name())
        .issuedAt(agora)
        .expiresAt(agora.plusSeconds(expiracaoMinutos * 60L))
        .build();
    return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
}
```

---

## 7. JwtAuthFilter

```
Requisição chega
  │
  ├── Lê cookie "session-token"
  │     └── ausente → passa adiante (SecurityConfig nega se rota protegida)
  │
  ├── JwtDecoder.decode(token)
  │     └── JwtException → passa adiante com contexto vazio
  │
  ├── Extrai subject (UUID do usuário)
  ├── UsuarioRepository.findById(uuid)
  │     └── não encontrado → passa adiante
  │
  └── SecurityContextHolder.setAuthentication(
          new UsernamePasswordAuthenticationToken(usuario, null, authorities))
```

O filtro **nunca rejeita** — só popula o contexto quando o token é válido. A rejeição é responsabilidade do `SecurityConfig`, mantendo separação de responsabilidades.

---

## 8. SecurityConfig

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthFilter jwtAuthFilter,
                                           AuditService auditService) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health", "/api/auth/login").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    // sem autenticação — usa overload anônimo (usuarioId = null)
                    auditService.log(AuditAction.ACESSO_NEGADO,
                        "rota: " + req.getRequestURI(), req);
                    res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                })
                .accessDeniedHandler((req, res, e) -> {
                    // autenticado mas sem permissão — extrai usuarioId do contexto
                    Usuario usuario = (Usuario) SecurityContextHolder
                        .getContext().getAuthentication().getPrincipal();
                    auditService.log(AuditAction.ACESSO_NEGADO,
                        usuario.getId(), null, null,
                        "rota: " + req.getRequestURI() + ", perfil: " + usuario.getPerfil(),
                        req);
                    res.sendError(HttpServletResponse.SC_FORBIDDEN);
                }));

        return http.build();
    }
}
```

`@EnableMethodSecurity` habilita `@PreAuthorize` nos controllers de João e Alisson. Sem isso, as anotações compilam mas não são executadas — bug silencioso crítico.

---

## 9. AuthController

### `POST /api/auth/login`

**Request:** `{ "email": "...", "senha": "..." }`

**Fluxo:**

```
1. UsuarioRepository.findByEmail()       → 404 se não existe
2. BCrypt.matches(senha, senhaHash)      → 401 + log(LOGIN_FALHO) se falhar
3. usuario.isAtivo()                     → 403 se conta desativada
4. usuario.isTrocarSenhaNoProximoLogin() → 403 { "reason": "PASSWORD_CHANGE_REQUIRED" } se true
5. emitirToken()                         → 200 + Set-Cookie: session-token + log(LOGIN)
```

**Cookie emitido:**

```java
ResponseCookie.from("session-token", token)
    .httpOnly(true)
    .secure(cookieSecure)        // configurável via env
    .sameSite("Strict")
    .path("/")
    .maxAge(Duration.ofMinutes(expiracaoMinutos))
    .build();
```

### `POST /api/auth/logout`

Expira o cookie no browser. Sem blacklist de tokens — JWT permanece válido até expirar (limitação documentada: janela máxima de 2h).

```java
ResponseCookie.from("session-token", "")
    .httpOnly(true)
    .secure(cookieSecure)
    .sameSite("Strict")
    .path("/")
    .maxAge(0)
    .build();
```

### `POST /api/auth/change-password`

**Requer:** token válido no cookie (rota protegida).  
**Request:** `{ "senhaAtual": "...", "novaSenha": "..." }`

**Fluxo:**

```
1. BCrypt.matches(senhaAtual, usuario.getSenhaHash())  → 400 se incorreta
2. novaSenha == senhaAtual                             → 400 "nova senha igual à atual"
3. novaSenha.length() < 8                             → 400 "mínimo 8 caracteres"
4. usuario.setSenhaHash(BCrypt.encode(novaSenha))
5. usuario.setTrocarSenhaNoProximoLogin(false)
6. usuarioRepository.save()
7. log(EDITAR_USUARIO, "senha alterada")
8. emitirToken()                                       → 200 + Set-Cookie: session-token
```

---

## 10. AuditService

### `AuditAction` enum

```java
public enum AuditAction {
    LOGIN, LOGIN_FALHO,
    CRIAR_OCORRENCIA, ALTERAR_STATUS, ADICIONAR_COMENTARIO, ATRIBUIR_ANALISTA,
    CRIAR_USUARIO, EDITAR_USUARIO,
    ACESSO_NEGADO,
    VISUALIZAR_LOGS
}
```

### Interface `AuditService`

```java
public interface AuditService {

    // Eventos com usuário autenticado
    void log(AuditAction acao,
             UUID usuarioId,
             String entidade,
             UUID entidadeId,
             String detalhe,
             HttpServletRequest request);

    // Eventos anônimos (LOGIN_FALHO, ACESSO_NEGADO sem sessão)
    void log(AuditAction acao,
             String detalhe,
             HttpServletRequest request);
}
```

### `AuditServiceImpl`

`@Transactional(propagation = Propagation.REQUIRES_NEW)` — abre transação independente. Log persiste mesmo se a transação do caller sofre rollback. Falha de negócio não apaga evidência de auditoria.

`ip_origem` é sempre extraído de `request.getRemoteAddr()` internamente — o caller nunca passa o IP, eliminando possibilidade de forjar a origem.

---

## 11. DataSeeder

```java
@Component
public class DataSeeder implements CommandLineRunner {
    // Executa na subida da aplicação
    // Idempotente: retorna se email já existe
    // Cria ADMINISTRADOR com trocar_senha_no_proximo_login = true
    // Loga no console: ">>> ADMIN criado: <email> — troca de senha obrigatória"
}
```

Credenciais via env vars com defaults documentados no `.env.example`. Reiniciar a aplicação nunca recria nem sobrescreve o admin.

---

## 12. Testes

| Teste | Valida |
|---|---|
| Login com credenciais válidas | 200 + cookie `session-token` presente |
| Login com senha errada | 401 + sem cookie + `LOGIN_FALHO` gerado |
| Login com `trocar_senha = true` | 403 + `reason: PASSWORD_CHANGE_REQUIRED` + sem cookie |
| Rota protegida sem token | 401 |
| `AuditServiceImplTest` — rollback no caller | Log persiste (valida `REQUIRES_NEW`) |

Banco de testes: H2 in-memory (já configurado em `src/test/resources/application.yml`).

---

## 13. Limitações documentadas (para o relatório)

| Limitação | Risco | Recomendação futura |
|---|---|---|
| Logout stateless — JWT válido até expirar | Janela de 2h após logout | Blacklist de tokens em Redis |
| `ip_origem` pode ser IP de proxy | Origem real mascarada | Validar `X-Forwarded-For` com allowlist de proxies |
| Logs no mesmo banco dos dados operacionais | Comprometimento do banco expõe logs | Separar storage de logs |
| Conta desativada com JWT válido | JwtAuthFilter não verifica `isEnabled()` — usuário desativado tem acesso até o JWT expirar (máx 2h) | Verificar `isEnabled()` no filtro ou usar blacklist de tokens |
| `LOGIN_FALHO` não gerado para email inexistente | Brute-force de emails não produz trilha de auditoria | Logar `LOGIN_FALHO` também quando email não encontrado |

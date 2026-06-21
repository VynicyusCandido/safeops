# Responsabilidades por Pessoa — Checkpoint 22/06

**Projeto:** P05-B — SafeOps  
**Atualizado em:** 20/06/2026  
**Próxima entrega:** 22/06/2026  

---

## Estado atual do código em 20/06

| Camada | O que já existe e funciona | O que ainda falta |
|---|---|---|
| Backend — Auth | JWT, cookie `session-token`, BCrypt, `AuditService`, `DataSeeder`, `AuthController` | — |
| Backend — Ocorrências | — | Entities, repositories, service, controller (João) |
| Backend — Admin | `UsuarioRepository`, `LogAuditoriaRepository` | `UsuarioService/Controller`, `LogAuditoriaController` (Alisson) |
| Frontend | Layout, sidebar, header, login page (só visual), middleware | Auth store, cliente HTTP, formulários funcionais (Vynicyus) |

**Gustavo terminou.** O bloqueio foi removido. João, Alisson e Vynicyus podem começar imediatamente.

---

## Gustavo Taques — CONCLUÍDO

Tudo abaixo já está no repositório e funcionando. Use como referência.

### O que está disponível para os outros usarem

**Autenticação:**
- `POST /api/auth/login` → 200 + cookie `session-token` (httpOnly, SameSite=Strict)
- `POST /api/auth/logout` → expira o cookie
- `POST /api/auth/change-password` → troca senha (com ou sem sessão ativa)

**SecurityContext:** em qualquer controller, use `@AuthenticationPrincipal Usuario usuario` para receber o usuário logado diretamente. Exemplo:
```java
@GetMapping("/exemplo")
public ResponseEntity<?> exemplo(@AuthenticationPrincipal Usuario usuario) {
    // usuario.getId(), usuario.getPerfil(), usuario.getNome() etc.
}
```

**Autorização por perfil:** use `@PreAuthorize` nos controllers. O `getAuthorities()` do `Usuario` retorna `ROLE_SOLICITANTE`, `ROLE_ANALISTA` ou `ROLE_ADMINISTRADOR`. Exemplos:
```java
@PreAuthorize("hasRole('ADMINISTRADOR')")
@PreAuthorize("hasRole('ANALISTA') or hasRole('ADMINISTRADOR')")
@PreAuthorize("hasAnyRole('SOLICITANTE','ANALISTA','ADMINISTRADOR')")
```

**Auditoria:** injetar `AuditService` e chamar um dos dois overloads:
```java
// Overload 1 — evento com usuário autenticado (6 argumentos)
auditService.log(
    AuditAction.CRIAR_OCORRENCIA,   // ação do enum
    usuario.getId(),                 // UUID do usuário que fez a ação
    "Ocorrencia",                    // nome da entidade afetada
    ocorrencia.getId(),              // UUID da entidade afetada
    "titulo: 'Falha no gerador'",   // detalhe (nunca colocar senha ou token)
    request                          // HttpServletRequest injetado no controller
);

// Overload 2 — evento anônimo (3 argumentos, usuário não autenticado)
auditService.log(AuditAction.LOGIN_FALHO, "tentativa com email: x@y.com", request);
```

**Enum `AuditAction`** (todos os 10 valores):
`LOGIN`, `LOGIN_FALHO`, `CRIAR_OCORRENCIA`, `ALTERAR_STATUS`, `ADICIONAR_COMENTARIO`, `ATRIBUIR_ANALISTA`, `CRIAR_USUARIO`, `EDITAR_USUARIO`, `ACESSO_NEGADO`, `VISUALIZAR_LOGS`

**Repositórios prontos:**
- `UsuarioRepository` → `findByEmail(String)`, `findById(UUID)` e métodos padrão JPA
- `LogAuditoriaRepository` → `findByAcao(AuditAction)`, `findByUsuarioId(UUID)`, `findByCriadoEmBetween(Instant, Instant)`

---

## João Angelico — Domínio de Ocorrências — CONCLUÍDO

### Visão geral

Você vai criar as entidades `Ocorrencia` e `Comentario`, os repositórios, os DTOs, os services e os controllers. Tudo no backend Spring Boot.

**Regra mais importante do projeto:** um `SOLICITANTE` só pode ver, atualizar ou comentar nas **suas próprias** ocorrências. Essa checagem deve acontecer no **service**, não no controller. O professor avalia isso diretamente.

---

### 1. Enums de domínio

Criar os dois arquivos em `backend/src/main/java/br/com/safeops/entity/`:

**`StatusOcorrencia.java`**
```java
package br.com.safeops.entity;
public enum StatusOcorrencia { ABERTA, EM_ANALISE, RESOLVIDA, ENCERRADA }
```

**`Prioridade.java`**
```java
package br.com.safeops.entity;
public enum Prioridade { BAIXA, MEDIA, ALTA, CRITICA }
```

---

### 2. Entity `Ocorrencia`

Criar `backend/src/main/java/br/com/safeops/entity/Ocorrencia.java`:

```java
package br.com.safeops.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ocorrencia")
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOcorrencia status = StatusOcorrencia.ABERTA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Prioridade prioridade;

    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitante_id", updatable = false)
    private Usuario solicitante;

    @ManyToOne
    @JoinColumn(name = "analista_id")
    private Usuario analista;

    @Column(name = "criado_em", updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em")
    private Instant atualizadoEm;

    @Column(name = "encerrado_em")
    private Instant encerradoEm;

    @PrePersist
    void prePersist() { criadoEm = atualizadoEm = Instant.now(); }

    @PreUpdate
    void preUpdate() { atualizadoEm = Instant.now(); }

    // Getters e setters para todos os campos
}
```

---

### 3. Entity `Comentario`

Criar `backend/src/main/java/br/com/safeops/entity/Comentario.java`:

```java
package br.com.safeops.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comentario")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ocorrencia_id", updatable = false)
    private Ocorrencia ocorrencia;

    @ManyToOne(optional = false)
    @JoinColumn(name = "autor_id", updatable = false)
    private Usuario autor;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "criado_em", updatable = false)
    private Instant criadoEm;

    @PrePersist
    void prePersist() { criadoEm = Instant.now(); }

    // Getters e setters
}
```

> Comentários são imutáveis. Não crie endpoint de edição — comentário é evidência auditável.

---

### 4. Repositórios

Criar em `backend/src/main/java/br/com/safeops/repository/`:

**`OcorrenciaRepository.java`**
```java
package br.com.safeops.repository;

import br.com.safeops.entity.Ocorrencia;
import br.com.safeops.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID> {
    List<Ocorrencia> findBySolicitante(Usuario solicitante);
}
```

**`ComentarioRepository.java`**
```java
package br.com.safeops.repository;

import br.com.safeops.entity.Comentario;
import br.com.safeops.entity.Ocorrencia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ComentarioRepository extends JpaRepository<Comentario, UUID> {
    List<Comentario> findByOcorrencia(Ocorrencia ocorrencia);
}
```

---

### 5. DTOs

Criar em `backend/src/main/java/br/com/safeops/dto/`:

```java
// OcorrenciaRequest.java — o que o cliente envia para criar
public record OcorrenciaRequest(
    @NotBlank String titulo,
    String descricao,
    @NotNull Prioridade prioridade
) {}

// StatusUpdateRequest.java — o que o cliente envia para atualizar status
public record StatusUpdateRequest(@NotNull StatusOcorrencia status) {}

// AtribuirAnalistaRequest.java — o que o cliente envia para atribuir analista
public record AtribuirAnalistaRequest(@NotNull UUID analistaId) {}

// OcorrenciaResponse.java — o que a API retorna (nunca expor senha_hash)
public record OcorrenciaResponse(
    UUID id, String titulo, String descricao,
    StatusOcorrencia status, Prioridade prioridade,
    UUID solicitanteId, UUID analistaId,
    Instant criadoEm, Instant atualizadoEm
) {
    public static OcorrenciaResponse from(Ocorrencia o) {
        return new OcorrenciaResponse(
            o.getId(), o.getTitulo(), o.getDescricao(),
            o.getStatus(), o.getPrioridade(),
            o.getSolicitante().getId(),
            o.getAnalista() != null ? o.getAnalista().getId() : null,
            o.getCriadoEm(), o.getAtualizadoEm()
        );
    }
}

// ComentarioRequest.java
public record ComentarioRequest(@NotBlank String conteudo) {}

// ComentarioResponse.java
public record ComentarioResponse(UUID id, UUID ocorrenciaId, UUID autorId, String conteudo, Instant criadoEm) {
    public static ComentarioResponse from(Comentario c) {
        return new ComentarioResponse(
            c.getId(), c.getOcorrencia().getId(), c.getAutor().getId(),
            c.getConteudo(), c.getCriadoEm()
        );
    }
}
```

---

### 6. `OcorrenciaService`

Criar `backend/src/main/java/br/com/safeops/service/OcorrenciaService.java`:

```java
@Service
public class OcorrenciaService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditService auditService;

    // Construtor com injeção de dependências

    public OcorrenciaResponse criar(OcorrenciaRequest request, Usuario solicitante, HttpServletRequest req) {
        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.setTitulo(request.titulo());
        ocorrencia.setDescricao(request.descricao());
        ocorrencia.setPrioridade(request.prioridade());
        ocorrencia.setSolicitante(solicitante);
        ocorrenciaRepository.save(ocorrencia);

        auditService.log(AuditAction.CRIAR_OCORRENCIA, solicitante.getId(),
            "Ocorrencia", ocorrencia.getId(), "titulo: '" + ocorrencia.getTitulo() + "'", req);

        return OcorrenciaResponse.from(ocorrencia);
    }

    public List<OcorrenciaResponse> listar(Usuario usuario) {
        List<Ocorrencia> lista = usuario.getPerfil() == Perfil.SOLICITANTE
            ? ocorrenciaRepository.findBySolicitante(usuario)
            : ocorrenciaRepository.findAll();
        return lista.stream().map(OcorrenciaResponse::from).toList();
    }

    public OcorrenciaResponse buscarPorId(UUID id, Usuario usuario) {
        return OcorrenciaResponse.from(buscarComVerificacao(id, usuario));
    }

    public OcorrenciaResponse atualizarStatus(UUID id, StatusUpdateRequest request,
                                               Usuario usuario, HttpServletRequest req) {
        Ocorrencia ocorrencia = buscarComVerificacao(id, usuario);
        StatusOcorrencia statusAnterior = ocorrencia.getStatus();
        ocorrencia.setStatus(request.status());
        if (request.status() == StatusOcorrencia.ENCERRADA) {
            ocorrencia.setEncerradoEm(Instant.now());
        }
        ocorrenciaRepository.save(ocorrencia);

        auditService.log(AuditAction.ALTERAR_STATUS, usuario.getId(),
            "Ocorrencia", ocorrencia.getId(),
            "de: " + statusAnterior + " → para: " + request.status(), req);

        return OcorrenciaResponse.from(ocorrencia);
    }

    public OcorrenciaResponse atribuirAnalista(UUID id, AtribuirAnalistaRequest request,
                                                Usuario usuario, HttpServletRequest req) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Usuario analista = usuarioRepository.findById(request.analistaId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Analista não encontrado"));
        ocorrencia.setAnalista(analista);
        ocorrenciaRepository.save(ocorrencia);

        auditService.log(AuditAction.ATRIBUIR_ANALISTA, usuario.getId(),
            "Ocorrencia", ocorrencia.getId(), "analista_id: " + analista.getId(), req);

        return OcorrenciaResponse.from(ocorrencia);
    }

    public void deletar(UUID id, Usuario usuario, HttpServletRequest req) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ocorrenciaRepository.delete(ocorrencia);
        // Nota: sem log de deleção definido no enum — use ALTERAR_STATUS se quiser registrar
    }

    // Verifica se o usuário tem direito de acessar esta ocorrência
    private Ocorrencia buscarComVerificacao(UUID id, Usuario usuario) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (usuario.getPerfil() == Perfil.SOLICITANTE
                && !ocorrencia.getSolicitante().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ocorrencia;
    }
}
```

---

### 7. `OcorrenciaController`

Criar `backend/src/main/java/br/com/safeops/controller/OcorrenciaController.java`:

```java
@RestController
@RequestMapping("/api/ocorrencias")
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE','ADMINISTRADOR')")
    public ResponseEntity<OcorrenciaResponse> criar(
            @RequestBody @Valid OcorrenciaRequest request,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ocorrenciaService.criar(request, usuario, req));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE','ANALISTA','ADMINISTRADOR')")
    public List<OcorrenciaResponse> listar(@AuthenticationPrincipal Usuario usuario) {
        return ocorrenciaService.listar(usuario);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SOLICITANTE','ANALISTA','ADMINISTRADOR')")
    public OcorrenciaResponse buscarPorId(@PathVariable UUID id,
                                           @AuthenticationPrincipal Usuario usuario) {
        return ocorrenciaService.buscarPorId(id, usuario);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ANALISTA') or hasRole('ADMINISTRADOR')")
    public OcorrenciaResponse atualizarStatus(@PathVariable UUID id,
            @RequestBody @Valid StatusUpdateRequest request,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        return ocorrenciaService.atualizarStatus(id, request, usuario, req);
    }

    @PatchMapping("/{id}/analista")
    @PreAuthorize("hasRole('ANALISTA') or hasRole('ADMINISTRADOR')")
    public OcorrenciaResponse atribuirAnalista(@PathVariable UUID id,
            @RequestBody @Valid AtribuirAnalistaRequest request,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        return ocorrenciaService.atribuirAnalista(id, request, usuario, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deletar(@PathVariable UUID id,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        ocorrenciaService.deletar(id, usuario, req);
        return ResponseEntity.noContent().build();
    }
}
```

---

### 8. `ComentarioService` e `ComentarioController`

Criar `backend/src/main/java/br/com/safeops/service/ComentarioService.java`:

```java
@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final AuditService auditService;

    public ComentarioResponse adicionar(UUID ocorrenciaId, ComentarioRequest request,
                                         Usuario autor, HttpServletRequest req) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // SOLICITANTE só comenta nas suas próprias ocorrências
        if (autor.getPerfil() == Perfil.SOLICITANTE
                && !ocorrencia.getSolicitante().getId().equals(autor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        Comentario comentario = new Comentario();
        comentario.setOcorrencia(ocorrencia);
        comentario.setAutor(autor);
        comentario.setConteudo(request.conteudo());
        comentarioRepository.save(comentario);

        auditService.log(AuditAction.ADICIONAR_COMENTARIO, autor.getId(),
            "Comentario", comentario.getId(),
            "ocorrencia_id: " + ocorrenciaId, req);

        return ComentarioResponse.from(comentario);
    }

    public List<ComentarioResponse> listarPorOcorrencia(UUID ocorrenciaId, Usuario usuario) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (usuario.getPerfil() == Perfil.SOLICITANTE
                && !ocorrencia.getSolicitante().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return comentarioRepository.findByOcorrencia(ocorrencia)
            .stream().map(ComentarioResponse::from).toList();
    }
}
```

Controller em `backend/src/main/java/br/com/safeops/controller/ComentarioController.java`:

```java
@RestController
@RequestMapping("/api/ocorrencias/{ocorrenciaId}/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE','ANALISTA','ADMINISTRADOR')")
    public ResponseEntity<ComentarioResponse> adicionar(
            @PathVariable UUID ocorrenciaId,
            @RequestBody @Valid ComentarioRequest request,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(comentarioService.adicionar(ocorrenciaId, request, usuario, req));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE','ANALISTA','ADMINISTRADOR')")
    public List<ComentarioResponse> listar(
            @PathVariable UUID ocorrenciaId,
            @AuthenticationPrincipal Usuario usuario) {
        return comentarioService.listarPorOcorrencia(ocorrenciaId, usuario);
    }
}
```

---

## Alisson Anderle — Admin + Consulta de Auditoria

### Visão geral

Você vai criar o CRUD administrativo de usuários e o endpoint de consulta de logs. O `AuditService` já está pronto — você só precisa chamá-lo. O `UsuarioRepository` e o `LogAuditoriaRepository` também já existem.

**Atenção:** os handlers de `LOGIN_FALHO` e `ACESSO_NEGADO` já estão implementados no `SecurityConfig` pelo Gustavo. Não mexa no `SecurityConfig`.

---

### 1. DTOs de usuário

Criar em `backend/src/main/java/br/com/safeops/dto/`:

```java
// UsuarioCriarRequest.java
public record UsuarioCriarRequest(
    @NotBlank String nome,
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8) String senha,
    @NotNull Perfil perfil
) {}

// UsuarioEditarRequest.java — apenas o que pode ser alterado
public record UsuarioEditarRequest(Perfil perfil, Boolean ativo) {}

// UsuarioResponse.java — nunca expor senhaHash
public record UsuarioResponse(UUID id, String nome, String email, Perfil perfil,
                               boolean ativo, Instant criadoEm) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(),
            u.getPerfil(), u.isAtivo(), u.getCriadoEm());
    }
}
```

---

### 2. `UsuarioService`

Criar `backend/src/main/java/br/com/safeops/service/UsuarioService.java`:

```java
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UsuarioResponse criar(UsuarioCriarRequest request, Usuario admin, HttpServletRequest req) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        Usuario novo = new Usuario();
        novo.setNome(request.nome());
        novo.setEmail(request.email());
        novo.setSenhaHash(passwordEncoder.encode(request.senha()));
        novo.setPerfil(request.perfil());
        novo.setTrocarSenhaNoProximoLogin(true); // obriga troca no primeiro login
        usuarioRepository.save(novo);

        auditService.log(AuditAction.CRIAR_USUARIO, admin.getId(),
            "Usuario", novo.getId(),
            "email: " + novo.getEmail() + ", perfil: " + novo.getPerfil(), req);

        return UsuarioResponse.from(novo);
    }

    public UsuarioResponse editar(UUID id, UsuarioEditarRequest request,
                                   Usuario admin, HttpServletRequest req) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        StringBuilder alteracoes = new StringBuilder();
        if (request.perfil() != null) {
            alteracoes.append("perfil: ").append(request.perfil());
            usuario.setPerfil(request.perfil());
        }
        if (request.ativo() != null) {
            alteracoes.append(" ativo: ").append(request.ativo());
            usuario.setAtivo(request.ativo());
        }
        usuarioRepository.save(usuario);

        auditService.log(AuditAction.EDITAR_USUARIO, admin.getId(),
            "Usuario", usuario.getId(), "campos alterados: " + alteracoes, req);

        return UsuarioResponse.from(usuario);
    }

    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
            .map(UsuarioResponse::from)
            .toList();
    }

    public UsuarioResponse buscarPorId(UUID id) {
        return usuarioRepository.findById(id)
            .map(UsuarioResponse::from)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    // Endpoint /me — retorna o usuário logado (usado pelo frontend para saber quem é o usuário)
    public UsuarioResponse me(Usuario usuario) {
        return UsuarioResponse.from(usuario);
    }
}
```

---

### 3. `UsuarioController`

Criar `backend/src/main/java/br/com/safeops/controller/UsuarioController.java`:

```java
@RestController
public class UsuarioController {

    private final UsuarioService usuarioService;

    // Endpoint público para o frontend saber quem está logado
    @GetMapping("/api/usuarios/me")
    @PreAuthorize("hasAnyRole('SOLICITANTE','ANALISTA','ADMINISTRADOR')")
    public UsuarioResponse me(@AuthenticationPrincipal Usuario usuario) {
        return usuarioService.me(usuario);
    }

    @PostMapping("/api/admin/usuarios")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> criar(
            @RequestBody @Valid UsuarioCriarRequest request,
            @AuthenticationPrincipal Usuario admin,
            HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(usuarioService.criar(request, admin, req));
    }

    @GetMapping("/api/admin/usuarios")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @GetMapping("/api/admin/usuarios/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public UsuarioResponse buscarPorId(@PathVariable UUID id) {
        return usuarioService.buscarPorId(id);
    }

    @PatchMapping("/api/admin/usuarios/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public UsuarioResponse editar(@PathVariable UUID id,
            @RequestBody UsuarioEditarRequest request,
            @AuthenticationPrincipal Usuario admin,
            HttpServletRequest req) {
        return usuarioService.editar(id, request, admin, req);
    }
}
```

---

### 4. `LogAuditoriaService` e `LogAuditoriaController`

Criar `backend/src/main/java/br/com/safeops/service/LogAuditoriaService.java`:

```java
@Service
public class LogAuditoriaService {

    private final LogAuditoriaRepository logRepository;
    private final AuditService auditService;

    public List<LogAuditoria> listar(AuditAction acao, UUID usuarioId,
                                      LocalDate de, LocalDate ate,
                                      Usuario admin, HttpServletRequest req) {
        // Busca tudo e filtra em memória (volume pequeno para demo)
        List<LogAuditoria> todos = logRepository.findAll();

        Stream<LogAuditoria> stream = todos.stream();
        if (acao != null) stream = stream.filter(l -> l.getAcao() == acao);
        if (usuarioId != null) stream = stream.filter(l -> usuarioId.equals(l.getUsuarioId()));
        if (de != null) stream = stream.filter(l ->
            l.getCriadoEm() != null && !l.getCriadoEm().isBefore(de.atStartOfDay(ZoneOffset.UTC).toInstant()));
        if (ate != null) stream = stream.filter(l ->
            l.getCriadoEm() != null && !l.getCriadoEm().isAfter(ate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));

        auditService.log(AuditAction.VISUALIZAR_LOGS, admin.getId(),
            null, null, "filtro: acao=" + acao + " usuarioId=" + usuarioId, req);

        return stream.toList();
    }
}
```

Criar `backend/src/main/java/br/com/safeops/controller/LogAuditoriaController.java`:

```java
@RestController
@RequestMapping("/api/admin/logs")
public class LogAuditoriaController {

    private final LogAuditoriaService logService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<LogAuditoria> listar(
            @RequestParam(required = false) AuditAction acao,
            @RequestParam(required = false) UUID usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate,
            @AuthenticationPrincipal Usuario admin,
            HttpServletRequest req) {
        return logService.listar(acao, usuarioId, de, ate, admin, req);
    }
}
```

---

### 5. Revisão de cobertura de auditoria

Depois de implementar, confirme que todos os 10 eventos estão cobertos no código:

| Evento | Quem chama | Status |
|---|---|---|
| `LOGIN` | `AuthService.login()` | ✅ Gustavo |
| `LOGIN_FALHO` | `SecurityConfig` (entryPoint) | ✅ Gustavo |
| `CRIAR_OCORRENCIA` | `OcorrenciaService.criar()` | João |
| `ALTERAR_STATUS` | `OcorrenciaService.atualizarStatus()` | João |
| `ADICIONAR_COMENTARIO` | `ComentarioService.adicionar()` | João |
| `ATRIBUIR_ANALISTA` | `OcorrenciaService.atribuirAnalista()` | João |
| `CRIAR_USUARIO` | `UsuarioService.criar()` | Alisson |
| `EDITAR_USUARIO` | `UsuarioService.editar()` | Alisson |
| `ACESSO_NEGADO` | `SecurityConfig` (accessDeniedHandler) | ✅ Gustavo |
| `VISUALIZAR_LOGS` | `LogAuditoriaService.listar()` | Alisson |

---

## Vynicyus Candido — Frontend: integração com a API real

### Visão geral

O scaffold já existe. Sua tarefa é conectar tudo à API do backend. O cookie `session-token` é gerenciado automaticamente pelo browser (httpOnly) — você não consegue ler o token via JavaScript, mas o browser o envia em toda requisição com `credentials: 'include'`.

---

### 1. Cliente HTTP base

Criar `frontend/src/lib/api-client.ts`:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include', // envia o cookie session-token automaticamente
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status, body })
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
}
```

---

### 2. Auth store (Zustand)

Criar `frontend/src/store/auth-store.ts`:

```typescript
import { create } from 'zustand'
import { api } from '@/lib/api-client'

interface User {
  id: string
  nome: string
  email: string
  perfil: 'SOLICITANTE' | 'ANALISTA' | 'ADMINISTRADOR'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, senha) => {
    // Pode retornar 403 com { reason: 'PASSWORD_CHANGE_REQUIRED' } — tratar na página de login
    await api.post('/api/auth/login', { email, senha })
    // Após o login, buscar dados do usuário
    const user = await api.get<User>('/api/usuarios/me')
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    await api.post('/api/auth/logout', {})
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      const user = await api.get<User>('/api/usuarios/me')
      set({ user, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
```

---

### 3. Login page funcional

Atualizar `frontend/src/app/(auth)/login/page.tsx` para lidar com três casos:

**Caso 1 — Login normal:** `POST /api/auth/login` retorna 200 → redirecionar para `/dashboard`

**Caso 2 — Troca de senha obrigatória:** `POST /api/auth/login` retorna 403 com `{ "reason": "PASSWORD_CHANGE_REQUIRED" }` → exibir o formulário de troca de senha. Ao submeter, chamar `POST /api/auth/change-password` com o payload:
```json
{ "email": "admin@safeops.com", "senhaAtual": "Admin@1234", "novaSenha": "NovaSenha@456" }
```
Resposta 200 → login automático (o cookie já é enviado na resposta).

**Caso 3 — Credenciais inválidas:** 401 → exibir mensagem de erro.

---

### 4. Header com usuário real e logout

Atualizar `frontend/src/components/layout/header.tsx`:

- Chamar `useAuthStore(state => state.user)` para pegar o nome do usuário logado
- Ao montar o componente, chamar `fetchMe()` para restaurar a sessão se o cookie ainda for válido
- Botão logout: chamar `useAuthStore(state => state.logout)()` e redirecionar para `/login`

---

### 5. Sidebar com links condicionais

Atualizar `frontend/src/components/layout/sidebar.tsx`:

```typescript
const { user } = useAuthStore()

// Mostrar link de admin apenas se perfil for ADMINISTRADOR
{user?.perfil === 'ADMINISTRADOR' && (
  <>
    <Link href="/dashboard/admin/usuarios">Usuários</Link>
    <Link href="/dashboard/admin/logs">Logs de auditoria</Link>
  </>
)}
```

---

### 6. Middleware de proteção de rotas

Atualizar `frontend/src/middleware.ts` — já existe, adicionar verificação de perfil para `/admin`:

O middleware do Next.js lê o cookie `session-token`. Se estiver ausente, redireciona para `/login`. Para rotas `/dashboard/admin/*`, verificar o perfil no cookie (o JWT contém o claim `perfil`). Se o perfil não for `ADMINISTRADOR`, redirecionar para `/dashboard`.

---

### 7. Páginas funcionais

**`/dashboard/ocorrencias`** (`app/dashboard/ocorrencias/page.tsx`):
- `GET /api/ocorrencias` → lista as ocorrências do usuário logado (o backend filtra automaticamente por perfil)
- Formulário de criação: `POST /api/ocorrencias`
- Exibir status e prioridade de cada ocorrência

**`/dashboard/admin/usuarios`** (`app/dashboard/admin/usuarios/page.tsx`):
- `GET /api/admin/usuarios` → lista todos os usuários
- Formulário de criação: `POST /api/admin/usuarios`
- Botão para desativar: `PATCH /api/admin/usuarios/{id}` com `{ "ativo": false }`

**`/dashboard/admin/logs`** (`app/dashboard/admin/logs/page.tsx`):
- `GET /api/admin/logs` → lista logs com filtros opcionais por `acao` e `de`/`ate`
- Tabela com: data, ação, usuário, detalhe, IP

---

## Contratos de integração — o que cada um depende do outro

| Quem | Depende de | O quê |
|---|---|---|
| João | Gustavo ✅ | `AuditService`, `Usuario` entity, `@AuthenticationPrincipal` |
| Alisson | Gustavo ✅ | `AuditService`, `UsuarioRepository`, `BCryptPasswordEncoder` bean |
| Vynicyus | Alisson | `GET /api/usuarios/me` (para o auth-store saber quem está logado) |
| Vynicyus | João | `GET /api/ocorrencias`, `POST /api/ocorrencias` |
| Vynicyus | Alisson | `GET /api/admin/usuarios`, `GET /api/admin/logs` |

**Sugestão de ordem:** Alisson entrega `/api/usuarios/me` primeiro (5 minutos, é um método simples), para desbloquear Vynicyus imediatamente.

---

## O que fica para 29/06

| Entregável | Responsável |
|---|---|
| MFA TOTP para ADMINISTRADOR | Gustavo |
| Dashboard com dados reais (gráficos, contadores da API) | Vynicyus |
| Relatório final consolidado | Todos |
| Defesa | Todos |

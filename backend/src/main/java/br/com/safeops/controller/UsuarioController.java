package br.com.safeops.controller;

import br.com.safeops.dto.UsuarioCriarRequest;
import br.com.safeops.dto.UsuarioEditarRequest;
import br.com.safeops.dto.UsuarioResponse;
import br.com.safeops.entity.Usuario;
import br.com.safeops.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

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
    public UsuarioResponse editar(
            @PathVariable UUID id,
            @RequestBody UsuarioEditarRequest request,
            @AuthenticationPrincipal Usuario admin,
            HttpServletRequest req) {
        return usuarioService.editar(id, request, admin, req);
    }
}

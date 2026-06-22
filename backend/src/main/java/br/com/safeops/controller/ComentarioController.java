package br.com.safeops.controller;

import br.com.safeops.dto.ComentarioRequest;
import br.com.safeops.dto.ComentarioResponse;
import br.com.safeops.entity.Usuario;
import br.com.safeops.service.ComentarioService;
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
@RequestMapping("/api/ocorrencias/{ocorrenciaId}/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;

    public ComentarioController(ComentarioService comentarioService) {
        this.comentarioService = comentarioService;
    }

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

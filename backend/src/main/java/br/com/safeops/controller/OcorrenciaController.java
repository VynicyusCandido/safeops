package br.com.safeops.controller;

import br.com.safeops.dto.*;
import br.com.safeops.entity.Usuario;
import br.com.safeops.service.OcorrenciaService;
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
@RequestMapping("/api/ocorrencias")
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;

    public OcorrenciaController(OcorrenciaService ocorrenciaService) {
        this.ocorrenciaService = ocorrenciaService;
    }

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
    @PreAuthorize("hasAnyRole('ANALISTA','ADMINISTRADOR')")
    public OcorrenciaResponse atualizarStatus(@PathVariable UUID id,
            @RequestBody @Valid StatusUpdateRequest request,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        return ocorrenciaService.atualizarStatus(id, request, usuario, req);
    }

    @PatchMapping("/{id}/analista")
    @PreAuthorize("hasAnyRole('ANALISTA','ADMINISTRADOR')")
    public OcorrenciaResponse atribuirAnalista(@PathVariable UUID id,
            @RequestBody @Valid AtribuirAnalistaRequest request,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest req) {
        return ocorrenciaService.atribuirAnalista(id, request, usuario, req);
    }

}

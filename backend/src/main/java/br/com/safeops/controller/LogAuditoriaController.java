package br.com.safeops.controller;

import br.com.safeops.entity.LogAuditoria;
import br.com.safeops.entity.Usuario;
import br.com.safeops.service.AuditAction;
import br.com.safeops.service.LogAuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/logs")
public class LogAuditoriaController {

    private final LogAuditoriaService logService;

    public LogAuditoriaController(LogAuditoriaService logService) {
        this.logService = logService;
    }

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

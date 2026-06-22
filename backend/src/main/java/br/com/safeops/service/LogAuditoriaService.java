package br.com.safeops.service;

import br.com.safeops.entity.LogAuditoria;
import br.com.safeops.entity.Usuario;
import br.com.safeops.repository.LogAuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class LogAuditoriaService {

    private final LogAuditoriaRepository logRepository;
    private final AuditService auditService;

    public LogAuditoriaService(LogAuditoriaRepository logRepository, AuditService auditService) {
        this.logRepository = logRepository;
        this.auditService = auditService;
    }

    public List<LogAuditoria> listar(AuditAction acao, UUID usuarioId,
                                      LocalDate de, LocalDate ate,
                                      Usuario admin, HttpServletRequest req) {
        Stream<LogAuditoria> stream = logRepository.findAll().stream();

        if (acao != null)
            stream = stream.filter(l -> l.getAcao() == acao);
        if (usuarioId != null)
            stream = stream.filter(l -> usuarioId.equals(l.getUsuarioId()));
        if (de != null)
            stream = stream.filter(l ->
                    l.getCriadoEm() != null &&
                    !l.getCriadoEm().isBefore(de.atStartOfDay(ZoneOffset.UTC).toInstant()));
        if (ate != null)
            stream = stream.filter(l ->
                    l.getCriadoEm() != null &&
                    !l.getCriadoEm().isAfter(ate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));

        auditService.log(AuditAction.VISUALIZAR_LOGS, admin.getId(),
                null, null, "filtro: acao=" + acao + " usuarioId=" + usuarioId, req);

        return stream.toList();
    }
}

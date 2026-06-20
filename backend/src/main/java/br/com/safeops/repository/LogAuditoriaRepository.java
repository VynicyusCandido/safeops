package br.com.safeops.repository;

import br.com.safeops.entity.LogAuditoria;
import br.com.safeops.service.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, UUID> {
    List<LogAuditoria> findByAcao(AuditAction acao);
    List<LogAuditoria> findByUsuarioId(UUID usuarioId);
    List<LogAuditoria> findByCriadoEmBetween(Instant inicio, Instant fim);
}

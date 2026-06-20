package br.com.safeops.service;

import br.com.safeops.entity.LogAuditoria;
import br.com.safeops.repository.LogAuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(propagation = Propagation.REQUIRES_NEW)
public class AuditServiceImpl implements AuditService {

    private final LogAuditoriaRepository logAuditoriaRepository;

    public AuditServiceImpl(LogAuditoriaRepository logAuditoriaRepository) {
        this.logAuditoriaRepository = logAuditoriaRepository;
    }

    @Override
    public void log(AuditAction acao, UUID usuarioId, String entidade,
                    UUID entidadeId, String detalhe, HttpServletRequest request) {
        LogAuditoria log = new LogAuditoria();
        log.setAcao(acao);
        log.setUsuarioId(usuarioId);
        log.setEntidade(entidade);
        log.setEntidadeId(entidadeId);
        log.setDetalhe(detalhe);
        log.setIpOrigem(request.getRemoteAddr());
        logAuditoriaRepository.save(log);
    }

    @Override
    public void log(AuditAction acao, String detalhe, HttpServletRequest request) {
        log(acao, null, null, null, detalhe, request);
    }
}

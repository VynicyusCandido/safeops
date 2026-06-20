package br.com.safeops.service;

import br.com.safeops.repository.LogAuditoriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class AuditServiceImplTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private LogAuditoriaRepository logAuditoriaRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private MockHttpServletRequest mockRequest;

    @BeforeEach
    void setUp() {
        logAuditoriaRepository.deleteAll();
        mockRequest = new MockHttpServletRequest();
        mockRequest.setRemoteAddr("127.0.0.1");
    }

    @Test
    void log_anonimo_persisteComIpDoRequest() {
        auditService.log(AuditAction.LOGIN_FALHO, "email: x@y.com", mockRequest);

        var logs = logAuditoriaRepository.findAll();
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAcao()).isEqualTo(AuditAction.LOGIN_FALHO);
        assertThat(logs.get(0).getIpOrigem()).isEqualTo("127.0.0.1");
        assertThat(logs.get(0).getUsuarioId()).isNull();
    }

    @Test
    void log_autenticado_persisteComUsuarioId() {
        UUID userId = UUID.randomUUID();
        UUID ocorrenciaId = UUID.randomUUID();

        auditService.log(AuditAction.CRIAR_OCORRENCIA, userId,
            "Ocorrencia", ocorrenciaId, "titulo: 'Teste'", mockRequest);

        var logs = logAuditoriaRepository.findAll();
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getUsuarioId()).isEqualTo(userId);
        assertThat(logs.get(0).getEntidade()).isEqualTo("Ocorrencia");
        assertThat(logs.get(0).getEntidadeId()).isEqualTo(ocorrenciaId);
    }

    @Test
    void log_persisteComRequiresNew_mesmoComRollbackDoCaller() {
        // Simula um service que chama auditService.log() e depois lança exceção
        assertThatThrownBy(() ->
            transactionTemplate.execute(status -> {
                auditService.log(AuditAction.LOGIN_FALHO, "teste", mockRequest);
                throw new RuntimeException("simula falha de negócio");
            })
        ).isInstanceOf(RuntimeException.class);

        // Log deve persistir — REQUIRES_NEW commitou em transação separada
        assertThat(logAuditoriaRepository.count()).isEqualTo(1);
    }
}

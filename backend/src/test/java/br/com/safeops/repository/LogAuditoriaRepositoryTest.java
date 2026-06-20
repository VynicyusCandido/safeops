package br.com.safeops.repository;

import br.com.safeops.entity.LogAuditoria;
import br.com.safeops.service.AuditAction;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class LogAuditoriaRepositoryTest {

    @Autowired
    private LogAuditoriaRepository logAuditoriaRepository;

    @Test
    void save_persisteLog_comIpEAcao() {
        LogAuditoria log = new LogAuditoria();
        log.setAcao(AuditAction.LOGIN);
        log.setIpOrigem("127.0.0.1");
        log.setDetalhe("email: teste@safeops.com");

        LogAuditoria salvo = logAuditoriaRepository.save(log);

        assertThat(salvo.getId()).isNotNull();
        assertThat(salvo.getAcao()).isEqualTo(AuditAction.LOGIN);
        assertThat(salvo.getIpOrigem()).isEqualTo("127.0.0.1");
    }

    @Test
    void save_persisteLog_anonimo_semUsuarioId() {
        LogAuditoria log = new LogAuditoria();
        log.setAcao(AuditAction.LOGIN_FALHO);
        log.setIpOrigem("192.168.1.1");
        log.setDetalhe("tentativa com email: hacker@evil.com");

        LogAuditoria salvo = logAuditoriaRepository.save(log);

        assertThat(salvo.getId()).isNotNull();
        assertThat(salvo.getUsuarioId()).isNull();
    }
}

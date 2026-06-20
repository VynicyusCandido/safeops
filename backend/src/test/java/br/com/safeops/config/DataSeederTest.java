package br.com.safeops.config;

import br.com.safeops.entity.Perfil;
import br.com.safeops.entity.Usuario;
import br.com.safeops.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DataSeederTest {

    @Autowired private DataSeeder dataSeeder;
    @Autowired private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
    }

    @Test
    void run_criaAdministrador_comFlagTrocarSenha() throws Exception {
        dataSeeder.run();

        Optional<Usuario> admin = usuarioRepository.findByEmail("admin@test.com");
        assertThat(admin).isPresent();
        assertThat(admin.get().getPerfil()).isEqualTo(Perfil.ADMINISTRADOR);
        assertThat(admin.get().isTrocarSenhaNoProximoLogin()).isTrue();
        assertThat(admin.get().getSenhaHash()).doesNotContain("Test@1234");
    }

    @Test
    void run_eIdempotente_naoRecriaSeCriadoNovamente() throws Exception {
        dataSeeder.run();
        dataSeeder.run();

        assertThat(usuarioRepository.count()).isEqualTo(1);
    }
}

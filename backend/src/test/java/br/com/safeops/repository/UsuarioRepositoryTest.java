package br.com.safeops.repository;

import br.com.safeops.entity.Perfil;
import br.com.safeops.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TestEntityManager em;

    @Test
    void findByEmail_retornaUsuario_quandoEmailExiste() {
        Usuario u = new Usuario();
        u.setNome("Teste");
        u.setEmail("teste@safeops.com");
        u.setSenhaHash("hash");
        u.setPerfil(Perfil.SOLICITANTE);
        em.persistAndFlush(u);

        Optional<Usuario> resultado = usuarioRepository.findByEmail("teste@safeops.com");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getNome()).isEqualTo("Teste");
    }

    @Test
    void findByEmail_retornaVazio_quandoEmailNaoExiste() {
        Optional<Usuario> resultado = usuarioRepository.findByEmail("naoexiste@safeops.com");
        assertThat(resultado).isEmpty();
    }

    @Test
    void usuario_temAuthority_baseadaEmPerfil() {
        Usuario u = new Usuario();
        u.setNome("Admin");
        u.setEmail("admin@safeops.com");
        u.setSenhaHash("hash");
        u.setPerfil(Perfil.ADMINISTRADOR);
        em.persistAndFlush(u);

        Usuario salvo = usuarioRepository.findByEmail("admin@safeops.com").orElseThrow();
        assertThat(salvo.getAuthorities())
            .extracting(Object::toString)
            .containsExactly("ROLE_ADMINISTRADOR");
    }
}

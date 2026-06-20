package br.com.safeops.controller;

import br.com.safeops.entity.Perfil;
import br.com.safeops.entity.Usuario;
import br.com.safeops.repository.LogAuditoriaRepository;
import br.com.safeops.repository.UsuarioRepository;
import br.com.safeops.service.AuditAction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private LogAuditoriaRepository logAuditoriaRepository;
    @Autowired private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        logAuditoriaRepository.deleteAll();
        usuarioRepository.deleteAll();

        Usuario usuario = new Usuario();
        usuario.setNome("Teste");
        usuario.setEmail("user@safeops.com");
        usuario.setSenhaHash(passwordEncoder.encode("Senha@123"));
        usuario.setPerfil(Perfil.SOLICITANTE);
        usuario.setTrocarSenhaNoProximoLogin(false);
        usuarioRepository.save(usuario);
    }

    @Test
    void login_retorna200_e_cookie_comCredenciaisValidas() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"user@safeops.com","senha":"Senha@123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(cookie().exists("session-token"))
            .andExpect(cookie().httpOnly("session-token", true));
    }

    @Test
    void login_retorna401_semCookie_comSenhaErrada() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"user@safeops.com","senha":"SenhaErrada"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(cookie().doesNotExist("session-token"));

        assertThat(logAuditoriaRepository.findByAcao(AuditAction.LOGIN_FALHO)).hasSize(1);
    }

    @Test
    void login_retorna403_comPasswordChangeRequired_quandoFlagAtiva() throws Exception {
        usuarioRepository.findByEmail("user@safeops.com").ifPresent(u -> {
            u.setTrocarSenhaNoProximoLogin(true);
            usuarioRepository.save(u);
        });

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"user@safeops.com","senha":"Senha@123"}
                    """))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.reason").value("PASSWORD_CHANGE_REQUIRED"))
            .andExpect(cookie().doesNotExist("session-token"));
    }

    @Test
    void changePassword_semAutenticacao_retorna200_quandoTrocarSenhaFlagAtiva() throws Exception {
        usuarioRepository.findByEmail("user@safeops.com").ifPresent(u -> {
            u.setTrocarSenhaNoProximoLogin(true);
            usuarioRepository.save(u);
        });

        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"user@safeops.com","senhaAtual":"Senha@123","novaSenha":"NovaSenha@456"}
                    """))
            .andExpect(status().isOk())
            .andExpect(cookie().exists("session-token"));
    }

    @Test
    void changePassword_semAutenticacao_retorna401_quandoFlagInativa() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"user@safeops.com","senhaAtual":"Senha@123","novaSenha":"NovaSenha@456"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword_semAutenticacao_semEmail_retorna400() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"senhaAtual":"Senha@123","novaSenha":"NovaSenha@456"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void logout_expira_cookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isNoContent())
            .andExpect(cookie().maxAge("session-token", 0));
    }
}

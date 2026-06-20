package br.com.safeops.config;

import br.com.safeops.entity.Perfil;
import br.com.safeops.entity.Usuario;
import br.com.safeops.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.senha}")
    private String adminSenha;

    public DataSeeder(UsuarioRepository usuarioRepository,
                      BCryptPasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }

        Usuario admin = new Usuario();
        admin.setNome("Administrador");
        admin.setEmail(adminEmail);
        admin.setSenhaHash(passwordEncoder.encode(adminSenha));
        admin.setPerfil(Perfil.ADMINISTRADOR);
        admin.setTrocarSenhaNoProximoLogin(true);
        usuarioRepository.save(admin);

        log.warn(">>> ADMIN criado: {} — troca de senha obrigatória no primeiro login", adminEmail);
    }
}

package br.com.safeops.service;

import br.com.safeops.entity.Usuario;
import br.com.safeops.exception.PasswordChangeRequiredException;
import br.com.safeops.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final AuditService auditService;

    @Value("${security.jwt.expiration-minutes}")
    private long expiracaoMinutos;

    public AuthService(UsuarioRepository usuarioRepository,
                       BCryptPasswordEncoder passwordEncoder,
                       JwtEncoder jwtEncoder,
                       AuditService auditService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.auditService = auditService;
    }

    public String login(String email, String senha, HttpServletRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            auditService.log(AuditAction.LOGIN_FALHO,
                "tentativa com email: " + email, request);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        if (!usuario.isAtivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta desativada");
        }

        if (usuario.isTrocarSenhaNoProximoLogin()) {
            throw new PasswordChangeRequiredException();
        }

        auditService.log(AuditAction.LOGIN, usuario.getId(),
            "Usuario", usuario.getId(), "email: " + email, request);

        return emitirToken(usuario);
    }

    public String changePassword(Usuario usuario, String senhaAtual,
                                  String novaSenha, HttpServletRequest request) {
        if (!passwordEncoder.matches(senhaAtual, usuario.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }

        if (senhaAtual.equals(novaSenha)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Nova senha não pode ser igual à atual");
        }

        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuario.setTrocarSenhaNoProximoLogin(false);
        usuarioRepository.save(usuario);

        auditService.log(AuditAction.EDITAR_USUARIO, usuario.getId(),
            "Usuario", usuario.getId(), "senha alterada", request);

        return emitirToken(usuario);
    }

    private String emitirToken(Usuario usuario) {
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .subject(usuario.getId().toString())
            .claim("perfil", usuario.getPerfil().name())
            .issuedAt(agora)
            .expiresAt(agora.plusSeconds(expiracaoMinutos * 60L))
            .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}

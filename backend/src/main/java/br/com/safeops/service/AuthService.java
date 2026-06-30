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

import br.com.safeops.exception.MfaRequiredException;
import br.com.safeops.exception.MfaSetupRequiredException;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.util.Utils;
import dev.samstevens.totp.exceptions.QrGenerationException;

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

    public String generateMfaSecret() {
        SecretGenerator generator = new DefaultSecretGenerator();
        return generator.generate();
    }

    public boolean verifyMfaCode(String secret, String code) {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        // Permite uma discrepância de janelas de tempo caso o relógio atrase um pouco
        verifier.setAllowedTimePeriodDiscrepancy(2);
        return verifier.isValidCode(secret, code);
    }

    private String generateQrCodeUri(String secret, String email) {
        try {
            QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer("SafeOps")
                .algorithm(dev.samstevens.totp.code.HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
            QrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageData = generator.generate(data);
            String mimeType = generator.getImageMimeType();
            return Utils.getDataUriForImage(imageData, mimeType);
        } catch (QrGenerationException e) {
            throw new RuntimeException("Erro ao gerar QR Code para MFA", e);
        }
    }

    public String login(String email, String senha, String mfaCode, HttpServletRequest request) {
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

        if (!usuario.isMfaEnabled()) {
            if (usuario.getMfaSecret() == null) {
                usuario.setMfaSecret(generateMfaSecret());
                usuarioRepository.save(usuario);
            }
            if (mfaCode == null || mfaCode.isBlank()) {
                String qrCodeUri = generateQrCodeUri(usuario.getMfaSecret(), usuario.getEmail());
                throw new MfaSetupRequiredException(qrCodeUri);
            } else {
                if (!verifyMfaCode(usuario.getMfaSecret(), mfaCode)) {
                    auditService.log(AuditAction.LOGIN_FALHO, "Código MFA inválido no setup para email: " + email, request);
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código MFA inválido");
                }
                usuario.setMfaEnabled(true);
                usuarioRepository.save(usuario);
            }
        } else {
            if (mfaCode == null || mfaCode.isBlank()) {
                throw new MfaRequiredException();
            }
            if (!verifyMfaCode(usuario.getMfaSecret(), mfaCode)) {
                auditService.log(AuditAction.LOGIN_FALHO, "Código MFA inválido para email: " + email, request);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código MFA inválido");
            }
        }

        auditService.log(AuditAction.LOGIN, usuario.getId(),
            "Usuario", usuario.getId(), "email: " + email, request);

        return emitirToken(usuario);
    }

    public String changePasswordForcado(String email, String senhaAtual,
                                        String novaSenha, HttpServletRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .filter(Usuario::isTrocarSenhaNoProximoLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return changePassword(usuario, senhaAtual, novaSenha, request);
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

package br.com.safeops.controller;

import br.com.safeops.dto.ChangePasswordRequest;
import br.com.safeops.dto.LoginRequest;
import br.com.safeops.entity.Usuario;
import br.com.safeops.exception.PasswordChangeRequiredException;
import br.com.safeops.exception.MfaRequiredException;
import br.com.safeops.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${security.jwt.expiration-minutes}")
    private long expiracaoMinutos;

    @Value("${server.servlet.session.cookie.secure:true}")
    private boolean cookieSecure;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        try {
            String token = authService.login(request.email(), request.senha(), request.mfaCode(), httpRequest);
            addSessionCookie(response, token);
            return ResponseEntity.ok(Map.of("message", "Login realizado com sucesso"));
        } catch (PasswordChangeRequiredException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("reason", "PASSWORD_CHANGE_REQUIRED"));
        } catch (MfaRequiredException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("reason", "MFA_REQUIRED"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("session-token", "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid ChangePasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        String token;
        if (usuario != null) {
            token = authService.changePassword(
                usuario, request.senhaAtual(), request.novaSenha(), httpRequest);
            addSessionCookie(response, token);
        } else {
            if (request.email() == null || request.email().isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email obrigatório para troca de senha sem autenticação"));
            }
            authService.changePasswordForcado(
                request.email(), request.senhaAtual(), request.novaSenha(), httpRequest);
            // Não adiciona cookie no changePasswordForcado (primeiro acesso) para forçar o login completo com MFA
        }
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso"));
    }

    private void addSessionCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("session-token", token)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofMinutes(expiracaoMinutos))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}

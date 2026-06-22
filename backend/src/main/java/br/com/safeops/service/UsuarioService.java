package br.com.safeops.service;

import br.com.safeops.dto.UsuarioCriarRequest;
import br.com.safeops.dto.UsuarioEditarRequest;
import br.com.safeops.dto.UsuarioResponse;
import br.com.safeops.entity.Usuario;
import br.com.safeops.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          BCryptPasswordEncoder passwordEncoder,
                          AuditService auditService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public UsuarioResponse criar(UsuarioCriarRequest request, Usuario admin, HttpServletRequest req) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        Usuario novo = new Usuario();
        novo.setNome(request.nome());
        novo.setEmail(request.email());
        novo.setSenhaHash(passwordEncoder.encode(request.senha()));
        novo.setPerfil(request.perfil());
        novo.setTrocarSenhaNoProximoLogin(true);
        usuarioRepository.save(novo);

        auditService.log(AuditAction.CRIAR_USUARIO, admin.getId(),
                "Usuario", novo.getId(),
                "email: " + novo.getEmail() + ", perfil: " + novo.getPerfil(), req);

        return UsuarioResponse.from(novo);
    }

    public UsuarioResponse editar(UUID id, UsuarioEditarRequest request,
                                   Usuario admin, HttpServletRequest req) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        StringBuilder alteracoes = new StringBuilder();
        if (request.perfil() != null) {
            alteracoes.append("perfil: ").append(request.perfil());
            usuario.setPerfil(request.perfil());
        }
        if (request.ativo() != null) {
            alteracoes.append(" ativo: ").append(request.ativo());
            usuario.setAtivo(request.ativo());
        }
        usuarioRepository.save(usuario);

        auditService.log(AuditAction.EDITAR_USUARIO, admin.getId(),
                "Usuario", usuario.getId(), "campos alterados: " + alteracoes, req);

        return UsuarioResponse.from(usuario);
    }

    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
                .map(UsuarioResponse::from)
                .toList();
    }

    public UsuarioResponse buscarPorId(UUID id) {
        return usuarioRepository.findById(id)
                .map(UsuarioResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public UsuarioResponse me(Usuario usuario) {
        return UsuarioResponse.from(usuario);
    }
}

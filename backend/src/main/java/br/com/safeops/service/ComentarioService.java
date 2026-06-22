package br.com.safeops.service;

import br.com.safeops.dto.ComentarioRequest;
import br.com.safeops.dto.ComentarioResponse;
import br.com.safeops.entity.*;
import br.com.safeops.repository.ComentarioRepository;
import br.com.safeops.repository.OcorrenciaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final AuditService auditService;

    public ComentarioService(ComentarioRepository comentarioRepository,
                              OcorrenciaRepository ocorrenciaRepository,
                              AuditService auditService) {
        this.comentarioRepository = comentarioRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.auditService = auditService;
    }

    public ComentarioResponse adicionar(UUID ocorrenciaId, ComentarioRequest request,
                                        Usuario autor, HttpServletRequest req) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (autor.getPerfil() == Perfil.SOLICITANTE
                && !ocorrencia.getSolicitante().getId().equals(autor.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Comentario comentario = new Comentario();
        comentario.setOcorrencia(ocorrencia);
        comentario.setAutor(autor);
        comentario.setConteudo(request.conteudo());
        comentarioRepository.save(comentario);
        auditService.log(AuditAction.ADICIONAR_COMENTARIO, autor.getId(),
                "Comentario", comentario.getId(),
                "ocorrencia_id: " + ocorrenciaId, req);
        return ComentarioResponse.from(comentario);
    }

    public List<ComentarioResponse> listarPorOcorrencia(UUID ocorrenciaId, Usuario usuario) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (usuario.getPerfil() == Perfil.SOLICITANTE
                && !ocorrencia.getSolicitante().getId().equals(usuario.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return comentarioRepository.findByOcorrencia(ocorrencia)
                .stream().map(ComentarioResponse::from).toList();
    }
}

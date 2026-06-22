package br.com.safeops.service;

import br.com.safeops.dto.*;
import br.com.safeops.entity.*;
import br.com.safeops.repository.OcorrenciaRepository;
import br.com.safeops.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OcorrenciaService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditService auditService;

    public OcorrenciaService(OcorrenciaRepository ocorrenciaRepository,
                              UsuarioRepository usuarioRepository,
                              AuditService auditService) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditService = auditService;
    }

    public OcorrenciaResponse criar(OcorrenciaRequest request, Usuario solicitante,
                                    HttpServletRequest req) {
        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.setTitulo(request.titulo());
        ocorrencia.setDescricao(request.descricao());
        ocorrencia.setPrioridade(request.prioridade());
        ocorrencia.setSolicitante(solicitante);
        ocorrenciaRepository.save(ocorrencia);
        auditService.log(AuditAction.CRIAR_OCORRENCIA, solicitante.getId(),
                "Ocorrencia", ocorrencia.getId(),
                "titulo: '" + ocorrencia.getTitulo() + "'", req);
        return OcorrenciaResponse.from(ocorrencia);
    }

    public List<OcorrenciaResponse> listar(Usuario usuario) {
        List<Ocorrencia> lista = usuario.getPerfil() == Perfil.SOLICITANTE
                ? ocorrenciaRepository.findBySolicitante(usuario)
                : ocorrenciaRepository.findAll();
        return lista.stream().map(OcorrenciaResponse::from).toList();
    }

    public OcorrenciaResponse buscarPorId(UUID id, Usuario usuario) {
        return OcorrenciaResponse.from(buscarComVerificacao(id, usuario));
    }

    public OcorrenciaResponse atualizarStatus(UUID id, StatusUpdateRequest request,
                                               Usuario usuario, HttpServletRequest req) {
        Ocorrencia ocorrencia = buscarComVerificacao(id, usuario);
        StatusOcorrencia statusAnterior = ocorrencia.getStatus();
        ocorrencia.setStatus(request.status());
        if (request.status() == StatusOcorrencia.ENCERRADA)
            ocorrencia.setEncerradoEm(Instant.now());
        ocorrenciaRepository.save(ocorrencia);
        auditService.log(AuditAction.ALTERAR_STATUS, usuario.getId(),
                "Ocorrencia", ocorrencia.getId(),
                "de: " + statusAnterior + " para: " + request.status(), req);
        return OcorrenciaResponse.from(ocorrencia);
    }

    public OcorrenciaResponse atribuirAnalista(UUID id, AtribuirAnalistaRequest request,
                                                Usuario usuario, HttpServletRequest req) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Usuario analista = usuarioRepository.findById(request.analistaId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Analista não encontrado"));
        ocorrencia.setAnalista(analista);
        ocorrenciaRepository.save(ocorrencia);
        auditService.log(AuditAction.ATRIBUIR_ANALISTA, usuario.getId(),
                "Ocorrencia", ocorrencia.getId(),
                "analista_id: " + analista.getId(), req);
        return OcorrenciaResponse.from(ocorrencia);
    }

    public void deletar(UUID id, HttpServletRequest req) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ocorrenciaRepository.delete(ocorrencia);
    }

    private Ocorrencia buscarComVerificacao(UUID id, Usuario usuario) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (usuario.getPerfil() == Perfil.SOLICITANTE
                && !ocorrencia.getSolicitante().getId().equals(usuario.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return ocorrencia;
    }
}

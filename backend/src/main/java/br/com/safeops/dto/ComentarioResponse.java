package br.com.safeops.dto;

import br.com.safeops.entity.Comentario;
import java.time.Instant;
import java.util.UUID;

public record ComentarioResponse(
        UUID id, UUID ocorrenciaId, UUID autorId,
        String conteudo, Instant criadoEm
) {
    public static ComentarioResponse from(Comentario c) {
        return new ComentarioResponse(
                c.getId(), c.getOcorrencia().getId(), c.getAutor().getId(),
                c.getConteudo(), c.getCriadoEm()
        );
    }
}

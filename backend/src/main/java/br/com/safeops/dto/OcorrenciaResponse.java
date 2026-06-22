package br.com.safeops.dto;

import br.com.safeops.entity.Ocorrencia;
import br.com.safeops.entity.Prioridade;
import br.com.safeops.entity.StatusOcorrencia;
import java.time.Instant;
import java.util.UUID;

public record OcorrenciaResponse(
        UUID id, String titulo, String descricao,
        StatusOcorrencia status, Prioridade prioridade,
        UUID solicitanteId, UUID analistaId,
        Instant criadoEm, Instant atualizadoEm
) {
    public static OcorrenciaResponse from(Ocorrencia o) {
        return new OcorrenciaResponse(
                o.getId(), o.getTitulo(), o.getDescricao(),
                o.getStatus(), o.getPrioridade(),
                o.getSolicitante().getId(),
                o.getAnalista() != null ? o.getAnalista().getId() : null,
                o.getCriadoEm(), o.getAtualizadoEm()
        );
    }
}

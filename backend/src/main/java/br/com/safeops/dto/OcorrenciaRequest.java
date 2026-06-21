package br.com.safeops.dto;

import br.com.safeops.entity.Prioridade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OcorrenciaRequest(
        @NotBlank String titulo,
        String descricao,
        @NotNull Prioridade prioridade
) {}

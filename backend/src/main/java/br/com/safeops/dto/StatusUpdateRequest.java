package br.com.safeops.dto;

import br.com.safeops.entity.StatusOcorrencia;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(@NotNull StatusOcorrencia status) {}

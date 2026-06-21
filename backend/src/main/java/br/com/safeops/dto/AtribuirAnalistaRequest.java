package br.com.safeops.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AtribuirAnalistaRequest(@NotNull UUID analistaId) {}

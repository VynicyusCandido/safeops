package br.com.safeops.dto;

import jakarta.validation.constraints.NotBlank;

public record ComentarioRequest(@NotBlank String conteudo) {}

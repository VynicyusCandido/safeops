package br.com.safeops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank String senhaAtual,
    @NotBlank @Size(min = 8) String novaSenha
) {}

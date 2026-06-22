package br.com.safeops.dto;

import br.com.safeops.entity.Perfil;

public record UsuarioEditarRequest(Perfil perfil, Boolean ativo) {}

package br.com.safeops.dto;

import br.com.safeops.entity.Perfil;
import br.com.safeops.entity.Usuario;

import java.time.Instant;
import java.util.UUID;

public record UsuarioResponse(UUID id, String nome, String email, Perfil perfil,
                               boolean ativo, Instant criadoEm) {

    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(
                u.getId(), u.getNome(), u.getEmail(),
                u.getPerfil(), u.isAtivo(), u.getCriadoEm()
        );
    }
}

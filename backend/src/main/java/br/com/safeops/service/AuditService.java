package br.com.safeops.service;

import jakarta.servlet.http.HttpServletRequest;

import java.util.UUID;

public interface AuditService {

    void log(AuditAction acao,
             UUID usuarioId,
             String entidade,
             UUID entidadeId,
             String detalhe,
             HttpServletRequest request);

    void log(AuditAction acao,
             String detalhe,
             HttpServletRequest request);
}

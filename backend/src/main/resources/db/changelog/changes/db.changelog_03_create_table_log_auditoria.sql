-- liquibase formatted sql

-- changeset liquibase:03_create_table_log_auditoria
CREATE TABLE log_auditoria (
    id UUID PRIMARY KEY,
    usuario_id UUID,
    acao VARCHAR(80) NOT NULL,
    entidade VARCHAR(60),
    entidade_id UUID,
    detalhe TEXT,
    ip_origem VARCHAR(45),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

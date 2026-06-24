-- liquibase formatted sql

-- changeset liquibase:01_create_table_ocorrencia
CREATE TABLE ocorrencia (
    id UUID PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,
    solicitante_id UUID NOT NULL,
    analista_id UUID,
    criado_em TIMESTAMP WITH TIME ZONE,
    atualizado_em TIMESTAMP WITH TIME ZONE,
    encerrado_em TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_ocorrencia_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuario (id),
    CONSTRAINT fk_ocorrencia_analista FOREIGN KEY (analista_id) REFERENCES usuario (id)
);

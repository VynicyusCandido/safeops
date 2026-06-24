-- liquibase formatted sql

-- changeset liquibase:02_create_table_comentario
CREATE TABLE comentario (
    id UUID PRIMARY KEY,
    ocorrencia_id UUID NOT NULL,
    autor_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_comentario_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencia (id),
    CONSTRAINT fk_comentario_autor FOREIGN KEY (autor_id) REFERENCES usuario (id)
);

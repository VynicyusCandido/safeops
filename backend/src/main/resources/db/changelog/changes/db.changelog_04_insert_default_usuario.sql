-- liquibase formatted sql

-- changeset liquibase:04_insert_default_usuario
-- validCheckSum: 9:173f91f4a0f468890f4a8ad32b6807cf
INSERT INTO usuario (id, nome, email, senha_hash, perfil, ativo, trocar_senha_no_proximo_login, criado_em, atualizado_em)
VALUES
(gen_random_uuid(), 'Administrador', 'admin@safeops.com', '$2a$10$eulZDglFlLmBOxy4sFkJuu6LYXMBH.bJQ4L./zVhcSj8Ef.bVGb8O', 'ADMINISTRADOR', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Password: Admin@1234
(gen_random_uuid(), 'Analista', 'analista@safeops.com', '$2a$10$X48NY.hqdLnUKmVqN.Se.OKla9nBXUybm6sMEQOX1PgsZnxDiiuh.', 'ANALISTA', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- Password: Analista@1234
(gen_random_uuid(), 'Solicitante', 'solicitante@safeops.com', '$2a$10$dhw3nCeAdFxR24Th.aYi.u599LArrxL.VLhYAx0vVA7ebEj6DC99.', 'SOLICITANTE', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); -- Password: Solicitante@1234

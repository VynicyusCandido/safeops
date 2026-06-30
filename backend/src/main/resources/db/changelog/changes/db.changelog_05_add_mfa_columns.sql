-- liquibase formatted sql

-- changeset liquibase:05_add_mfa_columns
ALTER TABLE usuario ADD COLUMN mfa_secret VARCHAR(64);
ALTER TABLE usuario ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL;

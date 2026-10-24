-- STAGING DE ENSAIO. Não é o esquema final institucional nem migra a produção.
-- Aplicar em banco exclusivo, com psql -v ON_ERROR_STOP=1. Sem DROP/UPDATE de dados.
BEGIN;
CREATE SCHEMA IF NOT EXISTS prgd_staging;
CREATE TABLE IF NOT EXISTS prgd_staging.import_runs (
    import_id uuid PRIMARY KEY,
    source_project text NOT NULL CHECK (length(source_project) > 0),
    source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
    exported_at timestamptz NOT NULL,
    expected_documents bigint NOT NULL CHECK (expected_documents >= 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_project, source_sha256)
);
CREATE TABLE IF NOT EXISTS prgd_staging.documents (
    import_id uuid NOT NULL REFERENCES prgd_staging.import_runs(import_id),
    document_path text NOT NULL CHECK (
        length(document_path) > 0 AND document_path !~ '^/' AND document_path !~ '/$' AND document_path !~ '//'
        AND cardinality(string_to_array(document_path, '/')) % 2 = 0
        AND document_path !~ '(^|/)\.{1,2}(/|$)'
    ),
    fields_typed jsonb NOT NULL CHECK (jsonb_typeof(fields_typed) = 'object'),
    content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
    source_create_time timestamptz,
    source_update_time timestamptz,
    PRIMARY KEY (import_id, document_path)
);
CREATE TABLE IF NOT EXISTS prgd_staging.identity_mapping (
    import_id uuid NOT NULL REFERENCES prgd_staging.import_runs(import_id),
    firebase_uid text NOT NULL,
    provider_issuer text NOT NULL,
    provider_subject text NOT NULL,
    person_document_path text NOT NULL,
    reviewed_by text NOT NULL CHECK (length(reviewed_by) > 0),
    reviewed_at timestamptz NOT NULL,
    PRIMARY KEY (import_id, firebase_uid, provider_issuer),
    UNIQUE (import_id, provider_issuer, provider_subject),
    FOREIGN KEY (import_id, person_document_path)
        REFERENCES prgd_staging.documents(import_id, document_path)
);
COMMENT ON TABLE prgd_staging.documents IS
'Payload tipado preserva integerValue em string, timestamps, arrays, maps, referências, bytes e campos legados sem conversão automática.';
COMMIT;

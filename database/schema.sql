-- Secure Document Management System (SDMS)
-- PostgreSQL Schema

-- Clean slate (safe for re-running during development)
DROP TABLE IF EXISTS failed_logins CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,       -- bcrypt hash only, never plaintext
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(10)  NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    failed_attempts INT NOT NULL DEFAULT 0,
    is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    locked_until    TIMESTAMP,
    last_login      TIMESTAMP,
    -- Two-Factor Authentication (TOTP) support
    totp_secret     VARCHAR(32),                 -- TOTP shared secret (optional)
    totp_enabled    BOOLEAN NOT NULL DEFAULT FALSE, -- user has enrolled in 2FA
    -- Account status (soft delete)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,  -- admin can deactivate without deleting
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 2. DOCUMENTS
CREATE TABLE documents (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL UNIQUE,
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_original_name ON documents(original_name);
CREATE INDEX idx_documents_title ON documents(title);

-- 3. ACTIVITY LOGS
CREATE TABLE activity_logs (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE SET NULL,
    action_type     VARCHAR(30) NOT NULL
        CHECK (action_type IN (
            'login',
            'logout',
            'upload',
            'update',
            'delete',
            'password_change'
        )),
    description     TEXT,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);

-- 4. FAILED LOGINS
CREATE TABLE failed_logins (
    id                  SERIAL PRIMARY KEY,
    attempted_username  VARCHAR(50) NOT NULL,    -- logged as typed; may not match a real user
    ip_address          VARCHAR(45),
    reason              VARCHAR(100),            -- e.g. 'wrong password', 'account locked', 'account deactivated'
    attempted_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_failed_logins_username ON failed_logins(attempted_username);
CREATE INDEX idx_failed_logins_ip ON failed_logins(ip_address);

-- TRIGGER: auto-update users.updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- OPTIONAL: seed an initial admin account
-- Replace 'REPLACE_WITH_BCRYPT_HASH' with a real bcrypt hash
-- generated in your Node.js app (never store plaintext here).
-- INSERT INTO users (username, email, password_hash, full_name, role)
-- VALUES ('admin', 'admin@example.com', 'REPLACE_WITH_BCRYPT_HASH', 'System Admin', 'admin');
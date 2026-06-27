-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    enrollment_number VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    docket VARCHAR(255),
    court VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    contradictions_count INT DEFAULT 0,
    case_timeline JSONB DEFAULT '[]',
    case_investigations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    original_name VARCHAR(500) NOT NULL,
    cloudinary_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    extracted_data JSONB DEFAULT '{}',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (case_id, original_name)
);

CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);


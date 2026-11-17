-- =============================================================
-- PostgreSQL Database Initialization Script
-- Project : Yaloric Assignment – User Management App
-- Database: yaloric_db
-- Run via : psql -U postgres -d yaloric_db -f backend/prisma/init.sql
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define user role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    phone      VARCHAR(20)  NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       user_role    NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast email lookups (login / duplicate-check)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Default Admin Account (admin@yaloric.com / Admin@123)
INSERT INTO users (first_name, last_name, email, phone, password, role)
VALUES (
    'Admin',
    'User',
    'admin@yaloric.com',
    '9876543210',
    '$2b$10$R69bxAzYN81Z0cmig6YRqe6KV358vILM7gvvhK5CUAv2ss92aSkLC',
    'ADMIN'
)
ON CONFLICT (email) DO NOTHING;



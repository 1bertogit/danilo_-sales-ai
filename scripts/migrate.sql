-- ═══════════════════════════════════════════════════════════════
-- Danilo Sales OS - Database Migration Script
-- Run this against your Neon PostgreSQL database
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- LEADS TABLE
-- Stores information about potential customers/contacts
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    specialty TEXT CHECK (specialty IN ('Cirurgião Plástico', 'Dermatologista', 'Otorrino', 'Outro')),
    stage TEXT CHECK (stage IN ('Descoberta', 'Consideração', 'Negociação', 'Fechamento')) DEFAULT 'Descoberta',
    temperature TEXT CHECK (temperature IN ('Frio', 'Morno', 'Quente')) DEFAULT 'Frio',
    last_contact TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster sorting by last contact
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON leads(last_contact DESC);

-- ─────────────────────────────────────────────────────────────────
-- TASKS TABLE
-- Stores follow-up tasks and reminders for leads
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    type TEXT CHECK (type IN ('followup_24h', 'followup_72h', 'followup_7d', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster task queries
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ─────────────────────────────────────────────────────────────────
-- MESSAGES TABLE
-- Stores chat history between users and the AI for each lead
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'model')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster message retrieval by lead
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ─────────────────────────────────────────────────────────────────
-- RAG STORES TABLE
-- Maps Google Gemini RAG store IDs to display names
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- Google RAG store ID (e.g., workspaces/default/stores/main)
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- SEED DATA (Optional - Sample leads for testing)
-- ─────────────────────────────────────────────────────────────────

-- Insert sample leads
INSERT INTO leads (name, phone, specialty, stage, temperature, last_contact) VALUES
    ('Dr. Ricardo Mendes', '(11) 99999-1234', 'Cirurgião Plástico', 'Negociação', 'Quente', NOW() - INTERVAL '2 hours'),
    ('Dra. Ana Paula Silva', '(21) 98888-5678', 'Dermatologista', 'Consideração', 'Morno', NOW() - INTERVAL '1 day'),
    ('Dr. Carlos Eduardo', '(31) 97777-9012', 'Otorrino', 'Descoberta', 'Frio', NOW() - INTERVAL '3 days'),
    ('Dra. Fernanda Costa', '(41) 96666-3456', 'Cirurgião Plástico', 'Fechamento', 'Quente', NOW() - INTERVAL '30 minutes'),
    ('Dr. Bruno Oliveira', '(51) 95555-7890', 'Dermatologista', 'Negociação', 'Morno', NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- Insert sample tasks for the leads
INSERT INTO tasks (lead_id, description, due_date, status, type)
SELECT
    l.id,
    'Follow-up: Enviar proposta comercial',
    NOW() + INTERVAL '2 hours',
    'pending',
    'followup_24h'
FROM leads l WHERE l.name = 'Dr. Ricardo Mendes'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (lead_id, description, due_date, status, type)
SELECT
    l.id,
    'Ligar para esclarecer dúvidas sobre o método',
    NOW() + INTERVAL '1 day',
    'pending',
    'followup_24h'
FROM leads l WHERE l.name = 'Dra. Ana Paula Silva'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (lead_id, description, due_date, status, type)
SELECT
    l.id,
    'Enviar link de checkout - Lead quente!',
    NOW(),
    'pending',
    'manual'
FROM leads l WHERE l.name = 'Dra. Fernanda Costa'
ON CONFLICT DO NOTHING;

-- Insert default RAG store
INSERT INTO rag_stores (name, display_name) VALUES
    ('workspaces/default/stores/main', 'Base Oficial - Playbooks')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- VERIFY SETUP
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✓ Migration completed successfully!';
    RAISE NOTICE '  - leads table: % rows', (SELECT COUNT(*) FROM leads);
    RAISE NOTICE '  - tasks table: % rows', (SELECT COUNT(*) FROM tasks);
    RAISE NOTICE '  - messages table: % rows', (SELECT COUNT(*) FROM messages);
    RAISE NOTICE '  - rag_stores table: % rows', (SELECT COUNT(*) FROM rag_stores);
END $$;

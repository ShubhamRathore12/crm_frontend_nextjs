-- ============================================================
-- CRM Backend - Missing Tables Migration + Seed Data
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create roles if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
  team_id       UUID,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users (status);
CREATE INDEX IF NOT EXISTS users_team_id_idx ON public.users (team_id);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  manager_id  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from users to teams
ALTER TABLE public.users ADD CONSTRAINT users_team_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id    UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  source        TEXT NOT NULL DEFAULT 'manual',
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  stage         TEXT NOT NULL DEFAULT 'awareness' CHECK (stage IN ('awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase')),
  assigned_to   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  product       TEXT DEFAULT '',
  campaign      TEXT DEFAULT '',
  custom_fields JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_contact_id_idx ON public.leads (contact_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS leads_stage_idx ON public.leads (stage);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);

-- ============================================================
-- LEAD_SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id    UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC(5,2) DEFAULT 0,
  factors    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_scores_lead_id_idx ON public.lead_scores (lead_id);

-- ============================================================
-- LEAD_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id    UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  note       TEXT,
  changed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_history_lead_id_idx ON public.lead_history (lead_id);

-- ============================================================
-- LEAD_SCORING_FACTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_scoring_factors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  weight      INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id            UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  value              NUMERIC(15,2) DEFAULT 0,
  currency           TEXT DEFAULT 'INR',
  stage              TEXT NOT NULL DEFAULT 'qualification' CHECK (stage IN ('qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability        INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  expected_closed_at TIMESTAMPTZ,
  assigned_to        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON public.opportunities (stage);
CREATE INDEX IF NOT EXISTS opportunities_assigned_to_idx ON public.opportunities (assigned_to);
CREATE INDEX IF NOT EXISTS opportunities_lead_id_idx ON public.opportunities (lead_id);

-- ============================================================
-- OPPORTUNITIES_ARCHIVE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opportunities_archive (
  id                 UUID PRIMARY KEY,
  lead_id            UUID,
  title              TEXT,
  description        TEXT,
  value              NUMERIC(15,2),
  currency           TEXT,
  stage              TEXT,
  probability        INTEGER,
  expected_closed_at TIMESTAMPTZ,
  assigned_to        UUID,
  created_at         TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ,
  archived_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTERACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id  UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'phone', 'sms', 'chat', 'whatsapp')),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed')),
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  subject     TEXT NOT NULL DEFAULT '',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interactions_contact_id_idx ON public.interactions (contact_id);
CREATE INDEX IF NOT EXISTS interactions_status_idx ON public.interactions (status);
CREATE INDEX IF NOT EXISTS interactions_assigned_to_idx ON public.interactions (assigned_to);

-- ============================================================
-- INTERACTION_MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interaction_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  sender         TEXT NOT NULL DEFAULT 'system',
  content        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interaction_messages_interaction_id_idx ON public.interaction_messages (interaction_id);

-- ============================================================
-- INTERACTION_ESCALATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interaction_escalations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  reason         TEXT NOT NULL,
  priority       TEXT DEFAULT 'high',
  escalated_by   UUID REFERENCES public.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONVERSATION_INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_insights (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
  sentiment      TEXT,
  summary        TEXT,
  key_topics     TEXT[],
  analyzed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  entity_type  TEXT,
  entity_id    UUID,
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks (due_date);

-- ============================================================
-- SALES_MARKETING_TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_marketing_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'ready_for_launch', 'launched', 'completed')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  estimated_hours NUMERIC(6,2) DEFAULT 0,
  effort_hours    NUMERIC(6,2) DEFAULT 0,
  category        TEXT DEFAULT 'general',
  department      TEXT DEFAULT 'marketing',
  parent_task_id  UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALES_FORMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_forms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  fields_json JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALES_FORM_SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_form_submissions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id    UUID NOT NULL REFERENCES public.sales_forms(id) ON DELETE CASCADE,
  data_json  JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKFLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT DEFAULT 'general',
  is_active       BOOLEAN NOT NULL DEFAULT false,
  version         INTEGER NOT NULL DEFAULT 1,
  definition_json JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKFLOW_TRIGGERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  conditions  JSONB DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- WORKFLOW_SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- WORKFLOW_RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id  UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error        TEXT
);

-- ============================================================
-- INTEGRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.integrations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider   TEXT NOT NULL,
  name       TEXT,
  config     JSONB NOT NULL DEFAULT '{}',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIELD_DEFINITIONS (Dynamic Fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_definitions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  field_name  TEXT NOT NULL,
  field_type  TEXT NOT NULL DEFAULT 'text',
  label       TEXT NOT NULL,
  options     JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL DEFAULT '',
  file_size   INTEGER DEFAULT 0,
  file_path   TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  uploaded_by UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attachments_entity_idx ON public.attachments (entity_type, entity_id);

-- ============================================================
-- BULK_UPLOADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bulk_uploads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name      TEXT NOT NULL,
  entity_type    TEXT NOT NULL DEFAULT 'contact',
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows     INTEGER,
  processed_rows INTEGER DEFAULT 0,
  failed_rows    INTEGER DEFAULT 0,
  error_log      TEXT,
  created_by     UUID REFERENCES public.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ============================================================
-- EMAIL_INBOUND
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_inbound (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_email TEXT NOT NULL,
  to_email   TEXT NOT NULL,
  subject    TEXT DEFAULT '',
  body_text  TEXT DEFAULT '',
  body_html  TEXT DEFAULT '',
  status     TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HIGH_PRIORITY_LEADS (View)
-- ============================================================
CREATE OR REPLACE VIEW public.high_priority_leads AS
SELECT l.*, ls.score, ls.confidence
FROM public.leads l
LEFT JOIN public.lead_scores ls ON ls.lead_id = l.id
WHERE ls.score > 70 OR l.status = 'qualified'
ORDER BY ls.score DESC NULLS LAST;

-- ============================================================
-- GRANT ALL TABLES TO ROLES
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

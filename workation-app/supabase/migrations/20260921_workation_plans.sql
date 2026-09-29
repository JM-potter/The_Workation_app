BEGIN;
CREATE TABLE public.workation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  employee_name text NOT NULL,
  title text NOT NULL,
  place text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  goals jsonb NOT NULL CHECK (jsonb_typeof(goals) = 'array' AND jsonb_array_length(goals) BETWEEN 1 AND 20),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','revision','approved','submitted','rework','completed')),
  feedback text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workation_plans_company_created ON public.workation_plans(company_id, created_at DESC);
CREATE INDEX workation_plans_employee ON public.workation_plans(user_id);
ALTER TABLE public.workation_plans ENABLE ROW LEVEL SECURITY;
-- Only authenticated server routes may access this table; never grant client writes.
REVOKE ALL ON public.workation_plans FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workation_plans TO service_role;
COMMIT;

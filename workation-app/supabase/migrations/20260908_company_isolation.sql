-- Make the company record, rather than a mutable company name, the authority for membership.
BEGIN;

UPDATE public.companies SET name = btrim(name) WHERE name <> btrim(name);

-- Consolidate any legacy duplicate company rows before enforcing a normalized unique name.
WITH canonical AS (
  SELECT DISTINCT ON (lower(btrim(name))) id AS canonical_id, lower(btrim(name)) AS company_key
  FROM public.companies
  ORDER BY lower(btrim(name)), id
), duplicates AS (
  SELECT c.id AS duplicate_id, canonical.canonical_id
  FROM public.companies c
  JOIN canonical ON lower(btrim(c.name)) = canonical.company_key
  WHERE c.id <> canonical.canonical_id
)
UPDATE public.bookings b SET company_id = d.canonical_id FROM duplicates d WHERE b.company_id = d.duplicate_id;

WITH canonical AS (
  SELECT DISTINCT ON (lower(btrim(name))) id AS canonical_id, lower(btrim(name)) AS company_key
  FROM public.companies
  ORDER BY lower(btrim(name)), id
), duplicates AS (
  SELECT c.id AS duplicate_id, canonical.canonical_id
  FROM public.companies c
  JOIN canonical ON lower(btrim(c.name)) = canonical.company_key
  WHERE c.id <> canonical.canonical_id
)
UPDATE public.users u SET company_id = d.canonical_id FROM duplicates d WHERE u.company_id = d.duplicate_id;

WITH canonical AS (
  SELECT DISTINCT ON (lower(btrim(name))) id AS canonical_id, lower(btrim(name)) AS company_key
  FROM public.companies
  ORDER BY lower(btrim(name)), id
)
DELETE FROM public.companies c USING canonical WHERE lower(btrim(c.name)) = canonical.company_key AND c.id <> canonical.canonical_id;

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_normalized_unique ON public.companies (lower(btrim(name)));

-- Preserve approved legacy companies and attach legacy members to their canonical record.
INSERT INTO public.companies (name, approved)
SELECT DISTINCT btrim(company_name), true
FROM public.users
WHERE role = 'hr' AND status = 'approved' AND nullif(btrim(company_name), '') IS NOT NULL
ON CONFLICT (lower(btrim(name))) DO UPDATE SET approved = true;

UPDATE public.users u
SET company_id = c.id, company_name = c.name
FROM public.companies c
WHERE u.role = 'hr' AND u.status = 'approved'
  AND lower(btrim(u.company_name)) = lower(btrim(c.name));

UPDATE public.users u
SET company_id = c.id, company_name = c.name
FROM public.companies c
WHERE u.role = 'emp' AND u.company_id IS NULL AND c.approved = true
  AND lower(btrim(u.company_name)) = lower(btrim(c.name));

-- Auth metadata is untrusted. This function keeps only the requested role (limited to HR/employee),
-- always starts pending, and accepts an employee company only when it is an approved company.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
  selected_company public.companies%ROWTYPE;
BEGIN
  requested_role := CASE new.raw_user_meta_data->>'role' WHEN 'hr' THEN 'hr' ELSE 'emp' END;

  IF requested_role = 'emp' THEN
    SELECT * INTO selected_company
    FROM public.companies
    WHERE id::text = new.raw_user_meta_data->>'company_id' AND approved = true
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'An approved company selection is required for employee signup';
    END IF;
    INSERT INTO public.users (id, name, email, role, company_id, company_name, status, phone_number)
    VALUES (new.id, nullif(btrim(new.raw_user_meta_data->>'name'), ''), new.email, 'emp', selected_company.id, selected_company.name, 'pending', null);
  ELSE
    INSERT INTO public.users (id, name, email, role, company_id, company_name, status, phone_number)
    VALUES (new.id, nullif(btrim(new.raw_user_meta_data->>'name'), ''), new.email, 'hr', NULL, nullif(btrim(new.raw_user_meta_data->>'company_name'), ''), 'pending', nullif(btrim(new.raw_user_meta_data->>'phone_number'), ''));
  END IF;
  RETURN new;
END;
$$;

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to select their own reports" ON public.ai_reports;
DROP POLICY IF EXISTS "Allow users to insert their own reports" ON public.ai_reports;
CREATE POLICY "Allow users to select their own reports" ON public.ai_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own reports" ON public.ai_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.users;
CREATE POLICY "Allow users to read their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow users to insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow users to select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow users to update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow users to read their own bookings" ON public.bookings;
CREATE POLICY "Allow users to read their own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

COMMIT;

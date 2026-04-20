
-- Garants pour les prêts
CREATE TABLE public.guarantors (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  loan_id uuid NOT NULL REFERENCES public.loans(id),
  member_id uuid REFERENCES public.members(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  address text,
  id_type text,
  id_number text,
  relationship text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;
;

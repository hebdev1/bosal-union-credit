
-- Succursales / agences
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  name text NOT NULL,
  address text,
  phone text,
  manager_agent_id uuid REFERENCES public.agents(id),
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Rattacher agents et membres à une succursale
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS nif text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS monthly_income numeric;

-- Clôtures journalières
CREATE TABLE public.daily_closings (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  branch_id uuid REFERENCES public.branches(id),
  closing_date date NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  total_deposits numeric DEFAULT 0,
  total_withdrawals numeric DEFAULT 0,
  total_loan_disbursements numeric DEFAULT 0,
  total_loan_repayments numeric DEFAULT 0,
  total_exchange_in numeric DEFAULT 0,
  total_exchange_out numeric DEFAULT 0,
  total_fees_collected numeric DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  closed_by uuid REFERENCES public.agents(id),
  notes text,
  status text DEFAULT 'open' CHECK (status IN ('open','closed','validated')),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cooperative_id, branch_id, closing_date)
);

ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
;

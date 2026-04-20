
-- Parts sociales des membres (cœur du modèle coopératif)
CREATE TABLE public.shares (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  member_id uuid NOT NULL REFERENCES public.members(id),
  share_number text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_value numeric NOT NULL CHECK (unit_value > 0),
  total_value numeric GENERATED ALWAYS AS (quantity * unit_value) STORED,
  purchased_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','redeemed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(cooperative_id, share_number)
);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Distribution de dividendes
CREATE TABLE public.dividends (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  member_id uuid NOT NULL REFERENCES public.members(id),
  period text NOT NULL,
  share_count integer NOT NULL,
  rate_applied numeric NOT NULL,
  gross_amount numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  net_amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  paid_at timestamptz,
  agent_id uuid REFERENCES public.agents(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.dividends ENABLE ROW LEVEL SECURITY;
;

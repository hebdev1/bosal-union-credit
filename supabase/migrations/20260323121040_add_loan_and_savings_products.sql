
-- Produits de prêt
CREATE TABLE public.loan_products (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  name text NOT NULL,
  description text,
  min_amount numeric NOT NULL CHECK (min_amount > 0),
  max_amount numeric NOT NULL CHECK (max_amount > 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  min_duration_months integer NOT NULL CHECK (min_duration_months > 0),
  max_duration_months integer NOT NULL CHECK (max_duration_months > 0),
  requires_guarantor boolean DEFAULT true,
  requires_collateral boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;

-- Produits d'épargne
CREATE TABLE public.savings_products (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  name text NOT NULL,
  description text,
  interest_rate numeric NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  min_balance numeric DEFAULT 0,
  min_deposit numeric DEFAULT 0,
  interest_period text DEFAULT 'monthly' CHECK (interest_period IN ('daily','monthly','quarterly','yearly')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.savings_products ENABLE ROW LEVEL SECURITY;

-- Lier les comptes aux produits d'épargne
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS savings_product_id uuid REFERENCES public.savings_products(id);

-- Lier les prêts aux produits de prêt
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loan_product_id uuid REFERENCES public.loan_products(id);
;

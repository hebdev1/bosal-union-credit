
-- Grille de frais par type d'opération
CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  name text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit','withdrawal','transfer','loan_disbursement','loan_repayment','exchange','adjustment')),
  fee_type text NOT NULL CHECK (fee_type IN ('fixed','percentage')),
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  min_fee numeric DEFAULT 0,
  max_fee numeric,
  currency text DEFAULT 'HTG',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Frais appliqués sur chaque transaction
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee_amount numeric DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee_id uuid REFERENCES public.fees(id);
;

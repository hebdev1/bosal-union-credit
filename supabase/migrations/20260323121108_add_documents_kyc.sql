
-- Documents KYC et pièces jointes
CREATE TYPE public.document_entity_type AS ENUM ('member','loan','guarantor','cooperative');

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  entity_type public.document_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('cin','passport','nif','birth_certificate','proof_of_address','photo','loan_contract','guarantee_letter','other')),
  file_url text NOT NULL,
  file_name text,
  file_size_kb integer,
  uploaded_by uuid REFERENCES public.agents(id),
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.agents(id),
  verified_at timestamptz,
  expires_at date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
;

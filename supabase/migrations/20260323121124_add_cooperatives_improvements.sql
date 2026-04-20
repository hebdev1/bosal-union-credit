
-- Amélioration de la table cooperatives
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS licence_number text;
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS share_unit_value numeric DEFAULT 500;
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS currency text DEFAULT 'HTG';
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS fiscal_year_start text DEFAULT '01-01';

-- Amélioration system_settings
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS loan_approval_required boolean DEFAULT true;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS max_loan_to_share_ratio numeric DEFAULT 3;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS min_shares_for_loan integer DEFAULT 1;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean DEFAULT false;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT false;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS late_penalty_rate numeric DEFAULT 2;
;

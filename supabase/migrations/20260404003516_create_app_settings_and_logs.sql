
-- ═══════════════════════════════════════════════
-- TABLE: app_settings (category / key / value jsonb)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.app_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  category      text NOT NULL,   -- 'general' | 'finance' | 'closure' | 'pdf'
  key           text NOT NULL,
  value         jsonb NOT NULL,
  label         text,
  description   text,
  input_type    text DEFAULT 'text', -- 'toggle'|'number'|'select'|'text'|'color'
  options       jsonb,               -- for select inputs: [{"value":"x","label":"y"}]
  updated_at    timestamptz DEFAULT now(),
  updated_by    uuid REFERENCES public.agents(id),
  UNIQUE(cooperative_id, category, key)
);

-- ═══════════════════════════════════════════════
-- TABLE: settings_logs (audit trail)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.settings_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id uuid NOT NULL REFERENCES public.cooperatives(id),
  agent_id      uuid REFERENCES public.agents(id),
  category      text NOT NULL,
  key           text NOT NULL,
  old_value     jsonb,
  new_value     jsonb NOT NULL,
  changed_at    timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════
ALTER TABLE public.app_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_access" ON public.app_settings FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "settings_logs_access" ON public.settings_logs FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

-- ═══════════════════════════════════════════════
-- FUNCTION: update_setting (upsert + log)
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_setting(
  p_cooperative_id uuid,
  p_agent_id       uuid,
  p_category       text,
  p_key            text,
  p_value          jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_old jsonb;
  v_result jsonb;
BEGIN
  -- Get old value for audit
  SELECT value INTO v_old
  FROM public.app_settings
  WHERE cooperative_id = p_cooperative_id
    AND category = p_category
    AND key = p_key;

  -- Upsert the setting
  INSERT INTO public.app_settings (cooperative_id, category, key, value, updated_at, updated_by)
  VALUES (p_cooperative_id, p_category, p_key, p_value, now(), p_agent_id)
  ON CONFLICT (cooperative_id, category, key)
  DO UPDATE SET value = p_value, updated_at = now(), updated_by = p_agent_id
  RETURNING to_jsonb(app_settings.*) INTO v_result;

  -- Log the change
  INSERT INTO public.settings_logs (cooperative_id, agent_id, category, key, old_value, new_value)
  VALUES (p_cooperative_id, p_agent_id, p_category, p_key, v_old, p_value);

  RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════
-- FUNCTION: get_settings_by_category (aggregated)
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_settings_by_category(
  p_cooperative_id uuid,
  p_category       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT jsonb_object_agg(
    s.category,
    cat_settings
  )
  FROM (
    SELECT
      category,
      jsonb_object_agg(key, value) AS cat_settings
    FROM public.app_settings
    WHERE cooperative_id = p_cooperative_id
      AND (p_category IS NULL OR category = p_category)
    GROUP BY category
  ) s;
$$;

-- ═══════════════════════════════════════════════
-- DEFAULT SETTINGS DATA
-- ═══════════════════════════════════════════════
INSERT INTO public.app_settings (cooperative_id, category, key, value, label, description, input_type, options)
VALUES
  -- GENERAL
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'coop_name',       '"Coopérative Bosal"',           'Nom de la coopérative',    'Nom officiel affiché sur les rapports et tickets',  'text',   NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'coop_phone',      '"+509 3700-0000"',              'Téléphone',                'Numéro affiché sur les tickets et rapports',        'text',   NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'coop_address',    '"Port-au-Prince, Haïti"',       'Adresse',                  'Adresse physique de la coopérative',                'text',   NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'currency_primary', '"HTG"',                        'Devise principale',        'Devise de base de la coopérative',                  'select', '[{"value":"HTG","label":"HTG — Gourde haïtienne"},{"value":"USD","label":"USD — Dollar américain"}]'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'language',        '"fr"',                          'Langue',                   'Langue de l''interface',                            'select', '[{"value":"fr","label":"Français"},{"value":"ht","label":"Kreyòl ayisyen"}]'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'sms_enabled',     'true',                          'Notifications SMS',        'Activer les alertes SMS aux membres',               'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'email_enabled',   'true',                          'Notifications Email',      'Activer les alertes email aux membres',             'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'general', 'two_factor_auth', 'false',                         'Authentification 2FA',     'Exiger une vérification en deux étapes',            'toggle', NULL),
  -- FINANCE
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'reserve_percent',        '20',   'Réserve obligatoire (%)',    'Pourcentage des dépôts à maintenir en réserve',     'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'max_withdraw_percent',   '40',   'Retrait max / solde (%)',    'Limite du montant retirable par rapport au solde',   'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'daily_withdraw_limit',   '50000','Limite retrait journalier (HTG)', 'Montant maximum retiré par jour par membre',     'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'loan_approval_required', 'true', 'Approbation prêt requise',   'Les prêts doivent être approuvés par un manager',   'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'max_loan_ratio',         '3',    'Ratio prêt / parts (max)',   'Montant maximum du prêt en multiple des parts',      'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'min_shares_for_loan',    '1',    'Parts min. pour prêt',      'Nombre minimum de parts pour être éligible',         'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'late_penalty_rate',      '2',    'Pénalité de retard (%)',    'Taux de pénalité mensuel sur les prêts en retard',   'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'exchange_commission',    '1.5',  'Commission change (%)',     'Commission appliquée sur les opérations de change',  'number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'fraud_threshold',        '100000','Seuil alerte fraude (HTG)','Montant au-delà duquel une alerte fraude est déclenchée','number', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'finance', 'share_unit_value',       '500',  'Valeur unitaire part (HTG)','Valeur nominale d''une part sociale',                'number', NULL),
  -- CLOSURE
  ('aaaaaaaa-0000-0000-0000-000000000001', 'closure', 'auto_close_enabled',   'false', 'Clôture automatique',       'Générer automatiquement la clôture en fin de journée','toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'closure', 'auto_close_time',       '"22:00"','Heure de clôture auto',   'Heure à laquelle la clôture automatique se déclenche','select', '[{"value":"20:00","label":"20h00"},{"value":"21:00","label":"21h00"},{"value":"22:00","label":"22h00"},{"value":"23:00","label":"23h00"}]'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'closure', 'lock_after_close',     'true',  'Verrouiller après clôture', 'Bloquer les transactions après validation de clôture','toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'closure', 'require_manager_sign', 'true',  'Signature manager requise', 'La clôture doit être signée par un manager',          'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'closure', 'send_report_email',    'false', 'Email rapport clôture',     'Envoyer automatiquement le rapport par email',        'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'closure', 'retention_days',       '365',   'Rétention des données (j)', 'Nombre de jours de conservation des clôtures',        'number', NULL),
  -- PDF
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pdf', 'pdf_logo_enabled',   'true',           'Afficher le logo',          'Inclure le logo de la coopérative dans les PDF',    'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pdf', 'pdf_header_color',   '"#F5A623"',      'Couleur d''en-tête',        'Couleur de l''en-tête des rapports PDF',             'text',   NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pdf', 'pdf_font_size',      '11',             'Taille de police (pt)',     'Taille de la police dans les rapports PDF',          'select', '[{"value":"9","label":"9pt"},{"value":"10","label":"10pt"},{"value":"11","label":"11pt"},{"value":"12","label":"12pt"}]'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pdf', 'pdf_footer_text',    '"Tipa Fintech — Coopérative Bosal — +509 3700-0000"', 'Texte de pied de page', 'Texte affiché en bas de chaque page PDF', 'text', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pdf', 'pdf_show_watermark', 'false',          'Filigrane PDF',             'Ajouter un filigrane "CONFIDENTIEL" sur les PDF',   'toggle', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pdf', 'ticket_width',       '"80mm"',         'Largeur ticket',            'Largeur d''impression des tickets de caisse',        'select', '[{"value":"58mm","label":"58mm"},{"value":"80mm","label":"80mm"},{"value":"A4","label":"A4"}]')
ON CONFLICT (cooperative_id, category, key) DO NOTHING;
;

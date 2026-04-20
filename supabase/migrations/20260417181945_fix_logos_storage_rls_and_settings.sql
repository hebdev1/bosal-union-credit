
-- ── 1. Storage RLS policies for logos bucket ───────────────────────────────
CREATE POLICY "logos_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_update_authenticated"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_delete_authenticated"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_select_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

-- ── 2. Fix pdf_header_color input_type (was 'text', should be 'color') ─────
UPDATE app_settings SET input_type = 'color' WHERE key = 'pdf_header_color';

-- ── 3. Add missing theme text-color settings ────────────────────────────────
INSERT INTO app_settings (cooperative_id, category, key, label, value, description, input_type)
SELECT cooperative_id, 'theme', 'text_primary_color', 'Couleur texte principal', '"#FFFFFF"',
       'Couleur du texte principal du tableau de bord', 'color'
FROM app_settings WHERE category = 'theme' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO app_settings (cooperative_id, category, key, label, value, description, input_type)
SELECT cooperative_id, 'theme', 'text_secondary_color', 'Couleur texte secondaire', '"rgba(255,255,255,0.50)"',
       'Couleur du texte secondaire et labels', 'color'
FROM app_settings WHERE category = 'theme' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO app_settings (cooperative_id, category, key, label, value, description, input_type)
SELECT cooperative_id, 'theme', 'kpi_value_color', 'Couleur valeurs KPI', '"#FFFFFF"',
       'Couleur des chiffres KPI sur le tableau de bord', 'color'
FROM app_settings WHERE category = 'theme' LIMIT 1
ON CONFLICT DO NOTHING;
;

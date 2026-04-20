
DO $$
DECLARE coop_id uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
BEGIN
INSERT INTO app_settings (cooperative_id, category, key, label, value, description, input_type) VALUES
  (coop_id,'pdf','pdf_accent_color','Couleur accent PDF','"#C41E3A"','Couleur secondaire des rapports PDF','color'),
  (coop_id,'pdf','pdf_text_color','Couleur texte PDF','"#1A1A2E"','Couleur du texte principal dans les PDF','color'),
  (coop_id,'pdf','pdf_logo_url','URL du logo','""','URL du logo affiché dans les PDF et tickets','image'),
  (coop_id,'pdf','pdf_margin_mm','Marges PDF (mm)','15','Marges des rapports en millimètres','number'),
  (coop_id,'pdf','pdf_show_qr','QR code sur tickets','false','Ajouter un QR code de vérification sur les tickets','toggle'),
  (coop_id,'pdf','pdf_custom_signature','Texte signature','"Validé par"','Texte précédant la signature sur les rapports','text'),
  (coop_id,'closure','report_email','Email rapport clôture','"admin@tipafintech.ht"','Email pour recevoir les rapports de clôture','text'),
  (coop_id,'closure','report_email_cc','Email CC','""','Adresse en copie pour les rapports de clôture','text'),
  (coop_id,'closure','report_email_subject','Objet email rapport','"[BUC] Clôture journalière"','Objet de l''email de rapport','text'),
  (coop_id,'theme','brand_color','Couleur principale','"#C41E3A"','Couleur de marque — boutons, liens actifs, accents','color'),
  (coop_id,'theme','sidebar_bg','Fond sidebar','"#0C0C0E"','Couleur de fond de la barre latérale','color'),
  (coop_id,'theme','surface_color','Couleur surface','"#111318"','Couleur de fond des cartes et panneaux','color'),
  (coop_id,'theme','border_color','Couleur bordures','"#252A36"','Couleur des séparateurs et bordures','color'),
  (coop_id,'theme','sidebar_collapsed','Sidebar réduite par défaut','false','Démarrer avec la sidebar en mode compact','toggle'),
  (coop_id,'theme','density','Densité interface','"normal"','Espacement des éléments du tableau de bord','select'),
  (coop_id,'theme','font_sans','Police principale','"DM Sans"','Police de texte principale','select'),
  (coop_id,'theme','kpi_animation','Animations KPI','true','Activer les animations sur les chiffres clés','toggle'),
  (coop_id,'theme','table_striped','Lignes alternées tableau','false','Alterner les couleurs de lignes dans les tableaux','toggle'),
  (coop_id,'theme','show_breadcrumbs','Afficher le fil d''Ariane','true','Montrer le chemin de navigation en haut des pages','toggle')
ON CONFLICT (cooperative_id, category, key) DO NOTHING;

UPDATE app_settings SET options = '[{"label":"Normal","value":"normal"},{"label":"Compact","value":"compact"},{"label":"Large","value":"large"}]'::jsonb WHERE key = 'density';
UPDATE app_settings SET options = '[{"label":"DM Sans","value":"DM Sans"},{"label":"Inter","value":"Inter"},{"label":"Geist","value":"Geist"}]'::jsonb WHERE key = 'font_sans';
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 2097152, ARRAY['image/png','image/jpeg','image/svg+xml','image/webp'])
ON CONFLICT (id) DO NOTHING;
;

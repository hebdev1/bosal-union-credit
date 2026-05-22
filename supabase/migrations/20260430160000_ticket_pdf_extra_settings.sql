-- ─────────────────────────────────────────────────────────────────────────
-- Ticket PDF — extra settings
--
-- Adds two new tunable colours to every cooperative's ticket config so
-- the saved settings from Paramètres > PDF are fully wired to the
-- deposit/withdrawal receipt PDF :
--
--   ticket_withdrawal_color  : accent du bloc montant pour les retraits
--                              (le ticket utilisait jusqu'ici le même
--                              accent que les dépôts).
--   ticket_text_color        : couleur du texte du corps du ticket
--                              (membre, soldes, motif…). Sombre par
--                              défaut pour rester lisible sur papier
--                              blanc / impression thermique.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.app_settings (cooperative_id, category, key, value, label, description, input_type)
select c.id,
       'pdf',
       'ticket_withdrawal_color',
       to_jsonb('#DC2626'::text),
       'Couleur montant retrait',
       'Couleur du bloc montant et de l''accent visuel pour les retraits',
       'color'
from public.cooperatives c
on conflict (cooperative_id, category, key) do nothing;

insert into public.app_settings (cooperative_id, category, key, value, label, description, input_type)
select c.id,
       'pdf',
       'ticket_text_color',
       to_jsonb('#0F172A'::text),
       'Couleur du texte ticket',
       'Couleur du texte principal du corps du ticket (membre, soldes, motif…). Choisissez une couleur sombre pour rester lisible sur papier blanc.',
       'color'
from public.cooperatives c
on conflict (cooperative_id, category, key) do nothing;

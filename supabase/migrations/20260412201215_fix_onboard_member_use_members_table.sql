
-- ============================================================
-- BUG 2 : Réécriture de onboard_member
-- - Supprime l'ancienne signature (customer_id / customers)
-- - Crée le member dans public.members (member_id / members)
-- - Lie le compte via accounts.member_id (pas customer_id)
-- ============================================================

-- Supprimer l'ancienne signature
DROP FUNCTION IF EXISTS public.onboard_member(uuid, uuid, text, text);

-- Nouvelle fonction
CREATE OR REPLACE FUNCTION public.onboard_member(
    p_cooperative_id UUID,
    p_first_name     TEXT,
    p_last_name      TEXT,
    p_phone          TEXT,
    p_birth_date     DATE,
    p_user_id        UUID DEFAULT NULL
)
RETURNS TABLE(member_id uuid, account_id uuid, member_number text, account_number text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_member_id     UUID;
    v_account_id    UUID;
    v_member_number TEXT;
    v_account_number TEXT;
BEGIN
    -- Générer des numéros uniques
    v_member_number  := 'MBR-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    v_account_number := 'TIPA-' || LPAD(FLOOR(RANDOM() * 90000000 + 10000000)::TEXT, 8, '0');

    -- 1. Créer le membre dans public.members
    INSERT INTO members (cooperative_id, member_number, first_name, last_name, phone, birth_date)
    VALUES (p_cooperative_id, v_member_number, p_first_name, p_last_name, p_phone, p_birth_date)
    RETURNING id INTO v_member_id;

    -- 2. Créer le compte lié au membre
    INSERT INTO accounts (cooperative_id, member_id, account_number)
    VALUES (p_cooperative_id, v_member_id, v_account_number)
    RETURNING id INTO v_account_id;

    -- 3. Créer le profil auth si un user_id est fourni (lien optionnel)
    IF p_user_id IS NOT NULL THEN
        INSERT INTO profiles (id, cooperative_id, full_name, phone, role)
        VALUES (p_user_id, p_cooperative_id, p_first_name || ' ' || p_last_name, p_phone, 'member')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 4. Audit
    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (
        p_cooperative_id,
        p_user_id,
        'ONBOARD_MEMBER',
        'members',
        v_member_id,
        jsonb_build_object(
            'first_name',     p_first_name,
            'last_name',      p_last_name,
            'member_number',  v_member_number,
            'account_number', v_account_number
        )
    );

    RETURN QUERY SELECT v_member_id, v_account_id, v_member_number, v_account_number;
END;
$$;
;

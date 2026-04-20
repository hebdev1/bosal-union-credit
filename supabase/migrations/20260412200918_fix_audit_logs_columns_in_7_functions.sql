
-- ============================================================
-- BUG 1 : Correction des colonnes audit_logs dans 7 fonctions
-- agent_id  → user_id
-- entity    → target_table  (+ vrais noms de tables)
-- entity_id → target_id
-- ============================================================

-- 1. deposit_money
CREATE OR REPLACE FUNCTION public.deposit_money(
    p_account_id UUID,
    p_amount     NUMERIC,
    p_motif      TEXT,
    p_reference  TEXT,
    p_agent_id   UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_coop_id     UUID;
    v_new_balance DECIMAL;
    v_tx_id       UUID;
BEGIN
    SELECT cooperative_id INTO v_coop_id
    FROM accounts
    WHERE id = p_account_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Compte introuvable ou inactif : %', p_account_id;
    END IF;

    INSERT INTO transactions (cooperative_id, account_id, agent_id, transaction_type, amount, motif, reference)
    VALUES (v_coop_id, p_account_id, p_agent_id, 'deposit', p_amount, p_motif, p_reference)
    RETURNING id INTO v_tx_id;

    UPDATE accounts
    SET balance = balance + p_amount
    WHERE id = p_account_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO ledger_entries (cooperative_id, account_id, transaction_id, entry_type, amount, balance_after)
    VALUES (v_coop_id, p_account_id, v_tx_id, 'credit', p_amount, v_new_balance);

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (v_coop_id, p_agent_id, 'DEPOSIT', 'accounts', p_account_id,
            jsonb_build_object('amount', p_amount, 'tx_id', v_tx_id, 'balance_after', v_new_balance));

    RETURN v_tx_id;
END;
$$;

-- 2. withdraw_money
CREATE OR REPLACE FUNCTION public.withdraw_money(
    p_account_id UUID,
    p_amount     NUMERIC,
    p_motif      TEXT,
    p_reference  TEXT,
    p_agent_id   UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_coop_id              UUID;
    v_current_balance      DECIMAL;
    v_new_balance          DECIMAL;
    v_tx_id                UUID;
    v_last_term_withdrawal TIMESTAMPTZ;
BEGIN
    SELECT balance, cooperative_id INTO v_current_balance, v_coop_id
    FROM accounts
    WHERE id = p_account_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Compte introuvable ou inactif : %', p_account_id;
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant. Disponible : %, Demandé : %', v_current_balance, p_amount;
    END IF;

    IF p_motif = 'retrait a terme' THEN
        SELECT created_at INTO v_last_term_withdrawal
        FROM transactions
        WHERE account_id = p_account_id
          AND motif = 'retrait a terme'
          AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_last_term_withdrawal IS NOT NULL
           AND v_last_term_withdrawal > NOW() - INTERVAL '30 days' THEN
            RAISE EXCEPTION 'Retrait à terme non éligible. Attendez 30 jours depuis le dernier retrait à terme.';
        END IF;
    END IF;

    INSERT INTO transactions (cooperative_id, account_id, agent_id, transaction_type, amount, motif, reference)
    VALUES (v_coop_id, p_account_id, p_agent_id, 'withdrawal', p_amount, p_motif, p_reference)
    RETURNING id INTO v_tx_id;

    UPDATE accounts
    SET balance = balance - p_amount
    WHERE id = p_account_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO ledger_entries (cooperative_id, account_id, transaction_id, entry_type, amount, balance_after)
    VALUES (v_coop_id, p_account_id, v_tx_id, 'debit', p_amount, v_new_balance);

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (v_coop_id, p_agent_id, 'WITHDRAWAL', 'accounts', p_account_id,
            jsonb_build_object('amount', p_amount, 'tx_id', v_tx_id, 'balance_after', v_new_balance));

    IF p_amount > 50000 THEN
        INSERT INTO fraud_flags (cooperative_id, transaction_id, rule_triggered, severity)
        VALUES (v_coop_id, v_tx_id, 'High value withdrawal', 'medium');
    END IF;

    RETURN v_tx_id;
END;
$$;

-- 3. transfer_money
CREATE OR REPLACE FUNCTION public.transfer_money(
    p_from_account_id UUID,
    p_to_account_id   UUID,
    p_amount          NUMERIC,
    p_reference       TEXT,
    p_agent_id        UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_coop_id_from UUID;
    v_coop_id_to   UUID;
    v_balance_from DECIMAL;
    v_bal_from     DECIMAL;
    v_bal_to       DECIMAL;
    v_tx_id        UUID;
BEGIN
    IF p_from_account_id < p_to_account_id THEN
        SELECT balance, cooperative_id INTO v_balance_from, v_coop_id_from
        FROM accounts WHERE id = p_from_account_id AND status = 'active' FOR UPDATE;

        SELECT cooperative_id INTO v_coop_id_to
        FROM accounts WHERE id = p_to_account_id AND status = 'active' FOR UPDATE;
    ELSE
        SELECT cooperative_id INTO v_coop_id_to
        FROM accounts WHERE id = p_to_account_id AND status = 'active' FOR UPDATE;

        SELECT balance, cooperative_id INTO v_balance_from, v_coop_id_from
        FROM accounts WHERE id = p_from_account_id AND status = 'active' FOR UPDATE;
    END IF;

    IF v_coop_id_from IS NULL THEN
        RAISE EXCEPTION 'Compte source introuvable ou inactif';
    END IF;
    IF v_coop_id_to IS NULL THEN
        RAISE EXCEPTION 'Compte destinataire introuvable ou inactif';
    END IF;
    IF v_coop_id_from <> v_coop_id_to THEN
        RAISE EXCEPTION 'Virement inter-coopératives non autorisé';
    END IF;
    IF v_balance_from < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant pour le virement. Disponible : %, Demandé : %',
                        v_balance_from, p_amount;
    END IF;

    INSERT INTO transactions (cooperative_id, account_id, agent_id, transaction_type, amount, reference)
    VALUES (v_coop_id_from, p_from_account_id, p_agent_id, 'transfer', p_amount, p_reference)
    RETURNING id INTO v_tx_id;

    UPDATE accounts SET balance = balance - p_amount
    WHERE id = p_from_account_id
    RETURNING balance INTO v_bal_from;

    INSERT INTO ledger_entries (cooperative_id, account_id, transaction_id, entry_type, amount, balance_after)
    VALUES (v_coop_id_from, p_from_account_id, v_tx_id, 'debit', p_amount, v_bal_from);

    UPDATE accounts SET balance = balance + p_amount
    WHERE id = p_to_account_id
    RETURNING balance INTO v_bal_to;

    INSERT INTO ledger_entries (cooperative_id, account_id, transaction_id, entry_type, amount, balance_after)
    VALUES (v_coop_id_from, p_to_account_id, v_tx_id, 'credit', p_amount, v_bal_to);

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (v_coop_id_from, p_agent_id, 'TRANSFER', 'accounts', p_from_account_id,
            jsonb_build_object(
                'amount', p_amount,
                'from_account', p_from_account_id,
                'to_account', p_to_account_id,
                'tx_id', v_tx_id
            ));

    RETURN v_tx_id;
END;
$$;

-- 4. repay_loan
CREATE OR REPLACE FUNCTION public.repay_loan(
    p_loan_id  UUID,
    p_amount   NUMERIC,
    p_agent_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_loan        loans%ROWTYPE;
    v_repayment   loan_repayments%ROWTYPE;
    v_tx_id       UUID;
    v_new_balance DECIMAL;
    v_account_bal DECIMAL;
BEGIN
    SELECT * INTO v_loan FROM loans WHERE id = p_loan_id FOR UPDATE;

    IF NOT FOUND OR v_loan.status <> 'active' THEN
        RAISE EXCEPTION 'Prêt introuvable ou non actif';
    END IF;

    SELECT * INTO v_repayment
    FROM loan_repayments
    WHERE loan_id = p_loan_id AND status IN ('pending', 'late')
    ORDER BY installment_no ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aucune échéance en attente pour ce prêt';
    END IF;

    SELECT balance INTO v_account_bal
    FROM accounts WHERE id = v_loan.account_id FOR UPDATE;

    IF v_account_bal < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant pour le remboursement';
    END IF;

    INSERT INTO transactions (cooperative_id, account_id, agent_id, transaction_type, amount, motif, reference)
    VALUES (v_loan.cooperative_id, v_loan.account_id, p_agent_id, 'withdrawal',
            p_amount, 'Remboursement prêt', v_loan.loan_number)
    RETURNING id INTO v_tx_id;

    UPDATE accounts SET balance = balance - p_amount
    WHERE id = v_loan.account_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO ledger_entries (cooperative_id, account_id, transaction_id, entry_type, amount, balance_after)
    VALUES (v_loan.cooperative_id, v_loan.account_id, v_tx_id, 'debit', p_amount, v_new_balance);

    UPDATE loan_repayments
    SET amount_paid = p_amount, paid_at = NOW(), status = 'paid'
    WHERE id = v_repayment.id;

    UPDATE loans
    SET amount_paid = amount_paid + p_amount,
        status = CASE
            WHEN amount_paid + p_amount >= total_amount_due THEN 'completed'
            ELSE 'active'
        END
    WHERE id = p_loan_id;

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (v_loan.cooperative_id, p_agent_id, 'LOAN_REPAYMENT', 'loans', p_loan_id,
            jsonb_build_object('amount', p_amount, 'installment_no', v_repayment.installment_no, 'tx_id', v_tx_id));

    RETURN v_tx_id;
END;
$$;

-- 5. disburse_loan
CREATE OR REPLACE FUNCTION public.disburse_loan(
    p_loan_id  UUID,
    p_agent_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_loan        loans%ROWTYPE;
    v_tx_id       UUID;
    v_new_balance DECIMAL;
BEGIN
    SELECT * INTO v_loan FROM loans WHERE id = p_loan_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prêt introuvable : %', p_loan_id;
    END IF;
    IF v_loan.status <> 'pending' THEN
        RAISE EXCEPTION 'Le prêt n''est pas en statut pending (statut actuel : %)', v_loan.status;
    END IF;

    INSERT INTO transactions (cooperative_id, account_id, agent_id, transaction_type, amount, motif, reference)
    VALUES (v_loan.cooperative_id, v_loan.account_id, p_agent_id, 'deposit',
            v_loan.principal_amount, 'Décaissement prêt', v_loan.loan_number)
    RETURNING id INTO v_tx_id;

    UPDATE accounts SET balance = balance + v_loan.principal_amount
    WHERE id = v_loan.account_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO ledger_entries (cooperative_id, account_id, transaction_id, entry_type, amount, balance_after)
    VALUES (v_loan.cooperative_id, v_loan.account_id, v_tx_id, 'credit',
            v_loan.principal_amount, v_new_balance);

    UPDATE loans
    SET status = 'active', disbursed_at = NOW()
    WHERE id = p_loan_id;

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (v_loan.cooperative_id, p_agent_id, 'LOAN_DISBURSED', 'loans', p_loan_id,
            jsonb_build_object('amount', v_loan.principal_amount, 'tx_id', v_tx_id));

    RETURN v_tx_id;
END;
$$;

-- 6. process_exchange
CREATE OR REPLACE FUNCTION public.process_exchange(
    p_cooperative_id   UUID,
    p_agent_id         UUID,
    p_client_first_name TEXT,
    p_client_last_name  TEXT,
    p_client_id_type    TEXT,
    p_client_id_number  TEXT,
    p_from_currency     currency_code,
    p_amount_given      NUMERIC,
    p_notes             TEXT DEFAULT NULL
) RETURNS TABLE(transaction_id UUID, ticket_number TEXT, amount_received NUMERIC, rate_applied NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_rate_id    UUID;
    v_rate       DECIMAL;
    v_amount_htg DECIMAL;
    v_ticket     TEXT;
    v_tx_id      UUID;
BEGIN
    SELECT id, rate INTO v_rate_id, v_rate
    FROM exchange_rates
    WHERE cooperative_id = p_cooperative_id
      AND from_currency  = p_from_currency
      AND to_currency    = 'HTG'
      AND is_active      = TRUE
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aucun taux actif trouvé pour % → HTG', p_from_currency;
    END IF;

    v_amount_htg := ROUND(p_amount_given * v_rate, 2);

    v_ticket := 'BDC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('exchange_ticket_seq')::TEXT, 4, '0');

    INSERT INTO exchange_transactions (
        cooperative_id, agent_id, exchange_rate_id,
        client_first_name, client_last_name, client_id_type, client_id_number,
        from_currency, to_currency, amount_given, rate_applied, amount_received,
        ticket_number, notes
    ) VALUES (
        p_cooperative_id, p_agent_id, v_rate_id,
        p_client_first_name, p_client_last_name, p_client_id_type, p_client_id_number,
        p_from_currency, 'HTG', p_amount_given, v_rate, v_amount_htg,
        v_ticket, p_notes
    ) RETURNING id INTO v_tx_id;

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (p_cooperative_id, p_agent_id, 'EXCHANGE', 'exchange_transactions', v_tx_id,
            jsonb_build_object(
                'client', p_client_first_name || ' ' || p_client_last_name,
                'from', p_from_currency, 'amount_given', p_amount_given,
                'rate', v_rate, 'amount_htg', v_amount_htg,
                'ticket', v_ticket
            ));

    RETURN QUERY SELECT v_tx_id, v_ticket, v_amount_htg, v_rate;
END;
$$;

-- 7. set_exchange_rate
CREATE OR REPLACE FUNCTION public.set_exchange_rate(
    p_cooperative_id UUID,
    p_from_currency  currency_code,
    p_to_currency    currency_code,
    p_rate           NUMERIC,
    p_agent_id       UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_rate_id UUID;
BEGIN
    UPDATE exchange_rates
    SET is_active = FALSE
    WHERE cooperative_id = p_cooperative_id
      AND from_currency  = p_from_currency
      AND to_currency    = p_to_currency
      AND is_active      = TRUE;

    INSERT INTO exchange_rates (cooperative_id, from_currency, to_currency, rate, set_by_agent_id, is_active)
    VALUES (p_cooperative_id, p_from_currency, p_to_currency, p_rate, p_agent_id, TRUE)
    RETURNING id INTO v_rate_id;

    INSERT INTO audit_logs (cooperative_id, user_id, action, target_table, target_id, metadata)
    VALUES (p_cooperative_id, p_agent_id, 'SET_EXCHANGE_RATE', 'exchange_rates', v_rate_id,
            jsonb_build_object('from', p_from_currency, 'to', p_to_currency, 'rate', p_rate));

    RETURN v_rate_id;
END;
$$;
;

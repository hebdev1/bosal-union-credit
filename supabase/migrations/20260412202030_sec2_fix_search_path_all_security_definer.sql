
-- ============================================================
-- SEC 2 : Fixer search_path sur toutes les fonctions
--         SECURITY DEFINER pour bloquer les attaques par
--         substitution d'objets (schema injection)
-- ============================================================

ALTER FUNCTION public.deposit_money(uuid, numeric, text, text, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.withdraw_money(uuid, numeric, text, text, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.transfer_money(uuid, uuid, numeric, text, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.repay_loan(uuid, numeric, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.disburse_loan(uuid, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.process_exchange(uuid, uuid, text, text, text, text, currency_code, numeric, text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.onboard_member(uuid, text, text, text, date, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.set_exchange_rate(uuid, currency_code, currency_code, numeric, uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.set_transaction_status(uuid, transaction_status)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.detect_fraud_func()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.increment_vault(uuid, numeric)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.decrement_vault(uuid, numeric)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_vault_balance(uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.sync_vault_balance()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_cooperative_summary(uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_my_cooperative()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_settings_by_category(uuid, text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.update_setting(uuid, uuid, text, text, jsonb)
    SET search_path = public, pg_temp;
;

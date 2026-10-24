-- ─────────────────────────────────────────────────────────────────────────
-- Contact form: exact rate limits, no cheap global lock-out (2026-10-24)
--
-- Review of 20261024004313 found two weaknesses in submit_contact_request():
--  1. Count-then-insert without a lock: concurrent calls all saw the same
--     count, so a burst could store far more than 3 requests per e-mail.
--     A transaction-scoped advisory lock now serialises submissions; the
--     work under the lock takes a few milliseconds.
--  2. The global cap of 60 per hour let anyone switch the form off for
--     every visitor with a short script (e-mail addresses are not verified).
--     The global count is now only a storage ceiling (200 per hour), far
--     above any genuine volume. Per-client limits would need a trusted
--     client identity, i.e. calling the function server-side with a
--     server-only key instead of granting EXECUTE to anon.
--
-- Same signature: CREATE OR REPLACE keeps the existing grants
-- (EXECUTE to anon, authenticated only).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.submit_contact_request(
  p_full_name    text,
  p_email        text,
  p_institution  text,
  p_org_type     text,
  p_member_range text,
  p_message      text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_recent integer;
begin
  -- Serialise submissions so the counts below are exact.
  perform pg_advisory_xact_lock(hashtext('public.submit_contact_request'));

  select count(*) into v_recent
    from public.contact_requests
   where email = v_email and created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'Trop de demandes envoyées avec cette adresse. Réessayez dans une heure.' using errcode = 'P0001';
  end if;

  -- Storage ceiling, not a traffic limit.
  select count(*) into v_recent
    from public.contact_requests
   where created_at > now() - interval '1 hour';
  if v_recent >= 200 then
    raise exception 'Le formulaire est temporairement saturé. Réessayez plus tard.' using errcode = 'P0001';
  end if;

  insert into public.contact_requests (full_name, email, institution, org_type, member_range, message)
  values (
    btrim(coalesce(p_full_name, '')),
    v_email,
    btrim(coalesce(p_institution, '')),
    nullif(btrim(coalesce(p_org_type, '')), ''),
    nullif(btrim(coalesce(p_member_range, '')), ''),
    btrim(coalesce(p_message, ''))
  );
end;
$function$;

comment on function public.submit_contact_request(text, text, text, text, text, text) is
  'Only public entry point of the contact form: validated by table CHECKs, rate-limited under an advisory lock (3/e-mail/hour; storage ceiling 200/hour).';

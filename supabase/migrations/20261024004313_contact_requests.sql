-- ─────────────────────────────────────────────────────────────────────────
-- Public contact form (site vitrine CoopFinance, 2026-10-23)
--
-- Visitors are not signed in, so the form posts as `anon`. anon gets NO
-- table privilege: the only entry point is submit_contact_request(), a
-- SECURITY DEFINER function that validates every field and rate-limits
-- (3 requests per e-mail per hour, 60 per hour overall). Nobody can read
-- the requests through the API; the team reads them in the Supabase
-- dashboard (or receives an e-mail when RESEND_API_KEY is configured).
--
-- Dry-run before applying: 12 checks as anon, all as expected.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.contact_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  full_name    text not null check (char_length(full_name) between 2 and 120),
  email        text not null check (char_length(email) between 5 and 200
                                    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  institution  text not null check (char_length(institution) between 2 and 160),
  org_type     text check (org_type in ('cooperative', 'microfinance', 'epargne_pret', 'autre')),
  member_range text check (member_range in ('lt_1000', '1000_5000', '5000_20000', 'gt_20000')),
  message      text not null check (char_length(message) between 10 and 4000),
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

create index if not exists contact_requests_created_at_idx on public.contact_requests (created_at desc);
create index if not exists contact_requests_email_created_idx on public.contact_requests (email, created_at desc);

alter table public.contact_requests enable row level security;
revoke all on public.contact_requests from public, anon, authenticated;

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
  select count(*) into v_recent
    from public.contact_requests
   where email = v_email and created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'Trop de demandes envoyées avec cette adresse. Réessayez dans une heure.' using errcode = 'P0001';
  end if;

  select count(*) into v_recent
    from public.contact_requests
   where created_at > now() - interval '1 hour';
  if v_recent >= 60 then
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

revoke execute on function public.submit_contact_request(text, text, text, text, text, text) from public, anon, authenticated;
grant  execute on function public.submit_contact_request(text, text, text, text, text, text) to anon, authenticated;

comment on function public.submit_contact_request(text, text, text, text, text, text) is
  'Only public entry point of the contact form: validated by table CHECKs, rate-limited (3/e-mail/hour, 60/hour).';

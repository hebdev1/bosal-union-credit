import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { AccountProfileClient } from '@/components/dashboard/account/AccountProfileClient'
import { EditMemberModal } from '@/components/dashboard/account/EditMemberModal'
import { formatHTG, formatUSD, formatDate, formatCurrency } from '@/lib/formatters'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('accounts').select('account_number').eq('id', id).single()
  return { title: data?.account_number ? `Compte ${data.account_number}` : 'Profil compte' }
}

export default async function AccountProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // ── Fetch account + member + plan ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account } = await (supabase as any)
    .from('accounts')
    .select(`
      id, account_number, account_type, balance, currency, status, created_at,
      savings_product_id,
      members(id, first_name, last_name, member_number, birth_date, phone, email, address, profession, status, created_at),
      savings_products(id, name, interest_rate, interest_period, min_balance)
    `)
    .eq('id', id)
    .single()

  if (!account) notFound()

  const member = account.members
  const plan   = account.savings_products

  // ── Transactions for this account ─────────────────────────────────────────
  const { data: txRaw } = await supabase
    .from('transactions')
    .select('id, transaction_type, amount, motif, reference, status, created_at')
    .eq('account_id', id)
    .order('created_at', { ascending: false })
    .limit(200)

  const txs = (txRaw ?? []) as any[]

  // ── Loans for this member ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loansRes = member?.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any)
        .from('loans')
        .select('id, loan_number, principal_amount, interest_rate, duration_months, monthly_payment, total_amount_due, amount_paid, status, purpose, created_at, due_date')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const loans = (loansRes.data ?? []) as any[]

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalDeposits    = txs.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
  const totalWithdrawals = txs.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0)
  const totalAdjustments = txs.filter(t => t.transaction_type === 'adjustment').reduce((s, t) => s + Number(t.amount), 0)
  const netFlow          = totalDeposits - totalWithdrawals

  const PERIOD: Record<string, string> = {
    daily: 'quotidien', monthly: 'mensuel', quarterly: 'trimestriel', yearly: 'annuel',
  }

  const TYPE_LABELS: Record<string, string> = {
    deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Virement', adjustment: 'Ajustement',
  }
  const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
    deposit:    { color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'   },
    withdrawal: { color: '#F87171', bg: 'rgba(239,68,68,0.10)'   },
    transfer:   { color: '#60A5FA', bg: 'rgba(59,130,246,0.10)'  },
    adjustment: { color: '#FCD34D', bg: 'rgba(234,179,8,0.10)'   },
  }

  const LOAN_STATUS: Record<string, { label: string; color: string }> = {
    pending:   { label: 'En attente', color: '#FCD34D' },
    active:    { label: 'Actif',      color: '#4ADE80' },
    completed: { label: 'Complété',   color: '#60A5FA' },
    defaulted: { label: 'En défaut',  color: '#F87171' },
    rejected:  { label: 'Rejeté',     color: '#F87171' },
    closed:    { label: 'Clôturé',    color: 'rgba(255,255,255,0.35)' },
  }

  return (
    <>
      <Header title={`Compte ${account.account_number}`} />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">

        {/* ── Back link ── */}
        <Link
          href="/tableau-de-bord/comptes"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft size={13} />
          Retour aux comptes
        </Link>

        {/* ── Account hero card ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111318', border: `1px solid ${account.status === 'active' ? 'rgba(74,222,128,0.28)' : '#252A36'}` }}>

          {/* Top bar */}
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            style={{ borderBottom: '1px solid #1a1f2e' }}>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold"
                style={{ background: 'rgba(196,30,58,0.15)', color: '#C41E3A' }}>
                {member ? `${member.first_name[0]}${member.last_name[0]}`.toUpperCase() : 'CC'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {account.account_number}
                  </h1>
                  <StatusBadge value={account.status} />
                  <StatusBadge value={account.account_type} />
                </div>
                {member && (
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {member.first_name} {member.last_name} · {member.member_number}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: balance + edit button */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold kpi-value" style={{ color: account.status === 'active' ? '#4ADE80' : 'rgba(255,255,255,0.50)' }}>
                  {formatCurrency(Number(account.balance), account.currency)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>Solde actuel · {account.currency}</p>
              </div>
              {member && (
                <EditMemberModal member={{
                  id:            member.id,
                  first_name:    member.first_name,
                  last_name:     member.last_name,
                  member_number: member.member_number,
                  birth_date:    member.birth_date    ?? null,
                  phone:         member.phone         ?? null,
                  email:         member.email         ?? null,
                  address:       member.address       ?? null,
                  profession:    member.profession    ?? null,
                }} />
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: '#1a1f2e' }}>
            {[
              { label: `Dépôts (${txs.filter(t => t.transaction_type === 'deposit').length})`,     value: formatCurrency(totalDeposits, account.currency),    color: '#4ADE80' },
              { label: `Retraits (${txs.filter(t => t.transaction_type === 'withdrawal').length})`, value: formatCurrency(totalWithdrawals, account.currency), color: '#F87171' },
              { label: 'Flux net',                                                                   value: formatCurrency(netFlow, account.currency),          color: netFlow >= 0 ? '#4ADE80' : '#F87171' },
              { label: `Total transactions`,                                                          value: String(txs.length),                                 color: 'rgba(255,255,255,0.80)' },
            ].map(s => (
              <div key={s.label} className="px-5 py-4" style={{ background: '#111318' }}>
                <p className="text-base font-bold kpi-value" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-col layout: Member info + Plan ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Member info */}
          {member && (
            <div className="lg:col-span-2 rounded-xl p-5 space-y-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Informations du membre
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: 'Prénom',       value: member.first_name },
                  { label: 'Nom',          value: member.last_name  },
                  { label: 'N° Membre',    value: member.member_number },
                  { label: 'Statut',       value: <StatusBadge value={member.status} /> },
                  { label: 'Téléphone',    value: member.phone     ?? '—' },
                  { label: 'Email',        value: member.email     ?? '—' },
                  { label: 'Adresse',      value: member.address   ?? '—' },
                  { label: 'Profession',   value: member.profession ?? '—' },
                  { label: 'Date de naissance', value: member.birth_date ? formatDate(member.birth_date) : '—' },
                  { label: 'Membre depuis',     value: formatDate(member.created_at) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</p>
                    <p className="text-sm mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan + account meta */}
          <div className="space-y-4">
            {/* Plan card */}
            {plan ? (
              <div className="rounded-xl p-5 space-y-3"
                style={{ background: '#111318', border: '1px solid rgba(52,211,153,0.22)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Plan d&apos;épargne
                </h2>
                <p className="text-base font-bold" style={{ color: '#34D399' }}>{plan.name}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Taux d&apos;intérêt</span>
                    <span className="text-sm font-semibold kpi-value" style={{ color: '#34D399' }}>
                      {Number(plan.interest_rate).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Période</span>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
                      {PERIOD[plan.interest_period] ?? plan.interest_period}
                    </span>
                  </div>
                  {plan.min_balance != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Solde minimum</span>
                      <span className="text-sm font-medium kpi-value" style={{ color: 'rgba(255,255,255,0.70)' }}>
                        {formatHTG(Number(plan.min_balance))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-5"
                style={{ background: '#111318', border: '1px solid #252A36' }}>
                <h2 className="text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>Plan d&apos;épargne</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>Aucun plan assigné</p>
              </div>
            )}

            {/* Account meta */}
            <div className="rounded-xl p-5 space-y-3"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Détails du compte
              </h2>
              {[
                { label: 'N° Compte',    value: account.account_number },
                { label: 'Type',         value: account.account_type   },
                { label: 'Devise',       value: account.currency       },
                { label: 'Ouvert le',    value: formatDate(account.created_at) },
                { label: 'Ajustements',  value: account.currency === 'USD' ? formatUSD(totalAdjustments) : formatHTG(totalAdjustments) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{item.label}</span>
                  <span className="text-sm font-medium kpi-value" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Loans section ── */}
        {loans.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Prêts du membre ({loans.length})
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #252A36' }}>
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 px-5 py-3"
                style={{ borderBottom: '1px solid #1a1f2e', background: '#0F1117' }}>
                {['N° Prêt', 'Capital', 'Remboursé', 'Mensualité', 'Statut', 'Date'].map(h => (
                  <p key={h} className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</p>
                ))}
              </div>
              {loans.map((l: any, idx: number) => {
                const pct = l.total_amount_due > 0 ? Math.round((Number(l.amount_paid ?? 0) / Number(l.total_amount_due)) * 100) : 0
                const ls  = LOAN_STATUS[l.status] ?? { label: l.status, color: 'rgba(255,255,255,0.45)' }
                return (
                  <div key={l.id}
                    className="grid grid-cols-6 gap-4 px-5 py-3.5 items-center"
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid #1a1f2e' }}>
                    <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>{l.loan_number}</p>
                    <p className="text-sm font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {formatHTG(Number(l.principal_amount))}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#252A36' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: pct >= 80 ? '#4ADE80' : pct >= 40 ? '#FCD34D' : '#C41E3A' }} />
                      </div>
                      <span className="text-xs kpi-value" style={{ color: 'rgba(255,255,255,0.45)' }}>{pct}%</span>
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
                      {formatHTG(Number(l.monthly_payment))}
                    </p>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium w-fit"
                      style={{ color: ls.color, background: `${ls.color}18`, border: `1px solid ${ls.color}30` }}>
                      {ls.label}
                    </span>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{formatDate(l.created_at)}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Transaction history (interactive — client component) ── */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Historique des transactions ({txs.length})
          </h2>
          {txs.length === 0 ? (
            <div className="rounded-xl" style={{ background: '#111318', border: '1px solid #252A36' }}>
              <EmptyState title="Aucune transaction" description="Les transactions de ce compte apparaîtront ici." />
            </div>
          ) : (
            <AccountProfileClient
              transactions={txs}
              currency={account.currency}
            />
          )}
        </section>

      </div>
    </>
  )
}

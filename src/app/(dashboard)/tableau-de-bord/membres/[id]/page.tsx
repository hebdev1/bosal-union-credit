import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileCheck, FileX, Upload, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { MemberStatusPicker } from '@/components/dashboard/forms/MemberStatusPicker'
import { formatHTG, formatDate } from '@/lib/formatters'
import { isFinalLoanStatus } from '@/lib/loans/finality'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('members').select('first_name, last_name').eq('id', id).single()
  return { title: data ? `${data.first_name} ${data.last_name}` : 'Membre' }
}

const DOC_LABELS: Record<string, string> = {
  national_id: 'Pièce d\'identité',
  passport: 'Passeport',
  proof_of_address: 'Justificatif domicile',
  proof_of_income: 'Justificatif revenus',
  selfie: 'Selfie',
  business_license: 'Patente',
  other: 'Autre',
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('members')
    .select(`
      id, first_name, last_name, member_number, birth_date, phone, email,
      address, profession, monthly_income, status, created_at,
      id_number, id_type, nif, photo_url,
      emergency_contact_name, emergency_contact_phone, emergency_contact_address
    `)
    .eq('id', id)
    .single()

  if (!member) notFound()

  const [accountsRes, loansRes, docsRes] = await Promise.all([
    supabase.from('accounts')
      .select('id, account_number, account_type, balance, currency, status')
      .eq('member_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('loans')
      .select('id, loan_number, principal_amount, monthly_payment, status, due_date, disbursed_at, created_at, amount_paid, total_amount_due, duration_months, interest_rate')
      .eq('member_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('documents')
      .select('id, document_type, file_name, file_url, verified, verified_at, expires_at, created_at')
      .eq('entity_type', 'member')
      .eq('entity_id', id)
      .order('created_at', { ascending: false }),
  ])

  const accounts = accountsRes.data ?? []
  const loans = loansRes.data ?? []
  const documents = docsRes.data ?? []

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance ?? 0), 0)
  const totalLoans = loans
    .filter((l) => l.status !== 'completed' && l.status !== 'rejected' && l.status !== 'defaulted')
    .reduce((s, l) => s + (Number(l.total_amount_due) - Number(l.amount_paid ?? 0)), 0)

  const verifiedDocs = documents.filter((d) => d.verified).length
  const kycComplete = verifiedDocs >= 2 && member.id_number

  const initials = `${member.first_name[0]}${member.last_name[0]}`.toUpperCase()

  return (
    <>
      <Header title={`${member.first_name} ${member.last_name}`} />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <Link
          href="/tableau-de-bord/membres"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft size={13} />
          Retour aux membres
        </Link>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                style={{ background: 'rgba(196,30,58,0.15)', color: '#C41E3A' }}>
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {member.first_name} {member.last_name}
                  </h1>
                  <MemberStatusPicker
                    memberId={member.id}
                    current={(member.status ?? 'pending') as 'active' | 'suspended' | 'closed' | 'pending'}
                  />
                  {kycComplete ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                      <FileCheck size={11} /> KYC vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'rgba(252,211,77,0.12)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.25)' }}>
                      <FileX size={11} /> KYC incomplet
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  N° {member.member_number} · Membre depuis {formatDate(member.created_at ?? '')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Comptes', value: String(accounts.length) },
              { label: 'Épargne totale', value: formatHTG(totalBalance), color: '#4ADE80' },
              { label: 'Encours prêts', value: formatHTG(totalLoans), color: totalLoans > 0 ? '#FCD34D' : 'rgba(255,255,255,0.60)' },
              { label: 'Docs vérifiés', value: `${verifiedDocs}/${documents.length}` },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4" style={{ background: '#0D1018' }}>
                <p className="text-base font-bold kpi-value" style={{ color: s.color ?? 'rgba(255,255,255,0.88)' }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Identity + Emergency contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 space-y-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Identité & contact</h2>
            {[
              { label: 'Date de naissance', value: formatDate(member.birth_date) },
              { label: 'Téléphone', value: member.phone ?? '—' },
              { label: 'Email', value: member.email ?? '—' },
              { label: 'Adresse', value: member.address ?? '—' },
              { label: 'Profession', value: member.profession ?? '—' },
              { label: 'Revenu mensuel', value: member.monthly_income ? formatHTG(Number(member.monthly_income)) : '—' },
              { label: 'Type pièce', value: member.id_type ?? '—' },
              { label: 'N° pièce', value: member.id_number ?? '—' },
              { label: 'NIF', value: member.nif ?? '—' },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.label}</span>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5 space-y-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Contact d&apos;urgence</h2>
            {member.emergency_contact_name ? (
              <>
                {[
                  { label: 'Nom', value: member.emergency_contact_name },
                  { label: 'Téléphone', value: member.emergency_contact_phone ?? '—' },
                  { label: 'Adresse', value: member.emergency_contact_address ?? '—' },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.label}</span>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>{f.value}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>Aucun contact d&apos;urgence renseigné.</p>
            )}
          </div>
        </div>

        {/* Accounts */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Comptes ({accounts.length})
          </h2>
          {accounts.length === 0 ? (
            <div className="rounded-xl" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <EmptyState title="Aucun compte" description="Ce membre n'a pas encore de compte actif." />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              {accounts.map((a, idx) => (
                <Link key={a.id} href={`/tableau-de-bord/comptes/${a.id}`}
                  className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02]"
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>{a.account_number}</p>
                  <StatusBadge value={a.account_type} />
                  <p className="text-sm font-semibold kpi-value" style={{ color: '#4ADE80' }}>
                    {formatHTG(Number(a.balance))} {a.currency}
                  </p>
                  <StatusBadge value={a.status ?? 'active'} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* KYC Documents */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Documents KYC ({documents.length})
            </h2>
            <button type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: 'rgba(196,30,58,0.12)', color: '#C41E3A', border: '1px solid rgba(196,30,58,0.25)' }}>
              <Upload size={12} /> Téléverser un document
            </button>
          </div>
          {documents.length === 0 ? (
            <div className="rounded-xl" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <EmptyState title="Aucun document" description="Aucun document KYC n'a encore été téléversé pour ce membre." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((d) => (
                <div key={d.id} className="rounded-xl p-4 flex items-start justify-between gap-3"
                  style={{ background: '#0D1018', border: `1px solid ${d.verified ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.09)'}` }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {DOC_LABELS[d.document_type] ?? d.document_type}
                    </p>
                    <p className="text-xs truncate mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{d.file_name ?? '—'}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      Téléversé le {formatDate(d.created_at ?? '')}
                      {d.expires_at && ` · Expire le ${formatDate(d.expires_at)}`}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium flex-shrink-0"
                    style={{
                      background: d.verified ? 'rgba(74,222,128,0.12)' : 'rgba(252,211,77,0.12)',
                      color: d.verified ? '#4ADE80' : '#FCD34D',
                    }}>
                    {d.verified ? 'Vérifié' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Loan profile — full borrower history */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Profil de prêt ({loans.length})
            </h2>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Historique complet de l&apos;emprunteur
            </p>
          </div>

          {loans.length === 0 ? (
            <div className="rounded-xl" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <EmptyState title="Aucun prêt" description="Ce membre n'a contracté aucun prêt à ce jour." />
            </div>
          ) : (
            <>
              {/* Loan KPIs */}
              {(() => {
                const totalBorrowed   = loans.reduce((s, l) => s + Number(l.principal_amount ?? 0), 0)
                const totalRepaid     = loans.reduce((s, l) => s + Number(l.amount_paid ?? 0), 0)
                const activeCount     = loans.filter(l => !isFinalLoanStatus(l.status ?? null) && l.status !== 'pending').length
                const pendingCount    = loans.filter(l => l.status === 'pending').length
                const sealedCount     = loans.filter(l => isFinalLoanStatus(l.status ?? null)).length
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: 'Total emprunté', value: formatHTG(totalBorrowed),  color: '#C41E3A' },
                      { label: 'Total remboursé', value: formatHTG(totalRepaid),    color: '#4ADE80' },
                      { label: 'Prêts actifs',    value: `${activeCount}${pendingCount > 0 ? ` + ${pendingCount} en attente` : ''}`, color: activeCount > 0 ? '#FCD34D' : 'rgba(255,255,255,0.60)' },
                      { label: 'Prêts soldés',    value: String(sealedCount),       color: 'rgba(255,255,255,0.70)' },
                    ].map(k => (
                      <div key={k.label} className="rounded-xl px-4 py-3"
                        style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <p className="text-base font-bold kpi-value" style={{ color: k.color }}>{k.value}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{k.label}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Header */}
              <div className="rounded-t-xl grid grid-cols-12 gap-3 px-5 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none' }}>
                <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>N° Prêt</p>
                <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Capital</p>
                <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Mensualité</p>
                <p className="col-span-3 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Progression</p>
                <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Échéance</p>
                <p className="col-span-1 text-[10px] font-semibold uppercase tracking-wide text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Statut</p>
              </div>

              {/* Rows */}
              <div className="rounded-b-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', borderTop: 'none' }}>
                {/* Sort: active first, pending next, sealed last */}
                {[...loans].sort((a, b) => {
                  const score = (s: string | null) =>
                    isFinalLoanStatus(s) ? 2 : s === 'pending' ? 1 : 0
                  return score(a.status ?? null) - score(b.status ?? null)
                }).map((l, idx) => {
                  const totalDue   = Number(l.total_amount_due ?? 0)
                  const paid       = Number(l.amount_paid ?? 0)
                  const pct        = totalDue > 0 ? Math.min(100, Math.round((paid / totalDue) * 100)) : 0
                  const sealed     = isFinalLoanStatus(l.status ?? null)
                  const barColor   = pct >= 100 ? '#4ADE80' : pct >= 50 ? '#FCD34D' : '#C41E3A'
                  return (
                    <Link key={l.id} href={`/tableau-de-bord/prets/${l.id}`}
                      className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02]"
                      style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="col-span-2 font-mono text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.70)' }}>
                        {sealed && <Lock size={9} aria-hidden style={{ opacity: 0.6 }} />}
                        {l.loan_number}
                      </p>
                      <p className="col-span-2 text-sm font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {formatHTG(Number(l.principal_amount))}
                      </p>
                      <p className="col-span-2 text-sm kpi-value" style={{ color: 'rgba(255,255,255,0.60)' }}>
                        {formatHTG(Number(l.monthly_payment))}
                      </p>
                      <div className="col-span-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            {formatHTG(paid)} <span style={{ color: 'rgba(255,255,255,0.30)' }}>/ {formatHTG(totalDue)}</span>
                          </span>
                          <span className="text-[11px] kpi-value font-semibold" style={{ color: barColor }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                      <p className="col-span-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        {formatDate(l.due_date)}
                      </p>
                      <div className="col-span-1 flex justify-end">
                        <StatusBadge value={l.status ?? 'pending'} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}

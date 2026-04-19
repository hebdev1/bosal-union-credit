import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/statut'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const SERVICES = [
  { name: 'Application web',         status: 'operational', uptime: '99.98%' },
  { name: 'API REST',                status: 'operational', uptime: '99.95%' },
  { name: 'Envoi de SMS',            status: 'operational', uptime: '99.72%' },
  { name: 'Génération de PDF',       status: 'operational', uptime: '99.99%' },
  { name: 'Webhooks',                status: 'operational', uptime: '99.89%' },
  { name: 'Sauvegardes',             status: 'operational', uptime: '100.00%' },
]

const INCIDENTS = [
  { date: '2026-03-18', title: 'Lenteurs intermittentes sur l’API', resolved: true, duration: '42 min' },
  { date: '2026-02-04', title: 'Maintenance planifiée — migration base de données', resolved: true, duration: '2h15' },
]

function Dot({ status }: { status: string }) {
  const color = status === 'operational' ? '#22C55E' : status === 'degraded' ? '#F59E0B' : '#EF4444'
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />
        <span className="relative w-2 h-2 rounded-full" style={{ background: color }} />
      </span>
    </span>
  )
}

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section>
        <div className="rounded-xl p-5 border flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
          <Dot status="operational" />
          <p className="text-[15px] font-semibold text-white">Tous les services sont opérationnels</p>
        </div>
      </Section>

      <Section title="Services">
        <div className="rounded-xl overflow-hidden border"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {SERVICES.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-3.5"
              style={{
                background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <div className="flex items-center gap-3">
                <Dot status={s.status} />
                <span className="text-[14px] text-white/85">{s.name}</span>
              </div>
              <span className="text-[12px] text-white/40 font-mono">{s.uptime} uptime · 90j</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Historique des incidents">
        <div className="space-y-2">
          {INCIDENTS.map(inc => (
            <div key={inc.date} className="rounded-xl p-4 border flex items-center justify-between flex-wrap gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-[14px] text-white/85">{inc.title}</p>
                <p className="text-[11.5px] text-white/40 mt-0.5">
                  {new Date(inc.date).toLocaleDateString('fr-HT', { year: 'numeric', month: 'long', day: 'numeric' })} · Durée : {inc.duration}
                </p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Résolu</span>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}

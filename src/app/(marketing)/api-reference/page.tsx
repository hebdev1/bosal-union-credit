import Link from 'next/link'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/api-reference'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const ENDPOINTS = [
  { method: 'GET',  path: '/v1/members',           desc: 'Liste paginée des membres de la coopérative' },
  { method: 'POST', path: '/v1/members',           desc: 'Créer un nouveau membre avec KYC' },
  { method: 'GET',  path: '/v1/accounts/:id',      desc: 'Détails et solde d’un compte' },
  { method: 'POST', path: '/v1/transactions',      desc: 'Enregistrer un dépôt, retrait ou virement' },
  { method: 'GET',  path: '/v1/loans',             desc: 'Liste des prêts avec filtres (statut, membre, agence)' },
  { method: 'POST', path: '/v1/loans/:id/disburse', desc: 'Décaisser un prêt approuvé' },
  { method: 'GET',  path: '/v1/exchange/rates',    desc: 'Taux de change du jour (HTG, USD, CAD, DOP)' },
  { method: 'POST', path: '/v1/webhooks',          desc: 'Souscrire à des événements (loan.created, etc.)' },
]

const METHOD_COLOR: Record<string, string> = {
  GET: '#22C55E',
  POST: '#3B82F6',
  PUT: '#F59E0B',
  DELETE: '#EF4444',
}

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="API REST — simple, prévisible, documentée">
        <p>
          Intégrez Bosal Credit Union à vos outils internes : comptabilité, CRM, reporting externe.
          Authentification par clé API, réponses JSON, webhooks en temps réel.
        </p>
      </Section>

      <Section title="Exemple — créer un dépôt">
        <pre className="rounded-xl p-5 text-[12.5px] overflow-x-auto"
          style={{ background: '#05060A', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', fontFamily: 'JetBrains Mono, monospace' }}>
{`curl -X POST https://api.bosal-credit-union.ht/v1/transactions \\
  -H "Authorization: Bearer \${API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "deposit",
    "account_id": "acc_7f3a...",
    "amount": 5000,
    "currency": "HTG",
    "memo": "Dépôt mensuel membre"
  }'`}
        </pre>
      </Section>

      <Section title="Endpoints principaux">
        <div className="mt-2 rounded-xl overflow-hidden border"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {ENDPOINTS.map((e, i) => (
            <div key={e.path} className="flex items-center gap-3 px-4 py-3"
              style={{
                background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <span className="w-14 text-[11px] font-semibold tracking-wider"
                style={{ color: METHOD_COLOR[e.method] }}>{e.method}</span>
              <code className="text-[13px] text-white/85 font-mono flex-shrink-0">{e.path}</code>
              <span className="text-[12px] text-white/45 ml-auto text-right hidden sm:block">{e.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <p>
          Besoin d’une clé API ? <Link href="/contact" style={{ color: '#C41E3A' }} className="underline underline-offset-4">Contactez-nous</Link> ou
          consultez le <Link href="/statut" style={{ color: '#C41E3A' }} className="underline underline-offset-4">statut</Link> des services.
        </p>
      </Section>
    </PageShell>
  )
}

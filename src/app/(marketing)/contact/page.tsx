import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/contact'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const LABEL = 'block text-xs font-medium mb-1.5'
const INPUT = 'w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.88)' }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 mt-4">
        {/* ── Coordonnées ───────────────────────────────── */}
        <div className="space-y-4">
          <Section title="Parlons de votre coopérative">
            <p>Notre équipe répond en moins de 24h, du lundi au vendredi.</p>
          </Section>

          {[
            { icon: <Mail size={16} />, label: 'Email',        value: 'contact@machekay-bosal.ht', href: 'mailto:contact@machekay-bosal.ht' },
            { icon: <Phone size={16} />, label: 'Téléphone',    value: '+509 36 00 00 00',         href: 'tel:+50936000000' },
            { icon: <MessageSquare size={16} />, label: 'WhatsApp', value: '+509 36 00 00 01',      href: 'https://wa.me/50936000001' },
            { icon: <MapPin size={16} />, label: 'Bureau',      value: 'Delmas 75, Port-au-Prince, Haïti' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-4 border flex items-start gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(196,30,58,0.10)', color: '#E11D48' }}>
                {c.icon}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40">{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="text-[14px] text-white/90 hover:text-white">{c.value}</a>
                ) : (
                  <p className="text-[14px] text-white/90">{c.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Formulaire ────────────────────────────────── */}
        <form className="rounded-2xl p-6 md:p-8 border space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="text-[18px] font-semibold text-white">Envoyer un message</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={{ color: 'rgba(255,255,255,0.42)' }}>Nom complet *</label>
              <input name="name" required className={INPUT} style={INPUT_STYLE} placeholder="Jean Moreau" />
            </div>
            <div>
              <label className={LABEL} style={{ color: 'rgba(255,255,255,0.42)' }}>Coopérative</label>
              <input name="coop" className={INPUT} style={INPUT_STYLE} placeholder="COOPEC Solidarité" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={{ color: 'rgba(255,255,255,0.42)' }}>Email *</label>
              <input type="email" name="email" required className={INPUT} style={INPUT_STYLE} placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className={LABEL} style={{ color: 'rgba(255,255,255,0.42)' }}>Téléphone</label>
              <input type="tel" name="phone" className={INPUT} style={INPUT_STYLE} placeholder="+509 …" />
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: 'rgba(255,255,255,0.42)' }}>Message *</label>
            <textarea name="message" required rows={5} className={INPUT + ' resize-none'} style={INPUT_STYLE}
              placeholder="Parlez-nous de votre projet, de vos questions, de votre coopérative…" />
          </div>
          <button type="submit" className="w-full h-11 rounded-full text-[14px] font-semibold transition-all"
            style={{ background: '#C41E3A', color: '#fff', boxShadow: '0 0 24px rgba(196,30,58,0.30)' }}>
            Envoyer le message
          </button>
          <p className="text-[11px] text-white/35 text-center">
            En envoyant, vous acceptez notre <a href="/confidentialite" className="underline underline-offset-2">politique de confidentialité</a>.
          </p>
        </form>
      </div>
    </PageShell>
  )
}

'use client'
import * as React from 'react'
import { Check, Pencil, X, Loader2, ChevronDown, Upload, Palette, Mail, Layout, FileText, Settings, Save, RotateCcw, UserMinus, Play } from 'lucide-react'
import { toast } from 'sonner'
import { updateSetting, updateCooperative, updateAgentStatus, runInactivityDeactivation } from '@/app/(dashboard)/tableau-de-bord/parametres/actions'
import { createClient } from '@/lib/supabase/client'

/* ── Constants ──────────────────────────────────────────────────────────── */
const SUPABASE_URL = 'https://ebioqgjyzrhjxxlugzcz.supabase.co'
const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const IS = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.90)' }
const ROLE_LABELS: Record<string, string> = { admin: 'Admin', manager: 'Manager', cashier: 'Caissier' }
const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  active:    { color: '#4ADE80', bg: 'rgba(34,197,94,0.12)'  },
  suspended: { color: '#F87171', bg: 'rgba(239,68,68,0.12)'  },
  pending:   { color: '#FCD34D', bg: 'rgba(234,179,8,0.12)'  },
}
const PALETTE_COLORS = [
  '#C41E3A','#E8314F','#FF6B6B','#FF8C42',
  '#F59E0B','#10B981','#3B82F6','#6366F1',
  '#8B5CF6','#EC4899','#0F172A','#1E293B',
  '#0C0C0E','#111318','#252A36','#FFFFFF',
  '#34D399','#60A5FA','#A78BFA','#FCD34D',
  '#F87171','#4ADE80','#2DD4BF','#FB923C',
]

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Setting { key: string; label: string; value: unknown; description?: string; input_type: string; options?: { label: string; value: string }[] | null }
interface Agent   { id: string; name: string; email: string; role: string; status: string }
interface Coop    { id: string; name: string; address?: string; phone?: string }

/* ── Color palette picker ───────────────────────────────────────────────── */
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = React.useState(false)
  const [custom, setCustom] = React.useState(value)
  const ref    = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const [dropPos, setDropPos] = React.useState<React.CSSProperties>({})

  React.useEffect(() => { setCustom(value) }, [value])

  React.useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const fitsBelow = rect.bottom + 340 < window.innerHeight
      setDropPos(fitsBelow
        ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
        : { bottom: window.innerHeight - rect.top + 8, right: window.innerWidth - rect.right }
      )
    }
    setOpen(o => !o)
  }

  function pick(color: string) { onChange(color); setCustom(color); setOpen(false) }
  function applyCustom() { if (!/^#[0-9A-Fa-f]{6}$/.test(custom)) return; pick(custom) }

  return (
    <div ref={ref}>
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)' }}>
        <span className="w-4 h-4 rounded-sm flex-shrink-0 shadow-sm" style={{ background: value }} />
        <span className="font-mono">{value}</span>
        <Palette size={11} className="ml-1 opacity-50" />
      </button>

      {open && (
        <div
          className="rounded-xl p-4 shadow-2xl w-64"
          style={{
            position: 'fixed',
            zIndex: 9999,
            background: '#181D27',
            border: '1px solid rgba(255,255,255,0.09)',
            ...dropPos,
          }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.50)' }}>Palette</p>
          <div className="grid grid-cols-8 gap-1.5 mb-1">
            {PALETTE_COLORS.map(c => (
              <button key={c} type="button" onClick={() => pick(c)}
                className="w-6 h-6 rounded-md transition-transform hover:scale-110 focus:outline-none"
                style={{ background: c, border: value === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.10)' }}
                title={c}
              />
            ))}
          </div>
          <p className="text-xs font-semibold mt-3 mb-2" style={{ color: 'rgba(255,255,255,0.50)' }}>Couleur personnalisée</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type="color" value={custom} onChange={e => setCustom(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}>
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: custom }} />
                <span className="font-mono">{custom}</span>
              </div>
            </div>
            <button type="button" onClick={applyCustom}
              className="h-8 px-3 rounded-lg text-xs font-medium"
              style={{ background: '#C41E3A', color: '#fff' }}>
              <Check size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Logo upload ────────────────────────────────────────────────────────── */
function LogoUpload({ settingKey, current }: { settingKey: string; current: string }) {
  const [url, setUrl]             = React.useState(current)
  const [uploading, setUploading] = React.useState(false)
  const [err, setErr]             = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setErr('Fichier trop grand (max 2 Mo)'); return }
    setUploading(true); setErr(null)
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop()
      const path = `logo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/logos/${path}`
      await updateSetting(settingKey, publicUrl)
      setUrl(publicUrl)
    } catch (ex: any) {
      setErr(ex.message ?? 'Erreur upload')
    } finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <img src={url} alt="Logo" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <Upload size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
      )}
      <div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFile} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F', border: '1px solid rgba(196,30,58,0.25)', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Upload…' : url ? 'Changer' : 'Téléverser'}
        </button>
        {url && (
          <button type="button" onClick={async () => { await updateSetting(settingKey, ''); setUrl('') }}
            className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Supprimer
          </button>
        )}
        {err && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{err}</p>}
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>PNG, JPG, SVG · max 2 Mo</p>
      </div>
    </div>
  )
}

/* ── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors"
      style={{ background: checked ? '#C41E3A' : 'rgba(255,255,255,0.10)' }}>
      <span className="inline-block h-4 w-4 rounded-full shadow-sm transition-transform"
        style={{ background: '#fff', transform: checked ? 'translateX(24px)' : 'translateX(4px)', marginTop: 4 }} />
    </button>
  )
}

/* ── Select ─────────────────────────────────────────────────────────────── */
function SelectControl({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-lg px-3 py-1.5 text-sm outline-none"
      style={{ ...IS, minWidth: 150 }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ── Inline text/number ─────────────────────────────────────────────────── */
function InlineControl({ value, type, onChange }: { value: string | number; type: 'text' | 'number'; onChange: (v: string | number) => void }) {
  const [editing, setEditing] = React.useState(false)
  const [local, setLocal]     = React.useState(String(value))
  const inputRef = React.useRef<HTMLInputElement>(null)

  // sync local when value prop changes (e.g. after cancel)
  React.useEffect(() => { if (!editing) setLocal(String(value)) }, [value, editing])
  React.useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commit() {
    onChange(type === 'number' ? Number(local) : local)
    setEditing(false)
  }
  function cancel() {
    setLocal(String(value))
    setEditing(false)
  }

  if (!editing) return (
    <button type="button" onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 group rounded px-2 py-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
      <span className="font-mono text-sm">{value}</span>
      <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type={type} value={local}
        onChange={e => setLocal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
        className="rounded-lg px-3 py-1.5 text-sm outline-none"
        style={{ ...IS, width: type === 'number' ? 100 : 220 }} />
      <button type="button" onClick={commit} className="rounded p-1 hover:bg-green-500/10" style={{ color: '#4ADE80' }}>
        <Check size={13} />
      </button>
      <button type="button" onClick={cancel} className="rounded p-1 hover:bg-red-500/10" style={{ color: '#F87171' }}>
        <X size={13} />
      </button>
    </div>
  )
}

/* ── Email input ────────────────────────────────────────────────────────── */
function EmailControl({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = React.useState(false)
  const [local, setLocal]     = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { if (!editing) setLocal(value) }, [value, editing])
  React.useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commit() { onChange(local); setEditing(false) }
  function cancel() { setLocal(value); setEditing(false) }

  if (!editing) return (
    <button type="button" onClick={() => setEditing(true)}
      className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs group transition-colors"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: value ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)' }}>
      <Mail size={12} style={{ color: '#C41E3A', flexShrink: 0 }} />
      <span className="font-mono">{value || placeholder || 'non défini'}</span>
      <Pencil size={10} className="ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#C41E3A' }} />
        <input ref={inputRef} type="email" value={local} onChange={e => setLocal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
          placeholder={placeholder}
          className="rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none"
          style={{ ...IS, width: 260 }} />
      </div>
      <button type="button" onClick={commit} className="rounded p-1 hover:bg-green-500/10" style={{ color: '#4ADE80' }}>
        <Check size={13} />
      </button>
      <button type="button" onClick={cancel} className="rounded p-1 hover:bg-red-500/10" style={{ color: '#F87171' }}>
        <X size={13} />
      </button>
    </div>
  )
}

/* ── Setting row (controlled) ───────────────────────────────────────────── */
function SettingRow({ s, value, onChange }: { s: Setting; value: unknown; onChange: (key: string, v: unknown) => void }) {
  const isEmail = s.key.includes('email') && s.input_type === 'text'

  function renderControl() {
    if (s.input_type === 'toggle')
      return <Toggle checked={Boolean(value)} onChange={v => onChange(s.key, v)} />
    if (s.input_type === 'color')
      return <ColorPicker value={String(value)} onChange={v => onChange(s.key, v)} />
    if (s.input_type === 'image')
      return <LogoUpload settingKey={s.key} current={String(value)} />
    if (s.input_type === 'select' && s.options)
      return <SelectControl value={String(value)} options={s.options} onChange={v => onChange(s.key, v)} />
    if (s.input_type === 'number')
      return <InlineControl value={Number(value)} type="number" onChange={v => onChange(s.key, v)} />
    if (isEmail)
      return <EmailControl value={String(value)} onChange={v => onChange(s.key, v)} placeholder="email@exemple.com" />
    return <InlineControl value={String(value)} type="text" onChange={v => onChange(s.key, v)} />
  }

  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>{s.label}</p>
        {s.description && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{s.description}</p>}
      </div>
      <div className="flex-shrink-0">{renderControl()}</div>
    </div>
  )
}

/* ── Theme preview card ─────────────────────────────────────────────────── */
function ThemePreview({ draft, settings }: { draft: Record<string, unknown>; settings: Setting[] }) {
  function get(key: string) {
    return String(draft[key] ?? settings.find(s => s.key === key)?.value ?? '').replace(/"/g, '')
  }
  const brand     = get('brand_color')         || '#C41E3A'
  const sidebar   = get('sidebar_bg')          || '#0C0C0E'
  const surface   = get('surface_color')       || '#111318'
  const border    = get('border_color')        || '#252A36'
  const textPri   = get('text_primary_color')  || 'rgba(255,255,255,0.90)'
  const textSec   = get('text_secondary_color')|| 'rgba(255,255,255,0.45)'
  const kpiColor  = get('kpi_value_color')     || '#FFFFFF'

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}`, maxWidth: 380 }}>
      <div className="flex">
        <div className="w-10 flex flex-col items-center py-3 gap-2" style={{ background: sidebar }}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: brand }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: '#fff' }} />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-5 h-1 rounded-full" style={{ background: i === 0 ? brand : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
        <div className="flex-1 p-3 space-y-2">
          {/* KPI cards */}
          <div className="flex gap-2">
            {['#4ADE80','#60A5FA',brand].map((c, i) => (
              <div key={i} className="flex-1 rounded-lg px-2 py-1.5" style={{ background: sidebar, border: `1px solid ${border}` }}>
                <div className="h-2 rounded-full w-8 mb-0.5" style={{ background: c }} />
                <div className="h-1 rounded-full w-5" style={{ background: i === 0 ? kpiColor + '55' : 'rgba(255,255,255,0.12)' }} />
              </div>
            ))}
          </div>
          {/* Table rows */}
          <div className="rounded-lg p-2" style={{ background: sidebar, border: `1px solid ${border}` }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i === 0 ? brand : 'rgba(255,255,255,0.15)' }} />
                <div className="h-1 rounded-full w-16" style={{ background: textPri + '60' }} />
                <div className="h-1 rounded-full flex-1" style={{ background: textSec + '40' }} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="rounded-lg px-3 py-1 text-[9px] font-bold" style={{ background: brand, color: '#fff' }}>Action</div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 flex justify-between items-center" style={{ borderTop: `1px solid ${border}` }}>
        <span className="text-[9px]" style={{ color: textSec }}>Texte secondaire</span>
        <span className="text-[9px] font-semibold" style={{ color: textPri }}>Texte principal</span>
      </div>
    </div>
  )
}

/* ── Ticket preview (PDF tab) ───────────────────────────────────────────── */
function TicketPreview({ accentColor, receivedColor, headerColor, headerTextColor, footerText, logoUrl }: {
  accentColor: string
  receivedColor: string
  headerColor?: string
  headerTextColor?: string
  footerText?: string
  logoUrl?: string
}) {
  const hBg   = headerColor    || '#0E0E12'
  const hText = headerTextColor || accentColor
  const rows: [string, string][] = [
    ['Client',         'Jean Dupont'],
    ['De',             'HTG'],
    ['Vers',           'USD'],
    ['Montant donné',  'HTG 5,000.00'],
    ['Taux appliqué',  '1 HTG = 0.0077 USD'],
  ]
  return (
    <div style={{ maxWidth: 280, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.45)', fontFamily: 'monospace' }}>
        {/* Accent top bar */}
        <div style={{ background: accentColor, height: 5 }} />
        {/* Header band */}
        <div style={{ background: hBg, padding: '10px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" style={{ height: 22, maxWidth: 60, objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, textAlign: logoUrl ? 'left' : 'center' }}>
            <p style={{ color: hText, fontWeight: 700, fontSize: 10, letterSpacing: 1.5, margin: 0 }}>BOSAL UNION CRÉDIT</p>
            <p style={{ color: 'rgba(180,180,190,0.7)', fontSize: 8, marginTop: 2, margin: 0 }}>BUREAU DE CHANGE · REÇU</p>
          </div>
        </div>
        <div style={{ padding: '12px 16px 10px' }}>
          {/* Ticket number */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <p style={{ color: '#bbb', fontSize: 8, margin: 0 }}>N° TICKET</p>
            <p style={{ color: accentColor, fontWeight: 700, fontSize: 14, margin: '3px 0 0', borderBottom: `2px solid ${accentColor}`, paddingBottom: 4, display: 'inline-block' }}>
              #TK-000001
            </p>
          </div>
          {rows.map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed #eee', fontSize: 9 }}>
              <span style={{ color: '#999' }}>{l}</span>
              <span style={{ color: '#222', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ background: receivedColor + '18', border: `1px solid ${receivedColor}50`, borderRadius: 6, padding: '7px 10px', marginTop: 10, textAlign: 'center' }}>
            <p style={{ color: '#999', fontSize: 7, marginBottom: 2, margin: 0 }}>MONTANT REÇU</p>
            <p style={{ color: receivedColor, fontWeight: 700, fontSize: 14, margin: '3px 0 0' }}>USD 38.50</p>
          </div>
        </div>
        {/* Bottom accent bar + footer text */}
        <div style={{ background: accentColor, padding: '4px 8px', textAlign: 'center' }}>
          <p style={{ color: '#fff', fontSize: 7, margin: 0, opacity: 0.9 }}>
            {footerText || 'Merci de votre confiance · Conservez ce reçu'}
          </p>
        </div>
      </div>
      <p className="text-center text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Aperçu ticket de caisse</p>
    </div>
  )
}

/* ── Report preview (PDF tab) ───────────────────────────────────────────── */
function ReportPreview({ headerColor, accentColor, textColor, footerText, logoUrl }: {
  headerColor: string; accentColor: string; textColor: string; footerText?: string; logoUrl?: string
}) {
  const tableRows = [
    ['REF-001', 'Dépôt',   'Jean Dupont',  'HTG 25,000.00', '17/04/2026'],
    ['REF-002', 'Retrait', 'Marie Pierre', 'HTG 8,500.00',  '17/04/2026'],
    ['REF-003', 'Dépôt',   'Paul Michel',  'HTG 12,000.00', '17/04/2026'],
  ]
  return (
    <div style={{ margin: '0 auto' }}>
      {/* A4 landscape aspect ratio container */}
      <div style={{
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        fontFamily: 'sans-serif',
        aspectRatio: '297 / 210',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ background: headerColor, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ height: 18, maxWidth: 50, objectFit: 'contain' }} />
              : <div style={{ width: 18, height: 18, borderRadius: 3, background: accentColor, opacity: 0.8 }} />
            }
            <span style={{ color: accentColor, fontWeight: 700, fontSize: 9, letterSpacing: 1 }}>RAPPORT TRANSACTIONS</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 7 }}>Généré le {new Date().toLocaleDateString('fr-FR')}</span>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: '#f9f9f9', flexShrink: 0 }}>
          {[
            { label: 'Opérations', val: '24',           color: accentColor   },
            { label: 'Dépôts',     val: 'HTG 89,500',   color: '#22C55E'     },
            { label: 'Retraits',   val: 'HTG 32,000',   color: '#EF4444'     },
            { label: 'Flux net',   val: 'HTG 57,500',   color: '#3B82F6'     },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '5px 7px' }}>
              <div style={{ color: k.color, fontWeight: 700, fontSize: 8 }}>{k.val}</div>
              <div style={{ color: '#aaa', fontSize: 6.5, marginTop: 1 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, padding: '0 14px', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
            {['Référence','Type','Membre','Montant','Date'].map(h => (
              <div key={h} style={{ flex: 1, color: '#888', fontSize: 6.5, fontWeight: 600, padding: '0 4px' }}>{h}</div>
            ))}
          </div>
          {tableRows.map(([ref, type, member, amount, date], i) => (
            <div key={ref} style={{ display: 'flex', padding: '4px 0', borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <div style={{ flex: 1, color: accentColor, fontSize: 6.5, padding: '0 4px', fontWeight: 600 }}>{ref}</div>
              <div style={{ flex: 1, color: type === 'Dépôt' ? '#22C55E' : '#EF4444', fontSize: 6.5, padding: '0 4px' }}>{type}</div>
              <div style={{ flex: 1, color: textColor === '#111318' ? '#333' : textColor, fontSize: 6.5, padding: '0 4px' }}>{member}</div>
              <div style={{ flex: 1, color: type === 'Dépôt' ? '#22C55E' : '#EF4444', fontSize: 6.5, padding: '0 4px', fontWeight: 600 }}>{amount}</div>
              <div style={{ flex: 1, color: '#aaa', fontSize: 6.5, padding: '0 4px' }}>{date}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '5px 14px', borderTop: '1px solid #e5e7eb', background: '#f9f9f9', flexShrink: 0 }}>
          <p style={{ color: '#bbb', fontSize: 6, textAlign: 'center' }}>
            {footerText || 'Bosal Credit Union · Document confidentiel'}
          </p>
        </div>
      </div>
      <p className="text-center text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Aperçu rapport PDF</p>
    </div>
  )
}

/* ── Coop editor ────────────────────────────────────────────────────────── */
function CoopEditor({ coop }: { coop: Coop }) {
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving]   = React.useState(false)
  const [err, setErr]         = React.useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setErr(null)
    const res = await updateCooperative(new FormData(e.currentTarget))
    setSaving(false)
    if (res?.error) { setErr(res.error); return }
    setEditing(false)
  }
  if (!editing) return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {[{ label: 'Nom', value: coop.name },{ label: 'Adresse', value: coop.address ?? '—' },{ label: 'Téléphone', value: coop.phone ?? '—' }].map(f => (
          <div key={f.label} className="px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.label}</p>
            <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.value}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 flex justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button type="button" onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F', border: '1px solid rgba(196,30,58,0.25)' }}>
          <Pencil size={12} /> Modifier
        </button>
      </div>
    </div>
  )
  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Nom *</label>
          <input name="name" required defaultValue={coop.name} className={INPUT} style={IS} /></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Adresse</label>
          <input name="address" defaultValue={coop.address ?? ''} className={INPUT} style={IS} /></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Téléphone</label>
          <input name="phone" defaultValue={coop.phone ?? ''} className={INPUT} style={IS} /></div>
      </div>
      {err && <p className="text-xs" style={{ color: '#F87171' }}>{err}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => { setEditing(false); setErr(null) }}
          className="h-8 px-3 rounded-lg text-xs font-medium"
          style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', background: 'transparent' }}>Annuler</button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium"
          style={{ background: '#C41E3A', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving && <Loader2 size={12} className="animate-spin" />} Enregistrer</button>
      </div>
    </form>
  )
}

/* ── Agent status select ────────────────────────────────────────────────── */
function AgentStatusSelect({ agentId, current }: { agentId: string; current: string }) {
  const [val, setVal]       = React.useState(current)
  const [saving, setSaving] = React.useState(false)
  const cfg = STATUS_CFG[val] ?? STATUS_CFG.pending
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value; const prev = val; setVal(next); setSaving(true)
    const res = await updateAgentStatus(agentId, next)
    setSaving(false)
    if (res?.error) setVal(prev)
  }
  return (
    <div className="relative flex items-center gap-1">
      <select value={val} onChange={handleChange} disabled={saving}
        className="appearance-none rounded-full pl-2 pr-6 py-0.5 text-[11px] font-medium cursor-pointer"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, opacity: saving ? 0.7 : 1 }}>
        {['active','suspended','pending'].map(s => {
          const l: Record<string,string> = { active: 'Actif', suspended: 'Suspendu', pending: 'En attente' }
          return <option key={s} value={s}>{l[s]}</option>
        })}
      </select>
      <ChevronDown size={10} style={{ color: cfg.color, position: 'absolute', right: 6, pointerEvents: 'none' }} />
    </div>
  )
}

/* ── Section card ───────────────────────────────────────────────────────── */
function SectionCard({ title, icon: Icon, description, children, accent, scrollable }: {
  title: string; icon: React.ElementType; description?: string
  children: React.ReactNode; accent?: string; scrollable?: boolean
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent ?? '#C41E3A'}18`, border: `1px solid ${accent ?? '#C41E3A'}30` }}>
          <Icon size={15} style={{ color: accent ?? '#C41E3A' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>{title}</h3>
          {description && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
        {scrollable ? (
          <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
            {children}
          </div>
        ) : children}
      </div>
    </section>
  )
}

/* ── Inactivity section (member auto-deactivation) ─────────────────────── */
function InactivitySection({ setting, value, onChange }: {
  setting: Setting | null
  value: unknown
  onChange: (key: string, v: unknown) => void
}) {
  const [running, setRunning] = React.useState(false)
  const days = Number((value ?? setting?.value ?? 30) as number) || 0

  async function runNow() {
    setRunning(true)
    try {
      const res = await runInactivityDeactivation()
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(
          res.suspended === 0
            ? `Aucun membre à suspendre (seuil ${res.days} j).`
            : `${res.suspended} membre${res.suspended > 1 ? 's' : ''} suspendu${res.suspended > 1 ? 's' : ''} (inactivité > ${res.days} j).`
        )
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <SectionCard
      title="Inactivité des membres"
      icon={UserMinus}
      description="Suspension automatique des membres sans opération depuis N jours"
      accent="#F87171"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Seuil d&apos;inactivité (jours)
            </label>
            <input
              type="number"
              min={0}
              max={3650}
              value={String(days)}
              onChange={e => onChange('member_inactivity_days', Number(e.target.value) || 0)}
              className={INPUT}
              style={IS}
              placeholder="30"
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Un membre actif sans dépôt, retrait, prêt ou remboursement depuis ce nombre de jours sera passé en{' '}
              <span style={{ color: '#F87171', fontWeight: 600 }}>Suspendu</span>. Mettez à 0 pour désactiver la règle.
            </p>
          </div>

          <button
            type="button"
            onClick={runNow}
            disabled={running || days <= 0}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: running ? 'rgba(248,113,113,0.18)' : 'rgba(248,113,113,0.12)',
              color: '#F87171',
              border: '1px solid rgba(248,113,113,0.30)',
            }}
          >
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? 'Exécution…' : 'Exécuter maintenant'}
          </button>
        </div>

        <div className="rounded-lg p-3 text-[11px] flex items-start gap-2"
          style={{ background: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.18)', color: 'rgba(255,255,255,0.65)' }}>
          <span style={{ color: '#FCD34D', fontWeight: 700 }}>!</span>
          <span>
            L&apos;exécution manuelle suspend immédiatement les membres concernés.
            Pour une exécution périodique, planifiez l&apos;appel RPC <code style={{ background: 'rgba(0,0,0,0.30)', padding: '0 4px', borderRadius: 3 }}>deactivate_inactive_members</code> côté serveur (cron / edge function).
          </span>
        </div>
      </div>
    </SectionCard>
  )
}

/* ── Tabs ───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'theme',   label: 'Design',    icon: Layout   },
  { id: 'pdf',     label: 'PDF',       icon: FileText },
  { id: 'general', label: 'Général',   icon: Settings },
  { id: 'finance', label: 'Finance',   icon: Settings },
]

/* ── Main export ────────────────────────────────────────────────────────── */
export function ParametresClient({ coop, agents, grouped }: {
  coop: Coop | null; agents: Agent[]; grouped: Record<string, Setting[]>
}) {
  const [tab, setTab] = React.useState('theme')

  // Build initial values map from all settings
  const buildInitial = React.useCallback(() => {
    const map: Record<string, unknown> = {}
    Object.values(grouped).flat().forEach(s => { map[s.key] = s.value })
    return map
  }, [grouped])

  const [original] = React.useState<Record<string, unknown>>(() => buildInitial())
  const [draft, setDraft]     = React.useState<Record<string, unknown>>(() => buildInitial())
  const [saving, setSaving]   = React.useState(false)
  const [saveOk, setSaveOk]   = React.useState(false)
  const [saveErr, setSaveErr] = React.useState<string | null>(null)

  // Check if there are unsaved changes
  const changedKeys = Object.keys(draft).filter(k => draft[k] !== original[k])
  const isDirty = changedKeys.length > 0

  function handleChange(key: string, value: unknown) {
    setSaveOk(false)
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  function handleCancel() {
    setDraft({ ...original })
    setSaveOk(false)
    setSaveErr(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveErr(null)
    setSaveOk(false)
    const results = await Promise.all(
      changedKeys.map(key => updateSetting(key, draft[key]))
    )
    setSaving(false)
    const firstErr = results.find(r => r?.error)
    if (firstErr) { setSaveErr(firstErr.error); return }
    Object.assign(original, draft)
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2500)
  }

  const themeSettings = (grouped['theme'] ?? []) as Setting[]

  return (
    <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full pb-28">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Paramètres</h2>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Configuration avancée de la coopérative</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="flex items-center gap-2 flex-1 justify-center h-8 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: active ? '#C41E3A' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
              }}>
              <t.icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── THEME TAB ── */}
      {tab === 'theme' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Couleurs — scrollable card */}
            <SectionCard
              title="Palette de couleurs"
              icon={Palette}
              description="Personnalisez les couleurs du tableau de bord"
              accent="#8B5CF6"
              scrollable
            >
              {themeSettings.filter(s => s.input_type === 'color').map(s => (
                <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
              ))}
            </SectionCard>

            {/* Aperçu live */}
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Aperçu en temps réel</p>
              <ThemePreview draft={draft} settings={themeSettings} />
              {isDirty && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                  style={{ background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.22)' }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#FCD34D' }} />
                  <p className="text-xs" style={{ color: '#FCD34D' }}>
                    {changedKeys.length} modification{changedKeys.length > 1 ? 's' : ''} non sauvegardée{changedKeys.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interface */}
          <SectionCard title="Interface & Comportement" icon={Layout} description="Espacement, animations et navigation" accent="#60A5FA">
            {themeSettings.filter(s => s.input_type !== 'color').map(s => (
              <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
            ))}
          </SectionCard>
        </div>
      )}

      {/* ── PDF TAB ── */}
      {tab === 'pdf' && (() => {
        const clean = (v: unknown, fallback: string) => String(v ?? fallback).replace(/"/g, '')
        const logoUrl           = clean(draft['pdf_logo_url'],             '')
        const ticketAccent      = clean(draft['ticket_accent_color'],      '#C41E3A')
        const ticketRcv         = clean(draft['ticket_received_color'],    '#22C55E')
        const ticketHeader      = clean(draft['ticket_header_color'],      '#0E0E12')
        const ticketHeaderText  = clean(draft['ticket_header_text_color'], ticketAccent)
        const ticketFooter      = clean(draft['ticket_footer_text'],       'Merci de votre confiance · Conservez ce reçu')
        const rptHeader         = clean(draft['pdf_header_color'],         '#0C0C0E')
        const rptAccent         = clean(draft['pdf_accent_color'],         '#C41E3A')
        const rptText           = clean(draft['pdf_text_color'],           '#111318')
        const footerTxt         = clean(draft['pdf_footer_text'],          '')
        const ticketColors      = (grouped['pdf'] ?? []).filter((s: Setting) => s.key.startsWith('ticket_') && s.input_type === 'color')
        const ticketTexts       = (grouped['pdf'] ?? []).filter((s: Setting) => s.key.startsWith('ticket_') && s.input_type === 'text')
        const reportColors      = (grouped['pdf'] ?? []).filter((s: Setting) => !s.key.startsWith('ticket_') && s.input_type === 'color')

        return (
          <div className="space-y-6">
            {/* Logo */}
            <SectionCard title="Logo de la coopérative" icon={Upload} description="Logo affiché dans l'en-tête des PDF et tickets" accent="#34D399">
              {(grouped['pdf'] ?? []).filter((s: Setting) => s.input_type === 'image').map((s: Setting) => (
                <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
              ))}
            </SectionCard>

            {/* ── Ticket colors + Ticket preview ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Personnalisation du ticket" icon={Palette} description="Couleurs, en-tête, pied de page et logo du ticket de caisse" accent="#8B5CF6">
                {ticketColors.map((s: Setting) => (
                  <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
                ))}
                {ticketTexts.map((s: Setting) => (
                  <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
                ))}
              </SectionCard>
              <div className="space-y-3 flex flex-col">
                <TicketPreview
                  accentColor={ticketAccent}
                  receivedColor={ticketRcv}
                  headerColor={ticketHeader}
                  headerTextColor={ticketHeaderText}
                  footerText={ticketFooter}
                  logoUrl={logoUrl || undefined}
                />
              </div>
            </div>

            {/* ── Report colors + Report preview ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Couleurs des rapports PDF" icon={Palette} description="En-tête, accent et texte pour tous les exports A4" accent="#F59E0B">
                {reportColors.map((s: Setting) => (
                  <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
                ))}
              </SectionCard>
              <div className="space-y-3 flex flex-col">
                <ReportPreview
                  headerColor={rptHeader}
                  accentColor={rptAccent}
                  textColor={rptText}
                  footerText={footerTxt}
                  logoUrl={logoUrl || undefined}
                />
              </div>
            </div>

            {isDirty && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.22)' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#FCD34D' }} />
                <p className="text-xs" style={{ color: '#FCD34D' }}>
                  {changedKeys.length} modification{changedKeys.length > 1 ? 's' : ''} non sauvegardée{changedKeys.length > 1 ? 's' : ''} — cliquez sur Sauvegarder
                </p>
              </div>
            )}

            <SectionCard title="Mise en page & Contenu" icon={FileText} description="Format, marges, pied de page et éléments des PDF" accent="#60A5FA">
              {(grouped['pdf'] ?? []).filter((s: Setting) => s.input_type !== 'color' && s.input_type !== 'image').map((s: Setting) => (
                <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
              ))}
            </SectionCard>
          </div>
        )
      })()}

      {/* ── GENERAL TAB ── */}
      {tab === 'general' && (
        <div className="space-y-6">
          {coop && (
            <SectionCard title="Informations de la coopérative" icon={Settings} description="Nom, adresse et coordonnées officielles" accent="#C41E3A">
              <CoopEditor coop={coop} />
            </SectionCard>
          )}
          <SectionCard title="Agents" icon={Settings} description={`${agents.length} agent${agents.length !== 1 ? 's' : ''} — cliquez sur le statut pour le modifier`} accent="#60A5FA">
            {agents.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: '#C41E3A20', color: '#C41E3A' }}>
                  {a.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>{a.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{a.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F' }}>
                    {ROLE_LABELS[a.role] ?? a.role}
                  </span>
                  <AgentStatusSelect agentId={a.id} current={a.status} />
                </div>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Paramètres généraux" icon={Settings} description="Langue, devise et notifications" accent="#34D399">
            {(grouped['general'] ?? []).map((s: Setting) => (
              <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
            ))}
          </SectionCard>
        </div>
      )}

      {/* ── FINANCE TAB ── */}
      {tab === 'finance' && (
        <div className="space-y-6">
          <SectionCard title="Règles financières" icon={Settings} description="Limites, taux et conditions de prêt" accent="#F59E0B">
            {(grouped['finance'] ?? []).filter((s: Setting) => s.key !== 'member_inactivity_days').map((s: Setting) => (
              <SettingRow key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={handleChange} />
            ))}
          </SectionCard>

          <InactivitySection
            setting={(grouped['finance'] ?? []).find((s: Setting) => s.key === 'member_inactivity_days') ?? null}
            value={draft['member_inactivity_days']}
            onChange={handleChange}
          />
        </div>
      )}

      {/* ── Sticky Save / Cancel bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          transform: isDirty || saveOk ? 'translateY(0)' : 'translateY(100%)',
          opacity:   isDirty || saveOk ? 1 : 0,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-4 shadow-2xl"
            style={{
              background: '#181D27',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.50)',
            }}>

            {/* Status info */}
            <div className="flex items-center gap-3">
              {saveOk ? (
                <>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(74,222,128,0.15)' }}>
                    <Check size={14} style={{ color: '#4ADE80' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#4ADE80' }}>
                    Paramètres sauvegardés avec succès
                  </p>
                </>
              ) : saveErr ? (
                <>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(248,113,113,0.15)' }}>
                    <X size={14} style={{ color: '#F87171' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#F87171' }}>{saveErr}</p>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(252,211,77,0.12)' }}>
                    <Pencil size={13} style={{ color: '#FCD34D' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      Modifications non sauvegardées
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {changedKeys.length} paramètre{changedKeys.length > 1 ? 's' : ''} modifié{changedKeys.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            {!saveOk && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-opacity"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid #3B4260',
                    color: 'rgba(255,255,255,0.70)',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  <RotateCcw size={13} />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold transition-opacity"
                  style={{
                    background: '#C41E3A',
                    color: '#fff',
                    opacity: (saving || !isDirty) ? 0.7 : 1,
                  }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

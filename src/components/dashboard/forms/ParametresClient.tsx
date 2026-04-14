'use client'
import * as React from 'react'
import { Check, Pencil, X, Loader2, ChevronDown, Upload, Palette, Mail, Layout, FileText, Settings } from 'lucide-react'
import { updateSetting, updateCooperative, updateAgentStatus } from '@/app/(dashboard)/tableau-de-bord/parametres/actions'
import { createClient } from '@/lib/supabase/client'

/* ── Constants ──────────────────────────────────────────────────────────── */
const SUPABASE_URL = 'https://ebioqgjyzrhjxxlugzcz.supabase.co'
const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const IS = { background: '#0F1117', border: '1px solid #3B4260', color: 'rgba(255,255,255,0.90)' }
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
]
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; desc: string }> = {
  theme:   { label: 'Thème & Design',          icon: Layout,   desc: 'Personnalisez l\'apparence du tableau de bord' },
  pdf:     { label: 'PDF & Tickets',            icon: FileText, desc: 'Configuration des rapports PDF et tickets de caisse' },
  general: { label: 'Général',                  icon: Settings, desc: 'Paramètres généraux de la coopérative' },
  finance: { label: 'Finance',                  icon: Settings, desc: 'Règles financières et limites' },
  closure: { label: 'Clôture journalière',      icon: Settings, desc: 'Configuration des clôtures et rapports email' },
}

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Setting { key: string; label: string; value: unknown; description?: string; input_type: string; options?: { label: string; value: string }[] | null }
interface Agent   { id: string; name: string; email: string; role: string; status: string }
interface Coop    { id: string; name: string; address?: string; phone?: string }

/* ── Color palette picker ───────────────────────────────────────────────── */
function ColorPicker({ settingKey, current }: { settingKey: string; current: string }) {
  const [val, setVal]       = React.useState(current)
  const [open, setOpen]     = React.useState(false)
  const [custom, setCustom] = React.useState(current)
  const [saving, setSaving] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  async function pick(color: string) {
    const prev = val
    setVal(color)
    setCustom(color)
    setSaving(true)
    try { await updateSetting(settingKey, color) }
    catch { setVal(prev); setCustom(prev) }
    finally { setSaving(false); setOpen(false) }
  }

  async function applyCustom() {
    if (!/^#[0-9A-Fa-f]{6}$/.test(custom)) return
    await pick(custom)
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium transition-colors"
        style={{ background: '#0F1117', border: '1px solid #3B4260', color: 'rgba(255,255,255,0.80)' }}>
        <span className="w-4 h-4 rounded-sm flex-shrink-0 shadow-sm" style={{ background: val }} />
        <span className="font-mono">{val}</span>
        {saving ? <Loader2 size={11} className="animate-spin ml-1" /> : <Palette size={11} className="ml-1 opacity-50" />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 rounded-xl p-4 shadow-2xl w-64"
          style={{ background: '#181D27', border: '1px solid #252A36' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.50)' }}>Palette</p>
          <div className="grid grid-cols-8 gap-1.5 mb-4">
            {PALETTE_COLORS.map(c => (
              <button key={c} type="button" onClick={() => pick(c)}
                className="w-6 h-6 rounded-md transition-transform hover:scale-110 focus:outline-none"
                style={{ background: c, border: val === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.10)' }}
                title={c}
              />
            ))}
          </div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.50)' }}>Couleur personnalisée</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="color"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs"
                style={{ background: '#0F1117', border: '1px solid #3B4260', color: 'rgba(255,255,255,0.70)' }}>
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
  const [url, setUrl]           = React.useState(current)
  const [uploading, setUploading] = React.useState(false)
  const [err, setErr]           = React.useState<string | null>(null)
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
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: '#0F1117', border: '1px solid #252A36' }}>
          <img src={url} alt="Logo" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#0F1117', border: '1px dashed #3B4260' }}>
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
function Toggle({ settingKey, checked }: { settingKey: string; checked: boolean }) {
  const [val, setVal]       = React.useState(checked)
  const [saving, setSaving] = React.useState(false)
  async function toggle() {
    setSaving(true); const next = !val; setVal(next)
    try { await updateSetting(settingKey, next) }
    catch { setVal(!next) } finally { setSaving(false) }
  }
  return (
    <button type="button" onClick={toggle} disabled={saving} role="switch" aria-checked={val}
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors"
      style={{ background: val ? '#C41E3A' : '#252A36', opacity: saving ? 0.7 : 1 }}>
      <span className="inline-block h-4 w-4 rounded-full shadow-sm transition-transform"
        style={{ background: '#fff', transform: val ? 'translateX(24px)' : 'translateX(4px)', marginTop: 4 }} />
    </button>
  )
}

/* ── Select ─────────────────────────────────────────────────────────────── */
function SelectSetting({ settingKey, current, options }: { settingKey: string; current: string; options: { label: string; value: string }[] }) {
  const [val, setVal] = React.useState(current)
  const [saving, setSaving] = React.useState(false)
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value; const prev = val; setVal(next); setSaving(true)
    try { await updateSetting(settingKey, next) }
    catch { setVal(prev) } finally { setSaving(false) }
  }
  return (
    <div className="flex items-center gap-2">
      <select value={val} onChange={handleChange} disabled={saving}
        className="rounded-lg px-3 py-1.5 text-sm outline-none"
        style={{ ...IS, minWidth: 150, opacity: saving ? 0.7 : 1 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {saving && <Loader2 size={12} className="animate-spin" style={{ color: 'rgba(255,255,255,0.35)' }} />}
    </div>
  )
}

/* ── Inline text/number ─────────────────────────────────────────────────── */
function InlineEdit({ settingKey, current, type }: { settingKey: string; current: string | number; type: 'text' | 'number' }) {
  const [editing, setEditing] = React.useState(false)
  const [val, setVal]         = React.useState(String(current))
  const [saved, setSaved]     = React.useState(String(current))
  const [saving, setSaving]   = React.useState(false)
  const [err, setErr]         = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  async function save() {
    if (val === saved) { setEditing(false); return }
    setSaving(true); setErr(null)
    try { await updateSetting(settingKey, type === 'number' ? Number(val) : val); setSaved(val); setEditing(false) }
    catch (e: any) { setErr(e.message) } finally { setSaving(false) }
  }
  if (!editing) return (
    <button type="button" onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 group rounded px-2 py-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
      <span className="font-mono text-sm">{saved}</span>
      <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type={type} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(saved); setEditing(false) } }}
        className="rounded-lg px-3 py-1.5 text-sm outline-none"
        style={{ ...IS, width: type === 'number' ? 100 : 220 }} />
      <button type="button" onClick={save} disabled={saving} className="rounded p-1 hover:bg-green-500/10" style={{ color: '#4ADE80' }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button type="button" onClick={() => { setVal(saved); setEditing(false) }} className="rounded p-1 hover:bg-red-500/10" style={{ color: '#F87171' }}>
        <X size={13} />
      </button>
      {err && <span className="text-xs" style={{ color: '#F87171' }}>{err}</span>}
    </div>
  )
}

/* ── Email input (special styled) ───────────────────────────────────────── */
function EmailSetting({ settingKey, current, placeholder }: { settingKey: string; current: string; placeholder?: string }) {
  const [editing, setEditing] = React.useState(false)
  const [val, setVal]         = React.useState(current)
  const [saved, setSaved]     = React.useState(current)
  const [saving, setSaving]   = React.useState(false)
  const [err, setErr]         = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  async function save() {
    if (val === saved) { setEditing(false); return }
    setSaving(true); setErr(null)
    try { await updateSetting(settingKey, val); setSaved(val); setEditing(false) }
    catch (e: any) { setErr(e.message) } finally { setSaving(false) }
  }
  if (!editing) return (
    <button type="button" onClick={() => setEditing(true)}
      className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs group transition-colors"
      style={{ background: '#0F1117', border: '1px solid #252A36', color: saved ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)' }}>
      <Mail size={12} style={{ color: '#C41E3A', flexShrink: 0 }} />
      <span className="font-mono">{saved || placeholder || 'non défini'}</span>
      <Pencil size={10} className="ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#C41E3A' }} />
        <input ref={inputRef} type="email" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(saved); setEditing(false) } }}
          placeholder={placeholder}
          className="rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none"
          style={{ ...IS, width: 260 }} />
      </div>
      <button type="button" onClick={save} disabled={saving} className="rounded p-1 hover:bg-green-500/10" style={{ color: '#4ADE80' }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button type="button" onClick={() => { setVal(saved); setEditing(false) }} className="rounded p-1 hover:bg-red-500/10" style={{ color: '#F87171' }}>
        <X size={13} />
      </button>
      {err && <span className="text-xs" style={{ color: '#F87171' }}>{err}</span>}
    </div>
  )
}

/* ── Setting row ────────────────────────────────────────────────────────── */
function SettingRow({ s }: { s: Setting }) {
  const rawVal = s.value
  const isEmail = s.key.includes('email') && s.input_type === 'text'

  function renderControl() {
    if (s.input_type === 'toggle')  return <Toggle settingKey={s.key} checked={Boolean(rawVal)} />
    if (s.input_type === 'color')   return <ColorPicker settingKey={s.key} current={String(rawVal)} />
    if (s.input_type === 'image')   return <LogoUpload settingKey={s.key} current={String(rawVal)} />
    if (s.input_type === 'select' && s.options) return <SelectSetting settingKey={s.key} current={String(rawVal)} options={s.options} />
    if (s.input_type === 'number')  return <InlineEdit settingKey={s.key} current={Number(rawVal)} type="number" />
    if (isEmail)                    return <EmailSetting settingKey={s.key} current={String(rawVal)} placeholder="email@exemple.com" />
    return <InlineEdit settingKey={s.key} current={String(rawVal)} type="text" />
  }

  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5"
      style={{ borderTop: '1px solid #1a1f2e' }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>{s.label}</p>
        {s.description && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{s.description}</p>}
      </div>
      <div className="flex-shrink-0">{renderControl()}</div>
    </div>
  )
}

/* ── Theme preview card ─────────────────────────────────────────────────── */
function ThemePreview({ settings }: { settings: Setting[] }) {
  const get = (key: string) => String(settings.find(s => s.key === key)?.value ?? '')
  const brand   = get('brand_color')   || '#C41E3A'
  const sidebar = get('sidebar_bg')    || '#0C0C0E'
  const surface = get('surface_color') || '#111318'
  const border  = get('border_color')  || '#252A36'

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}`, maxWidth: 380 }}>
      <div className="flex">
        {/* Mini sidebar */}
        <div className="w-10 flex flex-col items-center py-3 gap-2" style={{ background: sidebar }}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: brand }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: '#fff' }} />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-5 h-1 rounded-full" style={{ background: i === 0 ? brand : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-3 space-y-2">
          <div className="flex gap-2">
            {['#4ADE80','#60A5FA',brand].map((c, i) => (
              <div key={i} className="flex-1 rounded-lg px-2 py-1.5" style={{ background: sidebar, border: `1px solid ${border}` }}>
                <div className="h-1.5 rounded-full w-8 mb-1" style={{ background: c }} />
                <div className="h-1 rounded-full w-5" style={{ background: 'rgba(255,255,255,0.12)' }} />
              </div>
            ))}
          </div>
          <div className="rounded-lg p-2" style={{ background: sidebar, border: `1px solid ${border}` }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i === 0 ? brand : 'rgba(255,255,255,0.15)' }} />
                <div className="h-1 rounded-full flex-1" style={{ background: 'rgba(255,255,255,0.10)' }} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="rounded-lg px-3 py-1 text-[9px] font-bold" style={{ background: brand, color: '#fff' }}>Action</div>
          </div>
        </div>
      </div>
      <div className="px-3 py-1.5 text-[9px] font-medium" style={{ borderTop: `1px solid ${border}`, color: 'rgba(255,255,255,0.30)' }}>
        Aperçu en temps réel
      </div>
    </div>
  )
}

/* ── Coop editor ────────────────────────────────────────────────────────── */
function CoopEditor({ coop }: { coop: { id: string; name: string; address?: string; phone?: string } }) {
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving]   = React.useState(false)
  const [err, setErr]         = React.useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setErr(null)
    try { await updateCooperative(new FormData(e.currentTarget)); setEditing(false) }
    catch (ex: any) { setErr(ex.message) } finally { setSaving(false) }
  }
  if (!editing) return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: '#1a1f2e' }}>
        {[{ label: 'Nom', value: coop.name },{ label: 'Adresse', value: coop.address ?? '—' },{ label: 'Téléphone', value: coop.phone ?? '—' }].map(f => (
          <div key={f.label} className="px-5 py-4" style={{ borderColor: '#1a1f2e' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.label}</p>
            <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.value}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 flex justify-end" style={{ borderTop: '1px solid #1a1f2e' }}>
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
          <input name="name" required defaultValue={coop.name} className={`${INPUT}`} style={IS} /></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Adresse</label>
          <input name="address" defaultValue={coop.address ?? ''} className={`${INPUT}`} style={IS} /></div>
        <div><label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Téléphone</label>
          <input name="phone" defaultValue={coop.phone ?? ''} className={`${INPUT}`} style={IS} /></div>
      </div>
      {err && <p className="text-xs" style={{ color: '#F87171' }}>{err}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => { setEditing(false); setErr(null) }}
          className="h-8 px-3 rounded-lg text-xs font-medium"
          style={{ border: '1px solid #252A36', color: 'rgba(255,255,255,0.55)', background: 'transparent' }}>Annuler</button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium"
          style={{ background: '#C41E3A', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving && <Loader2 size={12} className="animate-spin" />} Enregistrer</button>
      </div>
    </form>
  )
}

/* ── Agent status ───────────────────────────────────────────────────────── */
function AgentStatusSelect({ agentId, current }: { agentId: string; current: string }) {
  const [val, setVal]       = React.useState(current)
  const [saving, setSaving] = React.useState(false)
  const cfg = STATUS_CFG[val] ?? STATUS_CFG.pending
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value; const prev = val; setVal(next); setSaving(true)
    try { await updateAgentStatus(agentId, next) }
    catch { setVal(prev) } finally { setSaving(false) }
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
function SectionCard({ title, icon: Icon, description, children, accent }: {
  title: string; icon: React.ElementType; description?: string
  children: React.ReactNode; accent?: string
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
      <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #252A36' }}>
        {children}
      </div>
    </section>
  )
}

/* ── Tabs ───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'theme',   label: 'Design',    icon: Layout   },
  { id: 'pdf',     label: 'PDF',       icon: FileText },
  { id: 'general', label: 'Général',   icon: Settings },
  { id: 'finance', label: 'Finance',   icon: Settings },
  { id: 'closure', label: 'Clôture',   icon: Mail     },
]

/* ── Main export ────────────────────────────────────────────────────────── */
export function ParametresClient({ coop, agents, grouped }: {
  coop: Coop | null; agents: Agent[]; grouped: Record<string, Setting[]>
}) {
  const [tab, setTab] = React.useState('theme')
  const themeSettings = (grouped['theme'] ?? []) as Setting[]

  return (
    <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Paramètres</h2>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Configuration avancée de la coopérative</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#111318', border: '1px solid #252A36' }}>
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
            {/* Couleurs */}
            <SectionCard title="Palette de couleurs" icon={Palette} description="Personnalisez les couleurs du tableau de bord" accent="#8B5CF6">
              {themeSettings.filter(s => s.input_type === 'color').map(s => (
                <SettingRow key={s.key} s={s} />
              ))}
            </SectionCard>

            {/* Aperçu live */}
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Aperçu en temps réel</p>
              <ThemePreview settings={themeSettings} />
            </div>
          </div>

          {/* Interface */}
          <SectionCard title="Interface & Comportement" icon={Layout} description="Espacement, animations et navigation" accent="#60A5FA">
            {themeSettings.filter(s => s.input_type !== 'color').map(s => (
              <SettingRow key={s.key} s={s} />
            ))}
          </SectionCard>
        </div>
      )}

      {/* ── PDF TAB ── */}
      {tab === 'pdf' && (
        <div className="space-y-6">
          {/* Logo */}
          <SectionCard title="Logo de la coopérative" icon={Upload} description="Logo affiché sur les PDF et tickets de caisse" accent="#34D399">
            {(grouped['pdf'] ?? []).filter((s: Setting) => s.input_type === 'image').map((s: Setting) => (
              <SettingRow key={s.key} s={s} />
            ))}
          </SectionCard>

          {/* Couleurs PDF */}
          <SectionCard title="Couleurs du rapport" icon={Palette} description="Personnalisez les couleurs de vos exports PDF" accent="#8B5CF6">
            {(grouped['pdf'] ?? []).filter((s: Setting) => s.input_type === 'color').map((s: Setting) => (
              <SettingRow key={s.key} s={s} />
            ))}
          </SectionCard>

          {/* Autres settings PDF */}
          <SectionCard title="Mise en page & Contenu" icon={FileText} description="Format, marges et éléments des PDF" accent="#F59E0B">
            {(grouped['pdf'] ?? []).filter((s: Setting) => s.input_type !== 'color' && s.input_type !== 'image').map((s: Setting) => (
              <SettingRow key={s.key} s={s} />
            ))}
          </SectionCard>
        </div>
      )}

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
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderTop: '1px solid #1a1f2e' }}>
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
            {(grouped['general'] ?? []).map((s: Setting) => <SettingRow key={s.key} s={s} />)}
          </SectionCard>
        </div>
      )}

      {/* ── FINANCE TAB ── */}
      {tab === 'finance' && (
        <SectionCard title="Règles financières" icon={Settings} description="Limites, taux et conditions de prêt" accent="#F59E0B">
          {(grouped['finance'] ?? []).map((s: Setting) => <SettingRow key={s.key} s={s} />)}
        </SectionCard>
      )}

      {/* ── CLOSURE TAB ── */}
      {tab === 'closure' && (
        <div className="space-y-6">
          <SectionCard title="Rapports de clôture par email" icon={Mail} description="Configurez les destinataires des rapports journaliers" accent="#60A5FA">
            {(grouped['closure'] ?? []).filter((s: Setting) => s.key.includes('email') || s.key.includes('subject')).map((s: Setting) => (
              <SettingRow key={s.key} s={s} />
            ))}
          </SectionCard>
          <SectionCard title="Règles de clôture" icon={Settings} description="Automatisation et verrouillage des clôtures" accent="#C41E3A">
            {(grouped['closure'] ?? []).filter((s: Setting) => !s.key.includes('email') && !s.key.includes('subject')).map((s: Setting) => (
              <SettingRow key={s.key} s={s} />
            ))}
          </SectionCard>
        </div>
      )}
    </div>
  )
}

'use client'
import * as React from 'react'
import { Check, Pencil, X, Loader2, ChevronDown } from 'lucide-react'
import { updateSetting, updateCooperative, updateAgentStatus } from '@/app/(dashboard)/tableau-de-bord/parametres/actions'

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Setting {
  key: string; label: string; value: unknown
  description?: string; input_type: string
  options?: { label: string; value: string }[] | null
}
interface Agent { id: string; name: string; email: string; role: string; status: string }
interface Coop  { id: string; name: string; address?: string; phone?: string }

const INPUT_BASE = 'rounded-lg px-3 py-1.5 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: '#0F1117', border: '1px solid #3B4260', color: 'rgba(255,255,255,0.90)' }
const ROLE_LABELS: Record<string, string> = { admin: 'Admin', manager: 'Manager', cashier: 'Caissier' }
const AGENT_STATUSES = ['active', 'suspended', 'pending']
const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  active:    { color: '#4ADE80', bg: 'rgba(34,197,94,0.12)'   },
  suspended: { color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
  pending:   { color: '#FCD34D', bg: 'rgba(234,179,8,0.12)'   },
}

/* ── Toggle switch ──────────────────────────────────────────────────────── */
function Toggle({ settingKey, checked }: { settingKey: string; checked: boolean }) {
  const [val, setVal]       = React.useState(checked)
  const [saving, setSaving] = React.useState(false)

  async function toggle() {
    setSaving(true)
    const next = !val
    setVal(next)
    try { await updateSetting(settingKey, next) }
    catch { setVal(!next) }
    finally { setSaving(false) }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      aria-checked={val}
      role="switch"
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none"
      style={{
        background: val ? '#C41E3A' : '#252A36',
        opacity: saving ? 0.7 : 1,
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full shadow-sm transition-transform"
        style={{
          background: '#fff',
          transform: val ? 'translateX(24px)' : 'translateX(4px)',
          marginTop: 4,
        }}
      />
    </button>
  )
}

/* ── Select setting ─────────────────────────────────────────────────────── */
function SelectSetting({ settingKey, current, options }: {
  settingKey: string; current: string
  options: { label: string; value: string }[]
}) {
  const [val, setVal]       = React.useState(current)
  const [saving, setSaving] = React.useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    const prev = val
    setVal(next)
    setSaving(true)
    try { await updateSetting(settingKey, next) }
    catch { setVal(prev) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={val}
        onChange={handleChange}
        disabled={saving}
        className={INPUT_BASE}
        style={{ ...INPUT_STYLE, minWidth: 140, opacity: saving ? 0.7 : 1 }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {saving && <Loader2 size={13} className="animate-spin" style={{ color: 'rgba(255,255,255,0.35)' }} />}
    </div>
  )
}

/* ── Text / number inline edit ──────────────────────────────────────────── */
function InlineEdit({ settingKey, current, type }: {
  settingKey: string; current: string | number; type: 'text' | 'number'
}) {
  const [editing, setEditing]   = React.useState(false)
  const [val, setVal]           = React.useState(String(current))
  const [saved, setSaved]       = React.useState(String(current))
  const [saving, setSaving]     = React.useState(false)
  const [err, setErr]           = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  async function save() {
    if (val === saved) { setEditing(false); return }
    setSaving(true); setErr(null)
    try {
      const parsed = type === 'number' ? Number(val) : val
      await updateSetting(settingKey, parsed)
      setSaved(val)
      setEditing(false)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  function cancel() { setVal(saved); setEditing(false); setErr(null) }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 group rounded px-2 py-1 transition-colors"
        style={{ color: 'rgba(255,255,255,0.75)' }}
        title="Cliquer pour modifier"
      >
        <span className="font-mono text-sm">{saved}</span>
        <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        className={INPUT_BASE}
        style={{ ...INPUT_STYLE, width: type === 'number' ? 90 : 200 }}
      />
      <button type="button" onClick={save} disabled={saving}
        className="rounded p-1 transition-colors hover:bg-green-500/10"
        style={{ color: '#4ADE80' }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button type="button" onClick={cancel}
        className="rounded p-1 transition-colors hover:bg-red-500/10"
        style={{ color: '#F87171' }}>
        <X size={13} />
      </button>
      {err && <span className="text-xs" style={{ color: '#F87171' }}>{err}</span>}
    </div>
  )
}

/* ── Setting row ────────────────────────────────────────────────────────── */
function SettingRow({ s }: { s: Setting }) {
  function renderControl() {
    const rawVal = s.value
    if (s.input_type === 'toggle') {
      return <Toggle settingKey={s.key} checked={Boolean(rawVal)} />
    }
    if (s.input_type === 'select' && s.options) {
      return <SelectSetting settingKey={s.key} current={String(rawVal)} options={s.options} />
    }
    if (s.input_type === 'number') {
      return <InlineEdit settingKey={s.key} current={Number(rawVal)} type="number" />
    }
    return <InlineEdit settingKey={s.key} current={String(rawVal)} type="text" />
  }

  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5"
      style={{ borderTop: '1px solid #1a1f2e' }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>{s.label}</p>
        {s.description && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{s.description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{renderControl()}</div>
    </div>
  )
}

/* ── Cooperative editor ─────────────────────────────────────────────────── */
function CoopEditor({ coop }: { coop: Coop }) {
  const [editing, setEditing]   = React.useState(false)
  const [saving, setSaving]     = React.useState(false)
  const [err, setErr]           = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setErr(null)
    try {
      await updateCooperative(new FormData(e.currentTarget))
      setEditing(false)
    } catch (ex: any) {
      setErr(ex.message)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
        style={{ borderColor: '#252A36' } as React.CSSProperties}>
        {[
          { label: 'Nom',       value: coop.name },
          { label: 'Adresse',   value: coop.address ?? '—' },
          { label: 'Téléphone', value: coop.phone ?? '—' },
        ].map(f => (
          <div key={f.label} className="px-5 py-4" style={{ borderColor: '#252A36' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.label}</p>
            <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.value}</p>
          </div>
        ))}
        <div className="px-5 py-4 flex items-center sm:col-span-3 justify-end" style={{ borderColor: '#252A36', borderTop: '1px solid #252A36' }}>
          <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F', border: '1px solid rgba(196,30,58,0.25)' }}>
            <Pencil size={12} />
            Modifier
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Nom *</label>
          <input name="name" required defaultValue={coop.name}
            className={`${INPUT_BASE} w-full`} style={INPUT_STYLE} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Adresse</label>
          <input name="address" defaultValue={coop.address ?? ''}
            className={`${INPUT_BASE} w-full`} style={INPUT_STYLE} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Téléphone</label>
          <input name="phone" defaultValue={coop.phone ?? ''}
            className={`${INPUT_BASE} w-full`} style={INPUT_STYLE} />
        </div>
      </div>
      {err && <p className="text-xs" style={{ color: '#F87171' }}>{err}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => { setEditing(false); setErr(null) }}
          className="h-8 px-3 rounded-lg text-xs font-medium"
          style={{ border: '1px solid #252A36', color: 'rgba(255,255,255,0.55)', background: 'transparent' }}>
          Annuler
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium"
          style={{ background: '#C41E3A', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving && <Loader2 size={12} className="animate-spin" />}
          Enregistrer
        </button>
      </div>
    </form>
  )
}

/* ── Agent status selector ──────────────────────────────────────────────── */
function AgentStatusSelect({ agentId, current }: { agentId: string; current: string }) {
  const [val, setVal]       = React.useState(current)
  const [saving, setSaving] = React.useState(false)
  const cfg = STATUS_CFG[val] ?? STATUS_CFG.pending

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    const prev = val
    setVal(next)
    setSaving(true)
    try { await updateAgentStatus(agentId, next) }
    catch { setVal(prev) }
    finally { setSaving(false) }
  }

  return (
    <div className="relative flex items-center gap-1">
      <select
        value={val}
        onChange={handleChange}
        disabled={saving}
        className="appearance-none rounded-full pl-2 pr-6 py-0.5 text-[11px] font-medium cursor-pointer"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, opacity: saving ? 0.7 : 1 }}
      >
        {AGENT_STATUSES.map(s => {
          const labels: Record<string,string> = { active: 'Actif', suspended: 'Suspendu', pending: 'En attente' }
          return <option key={s} value={s}>{labels[s] ?? s}</option>
        })}
      </select>
      <ChevronDown size={10} style={{ color: cfg.color, position: 'absolute', right: 6, pointerEvents: 'none' }} />
    </div>
  )
}

/* ── Main export ────────────────────────────────────────────────────────── */
export function ParametresClient({
  coop, agents, grouped,
}: {
  coop: Coop | null
  agents: Agent[]
  grouped: Record<string, Setting[]>
}) {
  const CATEGORY_LABELS: Record<string, string> = {
    general:  'Général',
    finance:  'Finance',
    closure:  'Clôture journalière',
    pdf:      'PDF & Tickets',
  }

  return (
    <div className="px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Paramètres</h2>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Configuration de la coopérative et gestion des agents
        </p>
      </div>

      {/* Cooperative */}
      {coop && (
        <section aria-label="Informations coopérative">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>Coopérative</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #252A36' }}>
            <CoopEditor coop={coop} />
          </div>
        </section>
      )}

      {/* Agents */}
      <section aria-label="Agents">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
          Agents ({agents.length})
        </h3>
        <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #252A36' }}>
          <div className="divide-y">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderTop: '1px solid #1a1f2e' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: '#C41E3A20', color: '#C41E3A' }} aria-hidden="true">
                  {a.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>{a.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{a.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F' }}>
                    {ROLE_LABELS[a.role] ?? a.role}
                  </span>
                  <AgentStatusSelect agentId={a.id} current={a.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App settings by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} aria-label={`Paramètres : ${category}`}>
          <h3 className="text-sm font-semibold mb-3 capitalize" style={{ color: 'rgba(255,255,255,0.80)' }}>
            {CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')}
          </h3>
          <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #252A36' }}>
            {(items as Setting[]).map((s) => (
              <SettingRow key={s.key} s={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

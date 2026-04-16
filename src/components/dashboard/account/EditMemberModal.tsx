'use client'
import * as React from 'react'
import { Pencil, X, Loader2, Check } from 'lucide-react'
import { updateMember } from '@/app/(dashboard)/tableau-de-bord/membres/actions'

const INPUT  = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: '#0F1117', border: '1px solid #252A36', color: 'rgba(255,255,255,0.85)' }
const LABEL  = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

export interface MemberData {
  id: string
  first_name: string
  last_name: string
  member_number: string
  birth_date: string | null
  phone: string | null
  email: string | null
  address: string | null
  profession: string | null
}

interface Props {
  member: MemberData
}

export function EditMemberModal({ member }: Props) {
  const [open, setOpen]       = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError]     = React.useState<string | null>(null)
  const formRef               = React.useRef<HTMLFormElement>(null)

  // Local state for each field (pre-filled)
  const [firstName,   setFirstName]   = React.useState(member.first_name)
  const [lastName,    setLastName]    = React.useState(member.last_name)
  const [memberNum,   setMemberNum]   = React.useState(member.member_number)
  const [birthDate,   setBirthDate]   = React.useState(member.birth_date   ?? '')
  const [phone,       setPhone]       = React.useState(member.phone        ?? '')
  const [email,       setEmail]       = React.useState(member.email        ?? '')
  const [address,     setAddress]     = React.useState(member.address      ?? '')
  const [profession,  setProfession]  = React.useState(member.profession   ?? '')

  function handleOpen() {
    // Reset to latest saved values every time modal opens
    setFirstName(member.first_name)
    setLastName(member.last_name)
    setMemberNum(member.member_number)
    setBirthDate(member.birth_date   ?? '')
    setPhone(member.phone            ?? '')
    setEmail(member.email            ?? '')
    setAddress(member.address        ?? '')
    setProfession(member.profession  ?? '')
    setError(null)
    setSuccess(false)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(false)
    const result = await updateMember(member.id, new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) { setError(result.error); return }
    setSuccess(true)
    // auto-close after short delay
    setTimeout(() => setOpen(false), 900)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid #252A36', color: 'rgba(255,255,255,0.75)' }}
      >
        <Pencil size={13} />
        Modifier le profil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#111318', border: '1px solid #252A36' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1a1f2e' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(196,30,58,0.15)' }}>
                  <Pencil size={13} style={{ color: '#C41E3A' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    Modifier le profil
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {member.first_name} {member.last_name} · {member.member_number}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.40)' }}>
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit}
              className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">

              {/* Prénom / Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Prénom *</label>
                  <input
                    name="first_name" required
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                    className={INPUT} style={INPUT_STYLE}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Nom *</label>
                  <input
                    name="last_name" required
                    value={lastName} onChange={e => setLastName(e.target.value)}
                    className={INPUT} style={INPUT_STYLE}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* N° Membre / Date de naissance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>N° Membre *</label>
                  <input
                    name="member_number" required
                    value={memberNum} onChange={e => setMemberNum(e.target.value)}
                    className={INPUT} style={INPUT_STYLE}
                    placeholder="MBR-001"
                  />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Date de naissance</label>
                  <input
                    name="birth_date" type="date"
                    value={birthDate} onChange={e => setBirthDate(e.target.value)}
                    className={INPUT} style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Téléphone / Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Téléphone</label>
                  <input
                    name="phone" type="tel"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    className={INPUT} style={INPUT_STYLE}
                    placeholder="+509 XXXX XXXX"
                  />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Email</label>
                  <input
                    name="email" type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className={INPUT} style={INPUT_STYLE}
                    placeholder="jean@example.com"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Adresse</label>
                <input
                  name="address"
                  value={address} onChange={e => setAddress(e.target.value)}
                  className={INPUT} style={INPUT_STYLE}
                  placeholder="Port-au-Prince, Haïti"
                />
              </div>

              {/* Profession */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Profession</label>
                <input
                  name="profession"
                  value={profession} onChange={e => setProfession(e.target.value)}
                  className={INPUT} style={INPUT_STYLE}
                  placeholder="Commerçant"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {error}
                </p>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                  <Check size={13} />
                  Profil mis à jour avec succès
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid #252A36', color: 'rgba(255,255,255,0.55)' }}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending || success}
                  className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: (pending || success) ? 0.7 : 1 }}
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  {success  && <Check  size={13} />}
                  {pending ? 'Enregistrement…' : success ? 'Enregistré' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

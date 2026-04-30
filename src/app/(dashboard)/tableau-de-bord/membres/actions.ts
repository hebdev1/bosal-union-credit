'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications/inapp'

export async function updateMember(
  memberId: string,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  const payload = {
    first_name:    (formData.get('first_name')  as string).trim(),
    last_name:     (formData.get('last_name')   as string).trim(),
    birth_date:    (formData.get('birth_date')  as string) || null,
    phone:         (formData.get('phone')       as string) || null,
    email:         (formData.get('email')       as string) || null,
    address:       (formData.get('address')     as string) || null,
    profession:    (formData.get('profession')  as string) || null,
    member_number: (formData.get('member_number') as string).trim(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('members')
    .update(payload)
    .eq('id', memberId)
    .eq('cooperative_id', agent.cooperative_id)

  if (error) {
    if (error.code === '23505') return { error: 'Ce numéro de membre est déjà utilisé.' }
    return { error: error.message }
  }

  await logAudit({
    action: 'member.update',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'members',
    targetId: memberId,
    metadata: { member_number: payload.member_number },
  })

  revalidatePath('/tableau-de-bord/membres')
  revalidatePath('/tableau-de-bord/comptes')
  revalidatePath('/tableau-de-bord/comptes/[id]', 'page')
  revalidatePath(`/tableau-de-bord/membres/${memberId}`)
  return null
}

export async function updateMemberStatus(
  memberId: string,
  status: 'active' | 'suspended' | 'closed' | 'pending',
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id, role').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // Only admin / manager may change member status
  if (!['admin', 'manager'].includes(String(agent.role))) {
    return { error: 'Action réservée aux administrateurs et gestionnaires.' }
  }

  const allowed = ['active', 'suspended', 'closed', 'pending']
  if (!allowed.includes(status)) return { error: 'Statut invalide' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: previous } = await (supabase as any)
    .from('members').select('status, member_number').eq('id', memberId)
    .eq('cooperative_id', agent.cooperative_id).single()
  if (!previous) return { error: 'Membre introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('members')
    .update({ status })
    .eq('id', memberId)
    .eq('cooperative_id', agent.cooperative_id)

  if (error) return { error: error.message }

  await logAudit({
    action: 'member.status_change',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'members',
    targetId: memberId,
    metadata: { from: previous.status, to: status, member_number: previous.member_number },
  })

  revalidatePath('/tableau-de-bord/membres')
  revalidatePath(`/tableau-de-bord/membres/${memberId}`)
  return null
}

export async function createMember(formData: FormData): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  const payload = {
    cooperative_id: agent.cooperative_id,
    member_number:  (formData.get('member_number') as string).trim(),
    first_name:     (formData.get('first_name') as string).trim(),
    last_name:      (formData.get('last_name') as string).trim(),
    birth_date:     formData.get('birth_date') as string,
    phone:          (formData.get('phone') as string) || null,
    email:          (formData.get('email') as string) || null,
    address:        (formData.get('address') as string) || null,
    profession:     (formData.get('profession') as string) || null,
    status:         'active',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (supabase as any)
    .from('members')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Ce numéro de membre existe déjà. Veuillez en choisir un autre.' }
    return { error: error.message }
  }

  await logAudit({
    action: 'member.create',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'members',
    targetId: inserted?.id,
    metadata: { member_number: payload.member_number, name: `${payload.first_name} ${payload.last_name}` },
  })

  // Welcome notification
  if (inserted?.id) {
    await createNotification({
      cooperativeId: agent.cooperative_id,
      memberId: inserted.id,
      type: 'member_created',
      message: `Bienvenue ${payload.first_name} ${payload.last_name} ! Votre compte membre ${payload.member_number} a été créé.`,
    })
  }

  revalidatePath('/tableau-de-bord/membres')
  return null
}

/* ─── Manually recompute a member's credit score ─────────────────────────── */
/**
 * Wraps the SQL `refresh_member_credit_score(uuid)` function so the dashboard
 * can offer a "Recalculer" button. Triggers keep the score live automatically;
 * this is for the rare case where the operator wants to force-refresh.
 */
export async function recalcMemberCreditScore(
  memberId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // Verify the member belongs to the agent's cooperative
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (supabase as any)
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  if (!member) return { error: 'Membre introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('refresh_member_credit_score', {
    p_member_id: memberId,
  })
  if (error) return { error: error.message }

  revalidatePath(`/tableau-de-bord/membres/${memberId}`)
  revalidatePath(`/tableau-de-bord/emprunteurs/${memberId}`)
  return { ok: true }
}

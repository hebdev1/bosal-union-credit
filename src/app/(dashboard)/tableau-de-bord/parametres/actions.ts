'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

export async function updateSetting(
  key: string,
  value: unknown,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('app_settings')
    .update({ value })
    .eq('key', key)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}

export async function updateCooperative(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('cooperatives')
    .update({
      name:    (formData.get('name') as string).trim(),
      address: (formData.get('address') as string) || null,
      phone:   (formData.get('phone') as string) || null,
    })
    .eq('id', agent.cooperative_id)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}

export async function updateAgentStatus(
  id: string,
  status: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('agents')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}

/**
 * Suspends every active member who has had no activity (transactions, loans
 * or repayments) within the configured `member_inactivity_days` window.
 * Returns the number of members actually suspended, or an error.
 */
export async function runInactivityDeactivation(): Promise<{ error: string } | { suspended: number; days: number }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id, role').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  if (!['admin', 'manager'].includes(String(agent.role))) {
    return { error: 'Action réservée aux administrateurs et gestionnaires.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: setting } = await (supabase as any)
    .from('app_settings')
    .select('value')
    .eq('cooperative_id', agent.cooperative_id)
    .eq('key', 'member_inactivity_days')
    .maybeSingle()

  const days = Number(setting?.value ?? 30)
  if (!Number.isFinite(days) || days <= 0) {
    return { error: 'Seuil d\'inactivité non défini ou désactivé (0).' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('deactivate_inactive_members', {
    p_cooperative_id: agent.cooperative_id,
    p_days: days,
  })

  if (error) return { error: error.message }

  const suspended = Number(data ?? 0)

  await logAudit({
    action: 'members.bulk_suspend_inactive',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'members',
    metadata: { days, suspended },
  })

  revalidatePath('/tableau-de-bord/membres')
  revalidatePath('/tableau-de-bord/parametres')
  return { suspended, days }
}

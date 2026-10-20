'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { getCurrentAgent, isManager } from '@/lib/auth/agent'
import type { Json } from '@/types/database'

/** Agent statuses an admin can set from the settings page. */
const AGENT_STATUSES = ['active', 'suspended', 'pending'] as const

export async function updateSetting(
  key: string,
  value: unknown,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }
  // Settings include the four-eyes thresholds and the inactivity rule: a
  // cashier must not be able to change them.
  if (!isManager(agent.role)) {
    return { error: 'Seul un administrateur ou un gérant peut modifier les paramètres.' }
  }
  if (typeof key !== 'string' || key.length === 0 || key.length > 100) {
    return { error: 'Paramètre invalide.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (supabase as any)
    .from('app_settings')
    .update({ value })
    .eq('cooperative_id', agent.cooperative_id)
    .eq('key', key)
    .select('key')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: `Paramètre « ${key} » introuvable.` }

  await logAudit({
    action: 'settings.update',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'app_settings',
    metadata: { key, value: (value ?? null) as Json },
  })

  revalidatePath('/tableau-de-bord/parametres')
  return null
}

export async function updateCooperative(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }
  if (agent.role !== 'admin') {
    return { error: 'Seul un administrateur peut modifier la coopérative.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Le nom est obligatoire.' }

  const changes = {
    name,
    address: String(formData.get('address') ?? '').trim() || null,
    phone:   String(formData.get('phone') ?? '').trim() || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (supabase as any)
    .from('cooperatives')
    .update(changes)
    .eq('id', agent.cooperative_id)
    .select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: 'Modification refusée.' }

  await logAudit({
    action: 'cooperative.update',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'cooperatives',
    targetId: agent.cooperative_id,
    metadata: changes,
  })

  revalidatePath('/tableau-de-bord/parametres')
  return null
}

export async function updateAgentStatus(
  id: string,
  status: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }
  if (agent.role !== 'admin') {
    return { error: 'Seul un administrateur peut changer le statut d’un agent.' }
  }
  if (!(AGENT_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Statut invalide.' }
  }
  if (id === agent.id) {
    return { error: 'Vous ne pouvez pas changer votre propre statut.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (supabase as any)
    .from('agents')
    .update({ status })
    .eq('id', id)
    .eq('cooperative_id', agent.cooperative_id)
    .select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: 'Agent introuvable dans cette coopérative.' }

  await logAudit({
    action: 'agent.status_change',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'agents',
    targetId: id,
    metadata: { status },
  })

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

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  if (!isManager(agent.role)) {
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

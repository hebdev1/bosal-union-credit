/**
 * Current agent lookup for server actions.
 *
 * RLS already scopes every table to the caller's cooperative and hides
 * suspended/closed agents (get_my_cooperative()), so a null result means
 * "not an active agent". Role checks still belong in the action so it can
 * return a clear error; the database enforces the same rules again
 * (role-scoped policies and the trg_guard_* triggers) for direct API calls.
 */

import type { createClient } from '@/lib/supabase/server'

type ServerClient = Awaited<ReturnType<typeof createClient>>

export type AgentRole = 'admin' | 'manager' | 'cashier'

export interface CurrentAgent {
  id:             string
  cooperative_id: string
  role:           AgentRole
  name:           string | null
}

/**
 * @param options.throwOnError  Throw when the agents query itself fails
 *   (database or network error) instead of returning null. The dashboard
 *   layout uses it so an outage shows the error page rather than telling an
 *   active agent that their access was revoked.
 */
export async function getCurrentAgent(
  supabase: ServerClient,
  options: { throwOnError?: boolean } = {},
): Promise<CurrentAgent | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, cooperative_id, role, name, status')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    if (options.throwOnError) throw new Error(`Lecture du profil agent impossible : ${error.message}`)
    return null
  }
  if (!agent || !agent.cooperative_id) return null
  if (agent.status === 'suspended' || agent.status === 'closed') return null

  return {
    id:             agent.id,
    cooperative_id: agent.cooperative_id,
    role:           agent.role as AgentRole,
    name:           agent.name ?? null,
  }
}

/** Admins and managers run back-office operations (rates, settings, loans, closures). */
export function isManager(role: AgentRole): boolean {
  return role === 'admin' || role === 'manager'
}

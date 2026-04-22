import { createClient } from '@/lib/supabase/server'

/**
 * Returns the ISO timestamp of the last session closure for the current
 * agent's cooperative. The dashboard uses this as a cut-off so that, right
 * after a clôture, only new-session activity is displayed. Historical
 * activity remains accessible from the rapports page.
 *
 * Returns null when no closing has ever been recorded (fresh install or
 * first-ever session) — callers should treat null as "no filter".
 */
export async function getCurrentSessionStart(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lastClosed } = await (supabase as any)
    .from('daily_closings')
    .select('closed_at')
    .eq('cooperative_id', agent.cooperative_id)
    .eq('status', 'closed')
    .not('closed_at', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return lastClosed?.closed_at ?? null
}

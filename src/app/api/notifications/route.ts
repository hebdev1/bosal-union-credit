/**
 * GET /api/notifications — liste des 20 dernières notifications de la coop
 * de l'agent connecté.
 *
 * POST /api/notifications/read — { id?: string }
 *   - Avec id  : marque cette notif comme lue
 *   - Sans id  : marque toutes les notifs de la coop comme lues
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('cooperative_id')
    .eq('id', user.id)
    .single()
  if (!agent) return NextResponse.json({ error: 'no-agent' }, { status: 403 })

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, message, sent_at, read_at')
    .eq('cooperative_id', agent.cooperative_id)
    .order('sent_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unreadCount = (data ?? []).filter((n) => !n.read_at).length
  return NextResponse.json({ items: data ?? [], unreadCount })
}

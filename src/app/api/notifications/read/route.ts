import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('cooperative_id')
    .eq('id', user.id)
    .single()
  if (!agent) return NextResponse.json({ error: 'no-agent' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as { id?: string }
  const readAt = new Date().toISOString()

  const q = supabase
    .from('notifications')
    .update({ read_at: readAt })
    .eq('cooperative_id', agent.cooperative_id)
    .is('read_at', null)

  const { error } = body.id ? await q.eq('id', body.id) : await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

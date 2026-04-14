import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { ParametresClient } from '@/components/dashboard/forms/ParametresClient'

export const metadata: Metadata = { title: 'Paramètres' }

export default async function ParametresPage() {
  const supabase = await createClient()

  const [settingsRes, agentsRes, coopRes] = await Promise.allSettled([
    supabase.from('app_settings').select('category, key, label, value, description, input_type, options').order('category').order('key'),
    supabase.from('agents').select('id, name, role, email, phone, status').order('role'),
    supabase.from('cooperatives').select('id, name, address, phone').limit(1).single(),
  ])

  const settings = settingsRes.status === 'fulfilled' ? (settingsRes.value.data ?? []) : []
  const agents   = agentsRes.status === 'fulfilled'   ? (agentsRes.value.data ?? [])   : []
  const coop     = coopRes.status === 'fulfilled'     ? (coopRes.value.data as any)     : null

  const grouped = (settings as any[]).reduce((acc: Record<string, any[]>, s: any) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <>
      <Header title="Paramètres" />
      <ParametresClient
        coop={coop}
        agents={agents as any[]}
        grouped={grouped}
      />
    </>
  )
}

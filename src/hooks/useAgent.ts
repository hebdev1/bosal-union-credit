'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Agent {
  id: string
  cooperative_id: string
  role: string
  name: string
  email: string
  phone?: string | null
  status?: string
}

export function useAgent() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchAgent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('agents')
        .select('id, cooperative_id, role, name, email, phone, status')
        .eq('id', user.id)
        .single()

      setAgent(data ?? null)
      setLoading(false)
    }

    fetchAgent()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchAgent()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { agent, loading }
}

'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createAccount(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: agent, error: agentErr } = await supabase
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (agentErr || !agent) throw new Error('Agent introuvable')

  const { error } = await supabase.from('accounts').insert({
    cooperative_id: agent.cooperative_id,
    member_id:      formData.get('member_id') as string,
    account_number: (formData.get('account_number') as string).trim(),
    account_type:   formData.get('account_type') as string,
    currency:       formData.get('currency') as string,
    balance:        Number(formData.get('balance') ?? 0),
    status:         'active',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/tableau-de-bord/comptes')
}

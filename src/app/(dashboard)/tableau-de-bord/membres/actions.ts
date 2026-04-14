'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createMember(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: agent, error: agentErr } = await supabase
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (agentErr || !agent) throw new Error('Agent introuvable')

  const { error } = await supabase.from('members').insert({
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
  })

  if (error) throw new Error(error.message)
  revalidatePath('/tableau-de-bord/membres')
}

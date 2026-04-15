'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createMember(formData: FormData): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('members').insert({
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

  if (error) {
    if (error.code === '23505') return { error: 'Ce numéro de membre existe déjà. Veuillez en choisir un autre.' }
    return { error: error.message }
  }
  revalidatePath('/tableau-de-bord/membres')
  return null
}

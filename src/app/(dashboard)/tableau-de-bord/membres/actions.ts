'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateMember(
  memberId: string,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Verify the agent belongs to the same cooperative as the member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('members')
    .update({
      first_name:    (formData.get('first_name')  as string).trim(),
      last_name:     (formData.get('last_name')   as string).trim(),
      birth_date:    (formData.get('birth_date')  as string) || null,
      phone:         (formData.get('phone')       as string) || null,
      email:         (formData.get('email')       as string) || null,
      address:       (formData.get('address')     as string) || null,
      profession:    (formData.get('profession')  as string) || null,
      member_number: (formData.get('member_number') as string).trim(),
    })
    .eq('id', memberId)
    .eq('cooperative_id', agent.cooperative_id)

  if (error) {
    if (error.code === '23505') return { error: 'Ce numéro de membre est déjà utilisé.' }
    return { error: error.message }
  }

  revalidatePath('/tableau-de-bord/membres')
  revalidatePath('/tableau-de-bord/comptes')
  // Revalidate any account profile that shows this member
  revalidatePath('/tableau-de-bord/comptes/[id]', 'page')
  return null
}

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

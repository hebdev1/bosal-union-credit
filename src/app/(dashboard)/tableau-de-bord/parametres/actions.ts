'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateSetting(key: string, value: unknown) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('app_settings')
    .update({ value })
    .eq('key', key)
  if (error) throw new Error(error.message)
  revalidatePath('/tableau-de-bord/parametres')
}

export async function updateCooperative(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) throw new Error('Agent introuvable')

  const { error } = await (supabase as any)
    .from('cooperatives')
    .update({
      name:    (formData.get('name') as string).trim(),
      address: (formData.get('address') as string) || null,
      phone:   (formData.get('phone') as string) || null,
    })
    .eq('id', agent.cooperative_id)
  if (error) throw new Error(error.message)
  revalidatePath('/tableau-de-bord/parametres')
}

export async function updateAgentStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('agents')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/tableau-de-bord/parametres')
}

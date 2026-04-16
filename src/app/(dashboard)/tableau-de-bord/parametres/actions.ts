'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateSetting(
  key: string,
  value: unknown,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('app_settings')
    .update({ value })
    .eq('key', key)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}

export async function updateCooperative(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('cooperatives')
    .update({
      name:    (formData.get('name') as string).trim(),
      address: (formData.get('address') as string) || null,
      phone:   (formData.get('phone') as string) || null,
    })
    .eq('id', agent.cooperative_id)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}

export async function updateAgentStatus(
  id: string,
  status: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('agents')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}

/**
 * Notifications in-app — lecture/écriture sur la table `notifications`.
 * Fonctions serveur (server actions / RSC) utilisant le client Supabase SSR.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type NotificationRow = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export type NotificationType =
  | 'loan_approved'
  | 'loan_due'
  | 'loan_late'
  | 'exchange_receipt'
  | 'daily_closing'
  | 'fraud_alert'
  | 'member_created'
  | 'password_reset'
  | 'generic'

/**
 * Créer une notification in-app pour un membre.
 * À appeler depuis une server action après une opération métier.
 */
export async function createNotification(input: {
  cooperativeId: string
  memberId: string
  type: NotificationType
  message: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      cooperative_id: input.cooperativeId,
      member_id: input.memberId,
      type: input.type,
      message: input.message,
      sent_at: new Date().toISOString(),
    } satisfies NotificationInsert)
    .select()
    .single()
  return { data, error }
}

/** Liste les notifications récentes d'un membre (non lues en premier). */
export async function listNotifications(memberId: string, limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, message, sent_at, read_at, cooperative_id, member_id')
    .eq('member_id', memberId)
    .order('read_at', { ascending: true, nullsFirst: true })
    .order('sent_at', { ascending: false })
    .limit(limit)
  return { data: (data ?? []) as NotificationRow[], error }
}

/** Compte les non-lus d'un membre. */
export async function countUnread(memberId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .is('read_at', null)
  return count ?? 0
}

/** Marque une notification comme lue. */
export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
  return { error }
}

/** Marque toutes les notifications d'un membre comme lues. */
export async function markAllAsRead(memberId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('member_id', memberId)
    .is('read_at', null)
  return { error }
}

/**
 * Audit trail — écriture structurée dans la table audit_logs.
 *
 * Les triggers DB côté Supabase loggent déjà les CRUD de base.
 * Ce helper sert pour les événements METIER (approbations, clôtures,
 * changements de rôle, reset mdp, connexion suspecte, etc.) qui ne
 * passent pas toujours par un INSERT/UPDATE direct.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database'

export type AuditAction =
  | 'loan.approve'
  | 'loan.reject'
  | 'loan.disburse'
  | 'loan.restructure'
  | 'loan.writeoff'
  | 'loan.repayment'
  | 'loan.adjust'
  | 'account.open'
  | 'account.close'
  | 'account.freeze'
  | 'account.unfreeze'
  | 'exchange.create'
  | 'exchange.cancel'
  | 'cash.closure.open'
  | 'cash.closure.close'
  | 'cash.transfer'
  | 'member.create'
  | 'member.update'
  | 'member.status_change'
  | 'member.kyc.approve'
  | 'member.kyc.reject'
  | 'members.bulk_suspend_inactive'
  | 'role.grant'
  | 'role.revoke'
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.password.reset'
  | 'settings.update'
  | 'fraud.flag.resolve'
  | 'fraud.flag.dismiss'

type AuditLogsInsert = Database['public']['Tables']['audit_logs']['Insert']

export interface AuditEvent {
  action: AuditAction
  cooperativeId: string
  userId?: string | null
  targetTable?: string
  targetId?: string
  metadata?: Record<string, Json | undefined>
}

/**
 * Enregistre un événement d'audit.
 * Doit être appelé depuis une server action ou un handler serveur.
 * En cas d'échec d'écriture, on log sans bloquer l'action métier
 * (l'audit ne doit jamais casser un flux critique).
 */
export async function logAudit(event: AuditEvent): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const insert: AuditLogsInsert = {
      action: event.action,
      cooperative_id: event.cooperativeId,
      user_id: event.userId ?? null,
      target_table: event.targetTable ?? null,
      target_id: event.targetId ?? null,
      metadata: (event.metadata ?? {}) as Json,
    }

    const { error } = await supabase.from('audit_logs').insert(insert)
    if (error) {
      console.warn('[audit]', event.action, error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    console.warn('[audit]', event.action, msg)
    return { ok: false, error: msg }
  }
}

/**
 * Helper : liste les derniers événements d'audit d'une coop
 * (pour la page admin /parametres/audit).
 */
export async function listAuditEvents(cooperativeId: string, limit = 100) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, user_id, target_table, target_id, metadata, created_at')
    .eq('cooperative_id', cooperativeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ?? [], error }
}

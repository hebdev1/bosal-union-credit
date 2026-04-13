'use client'

import { useAgent } from './useAgent'

export type AgentRole = 'admin' | 'manager' | 'cashier'

export type Permission =
  | 'members:read'    | 'members:write'
  | 'accounts:read'   | 'accounts:write'
  | 'transactions:read' | 'transactions:write'
  | 'loans:read'      | 'loans:write'       | 'loans:disburse'
  | 'exchange:read'   | 'exchange:write'    | 'exchange:rates'
  | 'vault:read'      | 'vault:close'
  | 'shares:read'     | 'dividends:read'
  | 'fraud:read'      | 'fraud:resolve'
  | 'agents:read'     | 'agents:write'
  | 'reports:read'
  | 'settings:read'   | 'settings:write'

const ROLE_PERMISSIONS: Record<AgentRole, Permission[]> = {
  admin: [
    'members:read',     'members:write',
    'accounts:read',    'accounts:write',
    'transactions:read','transactions:write',
    'loans:read',       'loans:write',       'loans:disburse',
    'exchange:read',    'exchange:write',    'exchange:rates',
    'vault:read',       'vault:close',
    'shares:read',      'dividends:read',
    'fraud:read',       'fraud:resolve',
    'agents:read',      'agents:write',
    'reports:read',
    'settings:read',    'settings:write',
  ],
  manager: [
    'members:read',     'members:write',
    'accounts:read',    'accounts:write',
    'transactions:read','transactions:write',
    'loans:read',       'loans:write',       'loans:disburse',
    'exchange:read',    'exchange:write',    'exchange:rates',
    'vault:read',
    'shares:read',      'dividends:read',
    'fraud:read',
    'agents:read',
    'reports:read',
    'settings:read',
  ],
  cashier: [
    'members:read',
    'accounts:read',
    'transactions:read','transactions:write',
    'loans:read',
    'exchange:read',    'exchange:write',
    'vault:read',
  ],
}

export function usePermissions() {
  const { agent } = useAgent()
  const role = agent?.role as AgentRole | undefined

  return {
    can: (permission: Permission): boolean =>
      role ? (ROLE_PERMISSIONS[role]?.includes(permission) ?? false) : false,
    canAny: (permissions: Permission[]): boolean =>
      permissions.some((p) =>
        role ? (ROLE_PERMISSIONS[role]?.includes(p) ?? false) : false
      ),
    canAll: (permissions: Permission[]): boolean =>
      permissions.every((p) =>
        role ? (ROLE_PERMISSIONS[role]?.includes(p) ?? false) : false
      ),
    role,
    isAdmin:   role === 'admin',
    isManager: role === 'manager',
    isCashier: role === 'cashier',
  }
}

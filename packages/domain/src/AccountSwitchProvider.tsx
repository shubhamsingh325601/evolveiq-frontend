import type { ReactNode } from 'react';
import { AccountSwitchContext, type AccountSwitchState } from './account-switch-context';

export interface AccountSwitchProviderProps {
  value: AccountSwitchState;
  children: ReactNode;
}

/** Offers the accounts in `value` in the account menu of every screen below it. */
export function AccountSwitchProvider({ value, children }: AccountSwitchProviderProps) {
  return <AccountSwitchContext.Provider value={value}>{children}</AccountSwitchContext.Provider>;
}

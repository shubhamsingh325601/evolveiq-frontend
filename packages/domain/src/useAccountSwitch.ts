import { useContext } from 'react';
import { AccountSwitchContext, type AccountSwitchState } from './account-switch-context';

/**
 * The only place `useContext(AccountSwitchContext)` is called. Null outside an
 * `AccountSwitchProvider`, which is how an app runs on its own: no switching.
 */
export function useAccountSwitch(): AccountSwitchState | null {
  return useContext(AccountSwitchContext);
}

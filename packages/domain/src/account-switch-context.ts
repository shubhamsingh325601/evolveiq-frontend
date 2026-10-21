import { createContext } from 'react';
import type { IconComponent } from '@evolveiq/ui';

export interface SwitchableAccount {
  id: string;
  /** What the person switches to, e.g. "Counsellor". */
  label: string;
  /** Who that is, e.g. "Dr. Anand Mehta". */
  detail?: string;
  icon?: IconComponent;
}

/**
 * Accounts the signed-in person may switch to from their account menu. Only a
 * shell that offers switching provides this — the combined test build does,
 * for staff roles — so the three apps never know switching exists.
 */
export interface AccountSwitchState {
  /** The heading over them in the account menu, e.g. "Switch role". */
  title: string;
  /** Empty when this person may not switch, such as a parent or a student. */
  accounts: SwitchableAccount[];
  /** The account in use, when it is one of them. */
  currentId?: string;
  switchTo: (accountId: string) => void;
}

export const AccountSwitchContext = createContext<AccountSwitchState | null>(null);

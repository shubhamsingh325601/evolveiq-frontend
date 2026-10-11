import type { User } from '@evolveiq/api-client';
import { Badge } from '@evolveiq/ui';

export interface AccountStatusBadgeProps {
  user: Pick<User, 'isActive'>;
}

/** Whether an account can sign in. Accounts are switched off, never deleted. */
export function AccountStatusBadge({ user }: AccountStatusBadgeProps) {
  return user.isActive ? <Badge tone="growth">Active</Badge> : <Badge tone="neutral">Switched off</Badge>;
}

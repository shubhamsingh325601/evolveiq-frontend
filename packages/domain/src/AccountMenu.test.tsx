import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountMenu } from './AccountMenu';

describe('AccountMenu', () => {
  it('shows who is signed in and signs them out', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    render(<AccountMenu userName="Priya Ahluwalia" roleLabel="Parent" onSignOut={onSignOut} />);

    expect(screen.queryByText('Parent')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByText('Priya Ahluwalia')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Parent')).not.toBeInTheDocument();
  });

  it('closes on Escape without signing out', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    render(<AccountMenu userName="Sunita Rao" roleLabel="Teacher" onSignOut={onSignOut} />);

    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute('aria-expanded', 'false');
    expect(onSignOut).not.toHaveBeenCalled();
  });
});

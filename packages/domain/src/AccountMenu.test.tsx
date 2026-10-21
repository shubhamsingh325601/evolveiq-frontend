import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

  it('lists what the app passes — a parent’s children — and marks the one on screen', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AccountMenu
          userName="Priya Ahluwalia"
          roleLabel="Parent"
          onSignOut={vi.fn()}
          sections={[
            {
              title: 'Your children',
              items: [
                { id: 'stu-arjun', label: 'Arjun Ahluwalia', to: '/parent/children/stu-arjun', isCurrent: true },
                { id: 'stu-maya', label: 'Maya Ahluwalia', detail: '2 stars', to: '/parent/children/stu-maya' },
              ],
            },
          ]}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByText('Your children')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Arjun Ahluwalia/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Maya Ahluwalia/ })).toHaveAttribute('href', '/parent/children/stu-maya');
    expect(screen.getByText('2 stars')).toBeInTheDocument();
  });

  it('runs an item’s action and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <AccountMenu
        userName="Sunita Rao"
        roleLabel="Teacher"
        onSignOut={vi.fn()}
        sections={[
          {
            title: 'Switch role',
            items: [
              { id: 'teacher', label: 'Teacher', isCurrent: true },
              { id: 'counsellor', label: 'Counsellor', detail: 'Dr. Anand Mehta', onSelect },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByRole('button', { name: /^Teacher/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Counsellor/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Switch role')).not.toBeInTheDocument();
  });
});

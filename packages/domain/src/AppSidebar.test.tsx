import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppSidebar } from './AppSidebar';

describe('AppSidebar', () => {
  it('renders whatever menu the app passes for the signed-in role', () => {
    render(
      <MemoryRouter initialEntries={['/review-queue']}>
        <AppSidebar
          appName="EvolvIQ"
          roleLabel="Psychologist"
          userName="Dr. Anand Mehta"
          onSignOut={vi.fn()}
          sections={[
            {
              items: [
                { label: 'Review queue', to: '/review-queue', badge: 4 },
                { label: 'Activity library', to: '/activities' },
              ],
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Psychologist')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review queue/ })).toHaveAttribute(
      'href',
      '/review-queue',
    );
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('marks the current route as the active link', () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AppSidebar
          appName="EvolvIQ"
          roleLabel="Psychologist"
          userName="Dr. Anand Mehta"
          onSignOut={vi.fn()}
          sections={[
            {
              items: [
                { label: 'Review queue', to: '/review-queue' },
                { label: 'Activity library', to: '/activities' },
              ],
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Activity library' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('signs the user out', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    render(
      <MemoryRouter>
        <AppSidebar
          appName="EvolvIQ"
          roleLabel="Parent"
          userName="Priya Ahluwalia"
          onSignOut={onSignOut}
          sections={[{ items: [{ label: 'My children', to: '/parent/children' }] }]}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});

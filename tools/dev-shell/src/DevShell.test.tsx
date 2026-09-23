import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueryClient, resetMockStore } from '@evolveiq/api-client';
import { AuthProvider } from '@evolveiq/auth';
import { DevShell } from './DevShell';

function renderShell() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <DevShell />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dev shell', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('offers every role, grouped by the app that serves it', async () => {
    renderShell();

    expect(
      await screen.findByRole('heading', { name: 'Open the product as anyone' }),
    ).toBeInTheDocument();

    for (const group of ['Family web app', 'School web app', 'Admin panel']) {
      expect(screen.getByRole('heading', { name: group })).toBeInTheDocument();
    }
    for (const role of [
      'Parent',
      'Student',
      'Teacher',
      'Psychologist',
      'School admin',
      'Platform admin',
    ]) {
      expect(screen.getByText(role)).toBeInTheDocument();
    }
  });

  it('opens the family app on the parent’s home screen', async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByRole('heading', { name: 'Open the product as anyone' });

    await user.click(screen.getByRole('button', { name: /Priya Ahluwalia/ }));

    expect(await screen.findByRole('heading', { name: 'My children' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
  });

  it('opens the school app on the review queue for a psychologist', async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByRole('heading', { name: 'Open the product as anyone' });

    await user.click(screen.getByRole('button', { name: /Dr. Anand Mehta/ }));

    expect(await screen.findByRole('heading', { name: 'Review queue' })).toBeInTheDocument();
  });

  it('opens the admin panel for a platform admin', async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByRole('heading', { name: 'Open the product as anyone' });

    await user.click(screen.getByRole('button', { name: /Tunde Oyelaran/ }));

    expect(await screen.findByRole('heading', { name: 'Schools' })).toBeInTheDocument();
  });

  it('switches from one role straight to another', async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByRole('heading', { name: 'Open the product as anyone' });

    await user.click(screen.getByRole('button', { name: /Sunita Rao/ }));
    expect(await screen.findByRole('heading', { name: 'My students' })).toBeInTheDocument();
    // Scoped to the switcher: "Teacher" also appears as the sidebar's role label.
    expect(screen.getByText(/Viewing as/).textContent).toContain('Teacher');

    await user.click(screen.getByRole('button', { name: 'Switch role' }));
    await screen.findByRole('heading', { name: 'Open the product as anyone' });

    await user.click(screen.getByRole('button', { name: /Clara Fernandes/ }));
    expect(await screen.findByRole('heading', { name: 'Students' })).toBeInTheDocument();
  });

  it('shows which role is being viewed while an app is mounted', async () => {
    const user = userEvent.setup();
    renderShell();
    await screen.findByRole('heading', { name: 'Open the product as anyone' });

    await user.click(screen.getByRole('button', { name: /Maya Ahluwalia/ }));

    await screen.findByRole('heading', { name: /Hello, Maya/ });
    expect(screen.getByText(/Viewing as/)).toBeInTheDocument();
  });
});

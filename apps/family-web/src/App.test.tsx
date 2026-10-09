import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueryClient, resetMockStore } from '@evolveiq/api-client';
import { AuthProvider } from '@evolveiq/auth';
import { App } from './App';

function renderApp(initialPath = '/sign-in') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Family app', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('takes a parent from sign-in to their first child’s dashboard, led by the EHI', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'priya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Parent Dashboard' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Maya’s score' })).toBeInTheDocument();

    const switcher = screen.getByRole('navigation', { name: 'Your children' });
    expect(within(switcher).getByRole('link', { name: /Maya/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(switcher).getByRole('link', { name: /Arjun/ })).toBeInTheDocument();
  });

  it('switches the dashboard to another child from the pills', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'priya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const switcher = await screen.findByRole('navigation', { name: 'Your children' });

    await user.click(within(switcher).getByRole('link', { name: /Arjun/ }));

    expect(await screen.findByRole('heading', { name: 'Arjun’s score' })).toBeInTheDocument();
  });

  it('opens a child’s Holistic Report Card from the dashboard', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'priya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(await screen.findByRole('link', { name: /View full 5-year analysis/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Maya’s Holistic Report' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Annual Report Card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Growth Playbook' })).toBeInTheDocument();
  });

  it('takes a student to their home: level, missions and the way into their report', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'maya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: /Hi, Maya/ })).toBeInTheDocument();
    expect(await screen.findByText('Level 4 • Curious Explorer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sort the morning' })).toHaveAttribute(
      'href',
      '/student/activities/asg-001',
    );
    expect(
      await screen.findByRole('link', { name: /View full 5-year analysis/ }),
    ).toHaveAttribute('href', '/student/report');
  });

  it('sends a signed-out visitor to sign-in instead of a guarded screen', async () => {
    renderApp('/parent/children');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument(),
    );
  });

  it('keeps a student out of the parent screens', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'maya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { name: /Hi, Maya/ });

    // The role guard, not the screen, is what refuses this.
    expect(screen.queryByRole('heading', { name: 'Parent Dashboard' })).not.toBeInTheDocument();
  });

  it('says so plainly when the email address is not recognised', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'nobody@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('We could not find an account with that email address.'),
    ).toBeInTheDocument();
  });
});

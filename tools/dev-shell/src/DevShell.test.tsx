import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueryClient, DEMO_PASSWORD, resetMockStore } from '@evolveiq/api-client';
import { AuthProvider } from '@evolveiq/auth';
import { DevShell } from './DevShell';

function renderShell(initialPath = '/') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <DevShell />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openSignIn() {
  const user = userEvent.setup();
  renderShell();
  await screen.findByRole('heading', { name: 'Sign in' });
  return user;
}

/** Signs in with one tap on the test account named for `role`. */
async function signInWithTestAccount(user: ReturnType<typeof userEvent.setup>, role: RegExp) {
  const accounts = screen.getByRole('list', { name: 'Test accounts' });
  await user.click(within(accounts).getByRole('button', { name: role }));
}

/**
 * Opens the account menu and returns queries scoped to its panel. The rail's
 * menu and the phone header's are both in the page under jsdom.
 */
async function openAccountMenu(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getAllByRole('button', { name: /^Account/ })[0]!;
  await user.click(trigger);
  return within(document.getElementById(trigger.getAttribute('aria-controls')!)!);
}

describe('Combined build', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('opens on one sign-in, with a test account for every role named by the role', async () => {
    await openSignIn();

    const accounts = screen.getByRole('list', { name: 'Test accounts' });
    for (const role of ['Parent', 'Student', 'Teacher', 'Counsellor', 'School admin', 'Platform admin']) {
      expect(within(accounts).getByRole('button', { name: new RegExp(`^${role}`) })).toBeInTheDocument();
    }
  });

  it('signs a teacher in with their own email and password, and opens the school app', async () => {
    const user = await openSignIn();

    await user.type(screen.getByLabelText('Email address'), 'rao@school.test');
    await user.type(screen.getByLabelText('Password'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'My students' })).toBeInTheDocument();
  });

  it('signs a student in with their ID and PIN', async () => {
    const user = await openSignIn();

    await user.click(screen.getByRole('tab', { name: 'Student' }));
    await user.type(screen.getByLabelText('Student ID'), 'RV-1001');
    await user.type(screen.getByLabelText('PIN'), '246810');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: /Hi, Maya/ })).toBeInTheDocument();
  });

  it('opens the parent’s home from the Parent test account, with no floating role switcher', async () => {
    const user = await openSignIn();

    await signInWithTestAccount(user, /^Parent/);

    expect(await screen.findByRole('heading', { name: 'Parent Dashboard' })).toBeInTheDocument();
    expect(await screen.findByText('Review Arjun’s progress and pending tasks.')).toBeInTheDocument();
    expect(screen.queryByText(/Viewing as/)).not.toBeInTheDocument();
  });

  it('lets a parent switch between their children from the account menu, but never switch roles', async () => {
    const user = await openSignIn();
    await signInWithTestAccount(user, /^Parent/);
    await screen.findByText('Review Arjun’s progress and pending tasks.');

    const menu = await openAccountMenu(user);
    expect(menu.queryByText('Switch role')).not.toBeInTheDocument();
    expect(menu.getByText('Your children')).toBeInTheDocument();
    expect(menu.getByRole('link', { name: /Arjun Ahluwalia/ })).toHaveAttribute('aria-current', 'page');
    await user.click(menu.getByRole('link', { name: /Maya Ahluwalia/ }));

    expect(await screen.findByText('Review Maya’s progress and pending tasks.')).toBeInTheDocument();
  });

  it('never offers a student a role switch', async () => {
    const user = await openSignIn();
    await signInWithTestAccount(user, /^Student/);
    await screen.findByRole('heading', { name: /Hi, Maya/ });

    const menu = await openAccountMenu(user);

    expect(menu.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(menu.queryByText('Switch role')).not.toBeInTheDocument();
  });

  it('lets staff switch role from the account menu', async () => {
    const user = await openSignIn();
    await signInWithTestAccount(user, /^Teacher/);
    await screen.findByRole('heading', { name: 'My students' });

    const menu = await openAccountMenu(user);
    expect(menu.getByText('Switch role')).toBeInTheDocument();
    expect(menu.getByRole('button', { name: /^Teacher/ })).toBeDisabled();
    await user.click(menu.getByRole('button', { name: /^Counsellor/ }));

    expect(await screen.findByRole('heading', { name: 'Review queue' })).toBeInTheDocument();
    expect(screen.getAllByText('Counsellor').length).toBeGreaterThan(0);
  });

  it('opens the admin panel for a platform admin', async () => {
    const user = await openSignIn();

    await signInWithTestAccount(user, /^Platform admin/);

    expect(await screen.findByRole('heading', { name: 'Schools' })).toBeInTheDocument();
  });

  it('signs out back to the sign-in', async () => {
    const user = await openSignIn();
    await signInWithTestAccount(user, /^Counsellor/);
    await screen.findByRole('heading', { name: 'Review queue' });

    const menu = await openAccountMenu(user);
    await user.click(menu.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('never shows the next person what the last person loaded', async () => {
    const user = await openSignIn();

    // Sunita's class list holds only her own classes, 4B and 3A.
    await signInWithTestAccount(user, /^Teacher/);
    await screen.findByRole('heading', { name: 'My students' });
    await screen.findByText('Maya Ahluwalia');
    const menu = await openAccountMenu(user);
    await user.click(menu.getByRole('button', { name: /^School admin/ }));

    // The school admin asks for the same list and must get the whole school's.
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getAllByRole('link', { name: /Classes/ })[0]!);

    // Served from Sunita's cache, Ritu Kapoor's class would be missing.
    expect(await screen.findByText('5C')).toBeInTheDocument();
  });
});

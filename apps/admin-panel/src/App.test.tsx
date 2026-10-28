import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueryClient, DEMO_PASSWORD, resetMockStore } from '@evolveiq/api-client';
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

async function signInAs(email: string) {
  const user = userEvent.setup();
  renderApp();
  await user.type(screen.getByLabelText('Email address'), email);
  await user.type(screen.getByLabelText('Password'), DEMO_PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

describe('Admin panel', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('takes a school admin to the students of their school', async () => {
    await signInAs('clara@school.test');

    expect(await screen.findByRole('heading', { name: 'Students' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
    // Halden Grove's students belong to another school.
    expect(screen.queryByText('Zoe Pinto')).not.toBeInTheDocument();
  });

  it('adds a student with a student ID, a PIN and a class', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByText('Maya Ahluwalia');

    await user.click(screen.getByRole('button', { name: 'Add a student' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a student' });
    await user.type(within(dialog).getByLabelText(/Full name/), 'Rhea Kulkarni');
    await user.type(within(dialog).getByLabelText(/Student ID/), 'RV-1099');
    await user.type(within(dialog).getByLabelText(/^PIN/), '135790');
    await user.selectOptions(within(dialog).getByLabelText(/Class/), 'cls-3a');
    await user.click(within(dialog).getByRole('button', { name: 'Add student' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const row = (await screen.findByText('Rhea Kulkarni')).closest('tr')!;
    expect(within(row).getByText('ID RV-1099')).toBeInTheDocument();
    expect(await within(row).findByText('3A')).toBeInTheDocument();
  });

  it('checks the fields before saving', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByText('Maya Ahluwalia');

    await user.click(screen.getByRole('button', { name: 'Add a student' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a student' });
    await user.type(within(dialog).getByLabelText(/^PIN/), '123');
    await user.click(within(dialog).getByRole('button', { name: 'Add student' }));

    expect(await within(dialog).findByText('Full name is needed')).toBeInTheDocument();
    expect(within(dialog).getByText('Use exactly 6 digits')).toBeInTheDocument();
  });

  it('switches a teacher’s account off, and back on', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByText('Maya Ahluwalia');

    await user.click(screen.getAllByRole('link', { name: /Teachers/ })[0]!);
    const row = (await screen.findByText('Ritu Kapoor')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Switch off' }));

    expect(await within(row).findByText('Switched off')).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: 'Switch on' }));
    expect(await within(row).findByText('Active')).toBeInTheDocument();
  });

  it('takes a platform admin to the school list instead', async () => {
    await signInAs('tunde@evolveiq.test');

    expect(await screen.findByRole('heading', { name: 'Schools' })).toBeInTheDocument();
    expect(await screen.findByText('Ridgeview Primary')).toBeInTheDocument();
    expect(screen.getByText('Halden Grove School')).toBeInTheDocument();
  });

  it('lets a platform admin create a teacher in a chosen school', async () => {
    const user = await signInAs('tunde@evolveiq.test');
    await screen.findByText('Ridgeview Primary');

    await user.click(screen.getAllByRole('link', { name: /People/ })[0]!);
    await user.click(await screen.findByRole('button', { name: 'Add an account' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add an account' });
    await user.type(within(dialog).getByLabelText(/Full name/), 'Asha Pillai');
    await user.type(within(dialog).getByLabelText(/Email address/), 'asha@halden.test');
    await user.type(within(dialog).getByLabelText(/^Password/), 'A-good-password-1');
    await user.selectOptions(within(dialog).getByLabelText(/School/), 'sch-halden');
    await user.click(within(dialog).getByRole('button', { name: 'Create account' }));

    const row = (await screen.findByText('Asha Pillai')).closest('tr')!;
    expect(within(row).getByText('Teacher')).toBeInTheDocument();
    expect(await within(row).findByText('Halden Grove School')).toBeInTheDocument();
  });

  it('shows a school admin CRM integration as coming soon, with their real counts and nothing to press', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByText('Maya Ahluwalia');

    await user.click(screen.getAllByRole('link', { name: /CRM integration/ })[0]!);

    expect(await screen.findByRole('heading', { name: 'CRM integration', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(1);
    expect(screen.getByText('API keys and webhooks')).toBeInTheDocument();
    // Ridgeview's seven students, counted from the list the school already has.
    const studentsTile = screen.getByText('At your school today').parentElement!;
    expect(await within(studentsTile).findByText('7')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
  });

  it('keeps CRM integration to school admins', async () => {
    await signInAs('tunde@evolveiq.test');
    await screen.findByRole('heading', { name: 'Schools' });

    expect(screen.queryByRole('link', { name: /CRM integration/ })).not.toBeInTheDocument();
  });

  it('sends a signed-out visitor to sign-in', async () => {
    renderApp('/platform/schools');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument());
  });
});

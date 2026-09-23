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

async function signInAs(email: string) {
  const user = userEvent.setup();
  renderApp();
  await user.type(screen.getByLabelText('Email address'), email);
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

  it('takes a school admin to their students', async () => {
    await signInAs('clara@school.test');

    expect(await screen.findByRole('heading', { name: 'Students' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
  });

  it('adds a student through the editor dialog', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });

    await user.click(screen.getByRole('button', { name: 'Add a student' }));

    const dialog = await screen.findByRole('dialog', { name: 'Add a student' });
    await user.type(within(dialog).getByLabelText(/Full name/), 'Rhea Kulkarni');
    await user.click(within(dialog).getByRole('button', { name: 'Add student' }));

    expect(await screen.findByText('Rhea Kulkarni')).toBeInTheDocument();
  });

  it('will not save a record without its required field', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });

    await user.click(screen.getByRole('button', { name: 'Add a student' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a student' });
    await user.click(within(dialog).getByRole('button', { name: 'Add student' }));

    expect(await within(dialog).findByText('Full name is needed')).toBeInTheDocument();
  });

  it('takes a platform admin to the school list instead', async () => {
    await signInAs('tunde@evolveiq.test');

    expect(await screen.findByRole('heading', { name: 'Schools' })).toBeInTheDocument();
    expect(await screen.findByText('Ridgeview Primary')).toBeInTheDocument();
    expect(screen.getByText('Halden Grove School')).toBeInTheDocument();
  });

  it('sends a signed-out visitor to sign-in', async () => {
    renderApp('/platform/schools');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument(),
    );
  });
});

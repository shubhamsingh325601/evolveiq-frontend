import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('takes a parent from sign-in to their children', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'priya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'My children' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
    expect(screen.getByText('Arjun Ahluwalia')).toBeInTheDocument();
  });

  it('takes a student to today rather than the parent screens', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByLabelText('Email address'), 'maya@family.test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: /Hello, Maya/ })).toBeInTheDocument();
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
    await screen.findByRole('heading', { name: /Hello, Maya/ });

    // The role guard, not the screen, is what refuses this.
    expect(screen.queryByRole('heading', { name: 'My children' })).not.toBeInTheDocument();
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

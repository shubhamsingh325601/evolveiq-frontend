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

describe('School app', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('takes a teacher to their own students', async () => {
    await signInAs('rao@school.test');

    expect(await screen.findByRole('heading', { name: 'My students' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
    // Ritu Kapoor's students belong to another teacher.
    expect(screen.queryByText('Tara Bhatt')).not.toBeInTheDocument();
  });

  it('takes a psychologist to the review queue', async () => {
    await signInAs('mehta@school.test');

    expect(await screen.findByRole('heading', { name: 'Review queue' })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /Pending/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('filters the queue down to what parents submitted', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    await user.click(screen.getByRole('tab', { name: /From parents/ }));

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getAllByText('Parent').length).toBeGreaterThan(0);
      expect(within(table).queryByText('Teacher')).not.toBeInTheDocument();
    });
  });

  it('opens one observation from the queue', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    const firstRow = await screen.findByText(/Devan left the room without asking/);
    await user.click(firstRow);

    expect(
      await screen.findByRole('heading', { name: 'Development areas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark reviewed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No action needed' })).toBeInTheDocument();
  });

  it('keeps a teacher out of the psychologist screens', async () => {
    await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    expect(screen.queryByRole('heading', { name: 'Review queue' })).not.toBeInTheDocument();
  });
});

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

describe('School app', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('takes a teacher to the students of their own classes', async () => {
    await signInAs('rao@school.test');

    expect(await screen.findByRole('heading', { name: 'My students' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
    // Ritu Kapoor's class.
    expect(screen.queryByText('Tara Bhatt')).not.toBeInTheDocument();
  });

  it('records a teacher’s observation and shows it on the student’s profile', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /New observation/ })[0]!);
    await screen.findByRole('heading', { name: 'New observation' });
    await user.selectOptions(await screen.findByLabelText('Who is this about'), 'stu-lila');
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'social');
    await user.type(screen.getByLabelText('What did you notice'), 'Invited a new classmate to join the game at break.');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    expect(await screen.findByRole('heading', { name: 'Lila Menon' })).toBeInTheDocument();
    expect(await screen.findByText(/Invited a new classmate/)).toBeInTheDocument();
  });

  it('takes a psychologist to the review queue, on Pending', async () => {
    await signInAs('mehta@school.test');

    expect(await screen.findByRole('heading', { name: 'Review queue' })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /Pending/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('filters the queue down to what parents wrote', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    await user.click(screen.getByRole('tab', { name: /From parents/ }));

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getAllByText('Parent').length).toBeGreaterThan(0);
      expect(within(table).queryByText('Teacher')).not.toBeInTheDocument();
    });
  });

  it('closes an observation with “No action needed”', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    await user.click(await screen.findByText(/waited for her turn at the game twice/));
    expect(await screen.findByRole('heading', { name: 'Development area' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'No action needed' }));

    await screen.findByRole('heading', { name: 'Review queue' });
    await waitFor(() => expect(screen.queryByText(/waited for her turn at the game twice/)).not.toBeInTheDocument());
  });

  it('asks for a development area before closing a Significant observation', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    await user.click(await screen.findByText(/Devan left the room without asking/));
    await user.click(await screen.findByRole('button', { name: 'No action needed' }));

    expect(await screen.findByText(/a Significant observation needs one/)).toBeInTheDocument();
  });

  it('keeps a teacher out of the psychologist screens', async () => {
    await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    expect(screen.queryByRole('heading', { name: 'Review queue' })).not.toBeInTheDocument();
  });
});

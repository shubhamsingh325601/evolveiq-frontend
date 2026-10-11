import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueryClient, DEMO_PASSWORD, DEMO_PIN, resetMockStore } from '@evolveiq/api-client';
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

async function signInAsParent(email = 'priya@family.test', password = DEMO_PASSWORD) {
  const user = userEvent.setup();
  renderApp();
  await user.type(screen.getByLabelText('Email address'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

async function signInAsStudent(studentId = 'RV-1001', pin = DEMO_PIN) {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('tab', { name: 'Student' }));
  await user.type(screen.getByLabelText('Student ID'), studentId);
  await user.type(screen.getByLabelText('PIN'), pin);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

describe('Family app', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('takes a parent from sign-in to their first child’s dashboard, led by this month in plain words', async () => {
    await signInAsParent();

    expect(await screen.findByRole('heading', { name: 'Parent Dashboard' })).toBeInTheDocument();
    const switcher = await screen.findByRole('navigation', { name: 'Your children' });
    expect(within(switcher).getByRole('link', { name: 'Arjun' })).toBeInTheDocument();
    // Arjun comes first alphabetically, so his dashboard opens.
    expect(within(switcher).getByRole('link', { name: 'Arjun' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByText(/Areas Arjun Ahluwalia is working on: Communication\./)).toBeInTheDocument();
  });

  it('switches the dashboard to another child from the pills', async () => {
    const user = await signInAsParent();
    const switcher = await screen.findByRole('navigation', { name: 'Your children' });

    await user.click(within(switcher).getByRole('link', { name: 'Maya' }));

    expect(await screen.findByText('Review Maya’s progress and pending tasks.')).toBeInTheDocument();
    expect(await screen.findByText('Sort the morning')).toBeInTheDocument();
    expect(await screen.findByText('Confidence & self-esteem')).toBeInTheDocument();
  });

  it('shows a parent only what they wrote, and never a clinical field', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    await user.click(screen.getAllByRole('link', { name: /^Observations/ })[0]!);

    expect(await screen.findByText(/nervous before the school assembly/)).toBeInTheDocument();
    expect(screen.getAllByText('Read by the school').length).toBeGreaterThan(0);
    // A teacher's observation about Maya is never in a parent's list.
    expect(screen.queryByText(/tangram puzzle/)).not.toBeInTheDocument();
    expect(screen.queryByText('Significant')).not.toBeInTheDocument();
    expect(screen.queryByText(/Learning behaviour/)).not.toBeInTheDocument();
  });

  it('takes a student to their home: level, streak and missions', async () => {
    await signInAsStudent();

    expect(await screen.findByRole('heading', { name: /Hi, Maya/ })).toBeInTheDocument();
    expect(await screen.findByText('Level 1 • First Steps')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Sort the morning' })).toHaveAttribute(
      'href',
      '/student/activities/asg-maya-sorting',
    );
  });

  it('lets a student finish an activity and celebrates it', async () => {
    const user = await signInAsStudent();
    await user.click(await screen.findByRole('link', { name: 'Sort the morning' }));

    await user.click(await screen.findByLabelText('Wake up'));
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));

    expect(await screen.findByRole('heading', { name: 'Finished' })).toBeInTheDocument();
    expect(screen.getByText('+10 XP')).toBeInTheDocument();
  });

  it('sends a signed-out visitor to sign-in instead of a guarded screen', async () => {
    renderApp('/parent/children');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument());
  });

  it('keeps a student out of the parent screens', async () => {
    await signInAsStudent();
    await screen.findByRole('heading', { name: /Hi, Maya/ });

    // The role guard, not the screen, is what refuses this.
    expect(screen.queryByRole('heading', { name: 'Parent Dashboard' })).not.toBeInTheDocument();
  });

  it('says so plainly when the password is wrong', async () => {
    await signInAsParent('priya@family.test', 'not-the-password');

    expect(await screen.findByText('That email address and password do not match an account.')).toBeInTheDocument();
  });

  it('sends a teacher to the school app instead', async () => {
    await signInAsParent('rao@school.test');

    expect(await screen.findByText('This account is for the school app. Sign in there instead.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

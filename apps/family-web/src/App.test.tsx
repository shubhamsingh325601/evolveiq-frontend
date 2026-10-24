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
    // His teacher's praise is a star, not something to work on.
    expect(await screen.findByText(/Arjun Ahluwalia has earned \d+ stars? this month\./)).toBeInTheDocument();
    expect(screen.queryByText(/is working on/)).not.toBeInTheDocument();
  });

  it('shows a parent their child’s stars, from school and from home, but never a teacher’s concern', async () => {
    const user = await signInAsParent();
    const switcher = await screen.findByRole('navigation', { name: 'Your children' });
    await user.click(within(switcher).getByRole('link', { name: 'Maya' }));

    const stars = await screen.findByRole('region', { name: 'Maya’s stars' });
    expect(await within(stars).findByText(/tangram puzzle/)).toBeInTheDocument();
    expect(within(stars).getByText(/Sunita Rao, teacher/)).toBeInTheDocument();
    expect(within(stars).getByText('1 from school · 1 from home')).toBeInTheDocument();
    // Ms Rao's concern about Maya stays with the school.
    expect(screen.queryByText(/afternoon reading block/)).not.toBeInTheDocument();
    expect(screen.queryByText('Significant')).not.toBeInTheDocument();
  });

  it('lets a parent celebrate something, and it is a star straight away', async () => {
    const user = await signInAsParent();
    await screen.findByText('Review Arjun’s progress and pending tasks.');

    await user.click(screen.getAllByRole('link', { name: /Celebrate something/ })[0]!);
    expect(await screen.findByLabelText(/Something to celebrate/)).toBeChecked();
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'physical');
    await user.type(screen.getByLabelText('What did you notice'), 'Rode his bicycle all the way to the park without stabilisers.');
    await user.click(screen.getByRole('button', { name: 'Give a star' }));

    const stars = await screen.findByRole('region', { name: 'Arjun’s stars' });
    expect(await within(stars).findByText(/without stabilisers/)).toBeInTheDocument();
    expect(within(stars).getByText('1 from school · 2 from home')).toBeInTheDocument();
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
    // Her own good news about Maya is a star.
    expect(screen.getByText(/laid out her uniform/)).toBeInTheDocument();
    expect(screen.getAllByText('Star given').length).toBeGreaterThan(0);
    // A teacher's observation about Maya is never in a parent's list.
    expect(screen.queryByText(/afternoon reading block/)).not.toBeInTheDocument();
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

  it('shows a student the stars they were given, with the words behind them', async () => {
    await signInAsStudent();

    const stars = await screen.findByRole('region', { name: 'Your stars' });
    expect(await within(stars).findByText(/tangram puzzle/)).toBeInTheDocument();
    expect(within(stars).getByText(/Sunita Rao, your teacher/)).toBeInTheDocument();
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

  it('shows siblings side by side as strengths, never as a ranking', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    await user.click(screen.getAllByRole('link', { name: /^Siblings/ })[0]!);

    expect(await screen.findByRole('heading', { name: 'Siblings' })).toBeInTheDocument();
    expect((await screen.findAllByText('Shines at')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/not a league table/i)).toBeInTheDocument();
    expect(screen.queryByText(/winner|ranking|best/i)).not.toBeInTheDocument();
  });

  it('opens a child’s Holistic Report for their parent, without any concern language', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    await user.click(await screen.findByRole('link', { name: /full report/i }));

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/Skill profile/i)).toBeInTheDocument();
    expect(screen.queryByText(/concern|significant|clinical/i)).not.toBeInTheDocument();
  });

  it('opens a student their own report from their progress page', async () => {
    const user = await signInAsStudent();
    await screen.findByText(/streak/i);

    await user.click(screen.getAllByRole('link', { name: /^Progress|^My progress/ })[0]!);
    await user.click(await screen.findByRole('link', { name: /full report/i }));

    expect(await screen.findByText(/Skill profile/i)).toBeInTheDocument();
  });

  it('keeps wellbeing check-ins off until a parent allows them, then records one', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    // Off by default, and the page says how to turn it on.
    await user.click(await screen.findByRole('link', { name: /Wellbeing check-in/i }));
    expect(await screen.findByText('Check-ins are off')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Choose in Privacy/i }));
    const tracking = (await screen.findAllByLabelText('Record daily wellbeing check-ins'))[0]!;
    expect(tracking).not.toBeChecked();
    await user.click(tracking);
    await waitFor(() => expect(screen.getAllByLabelText('Record daily wellbeing check-ins')[0]).toBeChecked());

    // Back on the child's page, the check-in form is there and saves.
    await user.click(screen.getAllByRole('link', { name: 'Home' })[0]!);
    await user.click(await screen.findByRole('link', { name: /Wellbeing check-in/i }));
    expect(await screen.findByRole('form', { name: 'Wellbeing check-in' })).toBeInTheDocument();
    const form = screen.getByRole('form', { name: 'Wellbeing check-in' });
    await user.click(within(form).getAllByRole('radio')[3]!); // mood: Good
    await user.click(within(form).getAllByRole('radio')[7]!); // energy: Lively
    await user.click(within(form).getByRole('button', { name: 'Save check-in' }));
    expect(await screen.findByText('Saved. Thank you.')).toBeInTheDocument();
    expect(await screen.findByText('Average mood')).toBeInTheDocument();
  });

  it('tells a student their check-in is off until a parent turns it on, and shows Explore ideas', async () => {
    const user = await signInAsStudent();
    await screen.findByText(/streak/i);

    await user.click(screen.getAllByRole('link', { name: /How I feel|Feel/ })[0]!);
    expect(await screen.findByText('Check-ins are off')).toBeInTheDocument();
    expect(screen.getByText(/Ask your parent to turn it on/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /Explore/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Explore' })).toBeInTheDocument();
    expect(await screen.findByText(/Ideas to explore, not predictions/i)).toBeInTheDocument();
  });
});

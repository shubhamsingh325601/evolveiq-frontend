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

  it('leads a student’s home with their progress and their graphs, then today’s missions', async () => {
    await signInAsStudent();

    const progress = await screen.findByRole('progressbar', { name: 'Progress to level 2' });
    const superpowers = await screen.findByRole('heading', { name: 'My superpowers' });
    const missions = screen.getByRole('heading', { name: 'Daily missions' });
    const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(progress, superpowers)).toBe(true);
    expect(follows(superpowers, missions)).toBe(true);
    expect(screen.getByRole('heading', { name: 'Maya’s score' })).toBeInTheDocument();
  });

  it('gives a student the guide in the middle, and points a worry to a trusted adult', async () => {
    const user = await signInAsStudent();
    await screen.findByRole('heading', { name: /Hi, Maya/ });

    await user.click(screen.getAllByRole('link', { name: 'Ask EvolvIQ' })[0]!);
    await user.click(await screen.findByRole('button', { name: 'What should I do today?' }));
    const log = screen.getByRole('log');
    expect(await within(log).findByText(/missions? to do: .*Sort the morning/, {}, { timeout: 3000 })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Ask EvolvIQ Guide a question'), 'some kids bullied me at break');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await within(log).findByText(/talk to a grown-up you trust/, {}, { timeout: 3000 })).toBeInTheDocument();
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

    // Not a tab any more (Explore took its place); still one tap from the dashboard.
    await user.click(await screen.findByRole('link', { name: /Compare strengths/ }));

    expect(await screen.findByRole('heading', { name: 'Siblings' })).toBeInTheDocument();
    expect((await screen.findAllByText('Shines at')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/not a league table/i)).toBeInTheDocument();
    expect(screen.queryByText(/winner|ranking|best/i)).not.toBeInTheDocument();
  });

  it('leads a parent’s dashboard with the graphs and progress, before the month in words', async () => {
    await signInAsParent();

    const score = await screen.findByRole('heading', { name: 'Arjun’s score' });
    const trajectory = await screen.findByRole('heading', { name: 'Trajectory' });
    const month = await screen.findByText(/Arjun Ahluwalia has earned \d+ stars? this month\./);
    const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(score, trajectory)).toBe(true);
    expect(follows(trajectory, screen.getByText('Activities still open'))).toBe(true);
    expect(follows(screen.getByText('Activities still open'), month)).toBe(true);
    expect(screen.getByRole('heading', { name: 'Holistic Report Card' })).toBeInTheDocument();
  });

  it('gives a parent Explore as a tab in place of Siblings, on the child they had open', async () => {
    const user = await signInAsParent();
    const switcher = await screen.findByRole('navigation', { name: 'Your children' });
    await user.click(within(switcher).getByRole('link', { name: 'Maya' }));
    await screen.findByText('Review Maya’s progress and pending tasks.');

    expect(screen.queryByRole('link', { name: /^Siblings/ })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('link', { name: /^Explore/ })[0]!);

    expect(await screen.findByRole('heading', { name: 'Explore with Maya' })).toBeInTheDocument();
    const pills = screen.getByRole('navigation', { name: 'Your children' });
    await user.click(within(pills).getByRole('link', { name: 'Arjun' }));
    expect(await screen.findByRole('heading', { name: 'Explore with Arjun' })).toBeInTheDocument();
  });

  it('puts the guide in the middle for a parent, answering from the family’s own data', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    await user.click(screen.getAllByRole('link', { name: 'Ask EvolvIQ' })[0]!);
    expect(await screen.findByRole('heading', { name: 'Ask EvolvIQ' })).toBeInTheDocument();
    expect(screen.getByText(/Not a person, not a live chat/)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'How is Arjun doing?' }));
    const log = screen.getByRole('log');
    expect(await within(log).findByText(/Arjun’s EvolvIQ Holistic Index is \d+/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(within(log).getByRole('link', { name: 'Open Arjun’s dashboard' })).toHaveAttribute('href', '/parent/children/stu-arjun');
    // Parent-safe: the guide knows nothing clinical to repeat.
    expect(within(log).queryByText(/significant|concern raised|counsellor’s note/i)).not.toBeInTheDocument();
  });

  it('opens a child’s Holistic Report for their parent, without any concern language', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    await user.click(await screen.findByRole('link', { name: /View full .*analysis/i }));

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

  it('keeps wellbeing check-ins off until a parent allows them, then records one on the Health tab', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    // Off by default, and the page says how to turn it on.
    await user.click(await screen.findByRole('link', { name: /Health and care/i }));
    expect(await screen.findByText('Check-ins are off')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Choose in Privacy/i }));
    const tracking = (await screen.findAllByLabelText('Record daily wellbeing check-ins'))[0]!;
    expect(tracking).not.toBeChecked();
    await user.click(tracking);
    await waitFor(() => expect(screen.getAllByLabelText('Record daily wellbeing check-ins')[0]).toBeChecked());

    // Back on the Health tab, the check-in form is there and saves.
    await user.click(screen.getAllByRole('link', { name: 'Health' })[0]!);
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

  it('gives a parent Health in place of Privacy in the tabs, with Privacy in the account menu', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    const tabs = screen.getAllByRole('navigation', { name: 'Main' });
    for (const nav of tabs) {
      expect(within(nav).getByRole('link', { name: 'Health' })).toHaveAttribute('href', '/parent/health');
      expect(within(nav).queryByRole('link', { name: /Privacy/ })).not.toBeInTheDocument();
    }

    await user.click(screen.getAllByRole('button', { name: /Priya Ahluwalia/ })[0]!);
    expect(await screen.findByRole('link', { name: /Privacy & safety/ })).toHaveAttribute('href', '/parent/privacy');
    expect(screen.getByRole('link', { name: /Notice board.*emergency numbers/ })).toHaveAttribute('href', '/parent/notices');
  });

  it('lets a parent tell the school about a health need, which reads back as the school will see it', async () => {
    const user = await signInAsParent();
    await screen.findByRole('heading', { name: 'Parent Dashboard' });

    await user.click(screen.getAllByRole('link', { name: 'Health' })[0]!);
    expect(await screen.findByRole('heading', { name: 'Arjun’s health' })).toBeInTheDocument();
    expect(await screen.findByText('Severe allergy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+91 98765 43210' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const form = screen.getByRole('form', { name: 'Arjun’s health and care' });
    await user.click(within(form).getByRole('checkbox', { name: 'Asthma' }));
    await user.click(within(form).getByRole('button', { name: 'Save for the school' }));

    expect(await screen.findByText(/Saved. Arjun’s school can see it now./)).toBeInTheDocument();
    const conditions = screen.getByRole('list', { name: 'Conditions' });
    expect(within(conditions).getByText('Asthma')).toBeInTheDocument();
    expect(within(conditions).getByText('Severe allergy')).toBeInTheDocument();
  });

  it('celebrates a child named Student of the Month on their parent’s dashboard, and shows the school’s news', async () => {
    const user = await signInAsParent();
    expect(await screen.findByRole('heading', { name: /Arjun is Student of the Month/ })).toBeInTheDocument();
    const news = await screen.findByRole('region', { name: 'From school' });
    expect(await within(news).findByText('Annual Sports Day')).toBeInTheDocument();
    expect(within(news).getByText(/Staff of the Month/)).toBeInTheDocument();

    await user.click(within(news).getByRole('link', { name: /Notice board/ }));
    expect(await screen.findByRole('heading', { name: 'Notice board' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Call Childline, 1098' })).toHaveAttribute('href', 'tel:1098');
    // Another family's child is never on this family's wall.
    expect(screen.queryByText('Noor Siddiqui')).not.toBeInTheDocument();
  });

  it('tells a student they are Student of the Month on their own home', async () => {
    await signInAsStudent('RV-1002');
    expect(await screen.findByRole('heading', { name: /You are Student of the Month/ })).toBeInTheDocument();
  });
});

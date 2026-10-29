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

  it('gives a star for something good: on the student’s profile at once, never awaiting review', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Give a star/ })[0]!);
    await screen.findByRole('heading', { name: 'Give a star' });
    await user.selectOptions(await screen.findByLabelText('Who is this about'), 'stu-lila');
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'social');
    await user.type(screen.getByLabelText('What did you notice'), 'Invited a new classmate to join the game at break.');
    // Something good has no Level, so it can never be flagged Significant.
    expect(screen.queryByLabelText(/^Level/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Give a star' }));

    expect(await screen.findByRole('heading', { name: 'Lila Menon' })).toBeInTheDocument();
    const stars = await screen.findByRole('region', { name: 'Lila’s stars' });
    expect(await within(stars).findByText(/Invited a new classmate/)).toBeInTheDocument();
    expect(await screen.findByText('2 stars')).toBeInTheDocument();
    expect(screen.queryByText('Awaiting review')).not.toBeInTheDocument();
  });

  it('raises a concern for the counsellor to review', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /New observation/ })[0]!);
    await screen.findByRole('heading', { name: 'New observation' });
    await user.selectOptions(await screen.findByLabelText('Who is this about'), 'stu-lila');
    await user.click(screen.getByLabelText(/Something to look into/));
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'emotions');
    await user.type(screen.getByLabelText('What did you notice'), 'Cried when her drawing was moved, and could not settle for the rest of the lesson.');
    await user.selectOptions(screen.getByLabelText(/^Level of concern/), 'significant');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    expect(await screen.findByRole('heading', { name: 'Lila Menon' })).toBeInTheDocument();
    expect(await screen.findByText(/Cried when her drawing was moved/)).toBeInTheDocument();
    expect(screen.getByText('Awaiting review')).toBeInTheDocument();
    expect(screen.getByText('Significant')).toBeInTheDocument();
  });

  it('keeps stars out of the counsellor’s queue', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    await user.click(screen.getByRole('tab', { name: /Everything/ }));

    expect(await screen.findByText(/afternoon reading block/)).toBeInTheDocument();
    expect(screen.queryByText(/tangram puzzle/)).not.toBeInTheDocument();
    expect(screen.queryByText(/museum trip/)).not.toBeInTheDocument();
  });

  it('takes a counsellor to the review queue, on Pending', async () => {
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

  it('keeps a teacher out of the counsellor screens', async () => {
    await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    expect(screen.queryByRole('heading', { name: 'Review queue' })).not.toBeInTheDocument();
  });

  it('lets a teacher open a support plan for a student, and says it is for staff only', async () => {
    const user = await signInAs('rao@school.test');
    await user.click(await screen.findByText('Maya Ahluwalia'));

    expect(await screen.findByText(/School staff only/i)).toBeInTheDocument();
    expect(await screen.findByText('No support plans for this student.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /New plan/ }));
    await user.selectOptions(screen.getByLabelText('Kind of support'), 'sensory');
    await user.type(screen.getByLabelText('What the student needs'), 'Loud rooms are hard to settle in.');
    await user.type(screen.getByLabelText(/What works in class/), 'A quiet corner and a warning before bells.');
    await user.click(screen.getByRole('button', { name: 'Save plan' }));

    expect(await screen.findByText('Loud rooms are hard to settle in.')).toBeInTheDocument();
    expect(screen.getByText('Sensory needs')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Status of the Sensory needs plan/), 'closed');
    await waitFor(() => expect(screen.getByLabelText(/Status of the Sensory needs plan/)).toHaveValue('closed'));
  });

  it('shows a teacher that the family has not shared wellbeing check-ins, not an empty chart', async () => {
    const user = await signInAs('rao@school.test');
    await user.click(await screen.findByText('Maya Ahluwalia'));

    expect(await screen.findByText(/has not turned on wellbeing check-ins/i)).toBeInTheDocument();
  });
});

describe('School app: classes, attendance, care needs and school life', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('narrows the roster to one class from the drop-down, with each student’s days in and care needs', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });
    const table = await screen.findByRole('table', { name: 'Students you teach' });
    expect(await within(table).findByText('Lila Menon')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Class'), 'cls-4b');
    await waitFor(() => expect(within(table).queryByText('Lila Menon')).not.toBeInTheDocument());
    expect(within(table).getByText('Maya Ahluwalia')).toBeInTheDocument();
    // Days in this month, as "attended/recorded", and the care needs the family recorded.
    expect((await within(table).findAllByText(/^\d+\/\d+$/)).length).toBeGreaterThan(0);
    expect(within(table).getByText('Asthma')).toBeInTheDocument();
    expect(within(table).getByText('ADHD')).toBeInTheDocument();
  });

  it('takes today’s register for a class, everyone present to start', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Attendance|Take attendance/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Class'), 'cls-3a');
    const register = await screen.findByRole('region', { name: /Register for/ });
    const noor = within(register).getByRole('radiogroup', { name: 'Noor Siddiqui' });
    await user.click(within(noor).getByRole('radio', { name: 'Absent' }));
    await user.click(within(register).getByRole('button', { name: /Save (register|changes)/ }));

    expect(await within(register).findByText(/Saved. The register for/)).toBeInTheDocument();
    expect(within(register).getByText(/Taken by Sunita Rao/)).toBeInTheDocument();
  });

  it('shows a teacher a student’s care needs and attendance on their profile', async () => {
    const user = await signInAs('rao@school.test');
    await user.click(await screen.findByText('Maya Ahluwalia'));

    const care = await screen.findByRole('region', { name: 'Health and care' });
    expect(await within(care).findByText('Asthma')).toBeInTheDocument();
    expect(within(care).getByRole('link', { name: '+91 98765 43210' })).toHaveAttribute('href', 'tel:+919876543210');
    expect(screen.getByText('Special care')).toBeInTheDocument();
    expect(await screen.findByText(/days in this month/)).toBeInTheDocument();
  });

  it('gives a teacher the notice board with the wall of fame, staff notices but not families-only ones', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Notice board|Notices/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Notice board' })).toBeInTheDocument();
    expect(await screen.findByText('First aid and CPR training')).toBeInTheDocument();
    expect(screen.queryByText('Parent–teacher meeting')).not.toBeInTheDocument();
    expect(await screen.findByText('Ritu Kapoor')).toBeInTheDocument();
    expect(screen.getByText('Noor Siddiqui')).toBeInTheDocument();
  });

  it('keeps a teacher’s reviews private to their account menu', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('button', { name: /Sunita Rao/ })[0]!);
    await user.click(await screen.findByRole('link', { name: /Your reviews/ }));
    expect(await screen.findByRole('heading', { name: 'Your reviews' })).toBeInTheDocument();
    expect(await screen.findByText(/Started the reading-buddies scheme/)).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Teaching quality: \d of 5/ }).length).toBeGreaterThan(0);
  });

  it('gives the counsellor the notice board too, without the school’s wall', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });
    await user.click(screen.getAllByRole('link', { name: /Notice board|Notices/ })[0]!);
    expect(await screen.findByText('Safeguarding refresher for every staff member')).toBeInTheDocument();
    expect(screen.queryByText('Wall of fame')).not.toBeInTheDocument();
  });
});

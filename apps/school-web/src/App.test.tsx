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

  it('lists a teacher’s students under NEP reports and opens one student’s report', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /NEP reports/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'NEP reports' })).toBeInTheDocument();
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();

    await user.click((await screen.findAllByRole('link', { name: /View report/ }))[0]!);
    expect(await screen.findByText(/Skill profile/i)).toBeInTheDocument();
  });

  it('shows a teacher each class with its numbers and who to look at first', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Class overview/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Class overview' })).toBeInTheDocument();
    const panel = (await screen.findAllByRole('region', { name: /^Class / }))[0]!;
    expect(within(panel).getByText('Awaiting review')).toBeInTheDocument();
    expect(within(panel).getByText('Look at first')).toBeInTheDocument();
  });

  it('shows a teacher their messages from parents, empty until a parent writes', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Messages/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Messages' })).toBeInTheDocument();
    expect(await screen.findByText('No messages yet')).toBeInTheDocument();
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

  it('narrows the class overview to the class picked, and the next screen opens on the same class', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Class overview/ })[0]!);
    expect(await screen.findByRole('region', { name: 'Class 3A' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Class'), 'cls-4b');
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Class 3A' })).not.toBeInTheDocument());
    expect(screen.getByRole('region', { name: 'Class 4B' })).toBeInTheDocument();

    // NEP reports remembers 4B: Maya is listed, Lila (3A) is not.
    await user.click(screen.getAllByRole('link', { name: /NEP reports/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'NEP reports' })).toBeInTheDocument();
    expect(screen.getByLabelText('Class')).toHaveValue('cls-4b');
    expect(await screen.findByText('Maya Ahluwalia')).toBeInTheDocument();
    expect(screen.queryByText('Lila Menon')).not.toBeInTheDocument();
  });

  it('offers only the picked class’s students when assigning an activity', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Assign an activity/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Assign an activity' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Class'), 'cls-3a');
    const names = within(screen.getByLabelText('Student'))
      .getAllByRole('option')
      .map((option) => option.textContent ?? '');
    expect(names).toEqual(['Lila Menon, 3A', 'Noor Siddiqui, 3A']);
  });

  it('opens a star on the student’s own class, and keeps what was written when the class changes', async () => {
    const user = await signInAs('rao@school.test');
    const table = await screen.findByRole('table', { name: 'Students you teach' });
    await user.click(await within(table).findByText('Lila Menon'));
    const star = (await screen.findAllByRole('link', { name: /Give a star/ })).find((link) =>
      link.getAttribute('href')?.includes('studentId=stu-lila'),
    )!;

    // The drop-down was last left on 4B; Lila is in 3A, so the form moves there.
    window.localStorage.setItem('evolveiq.teacher.class', 'cls-4b');
    await user.click(star);
    expect(await screen.findByRole('heading', { name: 'Give a star' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Class')).toHaveValue('cls-3a'));
    expect(screen.getByLabelText('Who is this about')).toHaveValue('stu-lila');

    await user.type(screen.getByPlaceholderText(/In the group task today/), 'Shared her crayons.');
    await user.selectOptions(screen.getByLabelText('Class'), 'cls-4b');
    await waitFor(() => expect(['stu-arjun', 'stu-devan', 'stu-maya']).toContain((screen.getByLabelText('Who is this about') as HTMLSelectElement).value));
    expect(screen.getByPlaceholderText(/In the group task today/)).toHaveValue('Shared her crayons.');
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

  it('lets a teacher raise an IT Help Desk ticket', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Raise a ticket|IT help/ })[0]!);
    await screen.findByRole('heading', { name: 'Raise a ticket' });
    await user.type(screen.getByLabelText("What's the problem"), 'Smartboard pen missing');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/Sent: .Smartboard pen missing./)).toBeInTheDocument();
  });

  it('keeps a counsellor off the Help Desk: they have no school', async () => {
    await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });

    expect(screen.queryByRole('link', { name: /Raise a ticket|IT help/ })).not.toBeInTheDocument();
  });

  it('lets a teacher enrol in a training, then mark it complete', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Trainings/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Trainings' })).toBeInTheDocument();
    expect(await screen.findByText('Growth mindset in the classroom')).toBeInTheDocument();
    // Halden Grove's training belongs to another school.
    expect(screen.queryByText('Digital literacy for staff')).not.toBeInTheDocument();
    // Already enrolled and complete, from the seed data.
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);

    const row = screen.getByText('Growth mindset in the classroom').closest('tr') ?? screen.getByText('Growth mindset in the classroom').closest('li');
    await user.click(within(row!).getByRole('button', { name: 'Enrol' }));
    await waitFor(() => expect(within(row!).queryByRole('button', { name: 'Enrol' })).not.toBeInTheDocument());
    await user.click(within(row!).getByRole('button', { name: 'Mark complete' }));
    await waitFor(() => expect(within(row!).getByText('Completed')).toBeInTheDocument());
  });

  it('gives the counsellor every school’s trainings too', async () => {
    const user = await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });
    await user.click(screen.getAllByRole('link', { name: /Trainings/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Trainings' })).toBeInTheDocument();
    expect(await screen.findByText('Digital literacy for staff')).toBeInTheDocument();
    expect(screen.getByText('First aid and CPR training')).toBeInTheDocument();
  });

  it('lets a teacher nominate one of their own students, then remove their own nomination', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('link', { name: /Competitions/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Competitions' })).toBeInTheDocument();
    expect(await screen.findByText('State Science Olympiad')).toBeInTheDocument();
    // Halden's competition is out of Rao's school.
    expect(screen.queryByText('National Maths Challenge')).not.toBeInTheDocument();

    const row = screen.getByRole('row', { name: /House elocution contest/ });
    await user.click(within(row).getByRole('button', { name: 'Nominate' }));
    await waitFor(() => expect(within(row).getByRole('button', { name: /Arjun Ahluwalia/ })).toBeInTheDocument());

    await user.click(within(row).getByRole('button', { name: /Remove Arjun Ahluwalia/ }));
    await waitFor(() => expect(within(row).queryByRole('button', { name: /Arjun Ahluwalia/ })).not.toBeInTheDocument());
  });

  it('has no Competitions nav entry for the counsellor, whose competitions list would be empty', async () => {
    await signInAs('mehta@school.test');
    await screen.findByRole('heading', { name: 'Review queue' });
    expect(screen.queryByRole('link', { name: /Competitions/ })).not.toBeInTheDocument();
  });
});

// Forgot password and change password (21 Nov 2026).
describe('School app: passwords', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('a teacher who forgot their password gets a code, sets a new one and lands signed in', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText('Email address'), 'rao@school.test');
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(screen.getByRole('heading', { name: 'Forgot password' })).toBeInTheDocument();
    // What was typed on the sign-in form carries over.
    expect(screen.getByLabelText('Email address')).toHaveValue('rao@school.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Code from the email'), '000000');
    await user.type(screen.getByLabelText(/^New password$/), 'Brand-New-Password-1');
    await user.type(screen.getByLabelText('New password again'), 'Brand-New-Password-1');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    expect(await screen.findByText(/That code is wrong or has expired/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Code from the email'));
    await user.type(screen.getByLabelText('Code from the email'), '123456');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    expect(await screen.findByRole('heading', { name: 'My students' })).toBeInTheDocument();
  });

  it('checks the new password before sending it', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await user.type(screen.getByLabelText('Email address'), 'rao@school.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await screen.findByRole('heading', { name: 'Check your email' });

    await user.type(screen.getByLabelText('Code from the email'), '123456');
    await user.type(screen.getByLabelText(/^New password$/), 'short');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    expect(screen.getByText('Use at least 10 characters.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^New password$/));
    await user.type(screen.getByLabelText(/^New password$/), 'Brand-New-Password-1');
    await user.type(screen.getByLabelText('New password again'), 'Something-Else-2');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    expect(screen.getByText('The two passwords are not the same.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('a signed-in teacher changes their password from the account menu', async () => {
    const user = await signInAs('rao@school.test');
    await screen.findByRole('heading', { name: 'My students' });

    await user.click(screen.getAllByRole('button', { name: 'Account' })[0]!);
    await user.click(screen.getByRole('button', { name: /Change password/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Change password' });

    await user.type(within(dialog).getByLabelText('Current password'), 'not-my-password');
    await user.type(within(dialog).getByLabelText(/^New password$/), 'Brand-New-Password-1');
    await user.type(within(dialog).getByLabelText('New password again'), 'Brand-New-Password-1');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await within(dialog).findByText(/That is not your current password/)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Current password'));
    await user.type(within(dialog).getByLabelText('Current password'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('dialog', { name: 'Password changed' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // Still signed in here, with a session the server knows.
    expect(screen.getByRole('heading', { name: 'My students' })).toBeInTheDocument();
  });
});

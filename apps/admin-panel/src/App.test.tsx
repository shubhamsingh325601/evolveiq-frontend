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

describe('Admin panel: import, remove, notices, reviews and the wall', () => {
  beforeEach(() => {
    resetMockStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  const csv = (name: string, text: string) => new File([text], name, { type: 'text/csv' });

  it('imports students from a spreadsheet: every row checked first, then created together', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getByRole('link', { name: /^Import$/ }));
    expect(await screen.findByRole('heading', { name: 'Import data' })).toBeInTheDocument();

    // A file with a problem is reported row by row, and cannot be imported.
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, csv('bad.csv', 'Full name,Student ID,PIN,Class\nAsha Rao,RV-2001,12,4B\nBen Thomas,RV-1001,654321,Year 6\n'));
    expect(await screen.findByText('PIN must be exactly 6 digits')).toBeInTheDocument();
    expect(screen.getByText('This student ID is already in use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import 2 students/ })).toBeDisabled();

    await user.upload(input, csv('good.csv', 'Full name,Student ID,PIN,Class,Parent email\nAsha Rao,RV-2001,123456,4B,neil@family.test\nBen Thomas,RV-2002,654321,Year 6,\n'));
    expect(await screen.findByText(/All 2 rows are ready/)).toBeInTheDocument();
    expect(screen.getByText(/It will also create the classes Year 6/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Import 2 students/ }));
    expect(await screen.findByText(/Imported 2 students\. New classes: Year 6\./)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'See the students' }));
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
  });

  it('says plainly that pulling from the school system is still to come', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getByRole('link', { name: /^Import$/ }));
    expect(await screen.findByText('Pull from your school system')).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('removes an account with no records, and offers to switch off one that has them', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getAllByRole('link', { name: /Teachers/ })[0]!);
    await screen.findByText('Sunita Rao');

    await user.click(screen.getByRole('button', { name: 'Remove Sunita Rao' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove Sunita Rao?' });
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(await within(dialog).findByText(/has records at school, so the account cannot be removed/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Switch off instead' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: /Add a teacher/ })[0]!);
    await user.type(screen.getByLabelText('Full name'), 'Added By Mistake');
    await user.type(screen.getByLabelText('Email address'), 'mistake@school.test');
    await user.type(screen.getByLabelText('Password'), 'Mistake-Password-1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await user.click(await screen.findByRole('button', { name: 'Remove Added By Mistake' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByText('Added By Mistake')).not.toBeInTheDocument());
  });

  it('deletes a class, leaving its students at the school', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getAllByRole('link', { name: /Classes/ })[0]!);
    await user.click(await screen.findByRole('button', { name: 'Delete 3A' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete class 3A?' });
    expect(within(dialog).getByText(/2 students wait for another class/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete class' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete 3A' })).not.toBeInTheDocument());
  });

  it('records a student’s care needs for their teachers', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByText('Lila Menon');
    await user.click(screen.getByRole('button', { name: 'Care needs for Lila Menon' }));
    const dialog = await screen.findByRole('dialog', { name: 'Lila’s health and care' });
    await user.click(within(dialog).getByRole('checkbox', { name: 'Hearing impaired' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Hearing impaired')).toBeInTheDocument();
  });

  it('posts a notice to the board, then takes it down', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getAllByRole('link', { name: /Notice board|Notices/ })[0]!);
    expect(await screen.findByText('Annual Sports Day')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Post a notice' })[0]!);
    const dialog = await screen.findByRole('dialog', { name: 'Post a notice' });
    await user.selectOptions(within(dialog).getByLabelText('What kind of notice'), 'emergency_contact');
    await user.type(within(dialog).getByLabelText('Who to call'), 'School nurse');
    await user.click(within(dialog).getByRole('button', { name: 'Post it' }));
    expect(await within(dialog).findByText('An emergency contact needs a phone number')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Phone number/), '+91 80 4000 1234');
    await user.click(within(dialog).getByRole('button', { name: 'Post it' }));
    expect(await screen.findByRole('link', { name: 'Call School nurse, +91 80 4000 1234' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Take down School nurse' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Take it down' }));
    await waitFor(() => expect(screen.queryByText('School nurse')).not.toBeInTheDocument());
    // A platform notice is read here, but changed only by the platform.
    expect(screen.queryByRole('button', { name: 'Edit Childline' })).not.toBeInTheDocument();
  });

  it('rates a teacher’s month on five things, 1 to 5', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getAllByRole('link', { name: /Staff reviews|Reviews/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Staff reviews' })).toBeInTheDocument();

    // Ritu Kapoor's review this month averages 4.4; a lower teaching rating brings it to 4.2.
    expect(await screen.findByText('4.4')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Change' })[0]!);
    const dialog = await screen.findByRole('dialog', { name: /Ritu Kapoor/ });
    const teaching = within(dialog).getByRole('radiogroup', { name: 'Teaching quality' });
    await user.click(within(teaching).getByRole('radio', { name: '3 of 5' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save review' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('4.2')).toBeInTheDocument();
  });

  it('names a Student of the Month on the wall', async () => {
    const user = await signInAs('clara@school.test');
    await screen.findByRole('heading', { name: 'Students' });
    await user.click(screen.getAllByRole('link', { name: /Wall of fame|Wall/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Wall of fame' })).toBeInTheDocument();
    expect(await screen.findAllByText('Arjun Ahluwalia')).not.toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Name a Student of the Month' }));
    const dialog = await screen.findByRole('dialog', { name: 'Name a Student of the Month' });
    await user.selectOptions(within(dialog).getByLabelText('Student'), 'stu-lila');
    await user.type(within(dialog).getByLabelText('Why'), 'For rebuilding the tower with a wider base.');
    await user.click(within(dialog).getByRole('button', { name: 'Put it on the wall' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findAllByText('For rebuilding the tower with a wider base.')).not.toHaveLength(0);
  });
});

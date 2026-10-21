import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ObservationForm } from './ObservationForm';

const STUDENTS = [
  { id: 'stu-maya', fullName: 'Maya Ahluwalia' },
  { id: 'stu-arjun', fullName: 'Arjun Ahluwalia' },
];

describe('ObservationForm', () => {
  it('submits a concern a parent recorded, without any teacher-only fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText(/Something to look into/));
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'social');
    await user.type(
      screen.getByLabelText('What did you notice'),
      'She waited for her turn twice at the party before getting upset.',
    );
    await user.click(screen.getByLabelText('This week'));
    await user.click(screen.getByLabelText('Often'));
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit.mock.calls[0]![0]).toEqual({
      studentId: 'stu-maya',
      tone: 'concern',
      area: 'social',
      description: 'She waited for her turn twice at the party before getting upset.',
      when: 'this_week',
      howOften: 'often',
    });
  });

  it('turns something good into a star, and says so', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} defaultStudentId="stu-arjun" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText(/Something to celebrate/));
    expect(screen.getByText(/It becomes a star on Arjun’s profile straight away/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'routines');
    await user.type(screen.getByLabelText('What did you notice'), 'Packed his school bag the night before, all on his own.');
    await user.click(screen.getByRole('button', { name: 'Give a star' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ studentId: 'stu-arjun', tone: 'positive', area: 'routines' });
  });

  it('asks what kind of observation it is before sending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="teacher" students={STUDENTS} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'communication');
    await user.type(screen.getByLabelText('What did you notice'), 'Actively communicating, fluent in language.');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    expect(await screen.findByText(/Choose whether this is something to celebrate/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides Level and learning behaviour from parents, and Level from anything good', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/^Level/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Learning-behaviour area/)).not.toBeInTheDocument();
    unmount();

    render(<ObservationForm variant="teacher" students={STUDENTS} onSubmit={vi.fn()} />);
    await user.click(screen.getByLabelText(/Something to look into/));
    expect(screen.getByLabelText(/^Level of concern/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Learning-behaviour area/)).toBeInTheDocument();

    // Something good is never Significant: there is no Level to give it.
    await user.click(screen.getByLabelText(/Something to celebrate/));
    expect(screen.queryByLabelText(/^Level/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Learning-behaviour area/)).toBeInTheDocument();
  });

  it('includes the teacher-only fields a teacher filled in on a concern', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="teacher" students={STUDENTS} defaultStudentId="stu-arjun" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText(/Something to look into/));
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'learning');
    await user.type(
      screen.getByLabelText('What did you notice'),
      'Could not recall the three-step instruction straight after hearing it.',
    );
    await user.selectOptions(screen.getByLabelText(/^Level of concern/), 'significant');
    await user.selectOptions(screen.getByLabelText(/Learning-behaviour area/), 'following_instructions');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      studentId: 'stu-arjun',
      tone: 'concern',
      area: 'learning',
      when: 'today',
      howOften: 'once',
      level: 'significant',
      learningBehaviourArea: 'following_instructions',
    });
  });

  it('never sends a Level with a star, even one picked before switching', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="teacher" students={STUDENTS} defaultStudentId="stu-arjun" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText(/Something to look into/));
    await user.selectOptions(screen.getByLabelText(/^Level of concern/), 'significant');
    await user.click(screen.getByLabelText(/Something to celebrate/));
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'communication');
    await user.type(screen.getByLabelText('What did you notice'), 'Actively communicating, fluent in language.');
    await user.selectOptions(screen.getByLabelText(/Learning-behaviour area/), 'participation');
    await user.click(screen.getByRole('button', { name: 'Give a star' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ tone: 'positive', learningBehaviourArea: 'participation' });
    expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty('level');
  });

  it('opens with a kind already chosen when asked to', () => {
    render(<ObservationForm variant="teacher" students={STUDENTS} defaultTone="positive" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/Something to celebrate/)).toBeChecked();
    expect(screen.getByRole('button', { name: 'Give a star' })).toBeInTheDocument();
  });

  it('leaves out the teacher fields a teacher did not record', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="teacher" students={STUDENTS} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText(/Something to look into/));
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'behaviour');
    await user.type(screen.getByLabelText('What did you notice'), 'Left the reading corner untidy again after being asked.');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty('level');
    expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty('learningBehaviourArea');
  });

  it('asks for more detail rather than submitting a one-word observation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText(/Something to celebrate/));
    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'routines');
    await user.type(screen.getByLabelText('What did you notice'), 'Good');
    await user.click(screen.getByRole('button', { name: 'Give a star' }));

    expect(await screen.findByText(/Add a little more detail/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

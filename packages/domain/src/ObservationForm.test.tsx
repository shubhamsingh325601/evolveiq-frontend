import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ObservationForm } from './ObservationForm';

const STUDENTS = [
  { id: 'stu-maya', fullName: 'Maya Ahluwalia' },
  { id: 'stu-arjun', fullName: 'Arjun Ahluwalia' },
];

describe('ObservationForm', () => {
  it('submits what a parent recorded, without any teacher-only fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={onSubmit} />);

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
      area: 'social',
      description: 'She waited for her turn twice at the party before getting upset.',
      when: 'this_week',
      howOften: 'often',
    });
  });

  it('hides Level and learning behaviour from parents and shows them to teachers', () => {
    const { unmount } = render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/^Level/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Learning-behaviour area/)).not.toBeInTheDocument();
    unmount();

    render(<ObservationForm variant="teacher" students={STUDENTS} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/^Level/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Learning-behaviour area/)).toBeInTheDocument();
  });

  it('includes the teacher-only fields a teacher filled in', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="teacher" students={STUDENTS} defaultStudentId="stu-arjun" onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'learning');
    await user.type(
      screen.getByLabelText('What did you notice'),
      'Stayed with the tangram puzzle for ten minutes without prompting.',
    );
    await user.selectOptions(screen.getByLabelText(/^Level/), 'significant');
    await user.selectOptions(screen.getByLabelText(/Learning-behaviour area/), 'attention');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      studentId: 'stu-arjun',
      area: 'learning',
      when: 'today',
      howOften: 'once',
      level: 'significant',
      learningBehaviourArea: 'attention',
    });
  });

  it('leaves out the teacher fields a teacher did not record', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="teacher" students={STUDENTS} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'behaviour');
    await user.type(screen.getByLabelText('What did you notice'), 'Tidied the reading corner without being asked.');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty('level');
    expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty('learningBehaviourArea');
  });

  it('asks for more detail rather than submitting a one-word observation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'routines');
    await user.type(screen.getByLabelText('What did you notice'), 'Good');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    expect(await screen.findByText(/Add a little more detail/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

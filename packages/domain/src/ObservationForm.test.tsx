import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ObservationForm } from './ObservationForm';

const STUDENTS = [
  { id: 'stu-maya', name: 'Maya Ahluwalia' },
  { id: 'stu-arjun', name: 'Arjun Ahluwalia' },
];

describe('ObservationForm', () => {
  it('submits what a parent recorded, without any teacher-only fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={onSubmit} />);

    await user.selectOptions(
      screen.getByLabelText('Which area does this fit'),
      'social-interaction',
    );
    await user.type(
      screen.getByLabelText('What did you notice'),
      'She waited for her turn twice at the party before getting upset.',
    );
    await user.click(screen.getByLabelText('During play'));
    await user.click(screen.getByLabelText('About once a week'));
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const submitted = onSubmit.mock.calls[0]![0];
    expect(submitted).toMatchObject({
      studentId: 'stu-maya',
      area: 'social-interaction',
      context: 'during-play',
      frequency: 'weekly',
    });
    expect(submitted).not.toHaveProperty('level');
    expect(submitted).not.toHaveProperty('learningBehaviourArea');
  });

  it('hides Level and learning behaviour from parents and shows them to teachers', () => {
    const { unmount } = render(
      <ObservationForm variant="parent" students={STUDENTS} onSubmit={vi.fn()} />,
    );
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

    render(<ObservationForm variant="teacher" students={STUDENTS} onSubmit={onSubmit} />);

    await user.selectOptions(
      screen.getByLabelText('Which area does this fit'),
      'focus-and-attention',
    );
    await user.type(
      screen.getByLabelText('What did you notice'),
      'Stayed with the tangram puzzle for ten minutes without prompting.',
    );
    await user.selectOptions(screen.getByLabelText(/^Level/), '4');
    await user.selectOptions(screen.getByLabelText(/Learning-behaviour area/), 'persistence');
    await user.click(
      screen.getByLabelText('Flag this for a psychologist to look at sooner'),
    );
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      level: 4,
      learningBehaviourArea: 'persistence',
      isSignificant: true,
    });
  });

  it('asks for more detail rather than submitting a one-word observation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ObservationForm variant="parent" students={STUDENTS} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Which area does this fit'), 'independence');
    await user.type(screen.getByLabelText('What did you notice'), 'Good');
    await user.click(screen.getByRole('button', { name: 'Send observation' }));

    expect(
      await screen.findByText(/Add a little more detail/),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

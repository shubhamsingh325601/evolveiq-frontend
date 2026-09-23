import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Activity } from '@evolveiq/api-client';
import { ActivityPlayer } from './ActivityPlayer';

const ACTIVITY: Activity = {
  id: 'act-test',
  title: 'Sort the morning',
  description: 'Puts four steps of a morning routine in order.',
  area: 'problem-solving',
  ageRange: '6-9',
  estimatedMinutes: 6,
  authorId: 'usr-mehta',
  createdAt: '2026-09-01T10:00:00.000Z',
  steps: [
    {
      id: 's1',
      kind: 'mcq',
      prompt: 'Which one comes first in the morning?',
      options: [
        { id: 'a', label: 'Put on shoes' },
        { id: 'b', label: 'Wake up' },
      ],
    },
    { id: 's2', kind: 'text', prompt: 'Why does that one come first?' },
    { id: 's3', kind: 'rating', prompt: 'How easy was that?', lowLabel: 'Hard', highLabel: 'Easy' },
  ],
};

describe('ActivityPlayer', () => {
  it('walks every step and hands back one response per answer', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<ActivityPlayer activity={ACTIVITY} onComplete={onComplete} />);

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Wake up'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'Because you have to be awake first.');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '4 out of 5' }));
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0]![0]).toEqual([
      { stepId: 's1', value: 'b' },
      { stepId: 's2', value: 'Because you have to be awake first.' },
      { stepId: 's3', value: 4 },
    ]);
  });

  it('will not move on until the current step is answered', async () => {
    const user = userEvent.setup();
    render(<ActivityPlayer activity={ACTIVITY} onComplete={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText('Answer this one to carry on.')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Wake up'));
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('keeps an answer when the child goes back a step', async () => {
    const user = userEvent.setup();
    render(<ActivityPlayer activity={ACTIVITY} onComplete={vi.fn()} />);

    await user.click(screen.getByLabelText('Wake up'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByLabelText('Wake up')).toBeChecked();
  });
});

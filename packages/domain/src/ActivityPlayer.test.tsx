import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityContent } from '@evolveiq/api-client';
import { ActivityPlayer } from './ActivityPlayer';
import { describeAnswer } from './activity-answers';

const MCQ: ActivityContent = {
  type: 'mcq',
  prompt: 'Which one comes first in the morning?',
  options: [
    { id: 'shoes', label: 'Put on shoes' },
    { id: 'wake', label: 'Wake up' },
  ],
};

const play = (content: ActivityContent, onComplete = vi.fn()) => {
  render(<ActivityPlayer activity={{ title: 'An activity', content }} onComplete={onComplete} />);
  return onComplete;
};

describe('ActivityPlayer', () => {
  it('asks the question and hands back an answer of the activity’s type', async () => {
    const user = userEvent.setup();
    const onComplete = play(MCQ);

    expect(screen.getByRole('heading', { name: 'Which one comes first in the morning?' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('Wake up'));
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ type: 'mcq', optionId: 'wake' }));
  });

  it('will not finish until the question is answered', async () => {
    const user = userEvent.setup();
    play({ type: 'text', prompt: 'What was the best part of your day?' });

    expect(screen.getByRole('button', { name: 'Finish activity' })).toBeDisabled();
    expect(screen.getByText('Answer this one to finish.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: 'Finish activity' })).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'Painting');
    expect(screen.getByRole('button', { name: 'Finish activity' })).toBeEnabled();
  });

  it('sends written answers trimmed, and a rating as a number', async () => {
    const user = userEvent.setup();
    const onText = play({ type: 'text', prompt: 'Tell me about your day' });
    await user.type(screen.getByRole('textbox'), '  We built a volcano!  ');
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));
    await waitFor(() => expect(onText).toHaveBeenCalledWith({ type: 'text', text: 'We built a volcano!' }));
  });

  it('takes a 1–5 rating', async () => {
    const user = userEvent.setup();
    const onComplete = play({ type: 'rating', prompt: 'How tricky was homework?' });

    await user.click(screen.getByRole('radio', { name: '4 out of 5' }));
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ type: 'rating', rating: 4 }));
  });

  it('plays a video link and takes the written response with it', async () => {
    const user = userEvent.setup();
    const onComplete = play({
      type: 'media_response',
      prompt: 'Watch the flower open.',
      mediaUrl: 'https://example.test/flower.mp4',
    });

    expect(document.querySelector('video')).toHaveAttribute('src', 'https://example.test/flower.mp4');
    await user.type(screen.getByLabelText('Your answer'), 'The petals unfolded.');
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ type: 'media_response', text: 'The petals unfolded.' }));
  });
});

describe('describeAnswer', () => {
  it('reads a choice as its label when the activity is known', () => {
    expect(describeAnswer({ type: 'mcq', optionId: 'wake' }, MCQ)).toBe('Chose “Wake up”');
    expect(describeAnswer({ type: 'mcq', optionId: 'wake' })).toBe('Chose one of the options');
    expect(describeAnswer({ type: 'rating', rating: 2 })).toBe('Rated it 2 out of 5');
    expect(describeAnswer({ type: 'text', text: 'Painting' })).toBe('Painting');
  });
});

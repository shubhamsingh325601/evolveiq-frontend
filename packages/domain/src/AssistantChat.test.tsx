import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AssistantChat } from './AssistantChat';
import { matchTopic, type AssistantTopic } from './assistant-match';

const TOPICS: AssistantTopic[] = [
  {
    id: 'stars',
    question: 'How do stars work?',
    keywords: ['star', 'stars', 'reward'],
    answer: 'A star is something good a teacher or your family noticed.',
    link: { label: 'See my stars', to: '/stars' },
  },
  {
    id: 'level',
    question: 'How do I level up?',
    keywords: ['level', 'xp'],
    answer: 'Every finished activity is 10 XP.',
  },
];

function renderChat() {
  render(
    <MemoryRouter>
      <AssistantChat
        name="EvolvIQ Guide"
        greeting="Hi! Ask me about your stars or your level."
        topics={TOPICS}
        fallback="I can only help with a few things for now."
        safety={{ keywords: ['scared', 'bullied'], answer: 'Please talk to a grown-up you trust.' }}
        replyDelayMs={0}
      />
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), log: screen.getByRole('log', { name: 'Conversation with EvolvIQ Guide' }) };
}

describe('AssistantChat', () => {
  it('says it is not a person, and answers a suggested question with its link', async () => {
    const { user, log } = renderChat();
    expect(screen.getByText(/Not a person, not a live chat/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'How do stars work?' }));

    expect(within(log).getByText('How do stars work?')).toBeInTheDocument();
    expect(within(log).getByText(/something good a teacher or your family noticed/)).toBeInTheDocument();
    expect(within(log).getByRole('link', { name: 'See my stars' })).toHaveAttribute('href', '/stars');
  });

  it('matches a typed question by its words', async () => {
    const { user, log } = renderChat();

    await user.type(screen.getByLabelText('Ask EvolvIQ Guide a question'), 'how much XP for the next level?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(within(log).getByText('Every finished activity is 10 XP.')).toBeInTheDocument();
    expect(screen.getByLabelText('Ask EvolvIQ Guide a question')).toHaveValue('');
  });

  it('says what it can help with when nothing matches, and keeps the questions on offer', async () => {
    const { user, log } = renderChat();

    await user.type(screen.getByLabelText('Ask EvolvIQ Guide a question'), 'what is for lunch');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(within(log).getByText('I can only help with a few things for now.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How do I level up?' })).toBeEnabled();
  });

  it('answers a worry with a trusted adult before any topic', async () => {
    const { user, log } = renderChat();

    await user.type(screen.getByLabelText('Ask EvolvIQ Guide a question'), 'I got bullied and lost my stars');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(within(log).getByText('Please talk to a grown-up you trust.')).toBeInTheDocument();
    expect(within(log).queryByText(/something good a teacher/)).not.toBeInTheDocument();
  });
});

describe('matchTopic', () => {
  it('compares whole words, so "start" is not "star"', () => {
    expect(matchTopic('where do I start', TOPICS)).toBeUndefined();
    expect(matchTopic('Where are my STARS?', TOPICS)?.id).toBe('stars');
  });
});

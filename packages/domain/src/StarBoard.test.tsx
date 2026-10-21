import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Star } from '@evolveiq/api-client';
import { StarBoard } from './StarBoard';

const star = (id: string, role: 'teacher' | 'parent', description: string, daysAgo = 0): Star => ({
  id,
  studentId: 'stu-arjun',
  area: role === 'teacher' ? 'communication' : 'routines',
  description,
  givenBy: { fullName: role === 'teacher' ? 'Sunita Rao' : 'Priya Ahluwalia', role },
  createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
});

const STARS = [
  star('s1', 'teacher', 'Told the class about the museum trip without notes.'),
  star('s2', 'parent', 'Packed his bag the night before, all on his own.', 1),
  star('s3', 'teacher', 'Helped a classmate find the right page.', 2),
  star('s4', 'teacher', 'Read his poem aloud to the whole class.', 3),
];

describe('StarBoard', () => {
  it('counts the stars, says where they came from and shows the newest with the giver’s words', () => {
    render(<StarBoard stars={STARS} name="Arjun" audience="family" />);

    expect(screen.getByRole('heading', { name: 'Arjun’s stars' })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3 from school · 1 from home')).toBeInTheDocument();
    expect(screen.getByText('Told the class about the museum trip without notes.')).toBeInTheDocument();
    expect(screen.getByText('Sunita Rao, teacher · Today')).toBeInTheDocument();
    // Three at first; the fourth waits behind "Show all".
    expect(screen.queryByText('Read his poem aloud to the whole class.')).not.toBeInTheDocument();
  });

  it('shows every star on request', async () => {
    const user = userEvent.setup();
    render(<StarBoard stars={STARS} name="Arjun" audience="staff" />);

    await user.click(screen.getByRole('button', { name: 'Show all 4 stars' }));

    expect(screen.getByText('Read his poem aloud to the whole class.')).toBeInTheDocument();
  });

  it('speaks to a student about their own stars', () => {
    render(<StarBoard stars={STARS.slice(0, 2)} audience="student" />);

    expect(screen.getByRole('heading', { name: 'Your stars' })).toBeInTheDocument();
    expect(screen.getByText(/Every star is something good someone noticed about you/)).toBeInTheDocument();
    expect(screen.getByText('Sunita Rao, your teacher · Today')).toBeInTheDocument();
    expect(screen.getByText('Priya Ahluwalia, at home · Yesterday')).toBeInTheDocument();
  });

  it('invites the first star when there are none', () => {
    const { container } = render(<StarBoard stars={[]} name="Lila" audience="staff" />);

    expect(within(container).getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/Give Lila one when you notice something good/)).toBeInTheDocument();
  });
});

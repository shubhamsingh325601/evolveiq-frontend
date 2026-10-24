import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HolisticIndex } from '@evolveiq/api-client';
import { HolisticReport } from './HolisticReport';

const INDEX: HolisticIndex = {
  studentId: 'stu-maya',
  score: 78,
  dimensions: [
    { dimension: 'education', score: 82 },
    { dimension: 'skills', score: 76 },
    { dimension: 'physical', score: 80 },
    { dimension: 'wellbeing', score: 74 },
    { dimension: 'character', score: 79 },
  ],
  history: [
    { schoolYear: '2022–23', grade: 'KG', score: 58, isCurrent: false },
    { schoolYear: '2023–24', grade: 'Year 1', score: 63, isCurrent: false },
    { schoolYear: '2024–25', grade: 'Year 2', score: 69, isCurrent: false },
    { schoolYear: '2025–26', grade: 'Year 3', score: 74, isCurrent: false },
    { schoolYear: '2026–27', grade: 'Year 4', score: 78, isCurrent: true },
  ],
  skills: [
    { skill: 'Maths & logic', score: 84 },
    { skill: 'Creativity', score: 88 },
    { skill: 'Physical', score: 78 },
    { skill: 'Social', score: 68 },
    { skill: 'Focus', score: 66 },
  ],
  monthly: [
    { month: '2026-09', score: 74 },
    { month: '2026-10', score: 78 },
  ],
  insights: [
    {
      dimension: 'education',
      trend: 'up',
      title: 'Education is growing',
      why: 'Evidence in this area has been getting stronger over the last month.',
      factors: ['3 good things noticed in the last 3 months'],
      action: 'Keep a regular, calm time for learning; it is working.',
      confidence: 'medium',
    },
  ],
  evidence: { stars: 5, activitiesCompleted: 9 },
  strengths: ['Creative arts', 'Logical reasoning'],
  playbook: ['Break homework into ten-minute blocks.', 'Play a turn-taking game together.'],
  updatedAt: '2026-10-06T08:00:00.000Z',
};

function renderReport() {
  return render(
    <MemoryRouter>
      <HolisticReport
        studentName="Maya Ahluwalia"
        index={INDEX}
        back={{ to: '/parent/children/stu-maya', label: 'Maya’s dashboard' }}
      />
    </MemoryRouter>,
  );
}

describe('HolisticReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens on the child’s EHI and how many years it is drawn from', () => {
    renderReport();

    expect(screen.getByRole('heading', { level: 1, name: 'Maya’s Holistic Report' })).toBeInTheDocument();
    expect(screen.getByText('Synthesised over 5 years')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Maya’s dashboard' })).toHaveAttribute(
      'href',
      '/parent/children/stu-maya',
    );
  });

  it('lists every year newest first, marking the one still in progress', () => {
    renderReport();

    const annualCard = screen.getByRole('heading', { name: 'Annual Report Card' }).closest('section')!;
    const years = within(annualCard).getAllByRole('listitem');

    expect(years).toHaveLength(5);
    expect(years[0]).toHaveTextContent('Y4');
    expect(years[0]).toHaveTextContent('2026–27 · so far this year');
    expect(years[0]).toHaveTextContent('78');
    expect(years[4]).toHaveTextContent('KG');
    expect(years[4]).toHaveTextContent('2022–23 · end of year');
  });

  it('lets a keyboard user read the trajectory one year at a time', async () => {
    const user = userEvent.setup();
    renderReport();

    const chart = screen.getByRole('group', { name: /year by year/ });
    act(() => chart.focus());
    expect(screen.getByText('Year 4, 2026–27 so far: EHI 78')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Year 3, 2025–26: EHI 74')).toBeInTheDocument();

    await user.keyboard('{Home}');
    expect(screen.getByText('KG, 2022–23: EHI 58')).toBeInTheDocument();
  });

  it('labels every skill on the profile with its score', () => {
    renderReport();

    expect(
      screen.getByRole('img', {
        name: 'Skill profile: Maths & logic 84, Creativity 88, Physical 78, Social 68, Focus 66',
      }),
    ).toBeInTheDocument();
  });

  it('keeps the Growth Playbook in its suggested order', () => {
    renderReport();

    const playbook = screen.getByRole('heading', { name: 'Growth Playbook' }).closest('section')!;
    const steps = within(playbook).getAllByRole('listitem');
    expect(steps[0]).toHaveTextContent('1Break homework into ten-minute blocks.');
    expect(steps[1]).toHaveTextContent('2Play a turn-taking game together.');
  });

  it('saves the report as a PDF through the browser’s print dialog', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderReport();

    await user.click(screen.getByRole('button', { name: 'Save as PDF' }));
    expect(print).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HolisticIndex } from '@evolveiq/api-client';
import { HolisticIndexCard } from './HolisticIndexCard';

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
    { schoolYear: '2025–26', grade: 'Year 3', score: 74, isCurrent: false },
    { schoolYear: '2026–27', grade: 'Year 4', score: 78, isCurrent: true },
  ],
  skills: [],
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
  strengths: [],
  playbook: [],
  updatedAt: '2026-10-06T08:00:00.000Z',
};

describe('HolisticIndexCard', () => {
  it('leads with the score and how far it has moved since last year', () => {
    render(<HolisticIndexCard studentName="Maya Ahluwalia" index={INDEX} />);

    expect(screen.getByRole('heading', { name: 'Maya’s score' })).toBeInTheDocument();
    expect(screen.getByText('EvolvIQ Holistic Index')).toBeInTheDocument();
    expect(screen.getByText('+4 since last year')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Holistic Index, 78, across its five pillars/ }),
    ).toBeInTheDocument();
  });

  it('prints each pillar’s value beside its name, so no ring is read by colour alone', () => {
    render(<HolisticIndexCard studentName="Maya Ahluwalia" index={INDEX} />);

    const expected = [
      ['Education', '82'],
      ['Skills', '76'],
      ['Physical', '80'],
      ['Wellbeing', '74'],
      ['Character', '79'],
    ];
    for (const [pillar, value] of expected) {
      expect(screen.getByText(pillar!).closest('li')).toHaveTextContent(`${pillar}${value}`);
    }
  });

  it('says plainly when there is no earlier year to compare with', () => {
    const firstYearOnly = { ...INDEX, history: INDEX.history.slice(1) };
    render(<HolisticIndexCard studentName="Maya Ahluwalia" index={firstYearOnly} />);

    expect(screen.queryByText(/since last year/)).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from 'vitest';
import { canSeeClinicalDetail, redactObservationForRole } from './redaction';
import type { Observation } from './types';

const FULL_OBSERVATION: Observation = {
  id: 'obs-001',
  studentId: 'stu-maya',
  authorId: 'usr-rao',
  authorName: 'Sunita Rao',
  authorRole: 'teacher',
  area: 'focus-and-attention',
  body: 'Stayed with the tangram puzzle for almost ten minutes without being prompted.',
  context: 'in-class',
  frequency: 'occasionally',
  observedAt: '2026-09-18T10:15:00.000Z',
  createdAt: '2026-09-18T11:02:00.000Z',
  status: 'reviewed',
  isSignificant: true,
  level: 4,
  learningBehaviourArea: 'persistence',
  reviewedAt: '2026-09-19T08:30:00.000Z',
  reviewedById: 'usr-mehta',
  taggedAreas: ['focus-and-attention'],
  teacherOnlyNote: 'Repeat the same task next week to see whether the duration holds.',
};

describe('parent and student visibility', () => {
  it.each(['parent', 'student'] as const)(
    'strips every clinical field before a %s sees an observation',
    (role) => {
      const redacted = redactObservationForRole(FULL_OBSERVATION, role);

      expect(redacted).not.toHaveProperty('level');
      expect(redacted).not.toHaveProperty('learningBehaviourArea');
      expect(redacted).not.toHaveProperty('teacherOnlyNote');
      expect(redacted).not.toHaveProperty('taggedAreas');
      expect(redacted).not.toHaveProperty('reviewedById');
      expect(redacted.isSignificant).toBe(false);
    },
  );

  it('keeps the words the observer actually wrote', () => {
    const redacted = redactObservationForRole(FULL_OBSERVATION, 'parent');

    expect(redacted.body).toBe(FULL_OBSERVATION.body);
    expect(redacted.authorName).toBe('Sunita Rao');
    expect(redacted.area).toBe('focus-and-attention');
    expect(redacted.status).toBe('reviewed');
  });

  it.each(['teacher', 'psychologist', 'school-admin', 'platform-admin'] as const)(
    'leaves the observation intact for a %s',
    (role) => {
      expect(redactObservationForRole(FULL_OBSERVATION, role)).toEqual(FULL_OBSERVATION);
      expect(canSeeClinicalDetail(role)).toBe(true);
    },
  );

  it('reports that parents and students cannot see clinical detail', () => {
    expect(canSeeClinicalDetail('parent')).toBe(false);
    expect(canSeeClinicalDetail('student')).toBe(false);
  });
});

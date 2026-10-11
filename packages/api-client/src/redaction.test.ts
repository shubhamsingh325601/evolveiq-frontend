import { describe, expect, it } from 'vitest';
import { canSeeClinicalDetail, toFamilyAssignment, toParentObservation } from './redaction';
import type { FamilyAssignment, ParentObservation, TeacherObservation } from './types';

// A teacher's observation, with every clinical field set: what a parent must never receive.
const CLINICAL: TeacherObservation & Record<string, unknown> = {
  id: 'obs-001',
  studentId: 'stu-maya',
  area: 'learning',
  description: 'Stayed with the tangram puzzle for almost ten minutes without being prompted.',
  when: 'this_week',
  howOften: 'sometimes',
  status: 'reviewed',
  createdAt: '2026-09-18T11:02:00.000Z',
  level: 'significant',
  learningBehaviourArea: 'attention',
  teacherOnlyNote: 'CLINICAL-NOTE',
  reviewedAt: '2026-09-19T08:30:00.000Z',
  developmentArea: 'focus_attention',
  reviewedBy: { id: 'usr-mehta', fullName: 'REVIEWER-NAME' },
};

describe('what a parent can receive', () => {
  it('keeps exactly the parent fields of an observation, whatever else arrives', () => {
    const safe = toParentObservation(CLINICAL as unknown as ParentObservation);

    expect(Object.keys(safe).sort()).toEqual(
      ['area', 'createdAt', 'description', 'howOften', 'id', 'status', 'studentId', 'when'],
    );
    const raw = JSON.stringify(safe);
    for (const secret of ['significant', 'attention', 'CLINICAL-NOTE', 'REVIEWER-NAME', 'focus_attention']) {
      expect(raw, secret).not.toContain(secret);
    }
  });

  it('keeps the words the parent actually wrote, and the status', () => {
    const safe = toParentObservation(CLINICAL as unknown as ParentObservation);

    expect(safe.description).toBe(CLINICAL.description);
    expect(safe.status).toBe('reviewed');
  });

  it('keeps a child’s activity to its title, done flag and dates — never the answer', () => {
    const fromApi = {
      id: 'asg-1',
      title: 'Tell me about your day',
      isDone: true,
      assignedAt: '2026-10-01T08:00:00.000Z',
      completedAt: '2026-10-02T10:00:00.000Z',
      answer: { type: 'text', text: 'PRIVATE-ANSWER' },
      source: 'recommended',
      assignedBy: { id: 'usr-mehta', fullName: 'Dr. Anand Mehta' },
    } as unknown as FamilyAssignment;

    const safe = toFamilyAssignment(fromApi);

    expect(safe).toEqual({
      id: 'asg-1',
      title: 'Tell me about your day',
      isDone: true,
      assignedAt: '2026-10-01T08:00:00.000Z',
      completedAt: '2026-10-02T10:00:00.000Z',
    });
  });
});

describe('who may see clinical detail', () => {
  it.each(['parent', 'student'] as const)('a %s never does', (role) => {
    expect(canSeeClinicalDetail(role)).toBe(false);
  });

  it.each(['teacher', 'psychologist', 'school_admin', 'platform_admin'] as const)('a %s does', (role) => {
    expect(canSeeClinicalDetail(role)).toBe(true);
  });
});

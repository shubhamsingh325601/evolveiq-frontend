import { beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import type { Assignment, HolisticDimension, HolisticIndex, StudentLevel } from '../types';
import { HOLISTIC_INDEXES } from './fixtures';
import { resetMockStore, setMockCurrentUser } from './mock-transport';

const PILLAR_ORDER: HolisticDimension[] = ['education', 'skills', 'physical', 'wellbeing', 'character'];

describe('mock backend: levels and XP', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('awards an assignment’s XP once, and levels up at the threshold', async () => {
    setMockCurrentUser('usr-maya');
    const levelPath = ENDPOINTS.students.level('stu-maya');

    expect(await request<StudentLevel>('GET', levelPath)).toMatchObject({
      level: 4,
      xp: 340,
      xpForNextLevel: 400,
    });

    // "Sort the morning" is worth 60 XP, which takes Maya to exactly 400.
    await request('POST', ENDPOINTS.assignments.complete('asg-001'), { body: { responses: [] } });
    expect(await request<StudentLevel>('GET', levelPath)).toMatchObject({
      level: 5,
      title: 'Brave Builder',
      xp: 400,
      xpForNextLevel: 500,
    });

    // Doing it again is fine, but earns nothing more.
    await request('POST', ENDPOINTS.assignments.complete('asg-001'), { body: { responses: [] } });
    expect((await request<StudentLevel>('GET', levelPath)).xp).toBe(400);
  });

  it('starts a child with no history at level 1', async () => {
    setMockCurrentUser('usr-rao');
    expect(await request<StudentLevel>('GET', ENDPOINTS.students.level('stu-lila'))).toEqual({
      studentId: 'stu-lila',
      level: 1,
      title: 'First Steps',
      xp: 0,
      xpForNextLevel: 100,
    });
  });

  it('makes a longer activity worth more XP when it is assigned', async () => {
    setMockCurrentUser('usr-rao');
    const assignment = await request<Assignment>('POST', ENDPOINTS.assignments.create, {
      body: { activityId: 'act-story', studentId: 'stu-maya' },
    });
    expect(assignment.xp).toBe(100);
  });
});

describe('mock backend: EvolvIQ Holistic Index', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('serves a parent their child’s EHI with no clinical field on it', async () => {
    setMockCurrentUser('usr-priya');
    const index = await request<HolisticIndex>(
      'GET',
      ENDPOINTS.students.holisticIndex('stu-maya'),
    );

    expect(Object.keys(index).sort()).toEqual([
      'dimensions',
      'history',
      'playbook',
      'score',
      'skills',
      'strengths',
      'studentId',
      'updatedAt',
    ]);
  });

  it('answers null for a child whose first EHI is not worked out yet', async () => {
    setMockCurrentUser('usr-fernandes');
    const newcomer = await request<{ id: string }>('POST', ENDPOINTS.students.list, {
      body: { name: 'Rhea Kulkarni', classId: 'cls-4b' },
    });
    expect(await request('GET', ENDPOINTS.students.holisticIndex(newcomer.id))).toBeNull();
  });

  it.each(HOLISTIC_INDEXES.map((index) => [index.studentId, index] as const))(
    'keeps %s’s EHI consistent with its pillars and its history',
    (_studentId, index) => {
      const mean =
        index.dimensions.reduce((sum, pillar) => sum + pillar.score, 0) / index.dimensions.length;
      expect(index.score).toBe(Math.round(mean));

      // The rings and their validated colours assume this order.
      expect(index.dimensions.map((pillar) => pillar.dimension)).toEqual(PILLAR_ORDER);

      const lastYear = index.history[index.history.length - 1];
      expect(lastYear?.isCurrent).toBe(true);
      expect(lastYear?.score).toBe(index.score);
      expect(index.history.filter((year) => year.isCurrent)).toHaveLength(1);
    },
  );
});

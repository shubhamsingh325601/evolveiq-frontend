import { describe, expect, it } from 'vitest';
import { MAX_PATHWAYS, pathwaysFor } from './future-explorer';
import { daysWithCheckins } from './WellbeingTrend';
import { formatMinutes } from './wellbeing';

describe('Future Explorer', () => {
  it('gives each strength its own pathway, in the order the index lists them', () => {
    const pathways = pathwaysFor(['Teamwork', 'Curiosity']);
    expect(pathways.map((p) => p.strength)).toEqual(['Teamwork', 'Curiosity']);
    expect(pathways[0]?.fields.length).toBeGreaterThan(0);
    expect(pathways[0]?.tryThis.length).toBeGreaterThan(0);
  });

  it('skips a strength it does not know and shows nothing when there are none', () => {
    expect(pathwaysFor(['Something unheard of'])).toEqual([]);
    expect(pathwaysFor([])).toEqual([]);
  });

  it('shows at most four at once', () => {
    const many = ['Teamwork', 'Curiosity', 'Communication', 'Learning habits', 'Daily routines', 'Active & healthy'];
    expect(pathwaysFor(many)).toHaveLength(MAX_PATHWAYS);
  });

  it('never ranks, predicts or promises', () => {
    const text = JSON.stringify(pathwaysFor(['Teamwork', 'Curiosity', 'Communication', 'Learning habits']));
    const words = text.toLowerCase().split(/[^a-z]+/);
    for (const word of ['best', 'winner', 'guarantee', 'scholarship']) expect(words).not.toContain(word);
  });
});

describe('wellbeing helpers', () => {
  it('spans the last N days, ending today, marking days without a check-in', () => {
    const rows = daysWithCheckins([{ day: '2026-10-23', mood: 4, energy: 3, sleepMinutes: null, activeMinutes: null }], 3, '2026-10-24');
    expect(rows.map((r) => r.day)).toEqual(['2026-10-22', '2026-10-23', '2026-10-24']);
    expect(rows.map((r) => r.checkin !== null)).toEqual([false, true, false]);
  });

  it('formats minutes as hours and minutes', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(480)).toBe('8 h');
    expect(formatMinutes(450)).toBe('7 h 30 min');
  });
});

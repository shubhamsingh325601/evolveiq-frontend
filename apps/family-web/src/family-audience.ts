/**
 * Who this build of the family app is for (client request, 20 Nov 2026):
 * parents at family.evolviq.in, children at student.evolviq.in, each installable as an
 * app of its own. Set at build time with `VITE_FAMILY_AUDIENCE=parents` or
 * `students`; unset, one app serves both (local development, the tests and
 * the combined dev shell).
 */
export type FamilyAudience = 'parents' | 'students' | 'both';

export function familyAudienceOf(value: string | undefined): FamilyAudience {
  return value === 'parents' || value === 'students' ? value : 'both';
}

export const FAMILY_AUDIENCE: FamilyAudience = familyAudienceOf(import.meta.env.VITE_FAMILY_AUDIENCE);

/**
 * Where the other half of the family signs in, e.g. `https://student.evolviq.in` on the
 * parents' build (`VITE_FAMILY_OTHER_URL`). Unset, no link is shown.
 */
export const FAMILY_OTHER_URL: string | undefined = import.meta.env.VITE_FAMILY_OTHER_URL || undefined;

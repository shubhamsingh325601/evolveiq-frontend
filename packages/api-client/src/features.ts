/**
 * What the backend can serve today. Screens and shared components check these
 * rather than guessing; flip one only once the backend has the endpoint.
 */
export const FEATURES = {
  /**
   * The EvolvIQ Holistic Index (score, rings, report card). The backend has
   * no EHI endpoint or scoring formula yet, so every EHI view is hidden. The
   * components (`HolisticIndexCard`, `HolisticReport`, the SVG charts) are kept
   * in `@evolveiq/domain` and `@evolveiq/ui`, tested, ready to wire back in.
   */
  holisticIndex: false,
} as const;

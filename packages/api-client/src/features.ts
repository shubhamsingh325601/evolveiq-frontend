/**
 * What the backend can serve today. Screens and shared components check these
 * rather than guessing; flip one only once the backend has the endpoint.
 */
export const FEATURES = {
  /** The EvolvIQ Holistic Index and Growth Moments: served by the backend's progress module. */
  holisticIndex: true,
} as const;

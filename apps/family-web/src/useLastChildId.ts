import { useOutletContext } from 'react-router-dom';

/** What the family frame hands the screens inside it. */
export interface FamilyFrameContext {
  /** The child a parent has open, or opened last: where pages without a child in their path start. */
  lastChildId: string | undefined;
}

export function useLastChildId(): string | undefined {
  return useOutletContext<FamilyFrameContext | undefined>()?.lastChildId;
}

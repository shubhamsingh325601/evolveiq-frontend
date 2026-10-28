import {
  FEATURES,
  useChildren,
  useChildrenAssignments,
  useHolisticIndexes,
  useStarsForStudents,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { AssistantChat, firstNameOf } from '@evolveiq/domain';
import { LoadingState, PageHeader } from '@evolveiq/ui';
import {
  GUIDE_NAME,
  PARENT_FALLBACK,
  PARENT_SAFETY,
  parentGreeting,
  parentTopics,
} from '../../assistant-topics';
import { useLastChildId } from '../../useLastChildId';

/**
 * A parent's guide, in the middle of their tab bar: how each child is doing,
 * and how stars, the Holistic Index, concerns, Explore and privacy work. Every
 * answer is written in advance and filled from the family's own parent-safe
 * data; it is not a person, and it passes nothing on to the school.
 */
export function AskScreen() {
  const { user } = useAuth();
  const children = useChildren();
  const lastChildId = useLastChildId();
  const list = children.data ?? [];
  const ids = list.map((child) => child.id);
  const assignmentsByChild = useChildrenAssignments(ids);
  const starsByChild = useStarsForStudents(ids);
  const indexes = useHolisticIndexes(FEATURES.holisticIndex ? ids : []);

  if (!user || children.isLoading || indexes.isLoading) return <LoadingState label="Getting the guide ready" />;

  // "My child" means the one they had open last.
  const ordered = [...list].sort((a, b) => Number(b.id === lastChildId) - Number(a.id === lastChildId));
  const parentFirstName = firstNameOf(user.fullName);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Ask EvolvIQ"
        subtitle="Quick answers about how your children are doing and how EvolvIQ works."
      />
      <AssistantChat
        name={GUIDE_NAME}
        greeting={parentGreeting(parentFirstName, ordered)}
        topics={parentTopics({
          parentFirstName,
          children: ordered,
          holisticByChild: indexes.byStudent,
          starsByChild,
          assignmentsByChild,
        })}
        fallback={PARENT_FALLBACK}
        safety={PARENT_SAFETY}
      />
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useStudent, useTeacherNotes } from '@evolveiq/api-client';
import { BackLink, formatDay } from '@evolveiq/domain';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MessageCircle,
  PageHeader,
  Quote,
  RuledList,
  RuledListItem,
} from '@evolveiq/ui';

/** Read-only for parents. Psychologist notes are never included here. */
export function TeacherNotesScreen() {
  const { childId } = useParams<{ childId: string }>();
  const student = useStudent(childId);
  const notes = useTeacherNotes(childId);

  if (notes.isLoading || student.isLoading) return <LoadingState label="Loading notes" />;
  if (notes.isError) return <ErrorState onRetry={() => void notes.refetch()} />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={
          <BackLink to={`/parent/children/${childId}`}>
            {student.data?.name ?? 'Back to profile'}
          </BackLink>
        }
        title="Teacher notes"
        subtitle={
          student.data
            ? `What ${student.data.name.split(' ')[0]}’s teachers have passed on to you.`
            : undefined
        }
      />

      {(notes.data ?? []).length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No notes yet"
          description="Teachers add a note when there is something they want you to know."
        />
      ) : (
        <Card className="max-w-3xl p-6 sm:p-8">
          <RuledList>
            {(notes.data ?? []).map((note) => (
              <RuledListItem key={note.id}>
                <Quote attribution={`${note.authorName}, ${formatDay(note.createdAt)}`}>
                  {note.body}
                </Quote>
              </RuledListItem>
            ))}
          </RuledList>
        </Card>
      )}
    </div>
  );
}

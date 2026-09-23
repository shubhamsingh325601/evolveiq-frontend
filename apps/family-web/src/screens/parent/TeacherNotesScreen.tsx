import { Link, useParams } from 'react-router-dom';
import { useStudent, useTeacherNotes } from '@evolveiq/api-client';
import { formatDay } from '@evolveiq/domain';
import {
  EmptyState,
  ErrorState,
  LoadingState,
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
        title="Teacher notes"
        subtitle={
          student.data
            ? `What ${student.data.name.split(' ')[0]}\u2019s teachers have passed on to you.`
            : undefined
        }
        actions={
          <Link
            to={`/parent/children/${childId}`}
            className="text-sm font-medium text-teal-600 underline underline-offset-4"
          >
            Back to profile
          </Link>
        }
      />

      {(notes.data ?? []).length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Teachers add a note when there is something they want you to know."
        />
      ) : (
        <RuledList>
          {(notes.data ?? []).map((note) => (
            <RuledListItem key={note.id}>
              <Quote attribution={`${note.authorName}, ${formatDay(note.createdAt)}`}>
                {note.body}
              </Quote>
            </RuledListItem>
          ))}
        </RuledList>
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  businessDate,
  useCreateNotice,
  useDeleteNotice,
  useNotices,
  useSchools,
  useUpdateNotice,
  type NewNotice,
  type Notice,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { NoticeBoard } from '@evolveiq/domain';
import { Button, CalendarDays, ErrorState, Megaphone, PageHeader, Pin, Plus, Siren, StatTile } from '@evolveiq/ui';
import { saveErrorMessage } from '../components/account-fields';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NoticeEditor } from '../components/NoticeEditor';

/**
 * The notice board, as its admins manage it (client feedback, 29 Oct 2026:
 * "events, activities, trainings, government policies and updates, emergency
 * contacts"). A school admin posts for their school; a platform admin for one
 * school or every school. Each reader sees the board in their own app.
 */
export function NoticesScreen() {
  const { user } = useAuth();
  const isPlatform = user?.role === 'platform_admin';
  const notices = useNotices();
  const schools = useSchools({ isEnabled: isPlatform });
  const create = useCreateNotice();
  const update = useUpdateNotice();
  const remove = useDeleteNotice();

  const [editing, setEditing] = useState<Notice | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<Notice | null>(null);
  const [removeError, setRemoveError] = useState<string>();

  if (notices.isError) return <ErrorState onRetry={() => void notices.refetch()} />;
  const list = notices.data ?? [];
  const today = businessDate();

  const save = async (fields: NewNotice) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        await create.mutateAsync(fields);
      } else if (editing) {
        await update.mutateAsync({
          noticeId: editing.id,
          // The school a notice was posted for never changes; a field emptied in the form is cleared.
          changes: {
            category: fields.category,
            title: fields.title,
            audience: fields.audience ?? 'everyone',
            isPinned: fields.isPinned ?? false,
            body: fields.body ?? null,
            startsOn: fields.startsOn ?? null,
            location: fields.location ?? null,
            phone: fields.phone ?? null,
          },
        });
      }
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that notice. Try again.'));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
      setRemoveError(undefined);
    } catch (caught) {
      setRemoveError(saveErrorMessage(caught, 'We could not take that notice down. Try again.'));
    }
  };

  const postButton = (
    <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
      Post a notice
    </Button>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notice board"
        subtitle={
          isPlatform
            ? 'Notices for one school or for every school: policy updates, trainings, emergency numbers.'
            : 'Events, activities, trainings, policy updates and emergency numbers for your school.'
        }
        actions={postButton}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Megaphone} label="On the board" value={list.length} detail="Every notice you can see" />
        <StatTile
          icon={CalendarDays}
          tone="jade"
          label="Coming up"
          value={list.filter((n) => n.startsOn !== null && n.startsOn >= today).length}
          detail="Events, activities and trainings"
        />
        <StatTile icon={Siren} tone="coral" label="Emergency numbers" value={list.filter((n) => n.category === 'emergency_contact').length} detail="Tap to call, in every app" />
        <StatTile icon={Pin} tone="lilac" label="Pinned" value={list.filter((n) => n.isPinned).length} detail="Kept at the top" />
      </div>

      <NoticeBoard
        notices={list}
        isLoading={notices.isLoading}
        showsAudience
        onEdit={(notice) => setEditing(notice)}
        onRemove={(notice) => setRemoving(notice)}
        emptyAction={postButton}
      />

      <NoticeEditor
        isOpen={editing !== null}
        notice={editing && editing !== 'new' ? editing : undefined}
        schools={isPlatform ? (schools.data ?? []) : undefined}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        onSave={save}
        isSaving={create.isPending || update.isPending}
        error={error}
      />

      <ConfirmDialog
        isOpen={removing !== null}
        title={removing ? `Take down “${removing.title}”?` : 'Take down'}
        description="It goes from every reader’s board at once."
        confirmLabel="Take it down"
        onConfirm={() => void confirmRemove()}
        onClose={() => {
          setRemoving(null);
          setRemoveError(undefined);
        }}
        isWorking={remove.isPending}
        error={removeError}
      />
    </div>
  );
}

import { useId, type ReactNode } from 'react';
import { businessDate, type Notice, type NoticeCategory } from '@evolveiq/api-client';
import {
  Badge,
  Button,
  CalendarDays,
  Card,
  cn,
  EmptyState,
  FileText,
  GraduationCap,
  LoadingState,
  MapPin,
  Megaphone,
  Pencil,
  Phone,
  Pin,
  School,
  Siren,
  Sparkles,
  Trash2,
  type IconComponent,
} from '@evolveiq/ui';
import { formatDay } from './format-date';
import { formatDayShort, NOTICE_AUDIENCE_LABELS, NOTICE_CATEGORY_LABELS } from './school-life';

export interface NoticeBoardProps {
  notices: Notice[];
  isLoading?: boolean;
  /** Admin screens: shown on the notices the signed-in admin may manage. */
  onEdit?: (notice: Notice) => void;
  onRemove?: (notice: Notice) => void;
  /** Staff and admins see who each notice is for; families only see their own. */
  showsAudience?: boolean;
  emptyAction?: ReactNode;
  className?: string;
}

const CATEGORY_ICONS: Record<NoticeCategory, IconComponent> = {
  event: CalendarDays,
  activity: Sparkles,
  training: GraduationCap,
  policy: FileText,
  emergency_contact: Siren,
  general: Megaphone,
};

const CATEGORY_WELLS: Record<NoticeCategory, string> = {
  event: 'bg-iris-50 text-iris-600 ring-iris-100',
  activity: 'bg-jade-50 text-jade-600 ring-jade-100',
  training: 'bg-lilac-50 text-lilac-600 ring-lilac-100',
  policy: 'bg-honey-50 text-honey-700 ring-honey-100',
  emergency_contact: 'bg-coral-50 text-coral-600 ring-coral-100',
  general: 'bg-iris-50 text-iris-600 ring-iris-100',
};

const DATED: NoticeCategory[] = ['event', 'activity', 'training'];
const DAY_PARTS = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** The pieces of a calendar badge: "Nov", "14", "Sat". */
function dayParts(day: string): { weekday: string; day: string; month: string } {
  const parts = Object.fromEntries(DAY_PARTS.formatToParts(new Date(`${day}T00:00:00Z`)).map((part) => [part.type, part.value]));
  return { weekday: parts.weekday ?? '', day: parts.day ?? '', month: parts.month ?? '' };
}
const telOf = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

function Controls({ notice, onEdit, onRemove }: Pick<NoticeBoardProps, 'onEdit' | 'onRemove'> & { notice: Notice }) {
  if (!notice.canManage || (!onEdit && !onRemove)) return null;
  return (
    <div className="flex shrink-0 gap-1">
      {onEdit ? (
        <Button variant="quiet" size="sm" icon={Pencil} onClick={() => onEdit(notice)} aria-label={`Edit ${notice.title}`}>
          Edit
        </Button>
      ) : null}
      {onRemove ? (
        <Button variant="danger-quiet" size="sm" icon={Trash2} onClick={() => onRemove(notice)} aria-label={`Take down ${notice.title}`}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}

function Meta({ notice, showsAudience }: { notice: Notice; showsAudience: boolean }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-faint">
      <span>
        {notice.createdBy.fullName}, {formatDay(notice.createdAt)}
      </span>
      {notice.schoolId === null ? (
        <span className="inline-flex items-center gap-1 font-semibold text-iris-700">
          <School className="size-3.5" /> Every school
        </span>
      ) : null}
      {showsAudience ? <span>For {NOTICE_AUDIENCE_LABELS[notice.audience].toLowerCase()}</span> : null}
    </p>
  );
}

function NoticeCard({ notice, onEdit, onRemove, showsAudience }: { notice: Notice; showsAudience: boolean } & Pick<NoticeBoardProps, 'onEdit' | 'onRemove'>) {
  const Icon = CATEGORY_ICONS[notice.category];
  return (
    <Card as="li" className="flex gap-4 p-5">
      {notice.startsOn && DATED.includes(notice.category) ? (
        <span aria-hidden="true" className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-night py-2 text-white shadow-card">
          <span className="text-[0.625rem] font-bold uppercase tracking-wider text-white/70">{dayParts(notice.startsOn).month}</span>
          <span className="text-2xl font-black leading-none">{dayParts(notice.startsOn).day}</span>
          <span className="text-[0.625rem] font-semibold text-white/70">{dayParts(notice.startsOn).weekday}</span>
        </span>
      ) : (
        <span aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset', CATEGORY_WELLS[notice.category])}>
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
              {NOTICE_CATEGORY_LABELS[notice.category]}
              {notice.isPinned ? (
                <span className="inline-flex items-center gap-1 normal-case tracking-normal text-iris-700">
                  <Pin className="size-3.5" /> Pinned
                </span>
              ) : null}
            </p>
            <h3 className="mt-1 text-base font-black tracking-tight text-ink">{notice.title}</h3>
          </div>
          <Controls notice={notice} onEdit={onEdit} onRemove={onRemove} />
        </div>
        {notice.startsOn || notice.location ? (
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-ink-muted">
            {notice.startsOn ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-iris-500" />
                {formatDayShort(notice.startsOn)}
              </span>
            ) : null}
            {notice.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-iris-500" />
                {notice.location}
              </span>
            ) : null}
          </p>
        ) : null}
        {notice.body ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{notice.body}</p> : null}
        {notice.phone ? (
          <a href={telOf(notice.phone)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-iris-700 hover:underline">
            <Phone className="size-4" /> {notice.phone}
          </a>
        ) : null}
        <Meta notice={notice} showsAudience={showsAudience} />
      </div>
    </Card>
  );
}

/**
 * The school's notice board (client feedback, 29 Oct 2026): emergency numbers
 * first, as buttons that call; then what is coming up — events, activities and
 * trainings, soonest first; then policy updates and announcements, newest
 * first. One component for every reader, and for the admins who manage it.
 */
export function NoticeBoard({ notices, isLoading = false, onEdit, onRemove, showsAudience = false, emptyAction, className }: NoticeBoardProps) {
  const emergencyId = useId();
  const upcomingId = useId();
  const updatesId = useId();
  const today = businessDate();

  if (isLoading) return <LoadingState label="Loading the notice board" />;
  if (notices.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={Megaphone}
        title="Nothing on the notice board yet"
        description="Events, activities, trainings, policy updates and emergency numbers appear here when the school posts them."
        action={emptyAction}
      />
    );
  }

  const contacts = notices.filter((n) => n.category === 'emergency_contact');
  const upcoming = notices
    .filter((n) => DATED.includes(n.category) && n.startsOn !== null && n.startsOn >= today)
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || (a.startsOn ?? '').localeCompare(b.startsOn ?? ''));
  const updates = notices.filter((n) => n.category !== 'emergency_contact' && !upcoming.includes(n));

  return (
    <div className={cn('flex flex-col gap-10', className)}>
      {contacts.length > 0 ? (
        <section aria-labelledby={emergencyId}>
          <h2 id={emergencyId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
            <Siren className="size-5 text-coral-500" /> Emergency contacts
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contacts.map((contact) => (
              <Card as="li" key={contact.id} className="flex items-center gap-3 border-coral-100 p-4">
                <a
                  href={telOf(contact.phone ?? '')}
                  aria-label={`Call ${contact.title}, ${contact.phone}`}
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral-500 text-white shadow-card transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
                >
                  <Phone className="size-5" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-ink">{contact.title}</p>
                  <a href={telOf(contact.phone ?? '')} className="text-lg font-black tabular-nums text-coral-700 hover:underline">
                    {contact.phone}
                  </a>
                  {contact.body ? <p className="text-xs font-medium text-ink-muted">{contact.body}</p> : null}
                </div>
                <Controls notice={contact} onEdit={onEdit} onRemove={onRemove} />
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-labelledby={upcomingId}>
          <h2 id={upcomingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
            <CalendarDays className="size-5 text-iris-500" /> Coming up
            <Badge>{upcoming.length}</Badge>
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {upcoming.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} onEdit={onEdit} onRemove={onRemove} showsAudience={showsAudience} />
            ))}
          </ul>
        </section>
      ) : null}

      {updates.length > 0 ? (
        <section aria-labelledby={updatesId}>
          <h2 id={updatesId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
            <Megaphone className="size-5 text-honey-500" /> Policies and updates
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {updates.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} onEdit={onEdit} onRemove={onRemove} showsAudience={showsAudience} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

import { useId } from 'react';
import { Link } from 'react-router-dom';
import { businessDate, type Honour, type Notice } from '@evolveiq/api-client';
import { formatDayShort, formatMonth, NOTICE_CATEGORY_LABELS } from '@evolveiq/domain';
import { Avatar, buttonClasses, CalendarDays, Card, ChevronRight, cn, Megaphone, Siren, Trophy } from '@evolveiq/ui';

export interface SchoolNewsCardProps {
  notices: Notice[];
  honours: Honour[];
  /** Where the full notice board is. */
  to: string;
  className?: string;
}

const DATED = new Set(['event', 'activity', 'training']);

/**
 * What the school is saying, on a family home: the Staff of the Month, the next
 * few dates, and how many emergency numbers are on the board — one tap from
 * the whole notice board.
 */
export function SchoolNewsCard({ notices, honours, to, className }: SchoolNewsCardProps) {
  const headingId = useId();
  const today = businessDate();
  const upcoming = notices
    .filter((n) => DATED.has(n.category) && n.startsOn !== null && n.startsOn >= today)
    .sort((a, b) => (a.startsOn ?? '').localeCompare(b.startsOn ?? ''))
    .slice(0, 3);
  const emergencyCount = notices.filter((n) => n.category === 'emergency_contact').length;
  const staffOfMonth = honours.filter((h) => h.kind === 'staff_of_month').sort((a, b) => b.month.localeCompare(a.month))[0];

  return (
    <Card as="section" aria-labelledby={headingId} isPlayful className={cn('flex flex-col gap-5 p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          <Megaphone className="size-5 text-honey-500" />
          From school
        </h2>
        <Link to={to} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
          Notice board
          <ChevronRight />
        </Link>
      </div>

      {staffOfMonth ? (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-star-50 to-white p-3 ring-1 ring-inset ring-star-200">
          <Avatar name={staffOfMonth.honoree.fullName} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-star-800">
              <Trophy className="size-3.5 fill-star-300" /> Staff of the Month · {formatMonth(staffOfMonth.month)}
            </p>
            <p className="truncate font-bold text-ink">{staffOfMonth.honoree.fullName}</p>
            <p className="line-clamp-2 text-xs font-medium text-ink-muted">{staffOfMonth.citation}</p>
          </div>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {upcoming.map((notice) => (
            <li key={notice.id} className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-iris-50 text-iris-600 ring-1 ring-inset ring-iris-100">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{notice.title}</p>
                <p className="text-xs font-medium text-ink-muted">
                  {NOTICE_CATEGORY_LABELS[notice.category]} · {formatDayShort(notice.startsOn ?? today)}
                  {notice.location ? ` · ${notice.location}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm font-medium text-ink-muted">No dates coming up on the board.</p>
      )}

      {emergencyCount > 0 ? (
        <Link to={to} className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-coral-700 hover:underline">
          <Siren className="size-4" />
          {emergencyCount === 1 ? '1 emergency number' : `${emergencyCount} emergency numbers`} on the board
        </Link>
      ) : null}
    </Card>
  );
}

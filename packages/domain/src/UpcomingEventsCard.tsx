import { Link } from 'react-router-dom';
import { businessDate, type Notice } from '@evolveiq/api-client';
import { buttonClasses, CalendarDays, Card, ChevronRight, cn, EmptyState, MapPin, SectionTitle } from '@evolveiq/ui';
import { upcomingNotices } from './school-life';

export interface UpcomingEventsCardProps {
  notices: Notice[];
  /** Where the full notice board is, for "See all" and the empty state. */
  to: string;
  /** How many events to show before "See all". */
  limit?: number;
  className?: string;
}

/** The pieces of a calendar badge: "Nov", "14". */
function dayParts(day: string): { day: string; month: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .formatToParts(new Date(`${day}T00:00:00Z`))
      .map((part) => [part.type, part.value]),
  );
  return { day: parts.day ?? '', month: parts.month ?? '' };
}

/**
 * A dedicated "Upcoming events" section (client feedback), separate from the
 * notice board's mixed "Coming up" list: events only, soonest first.
 */
export function UpcomingEventsCard({ notices, to, limit = 5, className }: UpcomingEventsCardProps) {
  const today = businessDate();
  const events = upcomingNotices(notices, ['event'], today).slice(0, limit);

  return (
    <Card as="section" isPlayful className={cn('flex flex-col gap-5 p-6', className)}>
      <SectionTitle
        icon={CalendarDays}
        iconClassName="text-iris-500"
        action={
          <Link to={to} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
            See all
            <ChevronRight />
          </Link>
        }
      >
        Upcoming events
      </SectionTitle>

      {events.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {events.map((event) => {
            const { day, month } = dayParts(event.startsOn ?? today);
            return (
              <li key={event.id} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-night py-1.5 text-white shadow-card"
                >
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider text-white/70">{month}</span>
                  <span className="text-lg font-black leading-none">{day}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{event.title}</p>
                  {event.location ? (
                    <p className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                      <MapPin className="size-3.5" />
                      {event.location}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No events coming up"
          description="When the school posts an event, it shows up here."
        />
      )}
    </Card>
  );
}

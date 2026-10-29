import type { Honour } from '@evolveiq/api-client';
import { Avatar, Button, Card, cn, Medal, Quote, Trash2, Trophy } from '@evolveiq/ui';
import { formatMonth } from './format-date';
import { HONOUR_KIND_LABELS } from './school-life';

export interface HonourCardProps {
  honour: Honour;
  /** Admin screens: take the honour down. */
  onRemove?: (honour: Honour) => void;
  className?: string;
}

/**
 * One entry on the celebration wall: who, for which month, and why, in the
 * words of the person who named them. Staff of the Month in gold, Students of
 * the Month in iris.
 */
export function HonourCard({ honour, onRemove, className }: HonourCardProps) {
  const isStaff = honour.kind === 'staff_of_month';
  const Icon = isStaff ? Trophy : Medal;
  return (
    <Card
      as="article"
      isPlayful
      className={cn(
        'relative isolate flex flex-col gap-4 overflow-hidden p-6',
        isStaff ? 'border-star-200 bg-gradient-to-br from-star-50 via-white to-white' : 'border-iris-100 bg-gradient-to-br from-iris-50 via-white to-white',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('absolute -bottom-6 -right-4 -z-10 size-28 rotate-12', isStaff ? 'text-star-200/70' : 'text-iris-100')}
      />
      <div className="flex items-center justify-between gap-3">
        <p className={cn('inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider', isStaff ? 'text-star-800' : 'text-iris-700')}>
          <Icon className={cn('size-4', isStaff && 'fill-star-300')} />
          {HONOUR_KIND_LABELS[honour.kind]} · {formatMonth(honour.month)}
        </p>
        {onRemove ? (
          <Button variant="danger-quiet" size="sm" icon={Trash2} onClick={() => onRemove(honour)} aria-label={`Take down ${honour.honoree.fullName}`}>
            Remove
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <Avatar name={honour.honoree.fullName} size="lg" />
        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-tight text-ink">{honour.honoree.fullName}</h3>
          <p className="text-sm font-semibold text-ink-muted">{honour.honoree.className ? `Class ${honour.honoree.className}` : 'Teacher'}</p>
        </div>
      </div>
      <Quote size="sm" attribution={`Named by ${honour.awardedBy.fullName}`}>
        {honour.citation}
      </Quote>
    </Card>
  );
}

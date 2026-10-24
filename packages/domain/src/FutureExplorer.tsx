import { useId } from 'react';
import { Card, cn, Compass, Lightbulb } from '@evolveiq/ui';
import { pathwaysFor } from './future-explorer';
import { possessive } from './holistic-index';

export interface FutureExplorerProps {
  /** The strengths the Holistic Index names, strongest first. */
  strengths: string[];
  /** The child's first name. */
  name: string;
  audience: 'student' | 'family';
  className?: string;
}

/**
 * Where the child's strengths could lead: fields to look at and things to try.
 * Everything traces back to a strength the child has already shown. These are
 * ideas to explore, not predictions, and nothing here ranks or limits a child.
 */
export function FutureExplorer({ strengths, name, audience, className }: FutureExplorerProps) {
  const headingId = useId();
  const pathways = pathwaysFor(strengths);
  const title = audience === 'student' ? 'Where your strengths could take you' : `Where ${possessive(name)} strengths could lead`;

  return (
    <Card as="section" aria-labelledby={headingId} isPlayful className={cn('p-6', className)}>
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
        <Compass className="size-5 shrink-0 text-iris-500" />
        {title}
      </h2>
      <p className="mt-1 text-sm font-medium text-ink-muted">
        Ideas to explore, not predictions. Each one starts from something noticed about {audience === 'student' ? 'you' : name}.
      </p>

      {pathways.length === 0 ? (
        <p className="mt-5 text-sm font-medium text-ink-muted">
          {audience === 'student'
            ? 'Keep going. As more good things are noticed, ideas will show up here.'
            : `Still getting to know ${name}. As more good things are noticed, ideas will show up here.`}
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {pathways.map((pathway) => (
            <li key={pathway.strength} className="rounded-2xl border border-line-soft p-4">
              <p className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-faint">Because of</p>
              <h3 className="text-base font-black text-ink">{pathway.strength}</h3>
              <p className="mt-3 text-xs font-bold text-ink-muted">Fields to look at</p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {pathway.fields.map((field) => (
                  <li key={field} className="rounded-xl bg-iris-50 px-2.5 py-1 text-xs font-bold text-iris-700">
                    {field}
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                <Lightbulb className="size-3.5" /> Try this term
              </p>
              <ul className="mt-1.5 list-disc pl-5 text-sm font-medium leading-relaxed text-ink">
                {pathway.tryThis.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

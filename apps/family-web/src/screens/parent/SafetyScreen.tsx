import { Card, PageHeader, Phone, SectionTitle, Siren } from '@evolveiq/ui';

interface EmergencyLine {
  name: string;
  detail: string;
  number: string;
}

/** India's national helplines. These are public numbers, so they work without the backend. */
const LINES: EmergencyLine[] = [
  { name: 'Emergency (police, fire, ambulance)', detail: 'Any emergency, any phone', number: '112' },
  { name: 'Childline', detail: 'A child in trouble or at risk, 24 hours', number: '1098' },
  { name: 'Ambulance', detail: 'Medical help', number: '108' },
  { name: 'Police', detail: 'Immediate danger or a missing child', number: '100' },
];

/** The SOS tab: one tap to a helpline, and what to do first. */
export function SafetyScreen() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="SOS and safety"
        subtitle="If a child is in danger, call first. Tell the school afterwards."
      />

      <Card isPlayful className="flex items-center gap-4 border-2 border-coral-100 bg-coral-50 p-5">
        <Siren className="size-8 shrink-0 text-coral-700" />
        <p className="text-sm font-semibold text-ink">
          These numbers are free to call from any phone. In an emergency, call 112.
        </p>
      </Card>

      <section>
        <SectionTitle>Helplines</SectionTitle>
        <ul className="mt-3 flex flex-col gap-3">
          {LINES.map((line) => (
            <li key={line.number}>
              <Card isPlayful className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{line.name}</p>
                  <p className="text-sm text-ink-muted">{line.detail}</p>
                </div>
                <a
                  href={`tel:${line.number}`}
                  aria-label={`Call ${line.name} on ${line.number}`}
                  className="flex h-11 items-center gap-2 rounded-full bg-coral-700 px-5 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-700"
                >
                  <Phone className="size-4" />
                  {line.number}
                </a>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle>What to do first</SectionTitle>
        <Card isPlayful className="mt-3 p-5">
          <ol className="list-decimal space-y-2 pl-5 text-sm font-medium text-ink">
            <li>Make sure the child is safe and not alone.</li>
            <li>Call the right helpline above.</li>
            <li>Tell the school office what happened, once everyone is safe.</li>
          </ol>
        </Card>
      </section>
    </div>
  );
}

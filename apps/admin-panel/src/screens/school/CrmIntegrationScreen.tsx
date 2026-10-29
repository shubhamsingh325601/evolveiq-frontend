import { Link } from 'react-router-dom';
import { useClasses, useUserCounts } from '@evolveiq/api-client';
import {
  ArrowLeftRight,
  Backpack,
  Badge,
  Card,
  Clock,
  HeartHandshake,
  LayoutGrid,
  PageHeader,
  Plug,
  Presentation,
  RefreshCw,
  SectionTitle,
  ShieldCheck,
  StatTile,
  Webhook,
  type IconComponent,
} from '@evolveiq/ui';

const PLANNED: { icon: IconComponent; title: string; description: string }[] = [
  {
    icon: RefreshCw,
    title: 'Two-way sync',
    description:
      'Students, teachers, classes and parents stay in step with your CRM, so nobody types the same record twice.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Field matching',
    description: 'Match your CRM’s fields to EvolvIQ’s once, when you connect, and every sync follows it.',
  },
  {
    icon: Webhook,
    title: 'API keys and webhooks',
    description:
      'For your school’s developers: a key your CRM uses to call EvolvIQ, and a call back to your systems when a record changes.',
  },
  {
    icon: ShieldCheck,
    title: 'Only what you choose',
    description:
      'Names, classes and family links. Observations, counsellors’ notes and the Holistic Index are not part of it.',
  },
];

const BY_HAND: { label: string; to: string }[] = [
  { label: 'Students', to: '/school/students' },
  { label: 'Teachers', to: '/school/teachers' },
  { label: 'Classes', to: '/school/classes' },
  { label: 'Parents', to: '/school/parents' },
];

/**
 * CRM integration, announced as coming soon (client feedback, 28 Oct 2026).
 * Nothing here connects to anything yet and there is no control that pretends
 * to: it says what the integration will do, and counts the records it will
 * keep in step — the school's real numbers, from the lists it already has.
 */
export function CrmIntegrationScreen() {
  const counts = useUserCounts({
    students: { role: 'student' },
    teachers: { role: 'teacher' },
    parents: { role: 'parent' },
  });
  const classes = useClasses();
  const show = (value: number | undefined) => value ?? '–';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="CRM integration"
        subtitle="Connect EvolvIQ to the CRM your school already uses."
        actions={
          <Badge tone="pending" icon={Clock}>
            Coming soon
          </Badge>
        }
      />

      <Card className="relative isolate overflow-hidden bg-night p-6 text-white sm:p-8">
        <span
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-gradient-to-br from-iris-500/50 to-lilac-500/40 blur-3xl"
        />
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15">
          <Plug className="size-6" />
        </span>
        <h2 className="mt-5 max-w-xl text-2xl font-black tracking-tight sm:text-3xl">
          One set of records, in step with your CRM
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
          Today the records below are added here by hand. When the integration arrives, you will connect your CRM once
          and EvolvIQ will keep students, teachers, classes and parents in step through its API.
        </p>
      </Card>

      <section>
        <SectionTitle>What it will keep in step</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon={Backpack} label="Students" value={show(counts.students)} detail="At your school today" />
          <StatTile icon={Presentation} label="Teachers" value={show(counts.teachers)} detail="With an account" />
          <StatTile icon={LayoutGrid} tone="lilac" label="Classes" value={show(classes.data?.length)} detail="Students are placed in" />
          <StatTile icon={HeartHandshake} tone="jade" label="Parents" value={show(counts.parents)} detail="Following along" />
        </div>
      </section>

      <section>
        <SectionTitle>What the integration will do</SectionTitle>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {PLANNED.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <Card className="flex h-full gap-4 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-iris-50 text-iris-600 ring-1 ring-inset ring-iris-100">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black tracking-tight text-ink">{title}</h3>
                    <Badge tone="pending">Coming soon</Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-ink-muted">
        Until then,{' '}
        <Link to="/school/import" className="font-semibold text-iris-700 underline-offset-2 hover:underline">
          import a spreadsheet
        </Link>{' '}
        from your current system, or add and edit records by hand:{' '}
        {BY_HAND.map((item, index) => (
          <span key={item.to}>
            <Link to={item.to} className="font-semibold text-iris-700 underline-offset-2 hover:underline">
              {item.label}
            </Link>
            {index < BY_HAND.length - 2 ? ', ' : index === BY_HAND.length - 2 ? ' and ' : '.'}
          </span>
        ))}
      </p>
    </div>
  );
}

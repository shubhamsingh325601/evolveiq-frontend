import { Link } from 'react-router-dom';
import { useStudents } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { greetingFor } from '@evolveiq/domain';
import {
  buttonClasses,
  EmptyState,
  ErrorState,
  HeroPanel,
  LoadingState,
  Plus,
  UsersRound,
} from '@evolveiq/ui';
import { ChildCard } from '../../components/ChildCard';

const NAME_LIST = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });

export function ChildrenScreen() {
  const { user } = useAuth();
  const students = useStudents();

  if (students.isLoading) return <LoadingState label="Loading your children" />;
  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const children = students.data ?? [];
  const firstName = user?.name.split(' ')[0] ?? '';
  const childNames = NAME_LIST.format(
    children.map((child) => child.name.split(' ')[0] ?? child.name),
  );

  return (
    <div className="flex flex-col gap-10">
      <HeroPanel
        title={firstName ? `${greetingFor()}, ${firstName}` : greetingFor()}
        description={
          children.length === 0
            ? 'Once your school links your children to your account, they will appear here.'
            : `Here is what ${childNames} ${children.length === 1 ? 'is' : 'are'} working on, and what the people around them have noticed.`
        }
        actions={
          <Link to="/parent/observations/new" className={buttonClasses({ variant: 'inverse' })}>
            <Plus />
            Add an observation
          </Link>
        }
      />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">My children</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">
          Open a child to see what their school has noticed and what they are working on.
        </p>

        {children.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={UsersRound}
            title="No children linked to your account yet"
            description="Your school adds this link. Ask the school office if you were expecting to see someone here."
          />
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChildren, type Person } from '@evolveiq/api-client';
import { EmptyState, ErrorState, LoadingState, PageHeader, UsersRound } from '@evolveiq/ui';
import { ChildSwitcher } from './ChildSwitcher';

export interface ChildPickerPageProps {
  /** `/parent/health` and the like: the switcher links back here with `?child=`. */
  path: string;
  title: string;
  subtitle: (child: Person) => string;
  children: (child: Person) => ReactNode;
}

/**
 * A top-level tab that is about one child at a time (Health, Explore). It opens
 * on the first child and a switcher across the top moves between them, so the
 * tab bar needs no child in its address.
 */
export function ChildPickerPage({ path, title, subtitle, children: render }: ChildPickerPageProps) {
  const [params] = useSearchParams();
  const kids = useChildren();

  if (kids.isLoading) return <LoadingState label="Loading" />;
  if (kids.isError) return <ErrorState onRetry={() => void kids.refetch()} />;

  const list = kids.data ?? [];
  const child = list.find((candidate) => candidate.id === params.get('child')) ?? list[0];
  if (!child) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title={title} />
        <EmptyState
          icon={UsersRound}
          title="No children linked to your account yet"
          description="Your school adds this link. Ask the school office if you were expecting to see someone here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {list.length > 1 ? (
        <ChildSwitcher students={list} currentChildId={child.id} pathFor={(id) => `${path}?child=${id}`} />
      ) : null}
      <PageHeader title={title} subtitle={subtitle(child)} />
      {render(child)}
    </div>
  );
}

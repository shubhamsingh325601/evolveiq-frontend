import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppBottomNav } from './AppBottomNav';
import type { SidebarMenuSection } from './AppSidebar';

const PSYCHOLOGIST_MENU: SidebarMenuSection[] = [
  {
    items: [
      { label: 'Review queue', shortLabel: 'Queue', to: '/review-queue', badge: 4 },
      { label: 'Activity library', shortLabel: 'Library', to: '/activities' },
    ],
  },
  { kind: 'action', items: [{ label: 'New activity', to: '/activities/new' }] },
];

describe('AppBottomNav', () => {
  it('turns the same menu config into tabs, with the action raised in the middle', () => {
    render(
      <MemoryRouter initialEntries={['/review-queue']}>
        <AppBottomNav sections={PSYCHOLOGIST_MENU} />
      </MemoryRouter>,
    );

    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/review-queue',
      '/activities/new',
      '/activities',
    ]);
    expect(screen.getByRole('link', { name: 'New activity' })).toBeInTheDocument();
  });

  it('keeps the full label as the name when the tab shows a short one', () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AppBottomNav sections={PSYCHOLOGIST_MENU} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Activity library' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the waiting count on its tab', () => {
    render(
      <MemoryRouter>
        <AppBottomNav sections={PSYCHOLOGIST_MENU} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Review queue/ })).toHaveTextContent('4');
  });
});

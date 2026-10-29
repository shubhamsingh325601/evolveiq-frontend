import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { addDays, businessDate, type HealthProfile, type Honour, type Notice } from '@evolveiq/api-client';
import { AppBottomNav } from './AppBottomNav';
import type { SidebarMenuSection } from './AppSidebar';
import { AttendanceMeter } from './AttendanceMeter';
import { CareFlags } from './CareFlags';
import { CareNeedsCard } from './CareNeedsCard';
import { HealthProfileForm } from './HealthProfileForm';
import { HonourBanner } from './HonourBanner';
import { HonourWall } from './HonourWall';
import { NoticeBoard } from './NoticeBoard';

const PROFILE: HealthProfile = {
  studentId: 'stu-maya',
  conditions: ['asthma', 'on_medication'],
  bloodGroup: 'B+',
  allergies: 'Dust',
  medications: 'Blue inhaler before PE',
  careNotes: 'Let her sit out if she is wheezy.',
  emergencyContact: { name: 'Priya Ahluwalia', relation: 'Mother', phone: '+91 98765 43210' },
  updatedBy: { fullName: 'Priya Ahluwalia', role: 'parent' },
  updatedAt: '2026-10-09T09:00:00.000Z',
};

describe('health and care', () => {
  it('shows the conditions, what to do and a number to call', () => {
    render(<CareNeedsCard profile={PROFILE} name="Maya" audience="staff" />);
    expect(screen.getByRole('list', { name: 'Conditions' })).toHaveTextContent('AsthmaOn medication');
    expect(screen.getByText('Let her sit out if she is wheezy.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+91 98765 43210' })).toHaveAttribute('href', 'tel:+919876543210');
    expect(screen.getByText(/Last updated by Priya Ahluwalia \(parent\)/)).toBeInTheDocument();
  });

  it('invites the family to add something when nothing is recorded', () => {
    render(<CareNeedsCard profile={{ ...PROFILE, conditions: [], updatedAt: null, updatedBy: null }} name="Lila" audience="family" />);
    expect(screen.getByText(/Nothing recorded yet. Add anything the school should know about Lila/)).toBeInTheDocument();
  });

  it('flags a roster row only when something is recorded', () => {
    const { rerender } = render(<CareFlags conditions={['adhd', 'dyslexia', 'asthma']} />);
    expect(screen.getByText('ADHD')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    rerender(<CareFlags conditions={[]} />);
    expect(screen.getByText('None recorded')).toBeInTheDocument();
  });

  it('saves the whole profile, and asks for a phone with a contact', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<HealthProfileForm profile={undefined} name="Arjun" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('checkbox', { name: 'Severe allergy' }));
    await user.click(screen.getByRole('checkbox', { name: 'Diabetes' }));
    await user.type(screen.getByRole('textbox', { name: /Allergies/ }), 'Peanuts');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Priya');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Add a phone number/)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Phone' }), '+91 98765 43210');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({
      conditions: ['diabetes', 'severe_allergy'],
      bloodGroup: null,
      allergies: 'Peanuts',
      medications: null,
      careNotes: null,
      emergencyContact: { name: 'Priya', phone: '+91 98765 43210' },
    });
  });
});

describe('attendance', () => {
  it('reads as days in out of school days, and flags under 75%', () => {
    const { rerender } = render(<AttendanceMeter attended={18} recorded={26} period="this month" />);
    expect(screen.getByText('18/26')).toBeInTheDocument();
    expect(screen.getByText('69%')).toHaveClass('text-honey-700');
    rerender(<AttendanceMeter attended={24} recorded={25} />);
    expect(screen.getByText('96%')).toHaveClass('text-jade-700');
    rerender(<AttendanceMeter attended={0} recorded={0} />);
    expect(screen.getByText('No register yet')).toBeInTheDocument();
  });
});

const notice = (fields: Partial<Notice> & Pick<Notice, 'id' | 'category' | 'title'>): Notice => ({
  schoolId: 'sch-ridgeview',
  schoolName: 'Ridgeview Primary',
  body: null,
  startsOn: null,
  location: null,
  phone: null,
  audience: 'everyone',
  isPinned: false,
  createdBy: { fullName: 'Clara Fernandes' },
  createdAt: '2026-10-20T09:00:00.000Z',
  updatedAt: '2026-10-20T09:00:00.000Z',
  canManage: false,
  ...fields,
});

describe('the notice board', () => {
  const today = businessDate();
  const NOTICES = [
    notice({ id: 'policy', category: 'policy', title: 'Fire drills', schoolId: null, schoolName: null }),
    notice({ id: 'late', category: 'event', title: 'Science fair', startsOn: addDays(today, 20) }),
    notice({ id: 'soon', category: 'event', title: 'Sports Day', startsOn: addDays(today, 3), location: 'Main ground', canManage: true }),
    notice({ id: 'call', category: 'emergency_contact', title: 'Ambulance', phone: '108' }),
  ];

  it('puts numbers to call first, then what is coming up soonest first, then updates', () => {
    render(<NoticeBoard notices={NOTICES} />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Emergency contacts', 'Coming up2', 'Policies and updates']);
    expect(screen.getByRole('link', { name: 'Call Ambulance, 108' })).toHaveAttribute('href', 'tel:108');
    const upcoming = within(screen.getByRole('region', { name: /Coming up/ })).getAllByRole('heading', { level: 3 });
    expect(upcoming.map((h) => h.textContent)).toEqual(['Sports Day', 'Science fair']);
    expect(screen.getByText('Every school')).toBeInTheDocument();
  });

  it('offers edit and remove only on what the admin may manage', () => {
    const onEdit = vi.fn();
    render(<NoticeBoard notices={NOTICES} onEdit={onEdit} onRemove={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sports Day' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'soon' }));
  });
});

const honour = (fields: Partial<Honour> & Pick<Honour, 'id' | 'kind' | 'month'>): Honour => ({
  honoree: { id: 'usr-rao', fullName: 'Sunita Rao', role: 'teacher', className: null },
  citation: 'For the reading-buddies scheme.',
  awardedBy: { fullName: 'Clara Fernandes' },
  createdAt: '2026-10-20T09:00:00.000Z',
  ...fields,
});

describe('the celebration wall', () => {
  it('groups honours by month, newest first', () => {
    render(
      <HonourWall
        honours={[
          honour({ id: 'a', kind: 'staff_of_month', month: '2026-09' }),
          honour({
            id: 'b',
            kind: 'student_of_month',
            month: '2026-10',
            honoree: { id: 'stu-arjun', fullName: 'Arjun Ahluwalia', role: 'student', className: '4B' },
          }),
        ]}
      />,
    );
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['October 2026', 'September 2026']);
    expect(screen.getByText('Class 4B')).toBeInTheDocument();
  });

  it('congratulates the child, or their parent, in their own terms', () => {
    const arjun = honour({
      id: 'b',
      kind: 'student_of_month',
      month: '2026-10',
      honoree: { id: 'stu-arjun', fullName: 'Arjun Ahluwalia', role: 'student', className: '4B' },
    });
    const { rerender } = render(<HonourBanner honour={arjun} audience="self" />);
    expect(screen.getByRole('heading')).toHaveTextContent('You are Student of the Month for October 2026!');
    rerender(<HonourBanner honour={arjun} audience="family" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Arjun is Student of the Month for October 2026!');
  });
});

describe('a tab bar with more places than fit', () => {
  const ADMIN_MENU: SidebarMenuSection[] = [
    {
      items: ['Students', 'Teachers', 'Classes', 'Parents', 'Notice board', 'Staff reviews', 'Wall of fame'].map((label) => ({
        label,
        to: `/school/${label.toLowerCase().replace(/ /g, '-')}`,
      })),
    },
  ];

  it('keeps four tabs and puts the rest behind More', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/school/students']}>
        <AppBottomNav sections={ADMIN_MENU} />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation');
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    const more = within(nav).getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(within(nav).getByRole('link', { name: 'Wall of fame' })).toHaveAttribute('href', '/school/wall-of-fame');
    expect(within(nav).getAllByRole('link')).toHaveLength(7);
  });
});

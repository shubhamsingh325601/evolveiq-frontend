import { useState } from 'react';
import { isApiError, useSupportTickets, useUpdateSupportTicketStatus, type SupportTicket, type SupportTicketStatus } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { formatRelativeDay, RecordsTable, SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_STATUSES, type RecordsTableColumn } from '@evolveiq/domain';
import { Badge, Button, CircleHelp, ErrorState, Inbox, LifeBuoy, PageHeader, Plus, Select, StatTile, type BadgeTone } from '@evolveiq/ui';
import { NewTicketDialog } from '../components/NewTicketDialog';

const STATUS_TONE: Record<SupportTicketStatus, BadgeTone> = {
  open: 'pending',
  in_progress: 'reviewed',
  resolved: 'growth',
};

/**
 * The IT Help Desk — a gap found against the client's UI prototype (16 Nov
 * 2026), not yet a confirmed client request; the project owner asked for it
 * to be built anyway so it's ready to demo. A School Admin sees and manages
 * their own school's tickets; a Platform Admin every school's, with the
 * school named on each row. Teachers raise tickets from the school app;
 * School Admins can also raise their own from here.
 */
export function HelpDeskScreen() {
  const { user } = useAuth();
  const isPlatform = user?.role === 'platform_admin';
  const tickets = useSupportTickets();
  const updateStatus = useUpdateSupportTicketStatus();

  const [isCreating, setIsCreating] = useState(false);
  const [rowError, setRowError] = useState<string>();

  if (tickets.isError) return <ErrorState onRetry={() => void tickets.refetch()} />;
  const list = tickets.data ?? [];

  const changeStatus = async (ticket: SupportTicket, status: SupportTicketStatus) => {
    setRowError(undefined);
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status });
    } catch (caught) {
      setRowError(isApiError(caught) ? caught.message : `We could not change “${ticket.subject}”. Try again.`);
    }
  };

  const columns: RecordsTableColumn<SupportTicket>[] = [
    {
      id: 'subject',
      header: 'Ticket',
      sortValue: (ticket) => ticket.subject,
      cell: (ticket) => (
        <span className="block min-w-0">
          <span className="block font-bold text-ink">{ticket.subject}</span>
          {ticket.body ? <span className="block truncate text-xs text-ink-muted">{ticket.body}</span> : null}
        </span>
      ),
    },
    {
      id: 'raisedBy',
      header: 'Raised by',
      isSecondary: true,
      sortValue: (ticket) => ticket.raisedBy.fullName,
      cell: (ticket) => ticket.raisedBy.fullName,
    },
    ...(isPlatform
      ? [
          {
            id: 'school',
            header: 'School',
            isSecondary: true,
            sortValue: (ticket: SupportTicket) => ticket.schoolName,
            cell: (ticket: SupportTicket) => ticket.schoolName,
          } satisfies RecordsTableColumn<SupportTicket>,
        ]
      : []),
    {
      id: 'when',
      header: 'Raised',
      isSecondary: true,
      sortValue: (ticket) => ticket.createdAt,
      cell: (ticket) => formatRelativeDay(ticket.createdAt),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (ticket) => ticket.status,
      cell: (ticket) => <Badge tone={STATUS_TONE[ticket.status]}>{SUPPORT_TICKET_STATUS_LABELS[ticket.status]}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Help desk"
        subtitle={
          isPlatform
            ? 'IT tickets raised by teachers and school admins, across every school.'
            : 'IT tickets raised by your teachers, and by you.'
        }
        actions={
          <Button size="sm" icon={Plus} onClick={() => setIsCreating(true)}>
            New ticket
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={LifeBuoy} label="Tickets" value={list.length} detail={isPlatform ? 'Across every school' : 'At your school'} />
        <StatTile icon={Inbox} tone="honey" label="Open" value={list.filter((t) => t.status === 'open').length} detail="Not yet started" />
        <StatTile icon={CircleHelp} tone="lilac" label="In progress" value={list.filter((t) => t.status === 'in_progress').length} detail="Being worked on" />
        <StatTile icon={Inbox} tone="jade" label="Resolved" value={list.filter((t) => t.status === 'resolved').length} detail="Done" />
      </div>

      {rowError ? <ErrorState title="That did not save" description={rowError} /> : null}

      <RecordsTable
        caption="IT Help Desk tickets"
        rows={list}
        columns={columns}
        getRowId={(ticket) => ticket.id}
        searchableText={(ticket) => `${ticket.subject} ${ticket.body ?? ''} ${ticket.raisedBy.fullName} ${ticket.schoolName}`}
        searchPlaceholder="Search by subject or who raised it"
        isLoading={tickets.isLoading}
        rowActions={(ticket) =>
          ticket.canManage ? (
            <span className="inline-block max-w-40">
              <label className="sr-only" htmlFor={`${ticket.id}-status`}>
                Status of “{ticket.subject}”
              </label>
              <Select
                id={`${ticket.id}-status`}
                value={ticket.status}
                onChange={(event) => void changeStatus(ticket, event.target.value as SupportTicketStatus)}
                className="h-9 py-0 text-xs"
              >
                {SUPPORT_TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SUPPORT_TICKET_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </span>
          ) : null
        }
        emptyTitle="No tickets yet"
        emptyDescription="Nothing has been raised. Nice and quiet."
      />

      <NewTicketDialog isOpen={isCreating} onClose={() => setIsCreating(false)} />
    </div>
  );
}

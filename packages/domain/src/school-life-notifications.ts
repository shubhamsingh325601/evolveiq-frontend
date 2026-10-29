import { addDays, addMonths, businessDate, businessMonth, type Honour, type Notice } from '@evolveiq/api-client';
import { Medal, Megaphone, Trophy } from '@evolveiq/ui';
import { formatMonth } from './format-date';
import type { AppNotification } from './NotificationsMenu';
import { HONOUR_KIND_LABELS, NOTICE_CATEGORY_LABELS } from './school-life';

export interface SchoolLifeNotificationSources {
  notices: Notice[];
  honours: Honour[];
  /** Who is reading: their own honour is said to them ("You are…"). */
  viewerId: string;
  /** The reader's notice board. */
  noticesPath: string;
  /** Where an honour leads the reader. */
  honourPath: (honour: Honour) => string;
}

/** How far back a notice is still news. */
const NOTICE_NEWS_DAYS = 14;

/**
 * The bell's share of school life, for every app: new notices (not the standing
 * emergency numbers) and this or last month's honours — built from lists the
 * app already loads, like the rest of the bell.
 */
export function schoolLifeNotifications({ notices, honours, viewerId, noticesPath, honourPath }: SchoolLifeNotificationSources): AppNotification[] {
  const since = addDays(businessDate(), -NOTICE_NEWS_DAYS);
  const months = [businessMonth(), addMonths(businessMonth(), -1)];

  const noticeNews = notices
    .filter((notice) => notice.category !== 'emergency_contact' && businessDate(notice.createdAt) >= since)
    .map(
      (notice): AppNotification => ({
        id: `notice-${notice.id}`,
        title: `On the notice board: ${notice.title}`,
        detail: NOTICE_CATEGORY_LABELS[notice.category],
        at: notice.createdAt,
        to: noticesPath,
        tone: 'honey',
        icon: Megaphone,
      }),
    );

  const honourNews = honours
    .filter((honour) => months.includes(honour.month))
    .map((honour): AppNotification => {
      const title = HONOUR_KIND_LABELS[honour.kind];
      const isViewer = honour.honoree.id === viewerId;
      return {
        id: `honour-${honour.id}`,
        title: isViewer
          ? `You are ${title} for ${formatMonth(honour.month)}!`
          : `${honour.honoree.fullName} is ${title} for ${formatMonth(honour.month)}`,
        detail: honour.citation,
        at: honour.createdAt,
        to: honourPath(honour),
        tone: 'star',
        icon: honour.kind === 'staff_of_month' ? Trophy : Medal,
      };
    });

  return [...honourNews, ...noticeNews];
}

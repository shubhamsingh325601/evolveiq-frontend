import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HolisticIndex } from '@evolveiq/api-client';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Card,
  Check,
  cn,
  Download,
  Eyebrow,
  Lightbulb,
  SectionTitle,
  Share2,
  Target,
  TrendChart,
  TrendingUp,
} from '@evolveiq/ui';
import {
  firstNameOf,
  possessive,
  shortGrade,
  trendPointsFor,
  yearsTracked,
} from './holistic-index';
import { SkillProfileCard } from './SkillProfileCard';

export interface HolisticReportProps {
  studentName: string;
  index: HolisticIndex;
  /** Where the header's back link goes, and what it says. */
  back: { to: string; label: string };
}

const CHIP = 'rounded-lg border px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500';

/**
 * The Holistic Report Card: the EHI over every year it has been tracked, the
 * skill profile, strengths, a year-by-year card and the Growth Playbook. One
 * component for the parent's and the student's report, so the two can never
 * disagree. The year-by-year list doubles as the trajectory chart's table view.
 */
export function HolisticReport({ studentName, index, back }: HolisticReportProps) {
  const firstName = firstNameOf(studentName);
  const years = yearsTracked(index);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  useEffect(() => {
    if (!hasCopiedLink) return;
    const timer = window.setTimeout(() => setHasCopiedLink(false), 2400);
    return () => window.clearTimeout(timer);
  }, [hasCopiedLink]);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${possessive(firstName)} Holistic Report`,
          text: `${possessive(firstName)} EvolvIQ Holistic Index is ${index.score}.`,
          url,
        });
      } catch {
        // The share sheet was closed; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setHasCopiedLink(true);
    } catch {
      // No clipboard access either; the address bar still has the link.
    }
  };

  const newestFirst = [...index.history].reverse();

  return (
    <div className="flex flex-col">
      <header className="relative isolate -mx-4 -mt-6 overflow-hidden rounded-b-[2.5rem] bg-report px-6 pb-20 pt-6 text-white shadow-raised [print-color-adjust:exact] sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-10 sm:pb-24 sm:pt-8">
        <span
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-white/10 blur-3xl"
        />
        <Link
          to={back.to}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 print:hidden',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
          )}
        >
          <ArrowLeft className="size-3.5" />
          {back.label}
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow className="text-white/60">Deep-Time Report</Eyebrow>
            <h1 className="mt-1 text-[1.75rem] font-black leading-[2.125rem] tracking-tight sm:text-4xl">
              {possessive(firstName)} <br />
              Holistic Report
            </h1>
            <p className="mt-3 inline-block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-iris-100">
              Synthesised over {years} {years === 1 ? 'year' : 'years'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-5xl font-black leading-none tracking-tight text-jade-300 sm:text-6xl">
              {index.score}
              <span className="sr-only"> out of 100</span>
            </p>
            <Eyebrow className="ml-auto mt-2 max-w-[6.5rem] text-white/70 sm:max-w-none">
              EvolvIQ Holistic Index
            </Eyebrow>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-12 flex flex-col gap-8 sm:-mt-14">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Solid, not glass: these two sit over the header's gradient. */}
          <Card isPlayful className="bg-white p-6 shadow-raised">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
                <TrendingUp className="size-5 shrink-0 text-iris-600" />
                Trajectory
              </h2>
              <span className={cn(CHIP, 'border-iris-100 bg-iris-50 text-iris-700')}>
                {years} yr trend
              </span>
            </div>
            <TrendChart
              className="mt-4"
              points={trendPointsFor(index)}
              valueName="EHI"
              label={`${possessive(firstName)} EvolvIQ Holistic Index, year by year`}
            />
          </Card>

          <SkillProfileCard
            className="bg-white shadow-raised"
            title="Skill profile"
            icon={Target}
            iconClassName="text-jade-500"
            skills={index.skills}
            action={
              <span className={cn(CHIP, 'border-jade-100 bg-jade-50 text-jade-700')}>This term</span>
            }
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-6">
          <section className="lg:col-span-7">
            <SectionTitle icon={Award} iconClassName="text-coral-500">
              Top strengths and subjects
            </SectionTitle>
            <ul className="mt-3 flex flex-wrap gap-2">
              {index.strengths.map((strength) => (
                <li
                  key={strength}
                  className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink-muted shadow-card"
                >
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-coral-500" />
                  {strength}
                </li>
              ))}
            </ul>
          </section>

          <section className="lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1">
            <SectionTitle icon={CalendarDays}>Annual Report Card</SectionTitle>
            <Card isPlayful className="mt-3 overflow-hidden">
              <ul className="divide-y divide-line-soft">
                {newestFirst.map((year) => (
                  <li
                    key={year.schoolYear}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-iris-100 bg-iris-50 text-sm font-black text-iris-600">
                        {shortGrade(year.grade)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] font-bold text-ink">
                          Overall growth
                          <span className="sr-only">, {year.grade}</span>
                        </p>
                        <Eyebrow className="mt-0.5">
                          {year.isCurrent
                            ? `${year.schoolYear} · so far this year`
                            : `${year.schoolYear} · end of year`}
                        </Eyebrow>
                      </div>
                    </div>
                    <p className="flex shrink-0 items-baseline gap-1 text-2xl font-black text-iris-600">
                      {year.score}
                      <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-faint">
                        EHI
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section className="lg:col-span-7">
            <SectionTitle icon={Lightbulb} iconClassName="fill-honey-300 text-honey-500">
              Growth Playbook
            </SectionTitle>
            <ol className="mt-3 flex flex-col gap-3">
              {index.playbook.map((step, position) => (
                <Card as="li" isPlayful key={step} className="flex items-start gap-4 p-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-honey-100 bg-honey-50 text-sm font-black text-honey-700">
                    {position + 1}
                  </span>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-ink-muted">{step}</p>
                </Card>
              ))}
            </ol>
          </section>

          <div className="grid grid-cols-2 gap-4 print:hidden lg:col-span-7">
            <button
              type="button"
              onClick={() => window.print()}
              className={cn(
                'flex h-14 items-center justify-center gap-2 rounded-2xl bg-night text-sm font-bold text-white shadow-raised transition-transform active:scale-[0.97]',
                FOCUS_RING,
              )}
            >
              <Download className="size-4" />
              Save as PDF
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className={cn(
                'flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white text-sm font-bold text-ink shadow-card transition-transform active:scale-[0.97]',
                FOCUS_RING,
              )}
            >
              {hasCopiedLink ? (
                <>
                  <Check className="size-4 text-jade-600" strokeWidth={2.5} />
                  Link copied
                </>
              ) : (
                <>
                  <Share2 className="size-4" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

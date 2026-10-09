import { useMemo, useState } from 'react';
import type { Activity, ActivityResponse, ActivityStep } from '@evolveiq/api-client';
import { Button, Card, ChevronLeft, cn } from '@evolveiq/ui';
import {
  ImagePickRenderer,
  McqRenderer,
  MediaResponseRenderer,
  RatingRenderer,
  TextRenderer,
  type StepValue,
} from './activity-renderers';

/**
 * One player shell for every activity type.
 *
 * The shell owns progress, answers, validation and the Back/Next controls;
 * each step kind only has to render its own input. Adding a sixth type means
 * writing one renderer and adding a line to `renderStep` — never a new player.
 */

export interface ActivityPlayerProps {
  activity: Activity;
  onComplete: (responses: ActivityResponse[]) => void | Promise<unknown>;
  onExit?: () => void;
  isSubmitting?: boolean;
}

function renderStep(
  step: ActivityStep,
  value: StepValue | undefined,
  onChange: (value: StepValue) => void,
) {
  switch (step.kind) {
    case 'mcq':
      return <McqRenderer step={step} value={value} onChange={onChange} />;
    case 'text':
      return <TextRenderer step={step} value={value} onChange={onChange} />;
    case 'image-pick':
      return <ImagePickRenderer step={step} value={value} onChange={onChange} />;
    case 'rating':
      return <RatingRenderer step={step} value={value} onChange={onChange} />;
    case 'media-response':
      return <MediaResponseRenderer step={step} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function hasAnswer(value: StepValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function ActivityPlayer({
  activity,
  onComplete,
  onExit,
  isSubmitting = false,
}: ActivityPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StepValue>>({});

  const step = activity.steps[stepIndex];
  const isLastStep = stepIndex === activity.steps.length - 1;
  const currentValue = step ? answers[step.id] : undefined;
  const canContinue = hasAnswer(currentValue);

  const responses = useMemo<ActivityResponse[]>(
    () =>
      activity.steps
        .filter((activityStep) => answers[activityStep.id] !== undefined)
        .map((activityStep) => ({
          stepId: activityStep.id,
          value: answers[activityStep.id] as StepValue,
        })),
    [activity.steps, answers],
  );

  if (!step) {
    return <p className="text-sm text-ink-muted">This activity has no steps yet.</p>;
  }

  const goBack = () => setStepIndex((index) => Math.max(0, index - 1));
  const goNext = () => {
    if (isLastStep) {
      void onComplete(responses);
      return;
    }
    setStepIndex((index) => Math.min(activity.steps.length - 1, index + 1));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2" aria-hidden="true">
          {activity.steps.map((activityStep, index) => (
            <span
              key={activityStep.id}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors duration-300',
                index < stepIndex && 'bg-jade-400',
                index === stepIndex && 'bg-iris-500',
                index > stepIndex && 'bg-iris-100',
              )}
            />
          ))}
        </div>
        <p className="mt-3 text-sm font-medium text-ink-muted">
          Step {stepIndex + 1} of {activity.steps.length}
        </p>
      </div>

      <Card isPlayful className="p-6 sm:p-8">
        <h2 className="max-w-prose text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {step.prompt}
        </h2>
        <div className="mt-6">
          {renderStep(step, currentValue, (value) =>
            setAnswers((previous) => ({ ...previous, [step.id]: value })),
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {stepIndex > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            isPlayful
            icon={ChevronLeft}
            onClick={goBack}
          >
            Back
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          isPlayful
          onClick={goNext}
          disabled={!canContinue}
          isLoading={isSubmitting}
        >
          {isLastStep ? 'Finish activity' : 'Next'}
        </Button>
        {!canContinue ? (
          <p className="text-sm text-ink-muted">Answer this one to carry on.</p>
        ) : null}
        {onExit ? (
          <Button
            type="button"
            variant="quiet"
            size="lg"
            className="sm:ml-auto"
            onClick={onExit}
          >
            Save and come back later
          </Button>
        ) : null}
      </div>
    </div>
  );
}

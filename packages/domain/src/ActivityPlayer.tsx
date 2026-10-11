import { useState } from 'react';
import type { ActivityAnswer, ActivityContent } from '@evolveiq/api-client';
import { Button, Card } from '@evolveiq/ui';
import { isAnswerComplete } from './activity-answers';
import {
  ImagePickRenderer,
  McqRenderer,
  MediaResponseRenderer,
  RatingRenderer,
  TextRenderer,
} from './activity-renderers';

/**
 * One player shell for every activity type.
 *
 * The shell owns the question, the answer so far, the check that there is an
 * answer, and the controls; each type only renders its own input. Adding a
 * sixth type means writing one renderer and one line in `renderContent` —
 * never a new player.
 */

export interface ActivityPlayerProps {
  activity: { title: string; content: ActivityContent };
  onComplete: (answer: ActivityAnswer) => void | Promise<unknown>;
  onExit?: () => void;
  isSubmitting?: boolean;
  /** Shown beside the controls when the answer could not be saved. */
  submitError?: string;
}

function renderContent(
  content: ActivityContent,
  answer: ActivityAnswer | undefined,
  onAnswer: (answer: ActivityAnswer) => void,
) {
  // An answer of another type (impossible from these renderers) counts as none.
  const own = <T extends ActivityAnswer['type']>(type: T) =>
    answer?.type === type ? (answer as Extract<ActivityAnswer, { type: T }>) : undefined;
  switch (content.type) {
    case 'mcq':
      return <McqRenderer content={content} answer={own('mcq')} onAnswer={onAnswer} />;
    case 'text':
      return <TextRenderer content={content} answer={own('text')} onAnswer={onAnswer} />;
    case 'image_pick':
      return <ImagePickRenderer content={content} answer={own('image_pick')} onAnswer={onAnswer} />;
    case 'rating':
      return <RatingRenderer content={content} answer={own('rating')} onAnswer={onAnswer} />;
    case 'media_response':
      return <MediaResponseRenderer content={content} answer={own('media_response')} onAnswer={onAnswer} />;
    default:
      return null;
  }
}

export function ActivityPlayer({
  activity,
  onComplete,
  onExit,
  isSubmitting = false,
  submitError,
}: ActivityPlayerProps) {
  const [answer, setAnswer] = useState<ActivityAnswer>();
  const canFinish = answer !== undefined && isAnswerComplete(answer);

  const finish = () => {
    if (!answer || !canFinish) return;
    // Free text goes up trimmed, as the backend stores it.
    const cleaned: ActivityAnswer =
      answer.type === 'text' || answer.type === 'media_response' ? { ...answer, text: answer.text.trim() } : answer;
    void onComplete(cleaned);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card isPlayful className="p-6 sm:p-8">
        <h2 className="max-w-prose text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {activity.content.prompt}
        </h2>
        <div className="mt-6">{renderContent(activity.content, answer, setAnswer)}</div>
      </Card>

      {submitError ? (
        <p role="alert" className="text-sm text-coral-700">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" isPlayful onClick={finish} disabled={!canFinish} isLoading={isSubmitting}>
          Finish activity
        </Button>
        {!canFinish ? <p className="text-sm text-ink-muted">Answer this one to finish.</p> : null}
        {onExit ? (
          <Button type="button" variant="quiet" size="lg" className="sm:ml-auto" onClick={onExit}>
            Come back later
          </Button>
        ) : null}
      </div>
    </div>
  );
}

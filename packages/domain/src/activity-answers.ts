import type { ActivityAnswer, ActivityContent } from '@evolveiq/api-client';

/** True once an answer is something the backend will take: a choice, a rating, or some words. */
export function isAnswerComplete(answer: ActivityAnswer): boolean {
  switch (answer.type) {
    case 'mcq':
    case 'image_pick':
      return answer.optionId.length > 0;
    case 'rating':
      return Number.isInteger(answer.rating) && answer.rating >= 1 && answer.rating <= 5;
    case 'text':
    case 'media_response':
      return answer.text.trim().length > 0;
    default:
      return false;
  }
}

/**
 * A student's answer in words, for the staff who look at it. Pass the
 * activity's content when it is known, so a choice reads as its label.
 */
export function describeAnswer(answer: ActivityAnswer, content?: ActivityContent): string {
  switch (answer.type) {
    case 'mcq':
    case 'image_pick': {
      const options: { id: string; label?: string }[] =
        content && 'options' in content ? content.options : [];
      const label = options.find((option) => option.id === answer.optionId)?.label;
      return label ? `Chose “${label}”` : 'Chose one of the options';
    }
    case 'rating':
      return `Rated it ${answer.rating} out of 5`;
    case 'text':
    case 'media_response':
      return answer.text;
    default:
      return '';
  }
}

/**
 * The scripted guide's whole "understanding": which prepared topic a typed
 * question is about. Words are compared whole, so "art" never matches "start".
 */

export interface AssistantTopic {
  id: string;
  /** What the person taps, and what the conversation shows they asked. */
  question: string;
  /** Words or short phrases that bring a typed question to this topic. */
  keywords: string[];
  /** The reply, written in advance and filled from data the app already has. */
  answer: string;
  /** Somewhere to go next, such as the full report. */
  link?: { label: string; to: string };
}

export interface AssistantSafetyReply {
  /** Words that mean a person, not a guide, should hear this. Checked first. */
  keywords: string[];
  answer: string;
  link?: { label: string; to: string };
}

/** Lower case, letters and digits only, single spaces, padded: " how is maya doing ". */
function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

function mentions(text: string, keyword: string): boolean {
  return normalise(text).includes(normalise(keyword));
}

export function needsSafetyReply(text: string, safety: AssistantSafetyReply | undefined): boolean {
  return Boolean(safety?.keywords.some((keyword) => mentions(text, keyword)));
}

/** The topic whose keywords the text mentions most; the earlier topic wins a tie; none if nothing matches. */
export function matchTopic(text: string, topics: readonly AssistantTopic[]): AssistantTopic | undefined {
  let best: AssistantTopic | undefined;
  let bestScore = 0;
  for (const topic of topics) {
    const score = topic.keywords.filter((keyword) => mentions(text, keyword)).length;
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best;
}

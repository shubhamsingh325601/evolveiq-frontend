import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateActivity } from '@evolveiq/api-client';
import type { ActivityStep, ActivityStepKind, DevelopmentArea } from '@evolveiq/api-client';
import {
  ACTIVITY_STEP_LABELS,
  BackLink,
  DEVELOPMENT_AREA_LABELS,
  DEVELOPMENT_AREAS,
} from '@evolveiq/domain';
import {
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Plus,
  Select,
  Textarea,
  X,
} from '@evolveiq/ui';

/**
 * Activity authoring as a plain form — the PRD rules out a drag-and-drop
 * builder for the MVP, so steps are added and removed in order.
 */

interface DraftStep {
  key: string;
  kind: ActivityStepKind;
  prompt: string;
  /** MCQ and image-pick options, one per line. */
  optionsText: string;
  lowLabel: string;
  highLabel: string;
  mediaUrl: string;
  mediaType: 'image' | 'audio' | 'video';
  responsePrompt: string;
  placeholder: string;
}

let draftKeyCounter = 0;
function newDraftStep(): DraftStep {
  draftKeyCounter += 1;
  return {
    key: `draft-${draftKeyCounter}`,
    kind: 'mcq',
    prompt: '',
    optionsText: '',
    lowLabel: 'Hard',
    highLabel: 'Easy',
    mediaUrl: '',
    mediaType: 'image',
    responsePrompt: '',
    placeholder: '',
  };
}

function toActivityStep(draft: DraftStep, index: number): ActivityStep | null {
  const id = `step-${index + 1}`;
  const options = draft.optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  switch (draft.kind) {
    case 'mcq':
      if (options.length < 2) return null;
      return {
        id,
        kind: 'mcq',
        prompt: draft.prompt,
        options: options.map((label, optionIndex) => ({
          id: `${id}-o${optionIndex + 1}`,
          label,
        })),
      };
    case 'image-pick':
      if (options.length < 2) return null;
      return {
        id,
        kind: 'image-pick',
        prompt: draft.prompt,
        options: options.map((line, optionIndex) => {
          const [label = line, imageUrl = ''] = line.split('|').map((part) => part.trim());
          return { id: `${id}-o${optionIndex + 1}`, label, imageUrl };
        }),
      };
    case 'text':
      return {
        id,
        kind: 'text',
        prompt: draft.prompt,
        ...(draft.placeholder ? { placeholder: draft.placeholder } : {}),
      };
    case 'rating':
      return {
        id,
        kind: 'rating',
        prompt: draft.prompt,
        lowLabel: draft.lowLabel,
        highLabel: draft.highLabel,
      };
    case 'media-response':
      if (!draft.mediaUrl) return null;
      return {
        id,
        kind: 'media-response',
        prompt: draft.prompt,
        mediaType: draft.mediaType,
        mediaUrl: draft.mediaUrl,
        responsePrompt: draft.responsePrompt || 'What did you notice?',
      };
    default:
      return null;
  }
}

export function NewActivityScreen() {
  const navigate = useNavigate();
  const createActivity = useCreateActivity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<DevelopmentArea>('focus-and-attention');
  const [ageRange, setAgeRange] = useState('6-9');
  const [estimatedMinutes, setEstimatedMinutes] = useState('6');
  const [drafts, setDrafts] = useState<DraftStep[]>([newDraftStep()]);
  const [error, setError] = useState<string>();

  const updateDraft = (key: string, changes: Partial<DraftStep>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...changes } : draft)),
    );
  };

  const save = async () => {
    setError(undefined);

    if (title.trim().length < 3) {
      setError('Give the activity a title.');
      return;
    }

    const steps = drafts
      .map((draft, index) => (draft.prompt.trim() ? toActivityStep(draft, index) : null))
      .filter((step): step is ActivityStep => step !== null);

    if (steps.length === 0) {
      setError('Add at least one step with a question, and the options it needs.');
      return;
    }

    try {
      await createActivity.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        area,
        ageRange,
        estimatedMinutes: Number(estimatedMinutes) || 5,
        steps,
      });
      navigate('/activities');
    } catch {
      setError('We could not save that activity. Try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<BackLink to="/activities">Activity library</BackLink>}
        title="New activity"
        subtitle="Write the questions a student will work through, in order."
      />

      <Card as="section" isPlayful className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <h2 className="text-lg font-black tracking-tight text-ink sm:col-span-2">
          About the activity
        </h2>
        <FormField label="Title" className="sm:col-span-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sort the morning"
          />
        </FormField>

        <FormField
          label="What it is for"
          hint="Plain language — a parent may read this."
          className="sm:col-span-2"
        >
          <Textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Puts four steps of a morning routine in order and explains the choice."
          />
        </FormField>

        <FormField label="Development area">
          <Select
            value={area}
            onChange={(event) => setArea(event.target.value as DevelopmentArea)}
          >
            {DEVELOPMENT_AREAS.map((value) => (
              <option key={value} value={value}>
                {DEVELOPMENT_AREA_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-5">
          <FormField label="Ages">
            <Input value={ageRange} onChange={(event) => setAgeRange(event.target.value)} />
          </FormField>
          <FormField label="Minutes">
            <Input
              type="number"
              min={1}
              max={60}
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
            />
          </FormField>
        </div>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-black tracking-tight text-ink">Steps</h2>
          <p className="text-sm text-ink-muted">Students work through these in order.</p>
        </div>

        {drafts.map((draft, index) => (
          <Card key={draft.key} isPlayful className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-3 text-base font-bold text-ink">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-iris-50 text-sm font-semibold tabular-nums text-iris-700 ring-1 ring-iris-100"
                >
                  {index + 1}
                </span>
                <span>
                  <span className="sr-only">Step {index + 1}: </span>
                  {ACTIVITY_STEP_LABELS[draft.kind]}
                </span>
              </p>
              {drafts.length > 1 ? (
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  icon={X}
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((candidate) => candidate.key !== draft.key),
                    )
                  }
                >
                  Remove
                </Button>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Type">
                <Select
                  value={draft.kind}
                  onChange={(event) =>
                    updateDraft(draft.key, { kind: event.target.value as ActivityStepKind })
                  }
                >
                  {(Object.keys(ACTIVITY_STEP_LABELS) as ActivityStepKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {ACTIVITY_STEP_LABELS[kind]}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Question" className="sm:col-span-2">
                <Input
                  value={draft.prompt}
                  onChange={(event) => updateDraft(draft.key, { prompt: event.target.value })}
                  placeholder="Which one comes first in the morning?"
                />
              </FormField>

              {draft.kind === 'mcq' ? (
                <FormField label="Answers, one per line" className="sm:col-span-2">
                  <Textarea
                    rows={4}
                    value={draft.optionsText}
                    onChange={(event) =>
                      updateDraft(draft.key, { optionsText: event.target.value })
                    }
                    placeholder={'Wake up\nEat breakfast\nPack the bag'}
                  />
                </FormField>
              ) : null}

              {draft.kind === 'image-pick' ? (
                <FormField
                  label="Answers, one per line"
                  hint="Write the label, then a vertical bar, then the image address."
                  className="sm:col-span-2"
                >
                  <Textarea
                    rows={4}
                    value={draft.optionsText}
                    onChange={(event) =>
                      updateDraft(draft.key, { optionsText: event.target.value })
                    }
                    placeholder={'Sad | https://…/sad.png\nHappy | https://…/happy.png'}
                  />
                </FormField>
              ) : null}

              {draft.kind === 'text' ? (
                <FormField label="Placeholder" isOptional className="sm:col-span-2">
                  <Input
                    value={draft.placeholder}
                    onChange={(event) =>
                      updateDraft(draft.key, { placeholder: event.target.value })
                    }
                    placeholder="It was when..."
                  />
                </FormField>
              ) : null}

              {draft.kind === 'rating' ? (
                <>
                  <FormField label="Label for 1">
                    <Input
                      value={draft.lowLabel}
                      onChange={(event) =>
                        updateDraft(draft.key, { lowLabel: event.target.value })
                      }
                    />
                  </FormField>
                  <FormField label="Label for 5">
                    <Input
                      value={draft.highLabel}
                      onChange={(event) =>
                        updateDraft(draft.key, { highLabel: event.target.value })
                      }
                    />
                  </FormField>
                </>
              ) : null}

              {draft.kind === 'media-response' ? (
                <>
                  <FormField label="Media type">
                    <Select
                      value={draft.mediaType}
                      onChange={(event) =>
                        updateDraft(draft.key, {
                          mediaType: event.target.value as DraftStep['mediaType'],
                        })
                      }
                    >
                      <option value="image">Image</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                    </Select>
                  </FormField>
                  <FormField label="Media address">
                    <Input
                      value={draft.mediaUrl}
                      onChange={(event) =>
                        updateDraft(draft.key, { mediaUrl: event.target.value })
                      }
                      placeholder="https://…"
                    />
                  </FormField>
                  <FormField label="What to answer afterwards" className="sm:col-span-2">
                    <Input
                      value={draft.responsePrompt}
                      onChange={(event) =>
                        updateDraft(draft.key, { responsePrompt: event.target.value })
                      }
                      placeholder="What were the three things, in order?"
                    />
                  </FormField>
                </>
              ) : null}
            </div>
          </Card>
        ))}

        <div>
          <Button
            type="button"
            variant="secondary"
            icon={Plus}
            onClick={() => setDrafts((current) => [...current, newDraftStep()])}
          >
            Add another step
          </Button>
        </div>
      </section>

      {error ? <ErrorState title="Check the activity" description={error} /> : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-6">
        <Button size="lg" onClick={() => void save()} isLoading={createActivity.isPending}>
          Save activity
        </Button>
        <Button variant="quiet" size="lg" onClick={() => navigate('/activities')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

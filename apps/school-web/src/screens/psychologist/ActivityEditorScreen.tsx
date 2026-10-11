import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  isApiError,
  useActivity,
  useCreateActivity,
  useUpdateActivity,
  type Activity,
  type ActivityContent,
  type ActivityType,
} from '@evolveiq/api-client';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, BackLink } from '@evolveiq/domain';
import {
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  Lock,
  PageHeader,
  Plus,
  Select,
  Textarea,
  X,
} from '@evolveiq/ui';

/**
 * Activity authoring as a plain form — the PRD rules out a drag-and-drop
 * builder. An activity is one question of one of five types. Once it has been
 * assigned, its type and options are frozen (the backend refuses a change),
 * so the form locks them and says why; the title and question stay editable.
 */

interface DraftOption {
  /** Kept from the stored activity when editing, so answers still point at it. */
  id: string;
  label: string;
  imageUrl: string;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const OPTION_IDS = 'abcdefghijklmnopqrstuvwxyz';
const isHttpUrl = (value: string) => /^https?:\/\/\S+$/.test(value.trim());

const TYPE_HINTS: Record<ActivityType, string> = {
  mcq: 'The student picks one answer. There is no right answer and no score.',
  text: 'The student writes an answer.',
  image_pick: 'The student picks one picture. Pictures are web addresses.',
  rating: 'The student picks a whole number from 1 to 5. Say in the question what 1 and 5 mean.',
  media_response: 'The student watches, listens to or looks at something, then writes an answer.',
};

function nextOptionId(options: DraftOption[]): string {
  return OPTION_IDS.split('').find((letter) => !options.some((option) => option.id === letter)) ?? `o${options.length + 1}`;
}

function blankOptions(): DraftOption[] {
  return [
    { id: 'a', label: '', imageUrl: '' },
    { id: 'b', label: '', imageUrl: '' },
  ];
}

function draftFrom(activity: Activity) {
  const { content } = activity;
  return {
    title: activity.title,
    type: content.type,
    prompt: content.prompt,
    options:
      'options' in content
        ? content.options.map((option) => ({
            id: option.id,
            label: option.label ?? '',
            imageUrl: 'imageUrl' in option ? option.imageUrl : '',
          }))
        : blankOptions(),
    mediaUrl: content.type === 'media_response' ? content.mediaUrl : '',
  };
}

/** Builds the content the backend expects, or says what is missing. */
function buildContent(
  type: ActivityType,
  prompt: string,
  options: DraftOption[],
  mediaUrl: string,
): { content?: ActivityContent; problem?: string } {
  const question = prompt.trim();
  if (!question) return { problem: 'Write the question the student will answer.' };
  switch (type) {
    case 'mcq': {
      if (options.length < MIN_OPTIONS) return { problem: `Give at least ${MIN_OPTIONS} answers to choose from.` };
      if (options.some((option) => !option.label.trim())) return { problem: 'Every answer needs some words.' };
      return { content: { type, prompt: question, options: options.map((option) => ({ id: option.id, label: option.label.trim() })) } };
    }
    case 'image_pick': {
      if (options.length < MIN_OPTIONS) return { problem: `Give at least ${MIN_OPTIONS} pictures to choose from.` };
      if (options.some((option) => !isHttpUrl(option.imageUrl))) {
        return { problem: 'Every picture needs a web address starting with http:// or https://.' };
      }
      return {
        content: {
          type,
          prompt: question,
          options: options.map((option) => ({
            id: option.id,
            imageUrl: option.imageUrl.trim(),
            ...(option.label.trim() ? { label: option.label.trim() } : {}),
          })),
        },
      };
    }
    case 'media_response':
      if (!isHttpUrl(mediaUrl)) return { problem: 'Add the web address of the video, audio or picture.' };
      return { content: { type, prompt: question, mediaUrl: mediaUrl.trim() } };
    case 'text':
    case 'rating':
      return { content: { type, prompt: question } };
  }
}

export function ActivityEditorScreen() {
  const { activityId } = useParams<{ activityId: string }>();
  const isEditing = Boolean(activityId);
  const navigate = useNavigate();
  const existing = useActivity(activityId);
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('mcq');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<DraftOption[]>(blankOptions);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSeeded, setIsSeeded] = useState(!isEditing);
  const [error, setError] = useState<string>();

  // Fill the form once, when the activity being edited arrives.
  useEffect(() => {
    if (isSeeded || !existing.data) return;
    const draft = draftFrom(existing.data);
    setTitle(draft.title);
    setType(draft.type);
    setPrompt(draft.prompt);
    setOptions(draft.options);
    setMediaUrl(draft.mediaUrl);
    setIsSeeded(true);
  }, [existing.data, isSeeded]);

  if (isEditing && existing.isLoading) return <LoadingState label="Opening the activity" />;
  if (isEditing && (existing.isError || !existing.data)) {
    return (
      <ErrorState
        title="We could not open that activity"
        description="It may have been archived. Go back to the library."
        onRetry={() => navigate('/activities')}
      />
    );
  }

  const isFrozen = Boolean(existing.data?.isAssigned);
  const hasOptions = type === 'mcq' || type === 'image_pick';
  const isSaving = createActivity.isPending || updateActivity.isPending;

  const updateOption = (id: string, changes: Partial<DraftOption>) =>
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, ...changes } : option)));

  const save = async () => {
    setError(undefined);
    if (!title.trim()) {
      setError('Give the activity a title.');
      return;
    }
    const { content, problem } = buildContent(type, prompt, options, mediaUrl);
    if (!content) {
      setError(problem);
      return;
    }
    try {
      if (activityId) {
        await updateActivity.mutateAsync({ activityId, changes: { title: title.trim(), content } });
      } else {
        await createActivity.mutateAsync({ title: title.trim(), content });
      }
      navigate('/activities');
    } catch (caught) {
      if (isApiError(caught) && caught.status === 409) {
        setError('This activity has been assigned, so its type and options can’t change. Archive it and write a new one.');
      } else if (isApiError(caught) && caught.fieldIssues.length > 0) {
        setError(caught.fieldIssues.map((issue) => `${issue.field}: ${issue.message}`).join('. '));
      } else {
        setError('We could not save that activity. Try again.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<BackLink to="/activities">Activity library</BackLink>}
        title={isEditing ? 'Edit activity' : 'New activity'}
        subtitle="One question, of one of five types. Students answer it once."
      />

      <Card as="section" isPlayful className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <h2 className="text-lg font-black tracking-tight text-ink sm:col-span-2">About the activity</h2>
        <FormField label="Title" className="sm:col-span-2">
          <Input
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sort the morning"
          />
        </FormField>

        <FormField label="Type" hint={TYPE_HINTS[type]} className="sm:col-span-2">
          <Select
            value={type}
            disabled={isFrozen}
            onChange={(event) => setType(event.target.value as ActivityType)}
          >
            {ACTIVITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {ACTIVITY_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        {isFrozen ? (
          <p className="flex items-start gap-2.5 rounded-xl bg-iris-50/80 px-4 py-3 text-sm text-iris-800 sm:col-span-2">
            <Lock className="mt-0.5 size-4 shrink-0" />
            This activity has been assigned, so its type and options are fixed. You can still change the
            title and the question. To change the rest, archive it and write a new one.
          </p>
        ) : null}
      </Card>

      <Card as="section" isPlayful className="flex flex-col gap-5 p-6 sm:p-8">
        <h2 className="text-lg font-black tracking-tight text-ink">The question</h2>
        <FormField label="Question">
          <Textarea
            rows={3}
            maxLength={1000}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={type === 'rating' ? 'How tricky was today? 1 is very easy, 5 is very hard.' : 'Which one comes first in the morning?'}
          />
        </FormField>

        {hasOptions ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">{type === 'mcq' ? 'Answers to choose from' : 'Pictures to choose from'}</p>
            {options.map((option, index) => (
              <div key={option.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <FormField label={type === 'mcq' ? `Answer ${index + 1}` : `Label for picture ${index + 1}`} isOptional={type === 'image_pick'}>
                  <Input
                    value={option.label}
                    disabled={isFrozen}
                    maxLength={200}
                    onChange={(event) => updateOption(option.id, { label: event.target.value })}
                  />
                </FormField>
                {type === 'image_pick' ? (
                  <FormField label={`Picture ${index + 1} address`}>
                    <Input
                      type="url"
                      value={option.imageUrl}
                      disabled={isFrozen}
                      placeholder="https://…"
                      onChange={(event) => updateOption(option.id, { imageUrl: event.target.value })}
                    />
                  </FormField>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  icon={X}
                  disabled={isFrozen || options.length <= MIN_OPTIONS}
                  onClick={() => setOptions((current) => current.filter((candidate) => candidate.id !== option.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="secondary"
                icon={Plus}
                disabled={isFrozen || options.length >= MAX_OPTIONS}
                onClick={() =>
                  setOptions((current) => [...current, { id: nextOptionId(current), label: '', imageUrl: '' }])
                }
              >
                Add another
              </Button>
            </div>
          </div>
        ) : null}

        {type === 'media_response' ? (
          <FormField
            label="Media address"
            hint="A link to a video (.mp4, .webm), audio (.mp3) or picture. There is no upload in this version."
          >
            <Input type="url" value={mediaUrl} placeholder="https://…" onChange={(event) => setMediaUrl(event.target.value)} />
          </FormField>
        ) : null}
      </Card>

      {error ? (
        <p role="alert" className="rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-6">
        <Button size="lg" onClick={() => void save()} isLoading={isSaving}>
          {isEditing ? 'Save changes' : 'Save activity'}
        </Button>
        <Button variant="quiet" size="lg" onClick={() => navigate('/activities')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

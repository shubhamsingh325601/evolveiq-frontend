import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import type {
  LearningBehaviourArea,
  NewObservation,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
  ObservationTone,
  ObservationWhen,
} from '@evolveiq/api-client';
import {
  Button,
  Card,
  Fieldset,
  FormField,
  RadioCardGroup,
  Select,
  Send,
  Star,
  Textarea,
} from '@evolveiq/ui';
import { firstNameOf, possessive } from './holistic-index';
import {
  LEARNING_BEHAVIOUR_AREAS,
  LEARNING_BEHAVIOUR_LABELS,
  OBSERVATION_AREA_LABELS,
  OBSERVATION_AREAS,
  OBSERVATION_FREQUENCY_LABELS,
  OBSERVATION_LEVEL_LABELS,
  OBSERVATION_LEVELS,
  OBSERVATION_TONES,
  OBSERVATION_WHEN_LABELS,
} from './labels';
import { ObservationTonePicker } from './ObservationTonePicker';

/**
 * One observation form for the whole product.
 *
 * It opens on the question that decides where an observation goes: something
 * to celebrate becomes a star on the child's profile straight away; something
 * to look into goes to the school counsellor's review queue.
 *
 * `variant="teacher"` adds the two fields only teachers submit: the
 * learning-behaviour area, and — for a concern only — its Level, where
 * "Significant" raises it in the counsellor's queue. Something good is never
 * Significant. Parents never see either field, and the parent's request never
 * carries them — the backend would refuse it.
 */

const keysOf = <T extends string>(labels: Record<T, string>) => Object.keys(labels) as [T, ...T[]];

const DESCRIPTION_MAX = 2000;

const observationSchema = z.object({
  studentId: z.string().min(1, 'Choose who this is about'),
  tone: z.enum(OBSERVATION_TONES as [ObservationTone, ...ObservationTone[]], {
    errorMap: () => ({ message: 'Choose whether this is something to celebrate or something to look into' }),
  }),
  area: z.enum(OBSERVATION_AREAS as [ObservationArea, ...ObservationArea[]], {
    errorMap: () => ({ message: 'Choose the area this fits best' }),
  }),
  description: z
    .string()
    .trim()
    .min(15, 'Add a little more detail — what happened, and what you saw')
    .max(DESCRIPTION_MAX, `Keep it under ${DESCRIPTION_MAX} characters`),
  when: z.enum(keysOf(OBSERVATION_WHEN_LABELS)),
  howOften: z.enum(keysOf(OBSERVATION_FREQUENCY_LABELS)),
  level: z.string().optional(),
  learningBehaviourArea: z.string().optional(),
});

type ObservationFormValues = z.infer<typeof observationSchema>;

export interface ObservationFormStudentOption {
  id: string;
  fullName: string;
}

export interface ObservationFormProps {
  variant: 'parent' | 'teacher';
  students: ObservationFormStudentOption[];
  defaultStudentId?: string;
  /** Opens with this kind already chosen, e.g. from a "Give a star" button. */
  defaultTone?: ObservationTone;
  onSubmit: (observation: NewObservation) => void | Promise<unknown>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  /** Shown above the actions when the submission failed. */
  submitError?: string;
}

export function ObservationForm({
  variant,
  students,
  defaultStudentId,
  defaultTone,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError,
}: ObservationFormProps) {
  const isTeacher = variant === 'teacher';

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      studentId: defaultStudentId ?? students[0]?.id ?? '',
      tone: defaultTone ?? ('' as ObservationTone),
      area: '' as ObservationArea,
      description: '',
      when: 'today',
      howOften: 'once',
      level: '',
      learningBehaviourArea: '',
    },
  });

  const tone = watch('tone') as ObservationTone | '';
  const isPositive = tone === 'positive';
  const isConcern = tone === 'concern';
  const student = students.find((candidate) => candidate.id === watch('studentId'));
  const childName = student ? firstNameOf(student.fullName) : isTeacher ? 'the student' : 'your child';
  const childPossessive = student ? possessive(childName) : `${childName}’s`;

  const toneDescriptions: Record<ObservationTone, string> = isTeacher
    ? {
        positive: `A strength, a win or good behaviour. It becomes a star on ${childPossessive} profile straight away, for ${childName} and their family to see.`,
        concern: 'Something that needs attention. It goes to the counsellor’s review queue.',
      }
    : {
        positive: `A kind act, a win or something new ${childName} managed. It becomes a star on ${childPossessive} profile straight away.`,
        concern: 'A worry, or a change you have noticed. The school counsellor reads it and decides what would help.',
      };

  const submit = handleSubmit((values) => {
    const observation: NewObservation = {
      studentId: values.studentId,
      tone: values.tone,
      area: values.area,
      description: values.description.trim(),
      when: values.when as ObservationWhen,
      howOften: values.howOften as ObservationFrequency,
    };

    if (isTeacher) {
      // Level measures a concern; a star never carries one, whatever the hidden field holds.
      if (values.tone === 'concern' && values.level) observation.level = values.level as ObservationLevel;
      if (values.learningBehaviourArea) {
        observation.learningBehaviourArea = values.learningBehaviourArea as LearningBehaviourArea;
      }
    }

    return onSubmit(observation);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <FormField label="Who is this about" error={errors.studentId?.message}>
        <Select {...register('studentId')}>
          {students.length === 0 ? <option value="">No students available</option> : null}
          {students.map((option) => (
            <option key={option.id} value={option.id}>
              {option.fullName}
            </option>
          ))}
        </Select>
      </FormField>

      <Fieldset legend="What kind of observation is this" error={errors.tone?.message}>
        <Controller
          control={control}
          name="tone"
          render={({ field }) => (
            <ObservationTonePicker
              value={field.value || null}
              onChange={field.onChange}
              descriptions={toneDescriptions}
            />
          )}
        />
      </Fieldset>

      <FormField
        label="Which area does this fit"
        hint={
          isPositive
            ? 'Pick the closest one. It shows beside the star.'
            : 'Pick the closest one. The counsellor looks at it when they review.'
        }
        error={errors.area?.message}
      >
        <Select {...register('area')}>
          <option value="">Choose an area</option>
          {OBSERVATION_AREAS.map((area) => (
            <option key={area} value={area}>
              {OBSERVATION_AREA_LABELS[area]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="What did you notice"
        hint={
          isPositive
            ? `Say what ${childName} did, in your own words. Your words go with the star.`
            : isTeacher
              ? 'Describe what happened and what you saw, in your own words.'
              : 'Write it the way you would tell someone. There is no right way to put it.'
        }
        error={errors.description?.message}
      >
        <Textarea
          rows={6}
          maxLength={DESCRIPTION_MAX}
          placeholder={
            isPositive
              ? isTeacher
                ? 'In the group task today, she helped…'
                : 'This morning, he got himself ready…'
              : isTeacher
                ? 'During the group task, she...'
                : 'At breakfast this morning, he...'
          }
          {...register('description')}
        />
      </FormField>

      <Fieldset legend="When did you see it" error={errors.when?.message}>
        <Controller
          control={control}
          name="when"
          render={({ field }) => (
            <RadioCardGroup
              columns={2}
              value={field.value}
              onChange={field.onChange}
              options={keysOf(OBSERVATION_WHEN_LABELS).map((value) => ({
                value,
                label: OBSERVATION_WHEN_LABELS[value],
              }))}
            />
          )}
        />
      </Fieldset>

      <Fieldset legend="How often does it happen" error={errors.howOften?.message}>
        <Controller
          control={control}
          name="howOften"
          render={({ field }) => (
            <RadioCardGroup
              columns={2}
              value={field.value}
              onChange={field.onChange}
              options={keysOf(OBSERVATION_FREQUENCY_LABELS).map((value) => ({
                value,
                label: OBSERVATION_FREQUENCY_LABELS[value],
              }))}
            />
          )}
        />
      </Fieldset>

      {isTeacher ? (
        <Card as="section" tone="tinted" className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <h3 className="text-base font-bold text-ink">For the school team</h3>
            <p className="mt-1 text-sm text-ink-muted">Parents never see these fields.</p>
          </div>

          {isPositive ? null : (
            <FormField
              label="Level of concern"
              hint="How worrying it is. Significant goes to the top of the counsellor’s queue."
              isOptional
              error={errors.level?.message}
            >
              <Select {...register('level')}>
                <option value="">Not recorded</option>
                {OBSERVATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {OBSERVATION_LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField
            label="Learning-behaviour area"
            hint={isPositive ? 'The strength this shows most clearly.' : 'The behaviour this shows most clearly.'}
            isOptional
            error={errors.learningBehaviourArea?.message}
          >
            <Select {...register('learningBehaviourArea')}>
              <option value="">Not recorded</option>
              {LEARNING_BEHAVIOUR_AREAS.map((area) => (
                <option key={area} value={area}>
                  {LEARNING_BEHAVIOUR_LABELS[area]}
                </option>
              ))}
            </Select>
          </FormField>
        </Card>
      ) : null}

      {submitError ? (
        <p role="alert" className="text-sm text-coral-700">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line-soft pt-6">
        <Button type="submit" size="lg" icon={isPositive ? Star : Send} isLoading={isSubmitting}>
          {isPositive ? 'Give a star' : 'Send observation'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="quiet" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <p className="text-sm text-ink-muted">
          {isPositive
            ? `${childName} gets the star straight away.`
            : isConcern
              ? isTeacher
                ? 'It goes to the review queue straight away.'
                : 'It goes to the school counsellor, who reads every concern.'
              : 'Choose what kind of observation this is first.'}
        </p>
      </div>
    </form>
  );
}

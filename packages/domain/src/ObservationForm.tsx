import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import type {
  LearningBehaviourArea,
  NewObservation,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
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
  Textarea,
} from '@evolveiq/ui';
import {
  LEARNING_BEHAVIOUR_AREAS,
  LEARNING_BEHAVIOUR_LABELS,
  OBSERVATION_AREA_LABELS,
  OBSERVATION_AREAS,
  OBSERVATION_FREQUENCY_LABELS,
  OBSERVATION_LEVEL_LABELS,
  OBSERVATION_LEVELS,
  OBSERVATION_WHEN_LABELS,
} from './labels';

/**
 * One observation form for the whole product.
 *
 * `variant="teacher"` adds the two fields only teachers submit: Level (where
 * "Significant" raises it in the psychologist's queue) and the
 * learning-behaviour area. Parents never see them, and the parent's request
 * never carries them — the backend would refuse it.
 */

const keysOf = <T extends string>(labels: Record<T, string>) => Object.keys(labels) as [T, ...T[]];

const DESCRIPTION_MAX = 2000;

const observationSchema = z.object({
  studentId: z.string().min(1, 'Choose who this is about'),
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
    formState: { errors },
  } = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      studentId: defaultStudentId ?? students[0]?.id ?? '',
      area: '' as ObservationArea,
      description: '',
      when: 'today',
      howOften: 'once',
      level: '',
      learningBehaviourArea: '',
    },
  });

  const submit = handleSubmit((values) => {
    const observation: NewObservation = {
      studentId: values.studentId,
      area: values.area,
      description: values.description.trim(),
      when: values.when as ObservationWhen,
      howOften: values.howOften as ObservationFrequency,
    };

    if (isTeacher) {
      if (values.level) observation.level = values.level as ObservationLevel;
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
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Which area does this fit"
        hint="Pick the closest one. A psychologist will look at it when they review."
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
          isTeacher
            ? 'Describe what happened and what you saw, in your own words.'
            : 'Write it the way you would tell someone. There is no right way to put it.'
        }
        error={errors.description?.message}
      >
        <Textarea
          rows={6}
          maxLength={DESCRIPTION_MAX}
          placeholder={isTeacher ? 'During the group task, she...' : 'At breakfast this morning, he...'}
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

          <FormField
            label="Level"
            hint="Significant goes to the top of the psychologist’s queue."
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

          <FormField
            label="Learning-behaviour area"
            hint="The behaviour this shows most clearly."
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
        <Button type="submit" size="lg" icon={Send} isLoading={isSubmitting}>
          Send observation
        </Button>
        {onCancel ? (
          <Button type="button" variant="quiet" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <p className="text-sm text-ink-muted">
          {isTeacher
            ? 'It goes to the review queue straight away.'
            : 'It goes to the school psychologist, who reads every observation.'}
        </p>
      </div>
    </form>
  );
}

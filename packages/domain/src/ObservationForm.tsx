import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import type { NewObservation } from '@evolveiq/api-client';
import {
  Button,
  Card,
  Checkbox,
  Fieldset,
  FormField,
  Input,
  RadioCardGroup,
  Select,
  Send,
  Textarea,
} from '@evolveiq/ui';
import {
  DEVELOPMENT_AREA_LABELS,
  DEVELOPMENT_AREAS,
  LEARNING_BEHAVIOUR_AREAS,
  LEARNING_BEHAVIOUR_LABELS,
  LEVEL_LABELS,
  OBSERVATION_CONTEXT_LABELS,
  OBSERVATION_FREQUENCY_LABELS,
} from './labels';

/**
 * One observation form for the whole product.
 *
 * `variant="teacher"` adds the two fields only teachers submit (Level and
 * Learning-behaviour area) plus the significance flag. Parents never see them,
 * and never see the values either — the api-client strips them on the way out.
 */

const CONTEXT_VALUES = Object.keys(OBSERVATION_CONTEXT_LABELS) as [
  keyof typeof OBSERVATION_CONTEXT_LABELS,
  ...(keyof typeof OBSERVATION_CONTEXT_LABELS)[],
];

const FREQUENCY_VALUES = Object.keys(OBSERVATION_FREQUENCY_LABELS) as [
  keyof typeof OBSERVATION_FREQUENCY_LABELS,
  ...(keyof typeof OBSERVATION_FREQUENCY_LABELS)[],
];

const observationSchema = z.object({
  studentId: z.string().min(1, 'Choose who this is about'),
  area: z.enum(DEVELOPMENT_AREAS as [string, ...string[]], {
    errorMap: () => ({ message: 'Choose the area this fits best' }),
  }),
  body: z
    .string()
    .trim()
    .min(15, 'Add a little more detail — what happened, and what you saw')
    .max(1200, 'Keep it under 1200 characters'),
  context: z.enum(CONTEXT_VALUES),
  frequency: z.enum(FREQUENCY_VALUES),
  observedAt: z.string().min(1, 'Add the date you saw this'),
  level: z.string().optional(),
  learningBehaviourArea: z.string().optional(),
  isSignificant: z.boolean().optional(),
});

type ObservationFormValues = z.infer<typeof observationSchema>;

export interface ObservationFormStudentOption {
  id: string;
  name: string;
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

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

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
      area: '',
      body: '',
      context: isTeacher ? 'in-class' : 'at-home',
      frequency: 'first-time',
      observedAt: todayIsoDate(),
      level: '',
      learningBehaviourArea: '',
      isSignificant: false,
    },
  });

  const submit = handleSubmit((values) => {
    const observation: NewObservation = {
      studentId: values.studentId,
      area: values.area as NewObservation['area'],
      body: values.body.trim(),
      context: values.context,
      frequency: values.frequency,
      observedAt: new Date(`${values.observedAt}T12:00:00`).toISOString(),
    };

    if (isTeacher) {
      if (values.level) {
        observation.level = Number(values.level) as NonNullable<NewObservation['level']>;
      }
      if (values.learningBehaviourArea) {
        observation.learningBehaviourArea =
          values.learningBehaviourArea as NewObservation['learningBehaviourArea'];
      }
      observation.isSignificant = values.isSignificant ?? false;
    }

    return onSubmit(observation);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Who is this about" error={errors.studentId?.message}>
          <Select {...register('studentId')}>
            {students.length === 0 ? <option value="">No students available</option> : null}
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="When did you see it" error={errors.observedAt?.message}>
          <Input type="date" max={todayIsoDate()} {...register('observedAt')} />
        </FormField>
      </div>

      <FormField
        label="Which area does this fit"
        hint="Pick the closest one. A psychologist will confirm it when they review."
        error={errors.area?.message}
      >
        <Select {...register('area')}>
          <option value="">Choose an area</option>
          {DEVELOPMENT_AREAS.map((area) => (
            <option key={area} value={area}>
              {DEVELOPMENT_AREA_LABELS[area]}
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
        error={errors.body?.message}
      >
        <Textarea
          rows={6}
          placeholder={
            isTeacher
              ? 'During the group task, she...'
              : 'At breakfast this morning, he...'
          }
          {...register('body')}
        />
      </FormField>

      <Fieldset legend="Where did this happen" error={errors.context?.message}>
        <Controller
          control={control}
          name="context"
          render={({ field }) => (
            <RadioCardGroup
              columns={2}
              value={field.value}
              onChange={field.onChange}
              options={Object.entries(OBSERVATION_CONTEXT_LABELS).map(([value, label]) => ({
                value: value as ObservationFormValues['context'],
                label,
              }))}
            />
          )}
        />
      </Fieldset>

      <Fieldset legend="How often does it happen" error={errors.frequency?.message}>
        <Controller
          control={control}
          name="frequency"
          render={({ field }) => (
            <RadioCardGroup
              columns={2}
              value={field.value}
              onChange={field.onChange}
              options={Object.entries(OBSERVATION_FREQUENCY_LABELS).map(([value, label]) => ({
                value: value as ObservationFormValues['frequency'],
                label,
              }))}
            />
          )}
        />
      </Fieldset>

      {isTeacher ? (
        <Card as="section" tone="tinted" className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <h3 className="text-base font-medium text-ink">For the school team</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Parents never see these fields or the flag.
            </p>
          </div>

          <FormField
            label="Level"
            hint="How much support was needed."
            isOptional
            error={errors.level?.message}
          >
            <Select {...register('level')}>
              <option value="">Not recorded</option>
              {(Object.keys(LEVEL_LABELS) as unknown as (1 | 2 | 3 | 4 | 5)[]).map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level]}
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

          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="isSignificant"
              render={({ field }) => (
                <Checkbox
                  variant="chip"
                  label="Flag this for a psychologist to look at sooner"
                  checked={field.value ?? false}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              )}
            />
          </div>
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
            : 'Your child’s teacher and school psychologist will see this.'}
        </p>
      </div>
    </form>
  );
}

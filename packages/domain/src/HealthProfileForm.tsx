import { useState, type FormEvent } from 'react';
import type { BloodGroup, HealthCondition, HealthProfile, HealthProfileInput } from '@evolveiq/api-client';
import { Button, Checkbox, Fieldset, FormField, Input, Select, Textarea } from '@evolveiq/ui';
import { possessive } from './holistic-index';
import { BLOOD_GROUPS, HEALTH_CONDITION_LABELS, HEALTH_CONDITIONS } from './school-life';

export interface HealthProfileFormProps {
  /** What is recorded now; the form starts from it. */
  profile: HealthProfile | undefined;
  /** The child's first name. */
  name: string;
  onSubmit: (input: HealthProfileInput) => Promise<unknown> | void;
  onCancel?: () => void;
  isSaving?: boolean;
  error?: string | undefined;
  submitLabel?: string;
}

const PHONE = /^\+?[0-9][0-9 ()-]*[0-9]$/;

/**
 * Health and care needs, as one form for a parent and for the school office.
 * Everything is optional; what is left empty is cleared, because saving
 * replaces the whole record.
 */
export function HealthProfileForm({
  profile,
  name,
  onSubmit,
  onCancel,
  isSaving = false,
  error,
  submitLabel = 'Save',
}: HealthProfileFormProps) {
  const [conditions, setConditions] = useState<HealthCondition[]>(profile?.conditions ?? []);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(profile?.bloodGroup ?? '');
  const [allergies, setAllergies] = useState(profile?.allergies ?? '');
  const [medications, setMedications] = useState(profile?.medications ?? '');
  const [careNotes, setCareNotes] = useState(profile?.careNotes ?? '');
  const [contactName, setContactName] = useState(profile?.emergencyContact?.name ?? '');
  const [contactRelation, setContactRelation] = useState(profile?.emergencyContact?.relation ?? '');
  const [contactPhone, setContactPhone] = useState(profile?.emergencyContact?.phone ?? '');
  const [problems, setProblems] = useState<{ contactName?: string; contactPhone?: string }>({});

  const toggle = (condition: HealthCondition, isOn: boolean) =>
    setConditions((current) =>
      isOn ? HEALTH_CONDITIONS.filter((c) => c === condition || current.includes(c)) : current.filter((c) => c !== condition),
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const hasContact = contactName.trim() !== '' || contactPhone.trim() !== '' || contactRelation.trim() !== '';
    const found: typeof problems = {};
    if (hasContact && contactName.trim() === '') found.contactName = 'Add who to call';
    if (hasContact && !PHONE.test(contactPhone.trim())) found.contactPhone = 'Add a phone number, such as +91 98450 12345';
    else if (hasContact && (contactPhone.trim().length < 3 || contactPhone.trim().length > 20)) found.contactPhone = 'Use 3 to 20 characters';
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    const optional = (value: string) => (value.trim() === '' ? null : value.trim());
    void onSubmit({
      conditions,
      bloodGroup: bloodGroup === '' ? null : bloodGroup,
      allergies: optional(allergies),
      medications: optional(medications),
      careNotes: optional(careNotes),
      emergencyContact: hasContact
        ? { name: contactName.trim(), phone: contactPhone.trim(), ...(contactRelation.trim() ? { relation: contactRelation.trim() } : {}) }
        : null,
    });
  };

  return (
    <form onSubmit={submit} aria-label={`${possessive(name)} health and care`} className="flex flex-col gap-6" noValidate>
      <Fieldset legend="Anything the school should know" hint="Tick every one that applies. Leave them all clear if none do.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {HEALTH_CONDITIONS.map((condition) => (
            <Checkbox
              key={condition}
              variant="chip"
              label={HEALTH_CONDITION_LABELS[condition]}
              checked={conditions.includes(condition)}
              onChange={(event) => toggle(condition, event.target.checked)}
            />
          ))}
        </div>
      </Fieldset>

      <FormField label="What the school should do" hint="In plain words: what helps, what to watch for, when to call you." isOptional>
        <Textarea rows={3} maxLength={1000} value={careNotes} onChange={(event) => setCareNotes(event.target.value)} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Allergies" isOptional>
          <Input maxLength={500} value={allergies} placeholder="e.g. Peanuts" onChange={(event) => setAllergies(event.target.value)} />
        </FormField>
        <FormField label="Blood group" isOptional>
          <Select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value as BloodGroup | '')}>
            <option value="">Not known</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Medication" hint="What, how much and when, if the school gives any." isOptional>
        <Textarea rows={2} maxLength={500} value={medications} onChange={(event) => setMedications(event.target.value)} />
      </FormField>

      <Fieldset legend="In an emergency, call" hint="Optional. A name and a phone number go together.">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Name" {...(problems.contactName ? { error: problems.contactName } : {})}>
            <Input maxLength={100} value={contactName} autoComplete="off" onChange={(event) => setContactName(event.target.value)} />
          </FormField>
          <FormField label="Relation" isOptional>
            <Input maxLength={50} value={contactRelation} placeholder="e.g. Mother" onChange={(event) => setContactRelation(event.target.value)} />
          </FormField>
          <FormField label="Phone" {...(problems.contactPhone ? { error: problems.contactPhone } : {})}>
            <Input type="tel" inputMode="tel" maxLength={20} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
          </FormField>
        </div>
      </Fieldset>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-coral-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

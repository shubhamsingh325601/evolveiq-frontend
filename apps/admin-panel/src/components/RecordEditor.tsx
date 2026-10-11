import { useEffect, useState } from 'react';
import { Button, CircleAlert, FormField, Input, Modal, Select } from '@evolveiq/ui';

/**
 * The create/edit dialog behind every management screen in this app.
 *
 * Screens describe their fields; this handles the dialog, the local draft and
 * the required-field check, so adding a managed record type is a field list.
 * The list can depend on the draft itself — a student account asks for a
 * student ID and PIN, an adult's for an email and password.
 */

export interface RecordEditorField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  isRequired?: boolean;
  /** Shown but not editable, with the hint saying why. */
  isDisabled?: boolean;
  /** Checked on save; return the problem to show it under the field. */
  validate?: (value: string) => string | undefined;
  inputMode?: 'numeric' | 'text' | 'email';
  maxLength?: number;
  autoComplete?: string;
}

export type RecordValues = Record<string, string>;

export interface RecordEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: RecordEditorField[] | ((values: RecordValues) => RecordEditorField[]);
  initialValues?: RecordValues;
  onSave: (values: RecordValues) => Promise<unknown> | void;
  isSaving?: boolean;
  saveLabel?: string;
  error?: string;
}

export function RecordEditor({
  isOpen,
  onClose,
  title,
  description,
  fields,
  initialValues,
  onSave,
  isSaving = false,
  saveLabel = 'Save',
  error,
}: RecordEditorProps) {
  const [values, setValues] = useState<RecordValues>({});
  const [problems, setProblems] = useState<Record<string, string>>({});
  const fieldsFor = (draft: RecordValues) => (typeof fields === 'function' ? fields(draft) : fields);
  const visibleFields = fieldsFor(values);

  // Re-seed whenever a different record is opened.
  useEffect(() => {
    if (!isOpen) return;
    const seeded: RecordValues = { ...initialValues };
    for (const field of fieldsFor(seeded)) {
      seeded[field.name] ??= field.type === 'select' ? (field.options?.[0]?.value ?? '') : '';
    }
    setValues(seeded);
    setProblems({});
    // `fields` and `initialValues` are rebuilt on each render by the screens,
    // so the dialog's open state is what should drive re-seeding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submit = () => {
    const found: Record<string, string> = {};
    for (const field of visibleFields) {
      if (field.isDisabled) continue;
      const value = (values[field.name] ?? '').trim();
      if (field.isRequired && !value) found[field.name] = `${field.label} is needed`;
      else if (value && field.validate) {
        const problem = field.validate(value);
        if (problem) found[field.name] = problem;
      }
    }
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    // Only the fields on screen are saved, so a value from a field that went away is never sent.
    const saved: RecordValues = {};
    for (const field of visibleFields) saved[field.name] = values[field.name] ?? '';
    void onSave(saved);
  };

  const setValue = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isSaving}>
            {saveLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {visibleFields.map((field) => (
          <FormField
            key={field.name}
            label={field.label}
            {...(field.hint ? { hint: field.hint } : {})}
            isOptional={!field.isRequired && !field.isDisabled}
            {...(problems[field.name] ? { error: problems[field.name] } : {})}
          >
            {field.type === 'select' ? (
              <Select
                value={values[field.name] ?? ''}
                disabled={field.isDisabled}
                onChange={(event) => setValue(field.name, event.target.value)}
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                type={field.type ?? 'text'}
                value={values[field.name] ?? ''}
                disabled={field.isDisabled}
                {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                {...(field.inputMode ? { inputMode: field.inputMode } : {})}
                {...(field.maxLength ? { maxLength: field.maxLength } : {})}
                {...(field.autoComplete ? { autoComplete: field.autoComplete } : {})}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            )}
          </FormField>
        ))}

        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Button, CircleAlert, FormField, Input, Modal, Select } from '@evolveiq/ui';

/**
 * The create/edit dialog behind every management screen in this app.
 *
 * Screens describe their fields; this handles the dialog, the local draft and
 * the required-field check, so adding a managed record type is a field list.
 */

export interface RecordEditorField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  isRequired?: boolean;
}

export type RecordValues = Record<string, string>;

export interface RecordEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: RecordEditorField[];
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
  const [missing, setMissing] = useState<string[]>([]);

  // Re-seed whenever a different record is opened.
  useEffect(() => {
    if (!isOpen) return;
    const seeded: RecordValues = {};
    for (const field of fields) {
      seeded[field.name] =
        initialValues?.[field.name] ??
        (field.type === 'select' ? (field.options?.[0]?.value ?? '') : '');
    }
    setValues(seeded);
    setMissing([]);
    // `fields` and `initialValues` are rebuilt on each render by the screens,
    // so the dialog's open state is what should drive re-seeding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submit = () => {
    const empty = fields
      .filter((field) => field.isRequired && !(values[field.name] ?? '').trim())
      .map((field) => field.name);
    setMissing(empty);
    if (empty.length > 0) return;
    void onSave(values);
  };

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
        {fields.map((field) => (
          <FormField
            key={field.name}
            label={field.label}
            {...(field.hint ? { hint: field.hint } : {})}
            isOptional={!field.isRequired}
            {...(missing.includes(field.name) ? { error: `${field.label} is needed` } : {})}
          >
            {field.type === 'select' ? (
              <Select
                value={values[field.name] ?? ''}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.name]: event.target.value }))
                }
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
                {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.name]: event.target.value }))
                }
              />
            )}
          </FormField>
        ))}

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

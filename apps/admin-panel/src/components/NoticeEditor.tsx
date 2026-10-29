import { useEffect, useState, type FormEvent } from 'react';
import type { NewNotice, Notice, NoticeAudience, NoticeCategory, School } from '@evolveiq/api-client';
import { NOTICE_AUDIENCE_LABELS, NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS } from '@evolveiq/domain';
import { Button, Checkbox, CircleAlert, FormField, Input, Modal, Select, Textarea } from '@evolveiq/ui';

export interface NoticeEditorProps {
  isOpen: boolean;
  /** The notice being changed; leave it out to post a new one. */
  notice?: Notice | undefined;
  /** Platform admins choose a school, or every school. */
  schools?: School[] | undefined;
  onClose: () => void;
  onSave: (notice: NewNotice) => Promise<unknown>;
  isSaving?: boolean;
  error?: string | undefined;
}

const DATED: NoticeCategory[] = ['event', 'activity', 'training'];
const PHONE = /^\+?[0-9][0-9 ()-]*[0-9]$/;
const EVERY_SCHOOL = '';

/**
 * Posting or changing a notice: what kind it is, a title, the details, when
 * and where for something that happens, a number for an emergency contact, and
 * who it is for. The fields follow the kind, so an emergency contact asks for
 * a phone and an event for a date.
 */
export function NoticeEditor({ isOpen, notice, schools, onClose, onSave, isSaving = false, error }: NoticeEditorProps) {
  const [category, setCategory] = useState<NoticeCategory>('event');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [audience, setAudience] = useState<NoticeAudience>('everyone');
  const [isPinned, setIsPinned] = useState(false);
  const [schoolId, setSchoolId] = useState(EVERY_SCHOOL);
  const [problems, setProblems] = useState<{ title?: string; phone?: string }>({});

  // Start from the notice opened, or from a blank one.
  useEffect(() => {
    if (!isOpen) return;
    setCategory(notice?.category ?? 'event');
    setTitle(notice?.title ?? '');
    setBody(notice?.body ?? '');
    setStartsOn(notice?.startsOn ?? '');
    setLocation(notice?.location ?? '');
    setPhone(notice?.phone ?? '');
    setAudience(notice?.audience ?? 'everyone');
    setIsPinned(notice?.isPinned ?? false);
    setSchoolId(notice?.schoolId ?? EVERY_SCHOOL);
    setProblems({});
  }, [isOpen, notice]);

  const isDated = DATED.includes(category);
  const isContact = category === 'emergency_contact';

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const found: typeof problems = {};
    if (title.trim() === '') found.title = 'Give it a title';
    if (isContact && !PHONE.test(phone.trim())) found.phone = 'An emergency contact needs a phone number';
    else if (phone.trim() !== '' && !PHONE.test(phone.trim())) found.phone = 'Use digits, with + ( ) - or spaces';
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    void onSave({
      category,
      title: title.trim(),
      audience,
      isPinned,
      ...(body.trim() ? { body: body.trim() } : {}),
      ...(isDated && startsOn ? { startsOn } : {}),
      ...(isDated && location.trim() ? { location: location.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(schools && !notice && schoolId !== EVERY_SCHOOL ? { schoolId } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={notice ? 'Change the notice' : 'Post a notice'}
      description="Events, activities, trainings, policy updates and emergency numbers, for everyone or for one group."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit()} isLoading={isSaving}>
            {notice ? 'Save changes' : 'Post it'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" aria-label={notice ? 'Change the notice' : 'Post a notice'} noValidate>
        <FormField label="What kind of notice">
          <Select value={category} onChange={(event) => setCategory(event.target.value as NoticeCategory)}>
            {NOTICE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {NOTICE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={isContact ? 'Who to call' : 'Title'} {...(problems.title ? { error: problems.title } : {})}>
          <Input maxLength={120} value={title} placeholder={isContact ? 'e.g. School nurse' : 'e.g. Annual Sports Day'} onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        {isContact || phone ? (
          <FormField label="Phone number" isOptional={!isContact} {...(problems.phone ? { error: problems.phone } : {})}>
            <Input type="tel" inputMode="tel" maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
        ) : null}
        {isDated ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="When" isOptional>
              <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
            </FormField>
            <FormField label="Where" isOptional>
              <Input maxLength={120} value={location} placeholder="e.g. Main ground" onChange={(event) => setLocation(event.target.value)} />
            </FormField>
          </div>
        ) : null}
        <FormField label="Details" isOptional>
          <Textarea rows={4} maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Who it is for">
            <Select value={audience} onChange={(event) => setAudience(event.target.value as NoticeAudience)}>
              {(Object.keys(NOTICE_AUDIENCE_LABELS) as NoticeAudience[]).map((value) => (
                <option key={value} value={value}>
                  {NOTICE_AUDIENCE_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
          {schools ? (
            <FormField label="Which school" {...(notice ? { hint: 'A notice stays with the school it was posted for.' } : {})}>
              <Select value={schoolId} disabled={Boolean(notice)} onChange={(event) => setSchoolId(event.target.value)}>
                <option value={EVERY_SCHOOL}>Every school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
        </div>
        <Checkbox label="Pin it to the top of the board" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

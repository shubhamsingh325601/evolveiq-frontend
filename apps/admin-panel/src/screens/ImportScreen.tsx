import { useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  isApiError,
  useImportPeople,
  useSchools,
  type ImportReport,
  type ImportRequest,
  type ImportRole,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Badge,
  Button,
  buttonClasses,
  Card,
  Check,
  CircleAlert,
  Download,
  FileSpreadsheet,
  FormField,
  PageHeader,
  PenLine,
  Plug,
  SegmentedControl,
  Select,
  Upload,
  type IconComponent,
} from '@evolveiq/ui';
import { parseCsv } from '../import/csv';
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS, readImportTable, templateCsv, type ReadImport } from '../import/import-columns';

const ROLE_WORDS: Record<ImportRole, { one: string; many: string; listPath: string }> = {
  student: { one: 'student', many: 'students', listPath: '/school/students' },
  teacher: { one: 'teacher', many: 'teachers', listPath: '/school/teachers' },
  parent: { one: 'parent', many: 'parents', listPath: '/school/parents' },
};

const COLUMN_NOTES: Record<string, string> = {
  'Student ID': 'What the student signs in with. Unique across EvolvIQ.',
  PIN: 'Six digits. Share it with the family safely.',
  Class: 'An existing class, or a new one the import creates.',
  'Parent email': 'A parent already at the school, to link. Import parents first, or leave it empty.',
  Email: 'Each person’s own address.',
  Password: '10 to 128 characters. Share it with them safely.',
  Classes: 'The classes they teach, separated by semicolons. New ones are created.',
  'Children student IDs': 'Their children’s student IDs, separated by semicolons. Each child once.',
  'Full name': 'As it should appear in EvolvIQ.',
};

type ReportRow = ImportReport['rows'][number];

function SourceCard({ icon: Icon, title, description, children, isCurrent = false }: { icon: IconComponent; title: string; description: string; children?: ReactNode; isCurrent?: boolean }) {
  return (
    <Card className={isCurrent ? 'border-iris-300 bg-iris-50/40 p-5' : 'p-5'}>
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-iris-50 text-iris-600 ring-1 ring-inset ring-iris-100">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-3 flex flex-wrap items-center gap-2 font-black text-ink">{title}</h3>
      <p className="mt-1 text-sm font-medium text-ink-muted">{description}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}

/** A chosen file's text: `Blob.text()` where the browser has it, else a FileReader. */
function readText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function download(filename: string, text: string) {
  if (typeof URL.createObjectURL !== 'function') return;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Bringing a school's people in (client feedback, 29 Oct 2026: "add school
 * data by importing and pulling data, and manual feed"). Three ways, said
 * plainly: a spreadsheet, checked row by row before anything is created;
 * pulling from the school's own system, which is the CRM integration still to
 * come; or one at a time by hand.
 */
export function ImportScreen() {
  const { user } = useAuth();
  const isPlatform = user?.role === 'platform_admin';
  const [params, setParams] = useSearchParams();
  const role = (['student', 'teacher', 'parent'] as const).find((r) => r === params.get('role')) ?? 'student';
  const schools = useSchools({ isEnabled: isPlatform });
  const schoolId = params.get('school') ?? '';
  const importPeople = useImportPeople();
  const [file, setFile] = useState<{ name: string; read: ReadImport } | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [problem, setProblem] = useState<string>();
  const words = ROLE_WORDS[role];
  const schoolName = isPlatform ? (schools.data ?? []).find((school) => school.id === schoolId)?.name : undefined;
  const isReadyToRead = !isPlatform || schoolId !== '';

  const setParam = (name: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set(name, value);
      return next;
    });
    setFile(null);
    setReport(null);
    setProblem(undefined);
  };

  const send = (read: ReadImport, dryRun: boolean) =>
    importPeople.mutateAsync({ role, rows: read.rows, dryRun, ...(isPlatform ? { schoolId } : {}) } as ImportRequest);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    setReport(null);
    setProblem(undefined);
    if (!chosen) return;
    const read = readImportTable(role, parseCsv(await readText(chosen)));
    setFile({ name: chosen.name, read });
    if (read.missingHeaders.length > 0) {
      setProblem(`The file has no ${read.missingHeaders.join(', ')} column. Start from the template, or rename the column headers.`);
      return;
    }
    if (read.rows.length === 0) {
      setProblem('The file has headers but no rows.');
      return;
    }
    if (read.rows.length > MAX_IMPORT_ROWS) {
      setProblem(`The file has ${read.rows.length} rows. Import at most ${MAX_IMPORT_ROWS} at a time: split it into parts.`);
      return;
    }
    try {
      setReport(await send(read, true));
    } catch (caught) {
      setProblem(isApiError(caught) ? caught.message : 'We could not check the file. Try again.');
    }
  };

  const confirm = async () => {
    if (!file) return;
    setProblem(undefined);
    try {
      setReport(await send(file.read, false));
    } catch (caught) {
      setProblem(isApiError(caught) ? caught.message : 'We could not import the file. Try again.');
    }
  };

  const problemsCount = report?.rows.filter((row) => row.problems.length > 0).length ?? 0;
  const columns: RecordsTableColumn<ReportRow>[] = [
    { id: 'row', header: 'Row', sortValue: (row) => row.row, cell: (row) => <span className="tabular-nums text-ink-muted">{row.row}</span> },
    { id: 'name', header: 'Name', sortValue: (row) => row.fullName, cell: (row) => <span className="font-bold text-ink">{row.fullName || '—'}</span> },
    { id: 'identifier', header: role === 'student' ? 'Student ID' : 'Email', sortValue: (row) => row.identifier, cell: (row) => row.identifier || '—' },
    {
      id: 'status',
      header: 'Check',
      sortValue: (row) => row.problems.length,
      cell: (row) =>
        row.problems.length === 0 ? (
          <Badge tone="growth">{report?.created ? 'Imported' : 'Ready'}</Badge>
        ) : (
          <ul className="flex flex-col gap-1">
            {row.problems.map((text) => (
              <li key={text} className="flex items-start gap-1.5 text-sm font-semibold text-coral-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Import data"
        subtitle={isPlatform ? 'Bring a school’s students, teachers and parents in from a spreadsheet.' : 'Bring your school’s students, teachers and parents in from a spreadsheet.'}
      />

      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="What are you importing?"
          value={role}
          onChange={(value) => setParam('role', value)}
          options={[
            { value: 'student', label: 'Students' },
            { value: 'teacher', label: 'Teachers' },
            { value: 'parent', label: 'Parents' },
          ]}
        />
        {isPlatform ? (
          <FormField label="Into which school" className="max-w-sm">
            <Select value={schoolId} onChange={(event) => setParam('school', event.target.value)}>
              <option value="">Choose a school</option>
              {(schools.data ?? []).map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SourceCard icon={FileSpreadsheet} title="From a spreadsheet" description="Excel or Google Sheets, saved as CSV. Every row is checked before anything is created." isCurrent />
        <SourceCard icon={Plug} title="Pull from your school system" description="Straight from your CRM or school system, kept in step. Not connected yet.">
          <Badge tone="reviewed">Coming soon</Badge>
          {!isPlatform ? (
            <Link to="/school/integrations" className="ml-3 text-sm font-bold text-iris-700 hover:underline">
              What is planned
            </Link>
          ) : null}
        </SourceCard>
        <SourceCard icon={PenLine} title="One at a time" description={`Add ${words.many} by hand, with the same checks.`}>
          <Link to={isPlatform ? '/platform/users' : words.listPath} className="text-sm font-bold text-iris-700 hover:underline">
            Add {words.many} by hand
          </Link>
        </SourceCard>
      </div>

      <Card as="section" aria-labelledby="import-steps" className="flex flex-col gap-6 p-6 sm:p-8">
        <h2 id="import-steps" className="text-lg font-black tracking-tight text-ink">
          Import {words.many} from a spreadsheet
        </h2>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-ink">1. Fill in the template</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                  <th className="py-2 pr-4">Column</th>
                  <th className="py-2 pr-4">Needed</th>
                  <th className="py-2">What goes in it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {IMPORT_COLUMNS[role].map((column) => (
                  <tr key={column.header}>
                    <td className="py-2 pr-4 font-bold text-ink">{column.header}</td>
                    <td className="py-2 pr-4 text-ink-muted">{column.isRequired ? 'Yes' : 'Optional'}</td>
                    <td className="py-2 text-ink-muted">{COLUMN_NOTES[column.header]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" size="sm" icon={Download} className="self-start" onClick={() => download(`evolveiq-${words.many}-template.csv`, templateCsv(role))}>
            Download the {words.one} template
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-ink">2. Choose the file</p>
          <label className={buttonClasses({ size: 'sm', className: isReadyToRead ? 'cursor-pointer self-start' : 'pointer-events-none self-start opacity-60' })}>
            <Upload />
            {file ? 'Choose another file' : 'Choose a CSV file'}
            <input type="file" accept=".csv,text/csv" className="sr-only" disabled={!isReadyToRead} onChange={(event) => void choose(event)} />
          </label>
          {!isReadyToRead ? <p className="text-sm font-medium text-ink-muted">Choose the school first.</p> : null}
          {file ? (
            <p className="text-sm font-medium text-ink-muted">
              {file.name}: {file.read.rows.length} {file.read.rows.length === 1 ? 'row' : 'rows'}
              {file.read.ignoredHeaders.length > 0 ? `. Left out the columns ${file.read.ignoredHeaders.join(', ')}.` : '.'}
            </p>
          ) : null}
          {importPeople.isPending ? <p className="text-sm font-semibold text-ink-muted">Checking every row…</p> : null}
        </div>

        {problem ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm font-semibold text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {problem}
          </p>
        ) : null}

        {report ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-ink">3. {report.created > 0 ? 'Done' : 'Check, then import'}</p>
            {report.created > 0 ? (
              <p role="status" className="flex items-start gap-2 rounded-xl bg-jade-50 px-3.5 py-3 text-sm font-semibold text-jade-700">
                <Check className="mt-0.5 size-4 shrink-0" />
                Imported {report.created} {report.created === 1 ? words.one : words.many}
                {schoolName ? ` into ${schoolName}` : ''}.
                {report.newClasses.length > 0 ? ` New classes: ${report.newClasses.join(', ')}.` : ''}
              </p>
            ) : (
              <p className="text-sm font-medium text-ink-muted">
                {report.isValid
                  ? `All ${report.rows.length} rows are ready. Nothing has been created yet.`
                  : `${problemsCount} of ${report.rows.length} rows need fixing. Fix them in the spreadsheet and choose the file again: nothing is created until every row is right.`}
                {report.newClasses.length > 0 ? ` It will also create the classes ${report.newClasses.join(', ')}.` : ''}
              </p>
            )}
            <RecordsTable caption="Rows in the file" rows={report.rows} columns={columns} getRowId={(row) => String(row.row)} pageSize={20} />
            {report.created === 0 ? (
              <Button icon={Upload} className="self-start" disabled={!report.isValid} isLoading={importPeople.isPending} onClick={() => void confirm()}>
                Import {report.rows.length} {report.rows.length === 1 ? words.one : words.many}
              </Button>
            ) : (
              <Link to={isPlatform ? '/platform/users' : words.listPath} className={buttonClasses({ size: 'sm', className: 'self-start' })}>
                See the {words.many}
              </Link>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

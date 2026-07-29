import { listTasks, type SortKey } from '../lib/tasks.ts';
import { createTaskAction, archiveTaskAction, unarchiveTaskAction } from './actions.ts';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'due_date', label: 'Due date' },
  { key: 'topic', label: 'Topic' },
  { key: 'status', label: 'Status' },
];

const STATUS_LABEL: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In-Progress',
  complete: 'Complete',
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortBy = (SORTS.find((s) => s.key === sort)?.key ?? 'due_date') as SortKey;

  const active = listTasks({ sortBy });
  const archived = listTasks({ sortBy, archived: true });

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      <form action={createTaskAction} className="mb-8 grid gap-2 border p-4 rounded">
        <input name="title" placeholder="Title" required className="border p-2 rounded" />
        <textarea name="description" placeholder="Description" className="border p-2 rounded" />
        <input name="dueDate" type="date" required className="border p-2 rounded" />
        <input name="topic" placeholder="Topic" required className="border p-2 rounded" />
        <select name="status" defaultValue="todo" className="border p-2 rounded">
          <option value="todo">Todo</option>
          <option value="in_progress">In-Progress</option>
          <option value="complete">Complete</option>
        </select>
        <button type="submit" className="bg-black text-white p-2 rounded">Add task</button>
      </form>

      <div className="mb-4 flex gap-3 text-sm">
        <span>Sort by:</span>
        {SORTS.map((s) => (
          <a
            key={s.key}
            href={`/?sort=${s.key}`}
            className={s.key === sortBy ? 'font-bold underline' : 'underline'}
          >
            {s.label}
          </a>
        ))}
      </div>

      <ul className="grid gap-2">
        {active.map((t) => (
          <li key={t.id} className="border p-3 rounded">
            <div className="flex justify-between items-start gap-4">
              <div>
                <strong>{t.title}</strong>
                {t.overdue && (
                  <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                    Overdue
                  </span>
                )}
                <div className="text-sm opacity-70">
                  {t.topic} · {STATUS_LABEL[t.status]} · due {t.due_date}
                </div>
                {t.description && <p className="text-sm mt-1">{t.description}</p>}
              </div>
              <div className="flex gap-3 shrink-0">
                <a href={`/tasks/${t.id}`} className="text-sm underline">Edit</a>
                <form action={archiveTaskAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="text-sm underline">Archive</button>
                </form>
              </div>
            </div>
          </li>
        ))}
        {active.length === 0 && <li className="opacity-60">No active tasks.</li>}
      </ul>

      {archived.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-10 mb-3">Archived</h2>
          <ul className="grid gap-2">
            {archived.map((t) => (
              <li key={t.id} className="border p-3 rounded opacity-60">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <strong>{t.title}</strong>
                    <div className="text-sm">
                      {t.topic} · {STATUS_LABEL[t.status]} · due {t.due_date}
                    </div>
                  </div>
                  <form action={unarchiveTaskAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="text-sm underline">Restore</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
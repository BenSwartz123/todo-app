import { getDb } from './db.ts';

export type Status = 'todo' | 'in_progress' | 'complete';
export type SortKey = 'topic' | 'status' | 'due_date';

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  topic: string;
  status: Status;
  archived_at: string | null;
  overdue: boolean;
}

/** Topics are created on demand; names are compared case-insensitively. */
function topicId(name: string): number {
  const db = getDb();
  const trimmed = name.trim();
  db.prepare('INSERT OR IGNORE INTO topics (name) VALUES (?)').run(trimmed);
  const row = db.prepare('SELECT id FROM topics WHERE name = ?').get(trimmed) as
    | { id: number }
    | undefined;
  if (!row) throw new Error(`Could not resolve topic: ${name}`);
  return row.id;
}

export function createTask(input: {
  title: string;
  description?: string;
  dueDate: string;
  topic: string;
  status?: Status;
}): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, due_date, topic_id, status)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.description ?? '',
      input.dueDate,
      topicId(input.topic),
      input.status ?? 'todo',
    );
  return Number(result.lastInsertRowid);
}

export function updateTask(
  id: number,
  input: {
    title: string;
    description?: string;
    dueDate: string;
    topic: string;
    status: Status;
  },
): void {
  getDb()
    .prepare(
      `UPDATE tasks
          SET title = ?, description = ?, due_date = ?,
              topic_id = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
    .run(
      input.title,
      input.description ?? '',
      input.dueDate,
      topicId(input.topic),
      input.status,
      id,
    );
}

/** Archiving sets a timestamp; the row is never deleted, so it stays viewable. */
export function archiveTask(id: number): void {
  getDb()
    .prepare(`UPDATE tasks SET archived_at = datetime('now') WHERE id = ?`)
    .run(id);
}

export function unarchiveTask(id: number): void {
  getDb().prepare('UPDATE tasks SET archived_at = NULL WHERE id = ?').run(id);
}

// Whitelisted so a sort key from the UI can never be injected into the SQL.
const ORDER_BY: Record<SortKey, string> = {
  topic: 'topics.name COLLATE NOCASE ASC, tasks.due_date ASC',
  status: `CASE tasks.status
             WHEN 'todo' THEN 0
             WHEN 'in_progress' THEN 1
             WHEN 'complete' THEN 2
           END ASC, tasks.due_date ASC`,
  due_date: 'tasks.due_date ASC',
};

export function listTasks(options?: {
  sortBy?: SortKey;
  archived?: boolean;
}): Task[] {
  const sortBy = options?.sortBy ?? 'due_date';
  const archived = options?.archived ?? false;

  // Overdue is derived here rather than stored, so it can never go stale.
  const rows = getDb()
    .prepare(
      `SELECT tasks.id, tasks.title, tasks.description, tasks.due_date,
              topics.name AS topic, tasks.status, tasks.archived_at,
              CASE WHEN tasks.due_date < date('now')
                    AND tasks.status <> 'complete'
                   THEN 1 ELSE 0 END AS overdue
         FROM tasks
         JOIN topics ON topics.id = tasks.topic_id
        WHERE tasks.archived_at IS ${archived ? 'NOT NULL' : 'NULL'}
        ORDER BY ${ORDER_BY[sortBy]}`,
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({ ...r, overdue: r.overdue === 1 })) as Task[];
}

export function getTask(id: number): Task | undefined {
  return listTasks({ archived: false })
    .concat(listTasks({ archived: true }))
    .find((t) => t.id === id);
}
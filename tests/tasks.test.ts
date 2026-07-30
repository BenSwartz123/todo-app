import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// Point at a throwaway database BEFORE the db module is loaded, so tests
// never touch the developer's own data/todo.db.
const DB_FILE = path.join(os.tmpdir(), `todo-test-${process.pid}-${Date.now()}.db`);
process.env.DB_PATH = DB_FILE;

const { createTask, updateTask, archiveTask, listTasks, getTask } =
  await import('../lib/tasks.ts');

after(() => {
  // Windows will not delete an open file, so close the connection first.
  const g = globalThis as unknown as { __db?: { close(): void } };
  try {
    g.__db?.close();
  } catch {
    // already closed
  }
  g.__db = undefined;

  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(DB_FILE + suffix, { force: true });
  }
});

test('a created task is returned with all four fields', () => {
  const id = createTask({
    title: 'Write lab report',
    description: 'Cover the schema decisions',
    dueDate: '2099-01-01',
    topic: 'Uni',
  });

  const task = getTask(id);
  assert.ok(task, 'task should exist');
  assert.equal(task.title, 'Write lab report');
  assert.equal(task.description, 'Cover the schema decisions');
  assert.equal(task.due_date, '2099-01-01');
  assert.equal(task.topic, 'Uni');
  assert.equal(task.status, 'todo');
});

test('archiving removes a task from the active list but keeps it viewable', () => {
  const id = createTask({ title: 'To archive', dueDate: '2099-06-01', topic: 'Admin' });

  assert.ok(listTasks().some((t) => t.id === id), 'should start active');

  archiveTask(id);

  assert.equal(listTasks().some((t) => t.id === id), false, 'should leave active list');

  const archived = listTasks({ archived: true }).find((t) => t.id === id);
  assert.ok(archived, 'should still be readable when archived');
  assert.equal(archived.title, 'To archive');
});

test('overdue is derived from the due date and cleared by completion', () => {
  const past = createTask({ title: 'Past due', dueDate: '2020-01-01', topic: 'Uni' });
  const future = createTask({ title: 'Not yet due', dueDate: '2099-01-01', topic: 'Uni' });

  assert.equal(getTask(past)?.overdue, true, 'past due date should be overdue');
  assert.equal(getTask(future)?.overdue, false, 'future due date should not be overdue');

  updateTask(past, {
    title: 'Past due',
    dueDate: '2020-01-01',
    topic: 'Uni',
    status: 'complete',
  });

  assert.equal(getTask(past)?.overdue, false, 'completing a task clears overdue');
  assert.equal(getTask(past)?.status, 'complete', 'overdue is not itself a status');
});

test('tasks sort by due date and by status', () => {
  const byDue = listTasks({ sortBy: 'due_date' }).map((t) => t.due_date);
  assert.deepEqual([...byDue].sort(), byDue, 'due dates should be ascending');

  const byStatus = listTasks({ sortBy: 'status' }).map((t) => t.status);
  const rank = { todo: 0, in_progress: 1, complete: 2 } as const;
  const ranks = byStatus.map((s) => rank[s]);
  assert.deepEqual([...ranks].sort(), ranks, 'statuses should be in fixed order');
});
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { Status } from '../lib/tasks.ts';

// Point at a throwaway database BEFORE the db module is loaded, so tests
// never touch the developer's own data/todo.db.
const DB_FILE = path.join(os.tmpdir(), `todo-test-${process.pid}-${Date.now()}.db`);
process.env.DB_PATH = DB_FILE;

const { createTask, updateTask, archiveTask, listTasks, getTask } =
  await import('../lib/tasks.ts');
  const { getDb, closeDb } = await import('../lib/db.ts');

/** Empty both tables so a test's assertions depend only on what it created. */
function reset() {
  const db = getDb();
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM topics');
}

after(() => {
  // Windows will not delete an open file, so close the connection first.
  closeDb();

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

test('tasks sort by topic, by status and by due date', () => {
  reset();

  createTask({ title: 'C', dueDate: '2030-03-01', topic: 'Zoology', status: 'complete' });
  createTask({ title: 'A', dueDate: '2030-01-01', topic: 'Maths', status: 'in_progress' });
  createTask({ title: 'B', dueDate: '2030-02-01', topic: 'Admin', status: 'todo' });

  assert.deepEqual(
    listTasks({ sortBy: 'due_date' }).map((t) => t.title),
    ['A', 'B', 'C'],
  );
  assert.deepEqual(
    listTasks({ sortBy: 'topic' }).map((t) => t.topic),
    ['Admin', 'Maths', 'Zoology'],
  );
  assert.deepEqual(
    listTasks({ sortBy: 'status' }).map((t) => t.status),
    ['todo', 'in_progress', 'complete'],
  );
});

test('the schema rejects a status outside the three allowed values', () => {
  assert.throws(
    () => createTask({ title: 'Bad', dueDate: '2030-01-01', topic: 'Uni', status: 'overdue' as Status }),
    /CHECK constraint failed/,
  );
});

test('data survives closing and reopening the database', () => {
  reset();
  createTask({ title: 'Persisted', dueDate: '2030-01-01', topic: 'Uni' });

  closeDb();

  const found = listTasks().find((t) => t.title === 'Persisted');
  assert.ok(found, 'task should still be there after reopening the file');
});
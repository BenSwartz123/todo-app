'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createTask,
  updateTask,
  archiveTask,
  unarchiveTask,
  type Status,
} from '../lib/tasks.ts';

const STATUSES: Status[] = ['todo', 'in_progress', 'complete'];

function parse(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const dueDate = String(formData.get('dueDate') ?? '').trim();
  const topic = String(formData.get('topic') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const rawStatus = String(formData.get('status') ?? 'todo');

  if (!title) throw new Error('Title is required');
  if (!dueDate) throw new Error('Due date is required');
  if (!topic) throw new Error('Topic is required');

  const status = STATUSES.includes(rawStatus as Status)
    ? (rawStatus as Status)
    : 'todo';

  return { title, dueDate, topic, description, status };
}

export async function createTaskAction(formData: FormData) {
  createTask(parse(formData));
  revalidatePath('/');
}

export async function updateTaskAction(formData: FormData) {
  const id = Number(formData.get('id'));
  updateTask(id, parse(formData));
  revalidatePath('/');
  redirect('/');
}

export async function archiveTaskAction(formData: FormData) {
  archiveTask(Number(formData.get('id')));
  revalidatePath('/');
}

export async function unarchiveTaskAction(formData: FormData) {
  unarchiveTask(Number(formData.get('id')));
  revalidatePath('/');
}
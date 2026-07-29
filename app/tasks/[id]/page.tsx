import { notFound } from 'next/navigation';
import { getTask } from '../../../lib/tasks.ts';
import { updateTaskAction } from '../../actions.ts';

export default async function EditTask({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = getTask(Number(id));

  if (!task) notFound();

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">Edit task</h1>

      <form action={updateTaskAction} className="grid gap-2 border p-4 rounded">
        <input type="hidden" name="id" value={task.id} />

        <label className="text-sm">Title</label>
        <input
          name="title"
          defaultValue={task.title}
          required
          className="border p-2 rounded"
        />

        <label className="text-sm">Description</label>
        <textarea
          name="description"
          defaultValue={task.description}
          className="border p-2 rounded"
        />

        <label className="text-sm">Due date</label>
        <input
          name="dueDate"
          type="date"
          defaultValue={task.due_date}
          required
          className="border p-2 rounded"
        />

        <label className="text-sm">Topic</label>
        <input
          name="topic"
          defaultValue={task.topic}
          required
          className="border p-2 rounded"
        />

        <label className="text-sm">Status</label>
        <select
          name="status"
          defaultValue={task.status}
          className="border p-2 rounded"
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In-Progress</option>
          <option value="complete">Complete</option>
        </select>

        <div className="flex gap-3 mt-2">
          <button type="submit" className="bg-black text-white p-2 rounded">
            Save changes
          </button>
          <a href="/" className="p-2 underline">
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
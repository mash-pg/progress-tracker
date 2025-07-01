import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json');

interface Task {
  id: string;
  name: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
}

async function readTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(tasksFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) { // unknown型で捕捉
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') { // 型ガードを追加
      await fs.writeFile(tasksFilePath, JSON.stringify([]));
      return [];
    }
    throw error;
  }
}

async function writeTasks(tasks: Task[]): Promise<void> {
  await fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const updatedTaskData = await request.json();

  const tasks = await readTasks();
  const taskIndex = tasks.findIndex(task => task.id === id);

  if (taskIndex === -1) {
    return NextResponse.json({ message: 'Task not found' }, { status: 404 });
  }

  // 既存のタスクデータと更新フィールドをマージ
  tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTaskData };
  await writeTasks(tasks);

  return NextResponse.json(tasks[taskIndex]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  let tasks = await readTasks();
  const initialLength = tasks.length;
  tasks = tasks.filter(task => task.id !== id);

  if (tasks.length === initialLength) {
    return NextResponse.json({ message: 'Task not found' }, { status: 404 });
  }

  await writeTasks(tasks);

  return new NextResponse(null, { status: 204 });
}
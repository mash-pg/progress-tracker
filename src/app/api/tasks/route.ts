import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json');

interface Task {
  id: string;
  name: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string; // カテゴリIDを追加
}

async function readTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(tasksFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) { // ここを修正
    if (error.code === 'ENOENT') {
      await fs.writeFile(tasksFilePath, JSON.stringify([]));
      return [];
    }
    throw error;
  }
}

async function writeTasks(tasks: Task[]): Promise<void> {
  await fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');

  let tasks = await readTasks();

  if (month) {
    tasks = tasks.filter(task => task.dueDate.startsWith(month));
  }

  if (categoryId) {
    tasks = tasks.filter(task => task.categoryId === categoryId);
  }

  if (keyword) {
    const lowercasedKeyword = keyword.toLowerCase();
    tasks = tasks.filter(task => task.name.toLowerCase().includes(lowercasedKeyword));
  }

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const { name, dueDate, categoryId } = await request.json();

  if (!name || !dueDate) {
    return NextResponse.json({ message: 'Name and dueDate are required' }, { status: 400 });
  }

  const newTask: Task = {
    id: uuidv4(),
    name,
    status: 'todo',
    createdAt: new Date().toISOString(),
    dueDate,
    categoryId,
  };

  const tasks = await readTasks();
  tasks.push(newTask);
  await writeTasks(tasks);

  return NextResponse.json(newTask, { status: 201 });
}

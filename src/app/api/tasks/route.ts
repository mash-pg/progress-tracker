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
  } catch (error: unknown) { // unknown型で捕捉
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') { // 型ガードを追加
      // Vercel環境ではファイル書き込みができないため、空の配列を返す
      // await fs.writeFile(tasksFilePath, JSON.stringify([]));
      return [];
    }
    throw error;
  }
}

async function writeTasks(tasks: Task[]): Promise<void> {
  // Vercel環境ではファイル書き込みができないため、何もしない
  // await fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2));
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
  // Vercel環境ではファイル書き込みができないため、ダミーの成功レスポンスを返すか、エラーを返す
  return NextResponse.json({ message: 'Task creation is disabled in this environment.' }, { status: 501 });
}

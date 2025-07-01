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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Vercel環境ではファイル書き込みができないため、ダミーの成功レスポンスを返すか、エラーを返す
  return NextResponse.json({ message: 'Task update is disabled in this environment.' }, { status: 501 });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Vercel環境ではファイル書き込みができないため、ダミーの成功レスポンスを返すか、エラーを返す
  return new NextResponse(null, { status: 501 });
}

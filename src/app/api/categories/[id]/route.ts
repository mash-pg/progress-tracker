import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');
const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json');

interface Category {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
}

async function readCategories(): Promise<Category[]> {
  try {
    const data = await fs.readFile(categoriesFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(categoriesFilePath, JSON.stringify([]));
      return [];
    }
    throw error;
  }
}

async function writeCategories(categories: Category[]): Promise<void> {
  await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2));
}

async function readTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(tasksFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const updatedCategoryData = await request.json();

  const categories = await readCategories();
  const categoryIndex = categories.findIndex(cat => cat.id === id);

  if (categoryIndex === -1) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }

  categories[categoryIndex] = { ...categories[categoryIndex], ...updatedCategoryData };
  await writeCategories(categories);

  return NextResponse.json(categories[categoryIndex]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  let categories = await readCategories();
  const initialLength = categories.length;
  categories = categories.filter(cat => cat.id !== id);

  if (categories.length === initialLength) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }

  await writeCategories(categories);

  // 削除されたカテゴリに紐づくタスクのcategoryIdをnullにする
  const tasks = await readTasks();
  const updatedTasks = tasks.map(task =>
    task.categoryId === id ? { ...task, categoryId: undefined } : task
  );
  await writeTasks(updatedTasks);

  return new NextResponse(null, { status: 204 });
}

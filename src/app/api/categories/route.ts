import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');

interface Category {
  id: string;
  name: string;
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

export async function GET() {
  const categories = await readCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
  }

  const newCategory: Category = {
    id: uuidv4(),
    name,
  };

  const categories = await readCategories();
  categories.push(newCategory);
  await writeCategories(categories);

  return NextResponse.json(newCategory, { status: 201 });
}

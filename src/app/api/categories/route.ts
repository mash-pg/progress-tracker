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
  } catch (error: unknown) { // unknown型で捕捉
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') { // 型ガードを追加
      // Vercel環境ではファイル書き込みができないため、空の配列を返す
      // await fs.writeFile(categoriesFilePath, JSON.stringify([]));
      return [];
    }
    throw error;
  }
}

async function writeCategories(categories: Category[]): Promise<void> {
  // Vercel環境ではファイル書き込みができないため、何もしない
  // await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2));
}

export async function GET() {
  const categories = await readCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  // Vercel環境ではファイル書き込みができないため、ダミーの成功レスポンスを返すか、エラーを返す
  return NextResponse.json({ message: 'Category creation is disabled in this environment.' }, { status: 501 });
}

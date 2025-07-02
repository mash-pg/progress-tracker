import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');

  let query = supabase.from('tasks').select('*, categories(name)');

  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }

  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error('Error searching tasks:', error);
    return NextResponse.json({ message: 'Error searching tasks', error: error.message }, { status: 500 });
  }

  // completed (boolean) を status (string) に変換
  const formattedTasks = tasks.map(task => ({
    ...task,
    status: task.completed ? 'completed' : 'todo'
  }));

  return NextResponse.json(formattedTasks);
}
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const dueDate = searchParams.get('dueDate');
  const status = searchParams.get('status');

  try {
    let query = supabase.from('tasks').select(`
      *,
      categories (
        name
      )
    `);

    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }

    if (keyword) {
      query = query.ilike('name', `%${keyword}%`);
    }

    if (dueDate) {
      query = query.eq('dueDate', dueDate);
    }

    if (status) {
      query = query.eq('app_status', status);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      // Check if the error is related to the relationship
      if (error.message.includes("relationship")) {
        return NextResponse.json({ message: "Error: Could not find a relationship between 'tasks' and 'categories' in the schema cache. Please check your table relationships in Supabase.", error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'Error fetching tasks', error: error.message }, { status: 500 });
    }

    const formattedTasks = tasks.map(task => ({
      ...task,
      status: task.completed ? 'completed' : 'todo',
      categoryName: task.categories ? task.categories.name : null,
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
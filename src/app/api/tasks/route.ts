import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid'; // uuidをインポート

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');

  let query = supabase.from('tasks').select('*');

  if (month) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const nextMonth = parseInt(mon) === 12 ? 1 : parseInt(mon) + 1;
    const nextYear = parseInt(mon) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    query = query.gte('dueDate', startDate).lt('dueDate', endDate);
  }

  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }

  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ message: 'Error fetching tasks', error: error.message }, { status: 500 });
  }

  // completed (boolean) を status (string) に変換
  const formattedTasks = tasks.map(task => ({
    ...task,
    status: task.completed ? 'completed' : 'todo' // Supabaseのcompletedをstatusに変換
  }));

  return NextResponse.json(formattedTasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, dueDate, categoryId, description, status } = body;
  const completed = status === 'completed'; // statusをcompleted (boolean) に変換

  if (!name || !dueDate) {
    return NextResponse.json({ message: 'Name and dueDate are required' }, { status: 400 });
  }

  const newId = uuidv4(); // 新しいIDを生成

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([{ id: newId, name, "createdAt": new Date().toISOString(), "dueDate": dueDate, "categoryId": categoryId, description, completed }])
    .select();

  if (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Error creating task', error: error.message }, { status: 500 });
  }
  
  const resultTask = {
    ...newTask[0],
    status: completed ? 'completed' : 'todo'
  };

  return NextResponse.json(resultTask, { status: 201 });
}
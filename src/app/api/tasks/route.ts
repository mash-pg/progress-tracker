import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, dueDate, categoryId, description, app_status } = body;

  if (!name || !dueDate) {
    return NextResponse.json({ message: 'Name and dueDate are required' }, { status: 400 });
  }

  const newId = uuidv4(); // 新しいIDを生成

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([{ id: newId, name, "createdAt": new Date().toISOString(), "dueDate": dueDate, "categoryId": categoryId, description, app_status: app_status }])
    .select();

  if (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Error creating task', error: error.message }, { status: 500 });
  }
  
  const resultTask = {
    ...newTask[0],
    app_status: app_status
  };

  return NextResponse.json(resultTask, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => null); // ボディの解析を試みる

  // 1. IDリストによる削除
  if (body && body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .in('id', body.ids);

    if (error) {
      console.error('Error deleting tasks by IDs:', error);
      return NextResponse.json({ message: 'Error deleting tasks by IDs', error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  }

  // 2. 検索パラメータによる一括削除 (既存のロジック)
  const dueDate = searchParams.get('dueDate');
  const month = searchParams.get('month');
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const status = searchParams.get('status');

  let query = supabase.from('tasks').delete();
  let hasWhereClause = false;

  if (dueDate) {
    query = query.eq('dueDate', dueDate);
    hasWhereClause = true;
  } else if (month) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const nextMonth = parseInt(mon) === 12 ? 1 : parseInt(mon) + 1;
    const nextYear = parseInt(mon) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    query = query.gte('dueDate', startDate).lt('dueDate', endDate);
    hasWhereClause = true;
  }

  if (categoryId) {
    query = query.eq('categoryId', categoryId);
    hasWhereClause = true;
  }
  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
    hasWhereClause = true;
  }
  if (status) {
    query = query.eq('app_status', status);
    hasWhereClause = true;
  }

  if (!hasWhereClause) {
    return NextResponse.json({ message: 'DELETE requires either a list of IDs in the body or specific search parameters in the URL' }, { status: 400 });
  }

  const { error } = await query;

  if (error) {
    console.error('Error deleting tasks by search criteria:', error);
    return NextResponse.json({ message: 'Error deleting tasks by search criteria', error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const dueDate = searchParams.get('dueDate');
  const status = searchParams.get('status'); // ここにstatusを追加
  const body = await request.json();
  const { app_status } = body;

  if (!app_status) {
    return NextResponse.json({ message: 'app_status is required' }, { status: 400 });
  }

  console.log('Received dueDate for PUT:', dueDate); // Add this line for debugging

  let query = supabase.from('tasks').update({ app_status: app_status });
  let hasWhereClause = false;

  // categoryId, keyword, dueDate, status は AND 条件として適用
  if (categoryId) {
    query = query.eq('categoryId', categoryId);
    hasWhereClause = true;
  }
  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
    hasWhereClause = true;
  }
  if (dueDate) {
    query = query.eq('dueDate', dueDate);
    hasWhereClause = true;
  }
  if (status) { // ここにstatusの条件を追加
    query = query.eq('app_status', status);
    hasWhereClause = true;
  }

  // WHERE句が全くない場合はエラーを返す
  if (!hasWhereClause) {
    return NextResponse.json({ message: 'UPDATE requires a WHERE clause or specific search parameters' }, { status: 400 });
  }

  const { error } = await query;

  if (error) {
    console.error('Error bulk updating tasks:', error);
    return NextResponse.json({ message: 'Error bulk updating tasks', error: error.message }, { status: 500 });
  }

  revalidatePath('/search');
  revalidatePath('/');
  return new NextResponse(null, { status: 200 });
}
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server'; // createClientをインポート
import { v4 as uuidv4 } from 'uuid'; // uuidをインポート

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM
  const categoryId = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const dueDate = searchParams.get('dueDate'); // dueDateを追加
  const status = searchParams.get('status'); // statusを追加

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('tasks').select('*').eq('user_id', user.id);

  if (month) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const nextMonth = parseInt(mon) === 12 ? 1 : parseInt(mon) + 1;
    const nextYear = parseInt(mon) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    query = query.gte('dueDate', startDate).lt('dueDate', endDate);
  } else if (dueDate) {
    // 指定された日付の00:00:00から翌日の00:00:00までの範囲で検索
    const startOfDay = `${dueDate}T00:00:00Z`;
    const nextDay = new Date(dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const startOfNextDay = nextDay.toISOString().split('T')[0];

    query = query.gte('dueDate', startOfDay).lt('dueDate', startOfNextDay);
  }

  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }

  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
  }

  if (status) {
    query = query.eq('app_status', status);
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

  const supabase = createClient(); // Supabaseクライアントを初期化
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const newId = uuidv4(); // 新しいIDを生成

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([{ id: newId, name, "createdAt": new Date().toISOString(), "dueDate": dueDate, "categoryId": categoryId, description, app_status: app_status, user_id: user.id }]) // user_idを追加
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

  const supabase = createClient(); // Supabaseクライアントを初期化
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 1. IDリストによる削除
  if (body && body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .in('id', body.ids)
      .eq('user_id', user.id); // user_idでフィルタリング

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

  let query = supabase.from('tasks').delete().eq('user_id', user.id); // user_idでフィルタリング
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
  const categoryIdParam = searchParams.get('categoryId');
  const keyword = searchParams.get('keyword');
  const dueDate = searchParams.get('dueDate');
  const statusParam = searchParams.get('status');

  const body = await request.json().catch(() => ({}));
  const { app_status, categoryId: bodyCategoryId, ids } = body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const updateObject: { app_status?: string | null; categoryId?: string | null } = {};
  if (app_status !== undefined) {
    updateObject.app_status = app_status;
  }
  if (bodyCategoryId !== undefined) {
    updateObject.categoryId = bodyCategoryId;
  }

  if (Object.keys(updateObject).length === 0) {
    return NextResponse.json({ message: 'No valid fields to update provided' }, { status: 400 });
  }

  let query = supabase.from('tasks').update(updateObject).eq('user_id', user.id);

  if (ids && Array.isArray(ids) && ids.length > 0) {
    query = query.in('id', ids);
  } else {
    let hasWhereClause = false;
    if (categoryIdParam) {
      query = query.eq('categoryId', categoryIdParam);
      hasWhereClause = true;
    }
    if (keyword) {
      query = query.ilike('name', `%${keyword}%`);
      hasWhereClause = true;
    }
    if (dueDate) {
      const startOfDay = `${dueDate}T00:00:00Z`;
      const nextDay = new Date(dueDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const startOfNextDay = nextDay.toISOString().split('T')[0];
      query = query.gte('dueDate', startOfDay).lt('dueDate', startOfNextDay);
      hasWhereClause = true;
    }
    if (statusParam) {
      query = query.eq('app_status', statusParam);
      hasWhereClause = true;
    }

    if (!hasWhereClause) {
      return NextResponse.json({ message: 'UPDATE requires a list of IDs in the body or specific search parameters in the URL' }, { status: 400 });
    }
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
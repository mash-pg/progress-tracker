import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// 特定のタスクを取得
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ message: 'Error fetching task', error: error.message }, { status: 500 });
  }

  if (!task) {
    return NextResponse.json({ message: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

// 特定のタスクを更新
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // parent_task_idが'null'文字列の場合、実際のnullに変換
  if (body.parent_task_id === 'null') {
    body.parent_task_id = null;
  }

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Error updating task', error: error.message }, { status: 500 });
  }

  if (!updatedTask || updatedTask.length === 0) {
    return NextResponse.json({ message: 'Task not found or unauthorized' }, { status: 404 });
  }

  revalidatePath('/'); // トップページを再検証
  revalidatePath('/search'); // 検索ページを再検証
  return NextResponse.json(updatedTask[0]);
}

// 特定のタスクを削除
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ message: 'Error deleting task', error: error.message }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/search');
  return new NextResponse(null, { status: 204 });
}

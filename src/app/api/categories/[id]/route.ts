import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// 特定のカテゴリを取得
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ message: 'Error fetching category', error: error.message }, { status: 500 });
  }

  if (!category) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }

  return NextResponse.json(category);
}

// 特定のカテゴリを更新
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { data: updatedCategory, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ message: 'Error updating category', error: error.message }, { status: 500 });
  }

  if (!updatedCategory || updatedCategory.length === 0) {
    return NextResponse.json({ message: 'Category not found or unauthorized' }, { status: 404 });
  }

  revalidatePath('/categories');
  return NextResponse.json(updatedCategory[0]);
}

// 特定のカテゴリを削除
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ message: 'Error deleting category', error: error.message }, { status: 500 });
  }

  revalidatePath('/categories');
  return new NextResponse(null, { status: 204 });
}

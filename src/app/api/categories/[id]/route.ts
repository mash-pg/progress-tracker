import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
  }

  const { data: updatedCategory, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ message: 'Error updating category', error: error.message }, { status: 500 });
  }

  if (!updatedCategory || updatedCategory.length === 0) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }

  return NextResponse.json(updatedCategory[0]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // まず、このカテゴリに紐づくタスクの categoryId を null に更新
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ categoryId: null })
    .eq('categoryId', id);

  if (updateError) {
    console.error('Error updating tasks categoryId before deleting category:', updateError);
    return NextResponse.json({ message: 'Error updating related tasks', error: updateError.message }, { status: 500 });
  }

  // その後、カテゴリを削除
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ message: 'Error deleting category', error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
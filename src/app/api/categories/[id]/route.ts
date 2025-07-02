import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    console.error('Error fetching category:', error);
    return NextResponse.json({ message: 'Error fetching category', error: error.message }, { status: 500 });
  }

  return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { name, color } = await request.json();

  const { data: updatedCategory, error } = await supabase
    .from('categories')
    .update({ name, color })
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
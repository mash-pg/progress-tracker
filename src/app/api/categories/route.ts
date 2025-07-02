import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Error fetching categories', error: error.message }, { status: 500 });
  }

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { name, color } = await request.json();

  if (!name) {
    return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
  }

  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert([{ name, color }])
    .select();

  if (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Error creating category', error: error.message }, { status: 500 });
  }

  return NextResponse.json(newCategory[0], { status: 201 });
}
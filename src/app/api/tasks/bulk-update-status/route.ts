import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request) {
  const body = await request.json();
  const { ids, app_status } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0 || !app_status) {
    return NextResponse.json({ message: 'IDs array and app_status are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ app_status })
    .in('id', ids)
    .select();

  if (error) {
    console.error('Error bulk updating task statuses:', error);
    return NextResponse.json({ message: 'Error bulk updating task statuses', error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
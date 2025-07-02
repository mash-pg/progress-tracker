import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }
    console.error('Error fetching task:', error);
    return NextResponse.json({ message: 'Error fetching task', error: error.message }, { status: 500 });
  }

  return NextResponse.json(task);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { name, dueDate, categoryId, description, completed } = body;

  console.log('PUT /api/tasks/[id] - ID:', id);
  console.log('PUT /api/tasks/[id] - Request Body:', body);

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update({ name, "dueDate": dueDate, "categoryId": categoryId, description, completed })
    .eq('id', id)
    .select();

  console.log('PUT /api/tasks/[id] - Supabase Data:', updatedTask);
  console.log('PUT /api/tasks/[id] - Supabase Error:', error);

  if (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Error updating task', error: error.message }, { status: 500 });
  }

  if (!updatedTask || updatedTask.length === 0) {
    // If updatedTask is empty, it means no rows were affected.
    // This could be because the task doesn't exist, or the values are already the same.
    // In this case, we should return the existing task, not a 404.
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      // If fetching also fails, then the task truly doesn't exist or there's another issue.
      console.error('Error fetching existing task after failed update:', fetchError);
      return NextResponse.json({ message: 'Task not found or error fetching existing task', error: fetchError.message }, { status: 404 });
    }

    // Task exists but no change was made (idempotent update). Return the existing task.
    console.warn('PUT /api/tasks/[id] - Task found but no changes applied (values already same) for ID:', id);
    return NextResponse.json(existingTask, { status: 200 });
  }

  return NextResponse.json(updatedTask[0]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ message: 'Error deleting task', error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // createClientをインポート
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(); // Supabaseクライアントを初期化
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, position') // positionも取得
    .eq('user_id', user.id)
    .order('position'); // positionでソート

  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Error fetching categories', error: error.message }, { status: 500 });
  }

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
  }

  const supabase = createClient(); // Supabaseクライアントを初期化
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const newId = uuidv4();

  // 新しいカテゴリのpositionを計算
  const { data: existingCategories, error: fetchError } = await supabase
    .from('categories')
    .select('position')
    .eq('user_id', user.id);

  if (fetchError) {
    console.error('Error fetching existing categories for position:', fetchError);
    return NextResponse.json({ message: 'Error creating category', error: fetchError.message }, { status: 500 });
  }

  const newPosition = existingCategories ? existingCategories.length : 0;

  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert([{ id: newId, name, user_id: user.id, position: newPosition }]) // user_idとpositionを追加
    .select();

  if (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Error creating category', error: error.message }, { status: 500 });
  }

  return NextResponse.json(newCategory[0], { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { updates } = body; // updatesはカテゴリの配列を想定

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ message: 'Updates array is required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // トランザクションで複数のカテゴリを更新
  const { error } = await supabase.from('categories').upsert(updates.map(u => ({ ...u, user_id: user.id })));

  if (error) {
    console.error('Error updating category positions:', error);
    return NextResponse.json({ message: 'Error updating category positions', error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

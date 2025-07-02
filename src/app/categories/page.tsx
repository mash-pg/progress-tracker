'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('categories')
      .select('id, name');

    if (error) {
      console.error('Error fetching categories:', error);
      setError(error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください。');
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newCategoryName.trim() }])
      .select();

    if (error) {
      console.error('Error adding category:', error);
      setError(error.message);
      alert('カテゴリの追加に失敗しました。');
    } else if (data) {
      setCategories([...categories, data[0]]);
      setNewCategoryName('');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) {
      alert('カテゴリ名を入力してください。');
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name: editingCategory.name.trim() })
      .eq('id', editingCategory.id)
      .select();

    if (error) {
      console.error('Error updating category:', error);
      setError(error.message);
      alert('カテゴリの更新に失敗しました。');
    } else if (data) {
      setCategories(categories.map(cat =>
        cat.id === data[0].id ? data[0] : cat
      ));
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('このカテゴリを削除してもよろしいですか？このカテゴリに紐づくタスクは未分類になります。')) {
      return;
    }

    // まず、このカテゴリに紐づくタスクの categoryId を null に更新
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ categoryId: null })
      .eq('categoryId', id);

    if (updateError) {
      console.error('Error updating tasks categoryId:', updateError);
      setError(updateError.message);
      alert('カテゴリに紐づくタスクの更新に失敗しました。');
      return;
    }

    // その後、カテゴリを削除
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      setError(error.message);
      alert('カテゴリの削除に失敗しました。');
    } else {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center"><p className="text-xl text-gray-600 dark:text-gray-300">カテゴリを読み込み中...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center"><p className="text-xl text-red-500 dark:text-red-300">エラー: {error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">カテゴリ管理</h1>

        {/* カテゴリ追加フォーム */}
        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="mb-8">
          <div className="flex items-center">
            <input
              type="text"
              placeholder={editingCategory ? 'カテゴリ名を編集' : '新しいカテゴリ名'}
              value={editingCategory ? editingCategory.name : newCategoryName}
              onChange={(e) => {
                if (editingCategory) {
                  setEditingCategory({ ...editingCategory, name: e.target.value });
                } else {
                  setNewCategoryName(e.target.value);
                }
              }}
              className="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
            <button
              type="submit"
              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {editingCategory ? '更新' : '追加'}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>

        {/* カテゴリリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm dark:bg-gray-700 dark:border-gray-600">
              <span className="text-gray-800 font-medium dark:text-gray-100">{category.name}</span>
              <div>
                <button
                  onClick={() => setEditingCategory(category)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-2 rounded mr-2"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
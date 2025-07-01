'use client';

import { useState, useEffect, useMemo } from 'react';
import TaskItem from '@/components/TaskItem'; // TaskItemはCategorySection内で使用
import TaskForm from '@/components/TaskForm';
import Pagination from '@/components/Pagination';
import CategorySection from '@/components/CategorySection'; // 新しいコンポーネントをインポート

interface Category {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
}

const CATEGORIES_PER_PAGE = 9; // 1ページあたりのカテゴリ数

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // 全タスクを保持
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(0); // カテゴリリストのページ

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAllTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks'); // 全タスクを取得
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAllTasks();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('カテゴリの追加に失敗しました。');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name); // フォームに既存の名前をセット
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setEditingCategory(null);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('カテゴリの更新に失敗しました。');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('このカテゴリを削除しますか？このカテゴリに紐づくタスクのカテゴリは解除されます。')) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fetchCategories();
        fetchAllTasks(); // タスクのカテゴリが解除されるので再取得
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('カテゴリの削除に失敗しました。');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = async () => {
    await fetchAllTasks(); // タスク更新後に再取得
    handleFormClose();
  };

  const handleStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  // カテゴリリストのページング
  const paginatedCategories = useMemo(() => {
    const startIndex = currentCategoryPage * CATEGORIES_PER_PAGE;
    const endIndex = startIndex + CATEGORIES_PER_PAGE;
    return categories.slice(startIndex, endIndex);
  }, [categories, currentCategoryPage]);

  const totalCategoryPages = Math.ceil(categories.length / CATEGORIES_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">カテゴリ管理</h1>

        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="mb-8">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder={editingCategory ? 'カテゴリ名を編集' : '新しいカテゴリ名'}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {editingCategory ? '更新' : '追加'}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName('');
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-300 dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>

        {loadingCategories && <p className="text-center text-blue-500 text-lg dark:text-blue-300">カテゴリを読み込み中...</p>}
        {loadingTasks && <p className="text-center text-blue-500 text-lg dark:text-blue-300">タスクを読み込み中...</p>}
        {error && <p className="text-center text-red-500 text-lg dark:text-red-300">エラー: {error}</p>}

        {!loadingCategories && !error && (
          <div className="space-y-6">
            {paginatedCategories.length > 0 ? (
              paginatedCategories.map(category => (
                <CategorySection
                  key={category.id}
                  category={category}
                  tasks={tasks.filter(task => task.categoryId === category.id)} // カテゴリに紐づくタスクを渡す
                  allCategories={categories} // TaskItemに渡すため
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onEditTask={handleEditTask}
                  onTaskChange={handleFormSubmit}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 text-lg dark:text-gray-400">カテゴリがありません。</p>
            )}
          </div>
        )}

        {totalCategoryPages > 1 && (
          <Pagination
            currentPage={currentCategoryPage}
            totalPages={totalCategoryPages}
            onPageChange={setCurrentCategoryPage}
          />
        )}

        {isFormOpen && (
          <TaskForm
            task={editingTask}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
}

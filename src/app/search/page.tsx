'use client';

import { useState, useEffect, useMemo } from 'react';
import TaskItem from '@/components/TaskItem';
import TaskForm from '@/components/TaskForm';
import Pagination from '@/components/Pagination'; // Paginationをインポート

interface Task {
  id: string;
  name: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 9; // 1ページあたりのタスク数

export default function SearchPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 検索結果のページ
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // カテゴリの取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Category[] = await response.json();
        setCategories(data);
      } catch (e: any) {
        console.error('Failed to fetch categories:', e);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setCurrentPage(0); // 検索時にページをリセット

    const queryParams = new URLSearchParams();
    if (selectedCategory) {
      queryParams.append('categoryId', selectedCategory);
    }
    if (keyword.trim()) {
      queryParams.append('keyword', keyword.trim());
    }

    try {
      const response = await fetch(`/api/tasks?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();
      setSearchResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 検索結果のタスクのソート (新しい順)
  const sortedSearchResults = useMemo(() => searchResults.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [searchResults]);

  // ページングされた検索結果
  const paginatedSearchResults = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedSearchResults.slice(startIndex, endIndex);
  }, [sortedSearchResults, currentPage]);

  const totalPages = Math.ceil(sortedSearchResults.length / ITEMS_PER_PAGE);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = async () => {
    await handleSearch(); // データ更新後に再検索
    handleFormClose();
  };

  const handleStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    // 検索結果のタスクのステータスを楽観的に更新
    setSearchResults(prevResults =>
      prevResults.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    // API呼び出しはTaskItem内で行われるため、ここではUI更新のみ
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">タスク検索</h1>

        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <div>
            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">カテゴリで絞り込み:</label>
            <select
              id="category"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">全カテゴリ</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="keyword" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">キーワード:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="keyword"
                placeholder="キーワードを入力"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                検索
              </button>
            </div>
          </div>
        </form>

        {loading && <p className="text-center text-blue-500 text-lg dark:text-blue-300">検索中...</p>}
        {error && <p className="text-center text-red-500 text-lg dark:text-red-300">エラー: {error}</p>}

        {!loading && !error && sortedSearchResults.length > 0 && (
          <div className="task-list mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSearchResults.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEditTask={handleEditTask}
                onTaskChange={handleFormSubmit}
                onStatusUpdate={handleStatusUpdate}
                categories={categories}
              />
            ))}
          </div>
        )}

        {!loading && !error && sortedSearchResults.length === 0 && (
          <p className="text-center text-gray-500 text-lg dark:text-gray-400">検索結果がありません。</p>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
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

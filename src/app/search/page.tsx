'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import TaskItem from '@/components/TaskItem'; // TaskItemをインポート
import Pagination from '@/components/Pagination'; // Paginationをインポート
import TaskForm from '@/components/TaskForm'; // TaskFormをインポート

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 9;

export default function SearchPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<Task['app_status'] | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false); // フォームの開閉状態
  const [editingTask, setEditingTask] = useState<Task | null>(null); // 編集中のタスク

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const handleSelectionChange = (taskId: string, isSelected: boolean) => {
    setSelectedTasks(prev =>
      isSelected ? [...prev, taskId] : prev.filter(id => id !== taskId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(paginatedResults.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedTasks.length === 0) {
      alert('削除するタスクを選択してください。');
      return;
    }
    if (!confirm(`${selectedTasks.length}件のタスクを削除してもよろしいですか？`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTasks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // UIから削除されたタスクを即座に反映
      setSearchResults(prev => prev.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]); // 選択状態をクリア

    } catch (e: any) {
      console.error('Failed to delete selected tasks:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (newAppStatus: Task['app_status']) => {
    if (selectedTasks.length === 0) {
      alert('ステータスを更新するタスクを選択してください。');
      return;
    }
    if (!confirm(`${selectedTasks.length}件のタスクのステータスを「${newAppStatus}」に更新してもよろしいですか？`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/bulk-update-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedTasks, app_status: newAppStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // UIを即座に更新
      setSearchResults(prev =>
        prev.map(task =>
          selectedTasks.includes(task.id) ? { ...task, app_status: newAppStatus } : task
        )
      );
      setSelectedTasks([]); // 選択をクリア

    } catch (e: any) {
      console.error('Failed to bulk update task statuses:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
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

    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('categoryId', selectedCategory);
      }
      if (keyword) {
        params.append('keyword', keyword);
      }
      if (dueDate) {
        params.append('dueDate', dueDate);
      }
      if (selectedStatus) { // ここにselectedStatusを追加
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/tasks/search?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search tasks');
      }

      const data = await response.json();
      setSearchResults(data || []);
    } catch (err: any) {
      console.error('Error searching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  const handleFormSubmit = async (savedTask: Task) => { // savedTaskを引数として受け取る
    // searchResultsを直接更新
    setSearchResults(prevResults => {
      const existingTaskIndex = prevResults.findIndex(t => t.id === savedTask.id);
      if (existingTaskIndex > -1) {
        // 既存のタスクを更新
        return prevResults.map(t => t.id === savedTask.id ? savedTask : t);
      } else {
        // 新しいタスクを追加 (検索ページでは通常発生しないが念のため)
        return [...prevResults, savedTask];
      }
    });
    handleFormClose();
  };

  const handleTaskChange = () => {
    // タスクが変更されたら検索結果を再取得
    handleSearch();
  };

  const handleStatusUpdate = (taskId: string, newAppStatus: Task['app_status']) => {
    // 楽観的UI更新
    setSearchResults(prevResults =>
      prevResults.map(task =>
        task.id === taskId ? { ...task, app_status: newAppStatus } : task
      )
    );
  };

  // ページングのための計算
  const paginatedResults = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return searchResults.slice(startIndex, endIndex);
  }, [searchResults, currentPage]);

  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">タスク検索</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="mb-4">
            <label htmlFor="categoryFilter" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">カテゴリで絞り込み:</label>
            <select
              id="categoryFilter"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || undefined)}
            >
              <option value="">全カテゴリ</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="keywordSearch" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">キーワード:</label>
            <input
              type="text"
              id="keywordSearch"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              placeholder="タスク名で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="dueDateSearch" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">期日:</label>
            <input
              type="date"
              id="dueDateSearch"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || undefined)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="statusFilter" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">ステータスで絞り込み:</label>
            <select
              id="statusFilter"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value as Task['app_status'] || undefined)}
            >
              <option value="">全ステータス</option>
              <option value="todo">未着手</option>
              <option value="in-progress">作業中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              検索
            </button>
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => handleBulkUpdateStatus(e.target.value as Task['app_status'])}
                  className="shadow appearance-none border rounded py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 font-bold"
                  defaultValue=""
                >
                  <option value="" disabled>一括ステータス更新</option>
                  <option value="todo">未着手</option>
                  <option value="in-progress">作業中</option>
                  <option value="completed">完了</option>
                </select>
                <button
                  type="button"
                  onClick={handleBulkDeleteSelected}
                  disabled={selectedTasks.length === 0}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-gray-500"
                >
                  選択したタスクを削除 ({selectedTasks.length})
                </button>
              </div>
            )}
          </div>
        </form>

        {loading && <p className="text-center text-blue-500 text-lg dark:text-blue-300">検索中...</p>}
        {error && <p className="text-center text-red-500 text-lg dark:text-red-300">エラー: {error}</p>}

        {!loading && !error && searchResults.length > 0 && (
          <>
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="selectAllCheckbox"
                  className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedTasks.length > 0 && selectedTasks.length === paginatedResults.length}
                />
                <label htmlFor="selectAllCheckbox" className="text-sm font-medium text-gray-700 dark:text-gray-300">このページのタスクをすべて選択</label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedResults.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEditTask={handleEditTask}
                  onTaskChange={handleTaskChange}
                  onStatusUpdate={handleStatusUpdate}
                  categories={categories}
                  isSelected={selectedTasks.includes(task.id)}
                  onSelectionChange={handleSelectionChange}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {!loading && !error && searchResults.length === 0 && (keyword || selectedCategory) && (
          <p className="text-center text-gray-500 text-lg dark:text-gray-400">検索条件に一致するタスクは見つかりませんでした。</p>
        )}

        {!loading && !error && searchResults.length === 0 && !keyword && !selectedCategory && (
          <p className="text-center text-gray-500 text-lg dark:text-gray-400">検索条件を入力してタスクを検索してください。</p>
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
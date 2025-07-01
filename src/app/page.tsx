'use client';

import { useState, useEffect, useMemo } from 'react';
import DateNavigation from '@/components/DateNavigation';
import AddTaskButton from '@/components/AddTaskButton';
import DateSection from '@/components/DateSection';
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

const ITEMS_PER_PAGE = 9; // 1ページあたりの日付数

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // 初期値をnullに設定
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // カテゴリの状態を追加
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 現在のページ
  const [isClient, setIsClient] = useState(false); // クライアントサイドでレンダリングされたかを示すフラグ

  useEffect(() => {
    setIsClient(true); // クライアントサイドでレンダリングされたことをマーク
    // ローカルストレージからselectedMonthを読み込む
    const savedMonth = localStorage.getItem('selectedMonth');
    if (savedMonth) {
      setSelectedMonth(savedMonth);
    } else {
      setSelectedMonth(new Date().toISOString().substring(0, 7));
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) { // selectedMonthがnullでない場合にのみfetchTasksを呼び出す
      localStorage.setItem('selectedMonth', selectedMonth);
      fetchTasks(selectedMonth);
      setCurrentPage(0); // 月が変わったらページをリセット
    }
  }, [selectedMonth]);

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

  const fetchTasks = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks?month=${month}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
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
    await fetchTasks(selectedMonth!); // データ更新後に再取得
    handleFormClose();
  };

  // ステータス変更時の楽観的UI更新
  const handleStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  // 日付ごとにタスクをグループ化するロジック
  const groupedTasks: { [key: string]: Task[] } = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      if (!groups[task.dueDate]) {
        groups[task.dueDate] = [];
      }
      groups[task.dueDate].push(task);
    });
    return groups;
  }, [tasks]);

  // 日付でソート (新しい順)
  const sortedDates = useMemo(() => Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a)), [groupedTasks]);

  // ページングされた日付
  const paginatedDates = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedDates.slice(startIndex, endIndex);
  }, [sortedDates, currentPage]);

  const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE);

  // 進捗率を計算する関数
  const calculateProgress = (tasksForDate: Task[]) => {
    const completedTasks = tasksForDate.filter(task => task.status === 'completed');
    const totalTasks = tasksForDate.length;
    if (totalTasks === 0) {
      return { progressRate: 0, completedCount: 0, totalCount: 0 };
    }
    const progressRate = Math.round((completedTasks.length / totalTasks) * 100);
    return { progressRate, completedCount: completedTasks.length, totalCount: totalTasks };
  };

  // selectedMonthがnullの間は何も表示しないか、ローディング表示
  if (!isClient || selectedMonth === null) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center">
        <p className="text-xl text-gray-600 dark:text-gray-300">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">進捗管理アプリ</h1>

        <DateNavigation selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />

        <AddTaskButton onAddTask={handleAddTask} />

        {loading && <p className="text-center text-blue-500 text-lg dark:text-blue-300">タスクを読み込み中...</p>}
        {error && <p className="text-center text-red-500 text-lg dark:text-red-300">エラー: {error}</p>}

        {!loading && !error && (
          <div className="task-list mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDates.length > 0 ? (
              paginatedDates.map(date => {
                const tasksForDate = groupedTasks[date];
                const { progressRate, completedCount, totalCount } = calculateProgress(tasksForDate);
                return (
                  <DateSection
                    key={date}
                    date={date}
                    progressRate={progressRate}
                    completedCount={completedCount}
                    totalCount={totalCount}
                    tasks={tasksForDate}
                    onEditTask={handleEditTask}
                    onTaskChange={handleFormSubmit}
                    onStatusUpdate={handleStatusUpdate}
                    categories={categories}
                  />
                );
              })
            ) : (
              <p className="text-center text-gray-500 text-lg col-span-full dark:text-gray-400">この月にはタスクがありません。</p>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
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

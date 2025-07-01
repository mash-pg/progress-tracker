'use client';

import { useState, useMemo, useEffect } from 'react';
import TaskItem from './TaskItem';
import Pagination from './Pagination'; // Paginationをインポート

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

interface DateSectionProps {
  date: string; // YYYY-MM-DD
  progressRate: number;
  completedCount: number;
  totalCount: number;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskChange: () => void; // タスク変更後に親に通知するためのコールバック
  onStatusUpdate: (taskId: string, newStatus: Task['status']) => void; // ステータス変更時の楽観的更新用
  categories: Category[]; // カテゴリリストを追加
}

const TASKS_PER_PAGE = 6; // 1ページあたりのタスク数

export default function DateSection({
  date,
  progressRate,
  completedCount,
  totalCount,
  tasks,
  onEditTask,
  onTaskChange,
  onStatusUpdate,
  categories,
}: DateSectionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // ローカルストレージから展開状態を読み込む
    if (typeof window !== 'undefined') {
      const savedExpanded = localStorage.getItem(`dateSectionExpanded-${date}`);
      return savedExpanded === 'true';
    }
    return false; // デフォルトは閉じた状態
  });
  const [currentPage, setCurrentPage] = useState(0); // 現在のタスクページ

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setCurrentPage(0); // 展開時にページをリセット
  };

  // ページングされたタスク
  const paginatedTasks = useMemo(() => {
    const startIndex = currentPage * TASKS_PER_PAGE;
    const endIndex = startIndex + TASKS_PER_PAGE;
    return tasks.slice(startIndex, endIndex);
  }, [tasks, currentPage]);

  const totalTaskPages = Math.ceil(tasks.length / TASKS_PER_PAGE);

  return (
    <div className="date-section mb-3 p-3 border border-gray-200 rounded-lg shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600">
      <div
        className="date-header flex flex-col items-start cursor-pointer pb-2 border-b border-gray-300 dark:border-gray-600"
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center w-full mb-0.5">
          <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{date}</span>
          <span className="text-gray-500 text-base ml-2 dark:text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </div>
        <span className="progress-rate text-gray-700 text-sm font-medium dark:text-gray-300">
          進捗率: <span className="font-bold text-green-600">{progressRate}%</span> ({completedCount}/{totalCount})
        </span>
      </div>
      <div className={`task-list-content transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100 pt-3 overflow-hidden' : 'max-h-0 opacity-0 overflow-hidden'}`}> {/* max-hを調整し、overflow-y-autoを削除 */}
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {paginatedTasks.map(task => (
              <TaskItem key={task.id} task={task} onEditTask={onEditTask} onTaskChange={onTaskChange} onStatusUpdate={onStatusUpdate} categories={categories} />
            ))}
            {totalTaskPages > 1 && (
              <div className="flex justify-center mt-4 space-x-1 text-xs">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalTaskPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-3 text-sm dark:text-gray-400">この日付にはタスクがありません。</p>
        )}
      </div>
    </div>
  );
}
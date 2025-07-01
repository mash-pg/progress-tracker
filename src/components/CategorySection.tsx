'use client';

import { useState, useMemo, useEffect } from 'react';
import TaskItem from './TaskItem';
import Pagination from './Pagination';

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

interface CategorySectionProps {
  category: Category;
  tasks: Task[];
  allCategories: Category[]; // TaskItemに渡すため
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onEditTask: (task: Task) => void;
  onTaskChange: () => void; // タスク変更後に親に通知するためのコールバック
  onStatusUpdate: (taskId: string, newStatus: Task['status']) => void; // ステータス変更時の楽観的更新用
}

const TASKS_PER_CATEGORY_PAGE = 6; // カテゴリごとのタスクページング数

export default function CategorySection({
  category,
  tasks,
  allCategories,
  onEditCategory,
  onDeleteCategory,
  onEditTask,
  onTaskChange,
  onStatusUpdate,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false); // デフォルトは閉じた状態
  const [currentTaskPage, setCurrentTaskPage] = useState(0);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setCurrentTaskPage(0); // 展開時にページをリセット
  };

  // カテゴリ内のタスクをソート (新しい順)
  const sortedTasks = useMemo(() => tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [tasks]);

  // ページングされたタスク
  const paginatedTasks = useMemo(() => {
    const startIndex = currentTaskPage * TASKS_PER_CATEGORY_PAGE;
    const endIndex = startIndex + TASKS_PER_CATEGORY_PAGE;
    return sortedTasks.slice(startIndex, endIndex);
  }, [sortedTasks, currentTaskPage]);

  const totalTaskPages = Math.ceil(sortedTasks.length / TASKS_PER_CATEGORY_PAGE);

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 p-4">
      <div
        className="flex justify-between items-center mb-4 pb-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer"
        onClick={toggleExpanded}
      >
        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{category.name} ({tasks.length})</span>
        <div className="space-x-2 flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onEditCategory(category); }}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-300 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-sm"
          >
            編集
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.id); }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 dark:bg-red-600 dark:hover:bg-red-700 text-sm"
          >
            削除
          </button>
          <span className="text-gray-500 text-lg ml-2 dark:text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      <div className={`task-list-content transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen opacity-100 pt-3' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {sortedTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {paginatedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onTaskChange={onTaskChange}
                onStatusUpdate={onStatusUpdate}
                categories={allCategories}
              />
            ))}
            {totalTaskPages > 1 && (
              <Pagination
                currentPage={currentTaskPage}
                totalPages={totalTaskPages}
                onPageChange={setCurrentTaskPage}
              />
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm dark:text-gray-400">このカテゴリにはタスクがありません。</p>
        )}
      </div>
    </div>
  );
}

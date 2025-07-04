'use client';

import { useState, useRef, useEffect } from 'react';

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
  description?: string; // 追加
}

interface Category {
  id: string;
  name: string;
}

interface TaskItemProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onTaskChange: () => void;
  onStatusUpdate: (taskId: string, newAppStatus: Task['app_status']) => void;
  categories: Category[];
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, isSelected: boolean) => void;
}

export default function TaskItem({
  task,
  onEditTask,
  onTaskChange,
  onStatusUpdate,
  categories,
  isSelected,
  onSelectionChange,
}: TaskItemProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleStatusChange = async (newAppStatus: Task['app_status']) => {
    setIsStatusDropdownOpen(false);

    if (newAppStatus === task.app_status) return;

    const originalStatus = task.app_status;
    onStatusUpdate(task.id, newAppStatus);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_status: newAppStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('ステータスの更新に失敗しました。UIを元に戻します。');
      onStatusUpdate(task.id, originalStatus);
    }
  };

  const handleDelete = async () => {
    if (confirm(`タスク「${task.name}」を削除しますか？`)) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        onTaskChange();
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('タスクの削除に失敗しました。');
      }
    }
  };

  const statusMap = {
    'todo': '未着手',
    'in-progress': '作業中',
    'completed': '完了',
  };

  const getButtonColorClass = (app_status: Task['app_status']) => {
    switch (app_status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'in-progress':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'todo':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const categoryName = task.categoryId && categories ? categories.find(cat => cat.id === task.categoryId)?.name : '未分類';

  return (
    <div className="task-item bg-white border border-gray-200 rounded-lg p-3 flex flex-col shadow-sm hover:shadow-md transition duration-300 ease-in-out dark:bg-gray-800 dark:border-gray-700 h-full">
      <div className="flex-grow mb-2">
        <div className="flex items-start mb-1">
          {onSelectionChange && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange(task.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="mr-2 mt-1 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
            />
          )}
          <div className="flex-grow cursor-pointer min-w-0" onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-words">{task.name}</h3>
          </div>
        </div>

        <div className={`flex-grow cursor-pointer ${onSelectionChange ? 'pl-6' : ''}`} onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
          <p className="text-xs text-gray-600 dark:text-gray-300">カテゴリ: {categoryName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">作成日時: {new Date(task.createdAt).toLocaleString()}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">期日: {task.dueDate}</p>
        </div>
      </div>

      <div className={`flex justify-between items-center mt-auto ${onSelectionChange ? 'pl-6' : ''}`}>
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            className={`px-2 py-1 rounded-md text-xs font-medium transition duration-300 ease-in-out text-white ${getButtonColorClass(task.app_status)}`}
            onClick={(e) => { e.stopPropagation(); setIsStatusDropdownOpen(!isStatusDropdownOpen); }}
            aria-haspopup="true"
            aria-expanded={isStatusDropdownOpen}
          >
            {statusMap[task.app_status]} ▼
          </button>

          {isStatusDropdownOpen && (
            <div
              className="origin-top-left absolute left-0 bottom-full mb-1 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 dark:bg-gray-700 dark:ring-gray-600"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
            >
              <div className="py-0.5" role="none">
                {Object.entries(statusMap).map(([key, value]) => (
                  <a
                    key={key}
                    href="#"
                    className={`block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 ${task.app_status === key ? 'bg-gray-100 font-semibold dark:bg-gray-600' : ''}`}
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusChange(key as Task['app_status']);
                    }}
                  >
                    {value}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-medium transition duration-300 ease-in-out"
        >
          削除
        </button>
      </div>
    </div>
  );
}
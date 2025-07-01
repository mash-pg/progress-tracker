'use client';

import { useState, useRef, useEffect } from 'react';

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

interface TaskItemProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onTaskChange: () => void; // タスク変更後に親に通知するためのコールバック (削除、編集フォームからの保存)
  onStatusUpdate: (taskId: string, newStatus: Task['status']) => void; // ステータス変更時の楽観的更新用
  categories: Category[]; // カテゴリリストを追加
}

export default function TaskItem({ task, onEditTask, onTaskChange, onStatusUpdate, categories }: TaskItemProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsStatusDropdownOpen(false); // プルダウンを閉じる

    if (newStatus === task.status) return; // 同じステータスなら何もしない

    // 楽観的UI更新
    const originalStatus = task.status;
    onStatusUpdate(task.id, newStatus);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 成功時は何もしない（既にUIは更新済み）
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('ステータスの更新に失敗しました。UIを元に戻します。');
      onStatusUpdate(task.id, originalStatus); // 失敗時はUIを元に戻す
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
        onTaskChange(); // 変更を親に通知してタスクリストを再取得
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

  const getStatusColorClass = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-yellow-600';
      case 'todo':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // ドロップダウン外をクリックしたら閉じる
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
    <div className="task-item bg-white border border-gray-200 rounded-lg p-2 flex flex-col shadow-sm hover:shadow-md transition duration-300 ease-in-out dark:bg-gray-800 dark:border-gray-700 min-h-[90px]"> {/* min-hを調整 */}
      <div className="flex-grow cursor-pointer" onClick={() => onEditTask(task)}>
        <h3 className="text-sm font-semibold text-gray-800 mb-0.5 dark:text-gray-100 truncate">{task.name}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">カテゴリ: {categoryName}</p>
        <p className="text-xs text-gray-600 dark:text-gray-300">作成日時: {new Date(task.createdAt).toLocaleString()}</p>
        <p className="text-xs text-gray-600 dark:text-gray-300">期日: {task.dueDate}</p>
      </div>
      <div className="flex justify-between items-center mt-1">
        {/* ステータス変更プルダウン */}
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            className={`px-2 py-0.5 rounded-md text-xs font-medium transition duration-300 ease-in-out
              ${task.status === 'completed' ? 'bg-green-500 text-white hover:bg-green-600' :
                task.status === 'in-progress' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                'bg-red-500 text-white hover:bg-red-600'
              }`}
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            aria-haspopup="true"
            aria-expanded={isStatusDropdownOpen}
          >
            {statusMap[task.status]} ▼
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
                    className={`block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 ${task.status === key ? 'bg-gray-100 font-semibold dark:bg-gray-600' : ''}`}
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      handleStatusChange(key as Task['status']);
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
          onClick={handleDelete}
          className="px-2 py-0.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-medium transition duration-300 ease-in-out"
        >
          削除
        </button>
      </div>
    </div>
  );
}
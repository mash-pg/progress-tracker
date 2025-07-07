'use client';

import { useState, useMemo, useEffect } from 'react';
import TaskItem from './TaskItem';
import Pagination from './Pagination'; // Paginationをインポート
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
  parent_task_id?: string;
  subtasks?: Task[];
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
  onStatusUpdate: (taskId: string, newAppStatus: Task['app_status']) => void; // ステータス変更時の楽観的更新用
  categories: Category[]; // カテゴリリストを追加
  onDeleteTasksByDate: (date: string) => void; // 日付ごとのタスク削除用
  onAddSubtask: (parentId: string) => void; // 新しいプロパティ
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
  onDeleteTasksByDate,
  onAddSubtask, // 新しいプロパティを受け取る
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

  useEffect(() => {
    // ローカルストレージに展開状態を保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dateSectionExpanded-${date}`, String(isExpanded));
    }
  }, [isExpanded, date]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setCurrentPage(0); // 展開時にページをリセット
  };

  // ページングされたタスク
  const paginatedTasks = useMemo(() => {
    const sortedTasks = [...tasks].sort((a, b) => {
      const convertToHalfWidth = (str: string) => str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

      // nullまたはundefinedの場合のハンドリング
      const aName = a.name || '';
      const bName = b.name || '';

      const aNameHalfWidth = convertToHalfWidth(aName);
      const bNameHalfWidth = convertToHalfWidth(bName);

      const aStartsWithNumber = /^[0-9]/.test(aNameHalfWidth);
      const bStartsWithNumber = /^[0-9]/.test(bNameHalfWidth);

      if (aStartsWithNumber && bStartsWithNumber) {
        // 両方数字で始まる場合、数値として比較
        const numA = parseInt(aNameHalfWidth);
        const numB = parseInt(bNameHalfWidth);
        if (numA !== numB) {
          return numA - numB;
        }
        // 数字部分が同じ場合は文字列全体で比較
        return aName.localeCompare(bName);
      } else if (aStartsWithNumber) {
        // aだけ数字で始まる場合、aを前に
        return -1;
      } else if (bStartsWithNumber) {
        // bだけ数字で始まる場合、bを前に
        return 1;
      } else {
        // 両方数字で始まらない場合、文字列として比較
        return aName.localeCompare(bName);
      }
    });

    const startIndex = currentPage * TASKS_PER_PAGE;
    const endIndex = startIndex + TASKS_PER_PAGE;
    return sortedTasks.slice(startIndex, endIndex);
  }, [tasks, currentPage]);

  const totalTaskPages = Math.ceil(tasks.length / TASKS_PER_PAGE);

  const renderTasks = (tasksToRender: Task[], level = 0) => {
    return tasksToRender.map(task => (
      <div key={task.id} style={{ marginLeft: `${level * 20}px` }}>
        <TaskItem
          task={task}
          onEditTask={onEditTask}
          onTaskChange={onTaskChange}
          onStatusUpdate={onStatusUpdate}
          categories={categories}
        />
        {task.subtasks && task.subtasks.length > 0 && renderTasks(task.subtasks, level + 1)}
      </div>
    ));
  };

  return (
    <div className="date-section mb-3 p-3 border border-gray-200 rounded-lg shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600">
      <div
        className="date-header flex flex-col items-start cursor-pointer pb-2 border-b border-gray-300 dark:border-gray-600"
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center w-full mb-0.5">
          <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{date}</span>
          <div className="flex items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDeleteTasksByDate(date); }}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4 mr-1" /> 削除
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              className="ml-2"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        <span className="progress-rate text-gray-700 text-sm font-medium dark:text-gray-300">
          進捗率: <span className="font-bold text-green-600">{progressRate}%</span> ({completedCount}/{totalCount})
        </span>
      </div>
      <div className={`task-list-content transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100 pt-3 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}> {/* max-hを調整し、overflow-y-autoを削除 */}
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {paginatedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onTaskChange={onTaskChange}
                onStatusUpdate={onStatusUpdate}
                categories={categories}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-3 text-sm dark:text-gray-400">この日付にはタスクがありません。</p>
        )}
      </div>
      {totalTaskPages > 1 && isExpanded && ( /* isExpandedがtrueの場合のみ表示 */
        <div className="flex justify-center mt-4 space-x-1 text-xs">
          <Pagination
            currentPage={currentPage}
            totalPages={totalTaskPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
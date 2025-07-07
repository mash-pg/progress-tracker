'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Edit, Trash2, PlusCircle } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
  description?: string;
  parent_task_id?: string;
  subtasks?: Task[];
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
  isSubtask?: boolean; // サブタスクかどうかを判定するプロパティ
  onAddSubtask?: (parentId: string) => void; // 新しいプロパティ
}

export default function TaskItem({
  task,
  onEditTask,
  onTaskChange,
  onStatusUpdate,
  categories,
  isSelected,
  onSelectionChange,
  isSubtask = false, // デフォルトはfalse
  onAddSubtask, // 新しいプロパティを受け取る
}: TaskItemProps) {
  const [subtasksVisible, setSubtasksVisible] = useState(false);

  const handleStatusChange = async (newAppStatus: Task['app_status']) => {
    if (newAppStatus === task.app_status) return;
    onStatusUpdate(task.id, newAppStatus);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_status: newAppStatus }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('ステータスの更新に失敗しました。');
      onStatusUpdate(task.id, task.app_status); // エラー時に元に戻す
    }
  };

  const handleDelete = async () => {
    if (confirm(`タスク「${task.name}」を削除しますか？`)) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  const getStatusVariant = (app_status: Task['app_status']) => {
    switch (app_status) {
      case 'completed':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'in-progress':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'todo':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const categoryName = task.categoryId && categories.find(cat => cat.id === task.categoryId)?.name || '未分類';

  return (
    <>
      <div className="task-item bg-white border border-gray-200 rounded-lg p-3 flex flex-col shadow-sm hover:shadow-md transition duration-300 ease-in-out dark:bg-gray-800 dark:border-gray-700">
        <div className="flex-grow mb-2">
          <div className="flex items-center mb-1">
            {/* サブタスクの表示/非表示切り替えボタン */}
            {task.subtasks && task.subtasks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); setSubtasksVisible(!subtasksVisible); }}
                className="mr-2"
              >
                {subtasksVisible ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            {/* チェックボックスは親タスクのみに表示 */}
            {onSelectionChange && !isSubtask && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(task.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
                className="mr-2 mt-1"
              />
            )}
            <div className="flex-grow cursor-pointer min-w-0" onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-words">{task.name}</h3>
            </div>
          </div>

          {/* サブタスクの場合はカテゴリ、作成日時、期日を非表示 */}
          {!isSubtask && (
            <div className={`flex-grow cursor-pointer ${onSelectionChange ? 'pl-10' : 'pl-4'}`} onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
              <p className="text-xs text-gray-600 dark:text-gray-300">カテゴリ: {categoryName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">作成日時: {new Date(task.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">期日: {task.dueDate}</p>
            </div>
          )}
        </div>

        <div className={`flex flex-wrap items-center justify-start gap-2 mt-auto ${isSubtask ? 'pl-4' : (onSelectionChange ? 'pl-10' : 'pl-4')}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className={getStatusVariant(task.app_status)} size="sm">
                {statusMap[task.app_status]} <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(statusMap).map(([key, value]) => (
                <DropdownMenuItem key={key} onClick={() => handleStatusChange(key as Task['app_status'])}>
                  {value}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center space-x-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {!isSubtask && onAddSubtask && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onAddSubtask(task.id); }}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* サブタスクの再帰的なレンダリング */}
      {subtasksVisible && task.subtasks && (
        <div className="ml-4 mt-2 space-y-2">
          {task.subtasks.map(subtask => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onEditTask={onEditTask}
              onTaskChange={onTaskChange}
              onStatusUpdate={onStatusUpdate}
              categories={categories}
              isSubtask={true} // サブタスクであることを伝える
            />
          ))}
        </div>
      )}
    </>
  );
}
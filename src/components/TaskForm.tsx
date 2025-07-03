'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
  description?: string; // 追加: descriptionプロパティ
}

interface Category {
  id: string;
  name: string;
}

interface TaskFormProps {
  task: Task | null; // 編集時はタスクオブジェクト、新規作成時はnull
  onClose: () => void;
  onSubmit: (savedTask: Task) => void | Promise<void>; // 変更: Promise<void>を許容
  categories: Category[]; // カテゴリリストを追加
}

export default function TaskForm({ task, onClose, onSubmit, categories }: TaskFormProps) {
  const [name, setName] = useState(task ? task.name : '');
  const [dueDate, setDueDate] = useState(task ? task.dueDate : '');
  const [status, setStatus] = useState<Task['app_status']>(task ? task.app_status : 'todo');
  const [categoryId, setCategoryId] = useState<string | undefined>(task?.categoryId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDueDate(task.dueDate);
      setStatus(task.app_status);
      setCategoryId(task.categoryId);
    } else {
      // 新規作成時は今日の日付をデフォルトに
      setDueDate(new Date().toISOString().split('T')[0]);
      setStatus('todo'); // 新規作成時はステータスをtodoに設定
      setCategoryId(undefined); // 新規作成時はカテゴリをクリア
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name || !dueDate) {
      alert('タスク名と期日は必須です。');
      setIsSubmitting(false);
      return;
    }

    const method = task ? 'PUT' : 'POST';
    const url = task ? `/api/tasks/${task.id}` : '/api/tasks';

    console.log('TaskForm: Submitting with method:', method, 'URL:', url, 'Body:', { name, dueDate, status, categoryId });
    console.log('Final method to be used:', method);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, dueDate, app_status: status, categoryId }),
      });

      console.log('TaskForm: Response OK:', response.ok, 'Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedTask = await response.json(); // 保存されたタスクを取得
      onSubmit(savedTask); // 保存されたタスクを親コンポーネントに渡す
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('タスクの保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800 task-form-modal">
        <h2 className="text-2xl font-bold mb-6 text-center">{task ? 'タスクを編集' : '新しいタスクを追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">タスク名:</label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">期日:</label>
            <input
              type="date"
              id="dueDate"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">カテゴリ:</label>
            <select
              id="category"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={categoryId || ''} // undefinedの場合は空文字列
              onChange={(e) => setCategoryId(e.target.value || undefined)}
              disabled={isSubmitting}
            >
              <option value="">-- カテゴリを選択 --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {task && (
            <div className="mb-6">
              <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">ステータス:</label>
              <select
                id="status"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['app_status'])}
                disabled={isSubmitting}
              >
                <option value="todo">未着手</option>
                <option value="in-progress">作業中</option>
                <option value="completed">完了</option>
              </select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-blue-600 dark:hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

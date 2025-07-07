import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  categoryId?: string;
  description?: string; // 追加: descriptionプロパティ
  parent_task_id?: string;
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
  tasks: Task[]; // タスクリストを追加
  isOpen: boolean; // Dialogの開閉状態を制御するためのプロパティ
}

export default function TaskForm({ task, onClose, onSubmit, categories, tasks, isOpen }: TaskFormProps) {
  const [name, setName] = useState(task ? task.name : '');
  const [dueDate, setDueDate] = useState(task ? task.dueDate : '');
  const [status, setStatus] = useState<Task['app_status']>(task ? task.app_status : 'todo');
  const [categoryId, setCategoryId] = useState<string | undefined>(task?.categoryId);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(task?.parent_task_id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDueDate(task.dueDate);
      setStatus(task.app_status);
      setCategoryId(task.categoryId);
      setParentTaskId(task.parent_task_id);
    } else {
      // 新規作成時は今日の日付をデフォルトに
      setDueDate(new Date().toISOString().split('T')[0]);
      setStatus('todo'); // 新規作成時はステータスをtodoに設定
      setCategoryId(undefined); // 新規作成時はカテゴリをクリア
      setParentTaskId(undefined);
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

    let method: 'POST' | 'PUT';
    let url: string;

    // taskが存在し、かつtask.idが有効なIDである場合にPUT、それ以外はPOST
    if (task && task.id) {
      method = 'PUT';
      url = `/api/tasks/${task.id}`;
    } else {
      method = 'POST';
      url = '/api/tasks';
    }

    console.log('TaskForm: Submitting with method:', method, 'URL:', url, 'Body:', { name, dueDate, status, categoryId, parent_task_id: parentTaskId });
    console.log('Final method to be used:', method);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, dueDate, app_status: status, categoryId, parent_task_id: parentTaskId }),
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'タスクを編集' : '新しいタスクを追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              タスク名:
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              期日:
            </Label>
            <Input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              カテゴリ:
            </Label>
            <Select
              value={categoryId || ''}
              onValueChange={(value) => setCategoryId(value || undefined)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="-- カテゴリを選択 --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem>-- カテゴリを選択 --</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parentTask" className="text-right">
              親タスク:
            </Label>
            <Select
              value={parentTaskId || ''}
              onValueChange={(value) => setParentTaskId(value || undefined)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="-- 親タスクを選択 --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem>-- 親タスクを選択 --</SelectItem>
                <SelectItem value="null">親タスクなし</SelectItem>
                {tasks && tasks.filter(t => !t.parent_task_id && (task ? t.id !== task.id : true)).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {task && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                ステータス:
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as Task['app_status'])}
                disabled={isSubmitting}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">未着手</SelectItem>
                  <SelectItem value="in-progress">作業中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

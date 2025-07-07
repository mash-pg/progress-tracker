'use client';

import { Button } from '@/components/ui/button';

interface AddTaskButtonProps {
  onAddTask: () => void;
}

export default function AddTaskButton({ onAddTask }: AddTaskButtonProps) {
  return (
    <Button
      onClick={onAddTask}
      className="add-task-button"
    >
      新しいタスクを追加
    </Button>
  );
}

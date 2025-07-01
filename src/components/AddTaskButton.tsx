'use client';

interface AddTaskButtonProps {
  onAddTask: () => void;
}

export default function AddTaskButton({ onAddTask }: AddTaskButtonProps) {
  return (
    <button
      onClick={onAddTask}
      className="add-task-button block w-64 mx-auto py-4 px-8 bg-green-500 text-white rounded-full hover:bg-green-600 text-xl font-bold shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
    >
      新しいタスクを追加
    </button>
  );
}
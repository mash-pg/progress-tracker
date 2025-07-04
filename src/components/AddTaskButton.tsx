'use client';

interface AddTaskButtonProps {
  onAddTask: () => void;
}

export default function AddTaskButton({ onAddTask }: AddTaskButtonProps) {
  return (
    <button
      onClick={onAddTask}
      className="add-task-button inline-block py-3 sm:py-4 px-6 sm:px-8 bg-green-500 text-white rounded-full hover:bg-green-600 text-lg sm:text-xl font-bold shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
    >
      新しいタスクを追加
    </button>
  );
}

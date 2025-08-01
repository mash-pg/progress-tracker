'use client';

import { useState, useEffect, useMemo } from 'react';
import DateNavigation from '@/components/DateNavigation';
import AddTaskButton from '@/components/AddTaskButton';
import DateSection from '@/components/DateSection';
import TaskForm from '@/components/TaskForm';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  name: string;
  app_status: 'todo' | 'in-progress' | 'completed';
  createdAt: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  categoryId?: string;
  parent_task_id?: string;
  subtasks?: Task[];
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 6;

export default function TaskList() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedMonth = localStorage.getItem('selectedMonth');
    if (savedMonth) {
      setSelectedMonth(savedMonth);
    } else {
      setSelectedMonth(new Date().toISOString().substring(0, 7));
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      localStorage.setItem('selectedMonth', selectedMonth);
      fetchTasks(selectedMonth);
      setCurrentPage(0);
    }
  }, [selectedMonth]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Category[] = await response.json();
        setCategories(data);
      } catch (e: any) {
        console.error('Failed to fetch categories:', e);
      }
    };
    fetchCategories();
  }, []);

  const fetchTasks = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks?month=${month}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();
      const tasksWithDefaultPriority = (data || []).map((task: Task) => ({
        ...task,
        priority: task.priority || 'Low',
      }));
      setTasks(tasksWithDefaultPriority);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleAddSubtask = (parentId: string) => {
    setEditingTask({
      id: '',
      name: '',
      app_status: 'todo',
      createdAt: new Date().toISOString(),
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'Low',
      parent_task_id: parentId,
    });
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = async (savedTask: Task) => {
    setTasks(prevTasks => {
      const existingTaskIndex = prevTasks.findIndex(t => t.id === savedTask.id);
      if (existingTaskIndex > -1) {
        return prevTasks.map(t => t.id === savedTask.id ? savedTask : t);
      } else {
        return [...prevTasks, savedTask];
      }
    });
    handleFormClose();
  };

  const handleStatusUpdate = (taskId: string, newAppStatus: Task['app_status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, app_status: newAppStatus } : task
      )
    );
  };

  const groupedTasks: { [key: string]: Task[] } = useMemo(() => {
    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, { ...t, subtasks: [] as Task[] }]));
    const rootTasks: Task[] = [];

    for (const task of Array.from(taskMap.values())) {
      if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
        const parentTask = taskMap.get(task.parent_task_id)!;
        if (!parentTask.subtasks) {
          parentTask.subtasks = [];
        }
        parentTask.subtasks.push(task);
      } else {
        rootTasks.push(task);
      }
    }

    const groups: { [key: string]: Task[] } = {};
    rootTasks.forEach(task => {
      if (!groups[task.dueDate]) {
        groups[task.dueDate] = [];
      }
      groups[task.dueDate].push(task);
    });

    for (const date in groups) {
      groups[date].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [tasks]);

  const sortedDates = useMemo(() => Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a)), [groupedTasks]);

  const paginatedDates = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedDates.slice(startIndex, endIndex);
  }, [sortedDates, currentPage]);

  const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE);

  const calculateProgress = (tasksForDate: Task[]) => {
    const completedTasks = tasksForDate.filter(task => task.app_status === 'completed');
    const totalTasks = tasksForDate.length;
    if (totalTasks === 0) {
      return { progressRate: 0, completedCount: 0, totalCount: 0 };
    }
    const progressRate = Math.round((completedTasks.length / totalTasks) * 100);
    return { progressRate, completedCount: completedTasks.length, totalCount: totalTasks };
  };

  const handleDeleteTasksByDate = async (date: string) => {
    if (!confirm(`${date} のタスクを全て削除してもよろしいですか？`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?dueDate=${date}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchTasks(selectedMonth as string);
    } catch (e: any) {
      console.error('Failed to delete tasks by date:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTasksByMonth = async () => {
    if (!selectedMonth) return;
    if (!confirm(`${selectedMonth} の全てのタスクを削除してもよろしいですか？この操作は元に戻せません。`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?month=${selectedMonth}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchTasks(selectedMonth as string);
    } catch (e: any) {
      console.error('Failed to delete tasks by month:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || selectedMonth === null) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center">
        <p className="text-xl text-gray-600 dark:text-gray-300">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">進捗管理アプリ</h1>

        <DateNavigation selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />

        <div className="flex justify-center mb-4 space-x-2">
          <AddTaskButton onAddTask={handleAddTask} />
          <Button
            onClick={handleDeleteTasksByMonth}
            variant="destructive"
          >
            この月のタスクを削除
          </Button>
        </div>

        {loading && <p className="text-center text-blue-500 text-lg dark:text-blue-300">タスクを読み込み中...</p>}
        {error && <p className="text-center text-red-500 text-lg dark:text-red-300">エラー: {error}</p>}

        {!loading && !error && (
          <div className="task-list mt-8 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedDates.length > 0 ? (
              paginatedDates.map(date => {
                const tasksForDate = groupedTasks[date];
                const { progressRate, completedCount, totalCount } = calculateProgress(tasksForDate);
                return (
                  <DateSection
                    key={date}
                    date={date}
                    progressRate={progressRate}
                    completedCount={completedCount}
                    totalCount={totalCount}
                    tasks={tasksForDate}
                    onEditTask={handleEditTask}
                    onTaskChange={() => fetchTasks(selectedMonth as string)}
                    onStatusUpdate={handleStatusUpdate}
                    onDeleteTasksByDate={handleDeleteTasksByDate}
                    categories={categories}
                    onAddSubtask={handleAddSubtask}
                  />
                );
              })
            ) : (
              <p className="text-center text-gray-500 text-lg col-span-full dark:text-gray-400">この月にはタスクがありません。</p>
            )}
          </div>
        )}

        {isFormOpen && (
          <TaskForm
            task={editingTask}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
            categories={categories}
            tasks={tasks}
            isOpen={isFormOpen}
          />
        )}
      </div>
    </div>
  );
}
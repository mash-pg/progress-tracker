'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import TaskItem from '@/components/TaskItem';
import Pagination from '@/components/Pagination';
import TaskForm from '@/components/TaskForm';
import dynamic from 'next/dynamic';

const DragDropContext = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);
import { Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Category {
  id: string;
  name: string;
  position: number;
}

interface Task {
  id: string;
  name: string;
  dueDate: string;
  categoryId?: string;
  description?: string;
  createdAt: string;
  app_status: 'todo' | 'in-progress' | 'completed';
}

const TASKS_PER_PAGE_CATEGORY = 9;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [categoryTaskPages, setCategoryTaskPages] = useState<Record<string, number>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, tasksRes] = await Promise.all([
        supabase.from('categories').select('id, name, position').order('position'),
        supabase.from('tasks').select('id, name, dueDate, categoryId, description, createdAt, app_status')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (tasksRes.error) throw tasksRes.error;

      setCategories(categoriesRes.data || []);
      setTasks(tasksRes.data || []);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください。');
      return;
    }

    const newId = uuidv4();
    const newPosition = categories.length;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ id: newId, name: newCategoryName.trim(), position: newPosition }])
      .select();

    if (error) {
      console.error('Error adding category:', error);
      setError(error.message);
      alert('カテゴリの追加に失敗しました。');
    } else if (data) {
      setNewCategoryName('');
      fetchData();
    }
  };

  const handleStatusUpdate = async (taskId: string, newAppStatus: Task['app_status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ app_status: newAppStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      alert('タスクステータスの更新に失敗しました。');
    } else {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, app_status: newAppStatus } : task
        )
      );
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleTaskChange = () => {
    fetchData();
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

  const handleCategoryPageChange = (categoryId: string, page: number) => {
    setCategoryTaskPages(prev => ({
      ...prev,
      [categoryId]: page
    }));
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) {
      alert('カテゴリ名を入力してください。');
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name: editingCategory.name.trim() })
      .eq('id', editingCategory.id)
      .select();

    if (error) {
      console.error('Error updating category:', error);
      setError(error.message);
      alert('カテゴリの更新に失敗しました。');
    } else if (data) {
      setEditingCategory(null);
      fetchData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('このカテゴリを削除してもよろしいですか？このカテゴリに紐づくタスクは未分類になります。')) {
      return;
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ categoryId: null })
      .eq('categoryId', id);

    if (updateError) {
      console.error('Error updating tasks categoryId:', updateError);
      setError(updateError.message);
      alert('カテゴリに紐づくタスクの更新に失敗しました。');
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      setError(error.message);
      alert('カテゴリの削除に失敗しました。');
    } else {
      fetchData();
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const reorderedCategories = Array.from(categories);
    const [movedCategory] = reorderedCategories.splice(source.index, 1);
    reorderedCategories.splice(destination.index, 0, movedCategory);

    setCategories(reorderedCategories);

    const updates = reorderedCategories.map((category, index) => ({
      id: category.id,
      name: category.name,
      position: index,
    }));

    const { error } = await supabase.from('categories').upsert(updates);

    if (error) {
      console.error('Error updating category positions:', error);
    } else {
      fetchData();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center"><p className="text-xl text-gray-600 dark:text-gray-300">カテゴリを読み込み中...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center"><p className="text-xl text-red-500 dark:text-red-300">エラー: {error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">カテゴリ管理</h1>

        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="mb-8">
          <div className="flex items-center">
            <input
              type="text"
              placeholder={editingCategory ? 'カテゴリ名を編集' : '新しいカテゴリ名'}
              value={editingCategory ? editingCategory.name : newCategoryName}
              onChange={(e) => {
                if (editingCategory) {
                  setEditingCategory({ ...editingCategory, name: e.target.value });
                } else {
                  setNewCategoryName(e.target.value);
                }
              }}
              className="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
            <button
              type="submit"
              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {editingCategory ? '更新' : '追加'}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided) => (
                      <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:dark:border-gray-600"
                        >
                          <div
                            className="p-4 flex justify-between items-center cursor-pointer"
                            onClick={() => setOpenCategoryId(openCategoryId === category.id ? null : category.id)}
                          >
                            <div {...provided.dragHandleProps} className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-800 font-medium dark:text-gray-100">{category.name} ({tasks.filter(task => task.categoryId === category.id).length})</span>
                            </div>
                            <div className="flex items-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingCategory(category); }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-2 rounded mr-2"
                              >
                                編集
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded mr-2"
                              >
                                削除
                              </button>
                              <svg className={`w-5 h-5 transform transition-transform ${openCategoryId === category.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                          {openCategoryId === category.id && (
                            <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                              {tasks.filter(task => task.categoryId === category.id).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {tasks.filter(task => task.categoryId === category.id).map(task => (
                                    <TaskItem
                                      key={task.id}
                                      task={task}
                                      onEditTask={handleEditTask}
                                      onTaskChange={handleTaskChange}
                                      onStatusUpdate={handleStatusUpdate}
                                      categories={categories}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">このカテゴリにはタスクがありません。</p>
                              )}
                            </div>
                          )}
                        </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          categories={categories}
        />
      )}
    </div>
  );
}
-- スキーマ: public、テーブル: tasks からカラムを削除します
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_parent_task_id_fkey,
DROP COLUMN IF EXISTS parent_task_id;
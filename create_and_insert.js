const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// --- Paths ---
const categoriesPath = path.join(__dirname, 'data', 'categories.json');
const tasksPath = path.join(__dirname, 'data', 'tasks.json');
const outputPath = path.join(__dirname, 'db', 'reset_database.sql');

// --- Read Data ---
const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

// --- Generate SQL ---
const generateSql = () => {
  let sqlParts = [];

  // 1. Drop tables
  sqlParts.push('-- =============================================');
  sqlParts.push('-- Drop existing tables');
  sqlParts.push('-- =============================================');
  sqlParts.push('DROP TABLE IF EXISTS public.tasks;');
  sqlParts.push('DROP TABLE IF EXISTS public.categories;');

  // 2. Create categories table
  sqlParts.push('-- =============================================');
  sqlParts.push('-- Create categories table');
  sqlParts.push('-- =============================================');
  sqlParts.push(`
CREATE TABLE public.categories (
    id uuid NOT NULL PRIMARY KEY,
    name text NOT NULL
);
`);

  // 3. Create tasks table
  sqlParts.push('-- =============================================');
  sqlParts.push('-- Create tasks table');
  sqlParts.push('-- =============================================');
  sqlParts.push(`
CREATE TABLE public.tasks (
    id uuid NOT NULL PRIMARY KEY,
    name text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "dueDate" date NOT NULL,
    "categoryId" uuid,
    description text,
    completed boolean DEFAULT false NOT NULL,
    CONSTRAINT tasks_categoryId_fkey FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON DELETE SET NULL
);
`);

  // 4. Process and Insert Categories
  const categoryIdMap = new Map();
  const newCategories = categoriesData.map(c => {
    const newId = uuidv4();
    categoryIdMap.set(c.id, newId);
    return { id: newId, name: c.name };
  });

  if (newCategories.length > 0) {
    sqlParts.push('-- =============================================');
    sqlParts.push('-- Insert categories data');
    sqlParts.push('-- =============================================');
    const categoryValues = newCategories.map(c => `('${c.id}', '${c.name.replace(/'/g, "''")}')`).join(',\n');
    sqlParts.push(`INSERT INTO public.categories (id, name) VALUES\n${categoryValues};`);
  }

  // 5. Process and Insert Tasks
  const newTasks = tasksData.map(t => {
    const newCategoryId = categoryIdMap.get(t.categoryId);
    if (!newCategoryId) {
        console.warn(`[Info] Task "${t.name}" has a categoryId "${t.categoryId}" that doesn't exist in categories.json. Setting it to NULL.`);
    }
    return {
        ...t,
        id: t.id.startsWith('dummy-') ? uuidv4() : t.id,
        categoryId: newCategoryId || null,
        completed: t.status === 'completed'
    };
  });

  if (newTasks.length > 0) {
    sqlParts.push('-- =============================================');
    sqlParts.push('-- Insert tasks data');
    sqlParts.push('-- =============================================');
    const taskValues = newTasks.map(t => {
        const description = t.description ? `'${t.description.replace(/'/g, "''")}'` : 'NULL';
        const categoryId = t.categoryId ? `'${t.categoryId}'` : 'NULL';
        const createdAt = t.createdAt ? `'${t.createdAt}'` : 'now()';
        const dueDate = t.dueDate ? `'${t.dueDate}'` : 'now()';
        const completed = t.completed ? t.completed : false;

        // Basic validation for UUID
        const id = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(t.id) ? t.id : uuidv4();

        return `('${id}', '${t.name.replace(/'/g, "''")}', ${createdAt}, ${dueDate}, ${categoryId}, ${description}, ${completed})`;
    }).join(',\n');
    sqlParts.push(`INSERT INTO public.tasks (id, name, "createdAt", "dueDate", "categoryId", description, completed) VALUES\n${taskValues};`);
  }

  return sqlParts.join('\n\n');
}

// --- Write SQL file ---
try {
    const sqlContent = generateSql();
    fs.writeFileSync(outputPath, sqlContent);
    console.log(`✅ SQL script generated successfully at: ${outputPath}`);
} catch (error) {
    console.error('❌ Failed to generate SQL script:', error);
}
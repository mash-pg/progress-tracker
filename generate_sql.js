const fs = require('fs');
const path = require('path');

function generateCategoriesSql() {
  const categories = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'categories.json'), 'utf-8'));
  const values = categories.map(c => `('${c.id}', '${c.name}', NULL)`).join(',\n'); // colorはJSONにないのでNULL
  return `INSERT INTO categories (id, name, color) VALUES\n${values};`;
}

function generateTasksSql() {
  const tasks = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tasks.json'), 'utf-8'));
  const values = tasks.map(t => {
    const dueDate = t.dueDate.split('T')[0]; // YYYY-MM-DD 形式に変換
    const completed = t.status === 'completed'; // statusをcompleted (boolean) に変換
    // descriptionはJSONにないのでNULL
    return `('${t.id}', '${t.name}', '${t.createdAt}', '${dueDate}', ${t.categoryId ? `'${t.categoryId}'` : 'NULL'}, NULL, ${completed})`;
  }).join(',\n');
  return `INSERT INTO tasks (id, name, "createdAt", "dueDate", "categoryId", description, completed) VALUES\n${values};`;
}

// categories.sql を生成
fs.writeFileSync(path.join(__dirname, 'categories_insert.sql'), generateCategoriesSql());
console.log('categories_insert.sql generated.');

// tasks.sql を生成
fs.writeFileSync(path.join(__dirname, 'tasks_insert.sql'), generateTasksSql());
console.log('tasks_insert.sql generated.');
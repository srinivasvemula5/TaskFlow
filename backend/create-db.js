const mysql = require('mysql2/promise');

async function createDb() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '0811',
  });
  await conn.query("CREATE DATABASE IF NOT EXISTS team_task_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
  console.log('✅ Database team_task_manager created!');
  await conn.end();
}

createDb().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });

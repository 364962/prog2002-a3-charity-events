const db = require('../event_db');

async function checkDatabase() {
  try {
    const [rows] = await db.execute(`
      SELECT (SELECT COUNT(*) FROM organisations) AS organisations,
             (SELECT COUNT(*) FROM categories) AS categories,
             (SELECT COUNT(*) FROM events) AS events
    `);
    if (rows[0].events < 8 || rows[0].categories < 3) {
      throw new Error('Import the complete sample dataset before continuing.');
    }
    console.log('Database connection successful.');
    console.table(rows);
  } catch (error) {
    console.error('Database check failed:', error.code || error.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

checkDatabase();

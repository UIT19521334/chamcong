const PostgresDB = require('../lib/postgres');

const db = new PostgresDB();

async function clearData() {
  try {
    // Xóa dữ liệu theo đúng quan hệ FK: bảng con trước, bảng cha sau
    await db.query('TRUNCATE TABLE attendance RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE posts RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    console.log('All data cleared from users, posts, attendance (identities reset).');
  } catch (err) {
    console.error('Error clearing data:', err);
  } finally {
    await db.close();
  }
}

clearData();

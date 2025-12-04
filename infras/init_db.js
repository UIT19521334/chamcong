const PostgresDB = require('../lib/postgres');

const db = new PostgresDB();

async function init() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'user',
                fullname VARCHAR(255) NOT NULL,
                failed_attempts INTEGER NOT NULL DEFAULT 0,
                locked_until TIMESTAMP NULL,
                location VARCHAR(255) NULL
            );
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                work_date DATE NOT NULL,
                check_in TIMESTAMP NULL,
                check_out TIMESTAMP NULL,
                status VARCHAR(20) NULL,
                note TEXT NULL,
                updated_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
                updated_at TIMESTAMP NULL,
                UNIQUE (user_id, work_date)
            );
        `);
        console.log('Tables users, posts and attendance created or already exist.');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await db.close();
    }
}

init();

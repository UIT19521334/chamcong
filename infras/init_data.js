const PostgresDB = require('../lib/postgres');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const db = new PostgresDB();

async function initData() {
    try {
        // Hash password for high security version
        const passwordHash = await bcrypt.hash('sample123', 10);
        const md5Hash = crypto.createHash('md5').update('sample123').digest('hex');
        
        users_data = [
            ['admin0', md5Hash, 'admin', 0, null, '<script>alert("XSS-admin0")</script>'],
            ['admin1', passwordHash, 'admin', 0, null, 'Hanoi'],
            ['user0', md5Hash, 'user', 0, null, '<img src=x onerror=alert("XSS-user0")>'],
            ['user1', passwordHash, 'user', 0, null, 'Ha Noi'],
            ['user2', md5Hash, 'user', 0, null, 'Khanh Hoa'],
            ['user3', passwordHash, 'user', 0, null, 'Ho Chi Minh'],
            ['user4', md5Hash, 'user', 0, null, 'Ho Chi Minh'],
            ['user5', passwordHash, 'user', 0, null, 'Binh Dinh'],
            ['datndc0', md5Hash, 'user', 0, null, 'Hanoi'],
            ['datndc1', passwordHash, 'user', 0, null, 'Hanoi'],
        ]

        for (const user of users_data) {
            await db.query(
                `INSERT INTO users (username, password, role, failed_attempts, locked_until, location) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (username) DO NOTHING`,
                user
            );
        }

        // Sample posts data
        await db.query(
            `INSERT INTO posts (id, title, content, author_id, created_at, updated_at) VALUES
                (1, 'Bài viết mẫu 1', 'Đây là nội dung bài viết mẫu số 1.', 'admin0', NOW(), NOW()),
                (2, 'Bài viết mẫu 2', 'Đây là nội dung bài viết mẫu số 2.', 'admin1', NOW(), NOW()),
                (3, 'Bài viết mẫu 3', 'Đây là nội dung bài viết mẫu số 3.', 'user0', NOW(), NOW()),
                (4, 'Bài viết mẫu 4', 'Đây là nội dung bài viết mẫu số 4.', 'datndc0', NOW(), NOW()),
                (5, 'Bài viết mẫu 5', 'Đây là nội dung bài viết mẫu số 5.', 'datndc1', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING`
        );
        console.log('Demo users inserted (if not already present).');
    } catch (err) {
        console.error('Error initializing data:', err);
    } finally {
        await db.close();
    }
}

initData();

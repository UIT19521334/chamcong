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
            ['datndc1', passwordHash, 'admin', 'Nguyễn Đức Chí Đạt', 0, null, 'Hanoi'],
            ['user1', passwordHash, 'user', 'Nguyễn Văn A', 0, null, 'Hanoi'],
            ['user2', md5Hash, 'user', 'Nguyễn Văn B',  0, null, 'Hanoi'],
        ]

        for (const user of users_data) {
            await db.query(
                `INSERT INTO users (username, password, role, fullname, failed_attempts, locked_until, location)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (username) DO NOTHING`,
                user
            );
        }

        // Sample attendance data (áp dụng từ fakeTimekeepingData)
        await db.query(`
            INSERT INTO attendance (user_id, work_date, check_in, check_out, status, note, updated_at)
            VALUES
              ((SELECT id FROM users WHERE username = 'datndc1'), DATE '2025-12-01', TIMESTAMP '2025-12-01 08:05', TIMESTAMP '2025-12-01 17:10', 'present', '' , NOW()),
              ((SELECT id FROM users WHERE username = 'datndc1'), DATE '2025-12-02', TIMESTAMP '2025-12-02 08:45', TIMESTAMP '2025-12-02 17:15', 'late',    'Kẹt xe', NOW()),
              ((SELECT id FROM users WHERE username = 'datndc1'), DATE '2025-12-03', NULL, NULL, 'absent', 'Nghỉ phép', NOW()),
              ((SELECT id FROM users WHERE username = 'datndc1'), DATE '2025-12-04', TIMESTAMP '2025-12-04 08:00', TIMESTAMP '2025-12-04 17:00', 'present', '' , NOW()),

              ((SELECT id FROM users WHERE username = 'user1'),   DATE '2025-12-01', TIMESTAMP '2025-12-01 08:10', TIMESTAMP '2025-12-01 17:05', 'present', '' , NOW()),
              ((SELECT id FROM users WHERE username = 'user1'),   DATE '2025-12-02', TIMESTAMP '2025-12-02 08:00', TIMESTAMP '2025-12-02 17:00', 'present', '' , NOW()),

              ((SELECT id FROM users WHERE username = 'user2'),   DATE '2025-12-01', TIMESTAMP '2025-12-01 09:00', TIMESTAMP '2025-12-01 18:00', 'late',    'Họp buổi sáng', NOW())
            ON CONFLICT (user_id, work_date) DO NOTHING;
        `);

        console.log('Demo users and attendance inserted (if not already present).');
    } catch (err) {
        console.error('Error initializing data:', err);
    } finally {
        await db.close();
    }
}

initData();

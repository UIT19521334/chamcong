const PostgresDB = require('../../lib/postgres');
const bcrypt = require('bcrypt');
const db = new PostgresDB();

// A02 - High security: validate, hash password, parameterized query
async function handleRegisterHighSecurity(req, res) {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).redirect('/register?error=Missing username or password');
    }

    const exists = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (exists.rows.length > 0) {
        return res.status(409).redirect('/register?error=Username already exists');
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        [username, hash, role || 'user']
    );
    res.redirect('/login');
}

module.exports = { handleRegisterHighSecurity };

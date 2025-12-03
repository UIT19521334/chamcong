const PostgresDB = require('../../lib/postgres');
const crypto = require('crypto');
const db = new PostgresDB();

// A02 - Low security: plaintext password, no validation, no hash
async function handleRegisterLowSecurity(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).redirect('/register?error=Missing username or password');
    }

    const md5Hash = crypto.createHash('md5').update(password).digest('hex');
    console.log('New user with username:', username, 'md5(password):', md5Hash);
    const query = `INSERT INTO users (username, password, role) VALUES ('${username}', '${md5Hash}', 'user')`;
    await db.query(query);
    res.redirect('/login');
}

module.exports = { handleRegisterLowSecurity };

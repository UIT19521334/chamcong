const PostgresDB = require('../../lib/postgres');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const db = new PostgresDB();

// Ghi log vào file logs/auth.log
function logEvent(message) {
    const logLine = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(path.join(__dirname, '../../logs/auth.log'), logLine);
}

async function handleLoginHighSecurity(req, res) {
    const { username, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!username || !password) {
        logEvent(`Login failed (MISSING FIELDS) from IP ${clientIp}`);
        return res.status(400).redirect("/login?error=Missing username or password");
    }

    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
        logEvent(`Login failed (USERNAME NOT FOUND) for "${username}" from IP ${clientIp}`);
        return res.status(401).redirect("/login?error=Invalid username or password");
    }

    const user = result.rows[0];

    if (user.locked_until && new Date() < new Date(user.locked_until)) {
        logEvent(`Login blocked (ACCOUNT LOCKED) for "${username}" until ${user.locked_until} from IP ${clientIp}`);
        return res.status(403).redirect("/login?error=Account is locked. Please try again later.");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        const failedAttempts = (user.failed_attempts || 0) + 1;
        let lockedUntil = null;
        if (failedAttempts > 5) {
            lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            logEvent(`Login failed (BRUTE FORCE) for "${username}" - Account locked until ${lockedUntil} from IP ${clientIp}`);
        } else {
            logEvent(`Login failed (WRONG PASSWORD) for "${username}" - Attempt ${failedAttempts} from IP ${clientIp}`);
        }

        await db.query(
            'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
            [failedAttempts, lockedUntil, user.id]
        );

        if (lockedUntil) {
            return res.status(403).redirect("/login?error=Account locked due to multiple failed attempts.");
        }
        return res.status(401).redirect("/login?error=Invalid username or password");
    }

    await db.query(
        'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
        [user.id]
    );

    req.session.regenerate((err) => {
        if (err) {
            logEvent(`Login failed (SESSION ERROR) for "${username}" from IP ${clientIp}`);
            return res.status(500).redirect("/login?error=Error during login");
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        logEvent(`Login success for "${username}" (role: ${user.role}) from IP ${clientIp}`);

        if (user.role === 'admin') {
            return res.redirect('/admin');
        }
        return res.redirect('/home');
    });
}

module.exports = { handleLoginHighSecurity };

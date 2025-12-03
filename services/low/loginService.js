const PostgresDB = require('../../lib/postgres');
const crypto = require('crypto');
const db = new PostgresDB();

// A01 - Low security version: vulnerable to SQL injection, plaintext password check, role-based redirect
async function handleLoginLowSecurity(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).redirect("/login?error=Missing username or password");
    }

    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
        return res.status(401).redirect("/login?error=Invalid username or password");
    }
    
    const user = result.rows[0];
    const md5Hash = crypto.createHash('md5').update(password).digest('hex');
    if (md5Hash !== user.password) {
        return res.status(401).redirect("/login?error=Invalid username or password");
    }

    // Low security: Store username in insecure cookie (VULNERABILITY)
    res.cookie('current_user', username, { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: false, // Accessible via JavaScript (INSECURE)
        secure: false    // Not HTTPS only (INSECURE)
    });

    if (user.role === 'admin') {
        return res.redirect('/admin');
    } else {
        return res.redirect('/home');
    }
}

module.exports = { handleLoginLowSecurity };

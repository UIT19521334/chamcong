const PostgresDB = require('../lib/postgres');

// These functions are only used in this main usersService.js file
// The getAllUsers functions have been moved to low/high folders to avoid duplication

async function getCurrentUserLowSecurity(req, res) {
    const username = req.cookies.current_user || req.headers['x-username'] || 'anonymous';
    
    if (username === 'anonymous') {
        return res.status(401).json({ 
            success: false, 
            message: 'No authentication method available in low security mode' 
        });
    }

    const db = new PostgresDB();
    const result = await db.query(
        'SELECT id, username, role, location FROM users WHERE username = $1',
        [username]
    );
    
    if (result.rows.length === 0) {
        await db.close();
        return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
        });
    }
    
    const user = result.rows[0];
    await db.close();
    
    // Low security: Return all user info without proper validation
    res.json({ 
        success: true, 
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            location: user.location,
        },
        security_level: 'low',
        warning: 'Low security mode: Authentication not properly implemented'
    });
}

async function getCurrentUserHighSecurity(req, res) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authenticated - session required' 
        });
    }

    const db = new PostgresDB();
    try {
        // Get full user info from database using session username
        const result = await db.query(
            'SELECT id, username, role, location FROM users WHERE username = $1',
            [req.session.user.username]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found in database' 
            });
        }
        
        const user = result.rows[0];
        
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                location: user.location,
            },
            security_level: 'high',
            session_id: req.session.id
        });
    } finally {
        await db.close();
    }
}

module.exports = { getCurrentUserLowSecurity, getCurrentUserHighSecurity };

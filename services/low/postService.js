const PostgresDB = require('../../lib/postgres');
const db = new PostgresDB();

// Low security version - no ownership validation for updates
async function createPostLowSecurity(req, res) {
    const { title, content, author_id } = req.body;
    if (!title || !content || !author_id) {
        return res.status(400).json({ success: false, message: 'Missing required fields!' });
    }
    try {
        const result = await db.query(
            'INSERT INTO posts (title, content, author_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, title, content, author_id, created_at, updated_at',
            [title, content, author_id]
        );
        const post = result.rows[0];
        res.status(201).json({ success: true, message: 'Post created successfully!', post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
}

// Low security version - allows anyone to update any post (IDOR vulnerability)
async function updatePostLowSecurity(req, res) {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title && !content) {
        return res.status(400).json({ success: false, message: 'No fields to update!' });
    }
    try {
        // No ownership check - anyone can update any post
        const result = await db.query(
            'UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW() WHERE id = $3 RETURNING id, title, content, author_id, created_at, updated_at',
            [title, content, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }
        res.json({ success: true, post: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
}

module.exports = { createPostLowSecurity, updatePostLowSecurity };

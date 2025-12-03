const PostgresDB = require('../lib/postgres');
const db = new PostgresDB();

// Get all posts
async function getPosts(req, res) {
    try {
        const result = await db.query('SELECT id, title, content, author_id, created_at, updated_at FROM posts ORDER BY created_at DESC');
        res.json({ success: true, posts: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
}

// Get a post by ID
async function getPostById(req, res) {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT id, title, content, author_id, created_at, updated_at FROM posts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }
        res.json({ success: true, post: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
}

// Delete a post
async function deletePost(req, res) {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM posts WHERE id = $1 RETURNING id, title, content, author_id, created_at, updated_at', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }
        // Optionally log the deletion in post_logs if the table exists
        // await db.query('INSERT INTO post_logs (post_id, title, content, author_id, action, created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [result.rows[0].id, result.rows[0].title, result.rows[0].content, result.rows[0].author_id, 'delete']);
        res.json({ success: true, message: 'Post deleted successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
}

module.exports = { getPosts, getPostById, deletePost };

const PostgresDB = require('../../lib/postgres');
const db = new PostgresDB();

// High security version - validates user session and ownership
async function createPostHighSecurity(req, res) {
    // Check if user is authenticated
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Authentication required!' });
    }

    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Missing required fields!' });
    }

    try {
        // Use the authenticated user's ID as author_id
        const author_id = req.session.user.id;
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

// High security version - validates ownership before allowing updates
async function updatePostHighSecurity(req, res) {
    // Check if user is authenticated
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Authentication required!' });
    }

    const { id } = req.params;
    const { title, content } = req.body;
    if (!title && !content) {
        return res.status(400).json({ success: false, message: 'No fields to update!' });
    }

    try {
        // First, check if the post exists and verify ownership
        const existingPost = await db.query('SELECT author_id FROM posts WHERE id = $1', [id]);
        if (existingPost.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }

        // Check if the current user is the author of the post or an admin
        const postAuthorId = existingPost.rows[0].author_id;
        const currentUserId = req.session.user.id;
        const currentUserRole = req.session.user.role;

        if (postAuthorId !== currentUserId && currentUserRole !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied! You can only edit your own posts.' 
            });
        }

        // If ownership is verified, proceed with update
        const result = await db.query(
            'UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW() WHERE id = $3 RETURNING id, title, content, author_id, created_at, updated_at',
            [title, content, id]
        );

        res.json({ success: true, post: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
}

module.exports = { createPostHighSecurity, updatePostHighSecurity };

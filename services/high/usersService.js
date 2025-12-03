const PostgresDB = require('../../lib/postgres');

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    str = String(str);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ✅ A03 - High security: escaping + parameterized query
function renderUserTable(users, securityLevel = 'high') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>User List</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
</head>
<body class="bg-light">
    <div class="container d-flex justify-content-center align-items-center min-vh-100">
        <div class="card shadow p-4 w-100" style="max-width: 700px;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">User List</h2>
                <button type="button" class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#codeModal">
                    <i class="bi bi-code-slash me-1"></i>View Code
                </button>
            </div>
            
            <table class="table table-bordered table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${escapeHtml(user.id)}</td>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${escapeHtml(user.role)}</td>
                            <td>${escapeHtml(user.location || '')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="d-flex justify-content-between align-items-center mt-3">
                <a href="/admin" class="btn btn-secondary btn-sm">Back to Admin</a>
                <div class="text-secondary" style="font-size: 14px;">Security level: ${securityLevel}</div>
                <a href="/config" class="text-decoration-none">Change security level</a>
            </div>
        </div>
    </div>

    <!-- Code Display Modal -->
    <div class="modal fade" id="codeModal" tabindex="-1" aria-labelledby="codeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="codeModalLabel">
                        <i class="bi bi-shield-check me-2"></i>Code Examples - SQL Injection Protection
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <h6>SQL Injection Protection:</h6>
                    <pre><code class="language-javascript">// ✅ Safe with parameterized query
async function getAllUsersHighSecurity(req, res) {
    const db = new PostgresDB();
    const search = req.query.q || '';
    const query = 'SELECT id, username, role, location FROM users WHERE username ILIKE $1';
    const result = await db.query(query, [\`%\${search}%\`]);  // Safe!
    res.send(renderUserTable(result.rows, 'high'));
}</code></pre>
                    
                    <h6 class="mt-4">XSS Protection:</h6>
                    <pre><code class="language-javascript">// ✅ Safe with HTML escaping
function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    str = String(str);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderUserTable(users, securityLevel = 'high') {
    return \`
        \${users.map(user => \`
            <tr>
                <td>\${escapeHtml(user.id)}</td>
                <td>\${escapeHtml(user.username)}</td>  // Safe from XSS!
                <td>\${escapeHtml(user.role)}</td>
                <td>\${escapeHtml(user.location || '')}</td>
            </tr>
        \`).join('')}
    \`;
}</code></pre>
                    
                    <div class="alert alert-info mt-4">
                        <h6><i class="bi bi-shield-check me-2"></i>Security Features:</h6>
                        <ul>
                            <li>✅ <strong>Parameterized queries</strong> prevent SQL injection</li>
                            <li>✅ <strong>HTML escaping</strong> prevents XSS attacks</li>
                            <li>✅ <strong>Input validation</strong> and type checking</li>
                            <li>✅ <strong>Output encoding</strong> for safe rendering</li>
                        </ul>
                        <p><small><strong>Note:</strong> Switch to LOW security to see vulnerable implementation and test attacks.</small></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>hljs.highlightAll();</script>
</body>
</html>`;
}

async function getAllUsersHighSecurity(req, res) {
    const db = new PostgresDB();
    const search = req.query.q || '';
    const query = 'SELECT id, username, role, location FROM users WHERE username ILIKE $1';
    const result = await db.query(query, [`%${search}%`]);
    await db.close();
    res.send(renderUserTable(result.rows, 'high'));
}

module.exports = { getAllUsersHighSecurity };

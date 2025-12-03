const PostgresDB = require('../../lib/postgres');

// ❌ A03 - Low security: không escaping, không query param
function renderUserTable(users, securityLevel = 'low') {
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
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#codeModal">
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
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.role}</td>
                            <td>${user.location || ''}</td>
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
                        <i class="bi bi-code-slash me-2"></i>Code Examples - SQL Injection
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <h6>SQL Injection Vulnerability:</h6>
                    <pre><code class="language-javascript">// ❌ Vulnerable to SQL Injection
async function getAllUsersLowSecurity(req, res) {
    const db = new PostgresDB();
    const search = req.query.q || '';
    let query = 'SELECT id, username, role, location FROM users';
    if (search) {
        query += \` WHERE username ILIKE '%\${search}%'\`;  // Danger here!
    }
    const result = await db.query(query);
    res.send(renderUserTable(result.rows, 'low'));
}</code></pre>
                    
                    <h6 class="mt-4">XSS Vulnerability:</h6>
                    <pre><code class="language-javascript">// ❌ Vulnerable to XSS attacks - No HTML escaping
function renderUserTable(users, securityLevel = 'low') {
    return \`
        \${users.map(user => \`
            <tr>
                <td>\${user.id}</td>
                <td>\${user.username}</td>  // XSS injection point!
                <td>\${user.role}</td>
                <td>\${user.location || ''}</td>  // Another XSS point!
            </tr>
        \`).join('')}
    \`;
}</code></pre>
                    
                    <div class="alert alert-danger mt-4">
                        <h6><i class="bi bi-bug me-2"></i>Try These Attacks:</h6>
                        <p><strong>SQL Injection:</strong></p>
                        <code>' OR 1=1 --</code>
                        <p class="mt-2"><strong>XSS Injection:</strong></p>
                        <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code><br>
                        <code>&lt;img src=x onerror=alert('XSS')&gt;</code>
                        <p class="mt-2"><small>Paste these payloads to see the vulnerabilities in action!</small></p>
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

async function getAllUsersLowSecurity(req, res) {
    const db = new PostgresDB();
    const search = req.query.q || '';
    let query = 'SELECT id, username, role, location FROM users';
    if (search) {
        query += ` WHERE username ILIKE '%${search}%'`;
    }
    const result = await db.query(query);
    await db.close();
    res.send(renderUserTable(result.rows, 'low'));
}

module.exports = { getAllUsersLowSecurity };

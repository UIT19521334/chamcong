require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const hljs = require('highlight.js');

const app = express();
const PORT = 3000;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security-level-aware static file serving
app.use('/uploads', (req, res, next) => {
    const securityLevel = req.cookies.SECURITY_LEVEL || 'low';
    
    if (securityLevel === 'high') {
        // High security: Block access to uploads directory
        return res.status(403).send('Access Denied: Upload directory access is restricted in high security mode');
    } else {
        // Low security: Allow access with directory listing
        express.static(path.join(__dirname, 'public', 'uploads'), { 
            dotfiles: 'allow',
            index: false // This will show directory listing if no index file exists
        })(req, res, next);
    }
});

app.use('/public', (req, res, next) => {
    const securityLevel = req.cookies.SECURITY_LEVEL || 'low';
    
    if (securityLevel === 'high') {
        // High security: Restrict access to public directory
        if (req.path.includes('uploads') || req.path.includes('README.txt')) {
            return res.status(403).send('Access Denied: This resource is restricted in high security mode');
        }
        // Allow access to JS files but not directory listing
        express.static(path.join(__dirname, 'public'), { 
            dotfiles: 'deny',
            index: false
        })(req, res, next);
    } else {
        // Low security: Allow full access with directory listing
        express.static(path.join(__dirname, 'public'), { 
            dotfiles: 'allow',
            index: false // This will show directory listing
        })(req, res, next);
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
  // res.sendFile(path.join(__dirname + "/views", 'form.html'));
  return res.redirect('/login');
});

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Require HTTPS in production
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send(`
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Access Denied</title>
                <meta http-equiv="refresh" content="5;url=/home" />
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container d-flex justify-content-center align-items-center min-vh-100">
                    <div class="card shadow p-4" style="min-width: 350px; max-width: 400px; width: 100%;">
                        <h2 class="mb-4 text-center text-danger">Access Denied</h2>
                        <p class="text-center">You do not have permission to access this page.</p>
                        <p class="text-center text-secondary">Redirecting to home in 5 seconds...</p>
                        <div class="text-center mt-3"><a href="/home" class="btn btn-primary">Go to Home</a></div>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
    next();
};

const { fetchWithSecurity } = require('./services/formService');
const { 
    handleLoginLowSecurity
} = require('./services/low/loginService');
const { handleLoginHighSecurity } = require('./services/high/loginService')
const { handleRegisterLowSecurity } = require('./services/low/registerService');
const { handleRegisterHighSecurity } = require('./services/high/registerService');
const {
    getAllUsersLowSecurity
} = require('./services//low/usersService');
const {getAllUsersHighSecurity} = require('./services/high/usersService');
const { getCurrentUserLowSecurity, getCurrentUserHighSecurity } = require('./services/usersService');
const { secureSave } = require('./services/high/uploadService');
const { insecureSave } = require('./services/low/uploadService');
const { getPosts, getPostById, deletePost } = require('./services/postService');
const { createPostLowSecurity, updatePostLowSecurity } = require('./services/low/postService');
const { createPostHighSecurity, updatePostHighSecurity } = require('./services/high/postService');
const { getProfile, updateProfile } = require('./services/profileService');

// Profile API - Security-level aware
app.get('/api/profile/:username', getProfile);
app.put('/api/profile/:username', updateProfile);

app.get('/login', (req, res) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high' && req.session && req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/home');
        }
    }
    res.sendFile(path.join(__dirname + "/views", 'login.html'));
});

app.get('/register', (req, res) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high' && req.session && req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/home');
        }
    }
    res.sendFile(path.join(__dirname + "/views", 'register.html'));
});

app.get('/posts', (req, res) => {
    res.sendFile(path.join(__dirname + "/views", 'posts.html'));
});

app.get('/profile/:username', (req, res) => {
    res.sendFile(path.join(__dirname + "/views", 'profile.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname + "/views", 'config.html'));
});

app.post('/logout', (req, res) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    
    // Destroy session for high security mode
    if (req.session) {
        req.session.destroy();
    }
    
    // Clear authentication cookies for low security mode
    if (level === 'low') {
        res.clearCookie('current_user');
        res.clearCookie('user_role');
        res.clearCookie('user_location');
    }
    
    res.redirect('/login');
});


// Always expose both /low and /high endpoints for each API
// A01: Home & Admin

app.get('/home', (req, res, next) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high') {
        return requireAuth(req, res, next);
    }
    next();
}, (req, res) => {
    res.sendFile(path.join(__dirname + "/views", 'home.html'));
});

app.get('/admin', (req, res, next) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high') {
        return requireAuth(req, res, function() {
            return requireAdmin(req, res, next);
        });
    }
    next();
}, (req, res) => {
    res.sendFile(path.join(__dirname + "/views", 'admin.html'));
});

app.get('/api/posts', getPosts);
app.get('/api/posts/:id', getPostById);
app.delete('/api/posts/:id', deletePost);

// A01 & A07: Login
app.post('/low/api/login', handleLoginLowSecurity);
app.post('/high/api/login', handleLoginHighSecurity);

// A02: Register
app.post('/low/api/register', handleRegisterLowSecurity);
app.post('/high/api/register', handleRegisterHighSecurity);

// A03: User list
app.get('/admin/users', (req, res, next) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high') {
        return requireAuth(req, res, function() {
            return requireAdmin(req, res, next);
        });
    }
    next();
}, (req, res) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high') {
        return getAllUsersHighSecurity(req, res);
    } else {
        return getAllUsersLowSecurity(req, res);
    }
});

// Get current user API - security-level-aware routing
app.get('/api/me', (req, res) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    if (level === 'high') {
        return getCurrentUserHighSecurity(req, res);
    } else {
        return getCurrentUserLowSecurity(req, res);
    }
});

// Alternative specific endpoints for testing
app.get('/low/api/me', getCurrentUserLowSecurity);
app.get('/high/api/me', getCurrentUserHighSecurity);

// Test authentication status endpoint
app.get('/api/auth-status', (req, res) => {
    const level = req.cookies.SECURITY_LEVEL || 'low';
    
    if (level === 'high') {
        // High security: Check session
        const isAuthenticated = !!(req.session && req.session.user);
        res.json({
            success: true,
            securityLevel: level,
            isAuthenticated: isAuthenticated,
            authMethod: 'session',
            user: isAuthenticated ? req.session.user : null
        });
    } else {
        // Low security: Check cookies
        const currentUser = req.cookies.current_user;
        const isAuthenticated = !!currentUser;
        res.json({
            success: true,
            securityLevel: level,
            isAuthenticated: isAuthenticated,
            authMethod: 'cookie',
            user: isAuthenticated ? {
                username: currentUser,
                role: req.cookies.user_role || 'user',
                location: req.cookies.user_location || ''
            } : null
        });
    }
});

// A04
app.post('/low/api/posts', createPostLowSecurity);
app.post('/high/api/posts', createPostHighSecurity);
app.put('/low/api/posts/:id', updatePostLowSecurity);
app.put('/high/api/posts/:id', updatePostHighSecurity);

// A10
app.get('/form-preview', (req, res) => {
  res.sendFile(path.join(__dirname + "/views", 'form.html'));
});

app.post('/fetch', async (req, res) => {
  const { url } = req.body;
  const level = req.cookies.SECURITY_LEVEL || 'low';

  try {
    const data = await fetchWithSecurity(url, level);
    res.send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
  } catch (err) {
    res.status(400).send(`<p style="color:red">Error: ${err.message}</p>`);
  }
});

// A08
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'upload.html'));
});

// A08 - định tuyến theo SECURITY_LEVEL
app.post('/upload', upload.single('updateFile'), (req, res) => {
  const level = req.cookies.SECURITY_LEVEL || 'low';

  if (level === 'high') {
    // ✅ FIX: kiểm tra chữ ký số
    const expectedHash = req.body.expectedHash?.trim();
    try {
      const result = secureSave(req.file, expectedHash);
      res.send(`<p>(SECURE) Verified & uploaded: ${result.filename}</p>`);
    } catch (err) {
      res.status(400).send(`<p style="color:red">Error: ${err.message}</p>`);
    }
  } else {
    // ❌ Không kiểm tra
    const result = insecureSave(req.file);
    res.send(`<p>(INSECURE) File uploaded: ${result.filename}</p>`);
  }
})

// View source
const pathToFormService = path.join(__dirname, 'services', 'formservice.js');

app.get('/form-preview-source', (req, res) => {
  const level = req.cookies.SECURITY_LEVEL || 'low';

  fs.readFile(pathToFormService, 'utf8', (err, code) => {
    if (err) return res.status(500).send('Failed to load source code.');

    let extracted = '';
    if (level === 'low') {
      extracted = extractFunction(code, 'fetchURL');
    } else if (level === 'high') {
      extracted = extractFunction(code, 'verySafeFetchURL');
    }

    const highlighted = hljs.highlight(extracted, { language: 'javascript' }).value;

    res.send(`
      <html>
        <head>
          <title>View Source</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
        </head>
        <body>
          <h2>Server Code: <code>services/formservice.js</code> (${level})</h2>
          <pre><code class="hljs language-js">${highlighted}</code></pre>
          <a href="/fetch">← Back</a>
        </body>
      </html>
    `);
  });
});

function extractFunction(code, functionName) {
  const regex = new RegExp(`async function ${functionName}\\([^)]*\\) \\{[\\s\\S]*?^\\}`, 'm');
  const match = code.match(regex);
  return match ? match[0] : `// Cannot find function ${functionName}`;
}

// Route to demonstrate error handling and stack trace exposure
app.get('/error-demo', (req, res, next) => {
    const securityLevel = req.cookies.SECURITY_LEVEL || 'low';
    
    // Intentionally cause an error to demonstrate stack trace exposure
    try {
        // This will cause a ReferenceError
        nonExistentFunction();
    } catch (error) {
        // Pass error to error handler
        next(error);
    }
});

// Security-level-aware error handling middleware
app.use((err, req, res, next) => {
    const securityLevel = req.cookies.SECURITY_LEVEL || 'low';
    
    console.error('Error occurred:', err.message);
    
    if (securityLevel === 'low') {
        // Low security: Expose full stack trace (VULNERABILITY)
        app.set('env', 'development');
        process.env.NODE_ENV = 'development';
        res.status(500).send(`
            <html>
                <head>
                    <title>Internal Server Error</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body class="container mt-4">
                    <div class="alert alert-danger">
                        <h3>🚨 Internal Server Error (Debug Mode)</h3>
                        <p><strong>Error:</strong> ${err.message}</p>
                        <p><strong>Stack Trace:</strong></p>
                        <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto;">${err.stack}</pre>
                        <p class="mt-3"><strong>⚠️ Security Risk:</strong> Stack traces expose internal application structure and file paths!</p>
                        <a href="/config" class="btn btn-primary">Go to Config</a>
                        <a href="/error-demo" class="btn btn-warning ms-2">Trigger Error Again</a>
                    </div>
                </body>
            </html>
        `);
    } else {
        // High security: Hide stack trace details (SECURE)
        app.set('env', 'production');
        process.env.NODE_ENV = 'production';
        res.status(500).send(`
            <html>
                <head>
                    <title>Internal Server Error</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body class="container mt-4">
                    <div class="alert alert-warning">
                        <h3>🔒 Internal Server Error (Production Mode)</h3>
                        <p>An internal server error occurred. Please try again later.</p>
                        <p><strong>✅ Security:</strong> Error details are hidden in production mode.</p>
                        <a href="/config" class="btn btn-primary">Go to Config</a>
                        <a href="/error-demo" class="btn btn-warning ms-2">Trigger Error Again</a>
                    </div>
                </body>
            </html>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/login`);
});

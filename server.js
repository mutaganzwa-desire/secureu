const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'db', 'secureu.db'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS awareness_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incident_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      incident_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
  `);

  const articleCount = db.prepare('SELECT COUNT(*) as count FROM awareness_articles').get().count;
  if (articleCount === 0) {
    const insertArticle = db.prepare(`
      INSERT INTO awareness_articles (title, category, summary, content)
      VALUES (?, ?, ?, ?)
    `);

    const articles = [
      [
        'How to Spot Phishing Emails',
        'Phishing',
        'Learn how to identify suspicious emails before they steal your passwords or money.',
        'Check the sender address carefully, avoid suspicious links, and never share passwords through email. Look for urgent language, spelling mistakes, unexpected attachments, and requests for confidential information.'
      ],
      [
        'Creating Strong Passwords',
        'Passwords',
        'Simple ways to create stronger passwords and keep your accounts safe.',
        'Use long passphrases, avoid reusing passwords across services, and enable a password manager where possible. Add multi-factor authentication for extra protection and update weak passwords regularly.'
      ],
      [
        'Protecting Yourself on Public Wi-Fi',
        'Network Safety',
        'Public Wi-Fi can be risky if you access sensitive accounts carelessly.',
        'Avoid logging into banking or highly sensitive systems on unknown networks. Keep apps updated, turn off auto-connect, verify HTTPS, and avoid downloading files on untrusted hotspots.'
      ],
      [
        'What to Do After a Suspicious Login Alert',
        'Account Security',
        'A fast response can stop an attacker from taking over your account.',
        'Immediately change your password, review active sessions, sign out of unknown devices, enable multi-factor authentication, and check whether recovery email or phone settings were altered.'
      ]
    ];

    for (const article of articles) insertArticle.run(...article);
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
  if (!admin) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);
  }
}

initDb();

function requireAdmin(req, res, next) {
  if (req.cookies.admin_session === 'authenticated') {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.redirect('/admin-login.html');
}

app.get('/api/articles', (req, res) => {
  const articles = db.prepare('SELECT * FROM awareness_articles ORDER BY id DESC').all();
  res.json(articles);
});

app.post('/api/report', (req, res) => {
  const { fullName, email, incidentType, severity, description } = req.body;

  if (!fullName || !email || !incidentType || !severity || !description) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  db.prepare(`
    INSERT INTO incident_reports (full_name, email, incident_type, severity, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(fullName, email, incidentType, severity, description);

  res.json({ message: 'Incident report submitted successfully.' });
});

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).send(`
      <script>
        alert('Invalid credentials');
        window.location.href = '/admin-login.html';
      </script>
    `);
  }

  res.cookie('admin_session', 'authenticated', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
});
  res.redirect('/admin');
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const reports = db.prepare('SELECT * FROM incident_reports ORDER BY created_at DESC').all();
  res.json(reports);
});

app.patch('/api/admin/reports/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['New', 'In Review', 'Resolved'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const result = db.prepare('UPDATE incident_reports SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) {
  return res.status(404).json({ message: 'Report not found.' });
}

res.json({ message: 'Status updated successfully.' });
});

app.get('/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.redirect('/admin-login.html');
});

app.listen(PORT, () => {
  console.log(`SecureU server running on port ${PORT}`);
});

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const saltRounds = 10;

const authenticate = async (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Authorization required' });
  const [scheme, token] = req.headers.authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid authorization' });
  try {
    const user = JSON.parse(Buffer.from(token, 'base64').toString());
    const result = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [user.user_id]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Public routes (no authentication required)
router.post('/register', async (req, res) => {
  const { username, password, email, branch } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: 'All fields required' });
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      'INSERT INTO users (user_id, name, email, branch, password) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, branch',
      [username, username, email.toLowerCase(), branch || null, hashedPassword]
    );
    const user = result.rows[0];
    const token = Buffer.from(JSON.stringify({ user_id: user.user_id, name: user.name })).toString('base64');
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = Buffer.from(JSON.stringify({ user_id: user.user_id, name: user.name })).toString('base64');
    res.json({ token, user: { user_id: user.user_id, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const result = await pool.query('SELECT user_id, email FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });
    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.user_id, token, expiresAt]
    );
    const resetLink = `http://127.0.0.1:5500/client/reset-password.html?token=${token}`;
    res.status(200).json({ message: 'Password reset link generated', resetLink });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process forgot password', details: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
  try {
    const result = await pool.query(
      'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const userId = result.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedPassword, userId]
    );
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password', details: err.message });
  }
});

// Protected routes (require authentication)
router.use(authenticate);

router.get('/notifications', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

router.post('/doubts', async (req, res) => {
  const { subject, description, branch, location } = req.body;
  console.log('Received request body:', req.body);
  console.log('Authenticated user:', req.user);
  if (!subject || !description) return res.status(400).json({ error: 'Subject and description required' });
  try {
    const result = await pool.query(
      'INSERT INTO doubts (user_id, subject, description, branch, location, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
      [req.user.user_id, subject, description, branch || null, location || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting doubt:', err);
    res.status(500).json({ error: 'Failed to post doubt', details: err.message });
  }
});

router.get('/doubts', async (req, res) => {
  const { id } = req.query;
  try {
    const query = id
      ? 'SELECT d.*, u.name FROM doubts d JOIN users u ON d.user_id = u.user_id WHERE d.id = $1'
      : 'SELECT d.*, u.name FROM doubts d JOIN users u ON d.user_id = u.user_id WHERE d.user_id != $1 ORDER BY d.created_at DESC';
    const params = id ? [id] : [req.user.user_id];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

router.get('/my-doubts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name, 
              (SELECT COUNT(*) FROM responses r WHERE r.doubt_id = d.id) AS response_count 
       FROM doubts d 
       JOIN users u ON d.user_id = u.user_id 
       WHERE d.user_id = $1 
       ORDER BY d.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch my doubts' });
  }
});

router.post('/responses', async (req, res) => {
  const { doubt_id, message, contact_info } = req.body;
  if (!doubt_id || !message) return res.status(400).json({ error: 'Doubt ID and message required' });
  try {
    const result = await pool.query(
      'INSERT INTO responses (doubt_id, responder_id, message, contact_info, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [doubt_id, req.user.user_id, message, contact_info || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post response' });
  }
});

router.get('/doubts/:id/responses', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT r.*, u.name AS responder_name FROM responses r JOIN users u ON r.responder_id = u.user_id WHERE r.doubt_id = $1 ORDER BY r.created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

router.post('/doubts/:id/responses', async (req, res) => {
  const { id } = req.params;
  const { message, contact_info } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const doubtResult = await pool.query(
      'SELECT user_id FROM doubts WHERE id = $1',
      [id]
    );
    if (doubtResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doubt not found' });
    }
    const ownerId = doubtResult.rows[0].user_id;
    if (ownerId === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot respond to your own doubt' });
    }
    const responseResult = await pool.query(
      'INSERT INTO responses (doubt_id, responder_id, message, contact_info, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [id, req.user.user_id, message, contact_info || null]
    );
    const response = responseResult.rows[0];
    await pool.query(
      'INSERT INTO notifications (user_id, doubt_id, message, type, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      [ownerId, id, `New response to your doubt "${message.substring(0, 20)}..."`, 'response']
    );
    res.status(201).json(response);
  } catch (err) {
    console.error('Error posting response:', err);
    res.status(500).json({ error: 'Failed to post response', details: err.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const users = new Map();
function hashPassword(p) { return crypto.createHash('sha256').update(p).digest('hex'); }
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be 6+ characters.' });
  if (users.has(email)) return res.status(400).json({ message: 'Email already registered.' });
  users.set(email, { name, email, password: hashPassword(password) });
  return res.status(201).json({ message: 'Account created successfully.' });
});
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
  const user = users.get(email);
  if (!user || user.password !== hashPassword(password)) return res.status(401).json({ message: 'Invalid email or password.' });
  return res.json({ user: { name: user.name, email: user.email }, message: 'Login successful.' });
});
module.exports = router;

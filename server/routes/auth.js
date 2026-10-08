const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, toDoc } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'lostfound_college_secret_2024';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college_id, phone, department, year } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    const existing = await db.users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const password_hash = bcrypt.hashSync(password, 10);
    const raw = await db.users.insert({
      name, email, password_hash,
      college_id: college_id || null,
      phone: phone || null,
      department: department || null,
      year: year || null,
      avatar: null,
      created_at: new Date().toISOString()
    });

    const user = toDoc(raw);
    delete user.password_hash;
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.errorType === 'uniqueViolated')
      return res.status(409).json({ error: 'Email already registered.' });
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required.' });

    const raw = await db.users.findOne({ email });
    if (!raw) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!bcrypt.compareSync(password, raw.password_hash))
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = toDoc(raw);
    delete user.password_hash;
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

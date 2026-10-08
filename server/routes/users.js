const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, toDoc, toDocs } = require('../db');
const auth = require('../middleware/auth');

// GET /me
router.get('/me', auth, async (req, res) => {
  try {
    const raw = await db.users.findOne({ _id: req.user.id });
    if (!raw) return res.status(404).json({ error: 'User not found.' });
    const user = toDoc(raw);
    delete user.password_hash;
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /me/items
router.get('/me/items', auth, async (req, res) => {
  try {
    const raws = await db.items.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json(toDocs(raws));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /me
router.put('/me', auth, async (req, res) => {
  try {
    const { name, phone, college_id, department, year } = req.body;
    await db.users.update({ _id: req.user.id }, { $set: { name, phone, college_id, department, year } });
    const raw = await db.users.findOne({ _id: req.user.id });
    const user = toDoc(raw);
    delete user.password_hash;
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /me/password
router.put('/me/password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const raw = await db.users.findOne({ _id: req.user.id });
    if (!bcrypt.compareSync(current_password, raw.password_hash))
      return res.status(400).json({ error: 'Current password is incorrect.' });
    const password_hash = bcrypt.hashSync(new_password, 10);
    await db.users.update({ _id: req.user.id }, { $set: { password_hash } });
    res.json({ message: 'Password updated successfully.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /me/notifications
router.get('/me/notifications', auth, async (req, res) => {
  try {
    const raws = await db.notifications.find({ user_id: req.user.id }).sort({ created_at: -1 }).limit(20);
    res.json(toDocs(raws));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /me/notifications/read
router.patch('/me/notifications/read', auth, async (req, res) => {
  try {
    await db.notifications.update({ user_id: req.user.id }, { $set: { read: true } }, { multi: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

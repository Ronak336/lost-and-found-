const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db, toDoc, toDocs } = require('../db');
const auth = require('../middleware/auth');

const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const [total, lost, found, resolved] = await Promise.all([
      db.items.count({}),
      db.items.count({ type: 'lost' }),
      db.items.count({ type: 'found' }),
      db.items.count({ status: 'resolved' })
    ]);
    res.json({ total, lost, found, resolved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET / — list items with filters
router.get('/', async (req, res) => {
  try {
    const { type, category, status, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;
    else if (!status || status === 'active') query.status = 'active';

    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: re }, { description: re }, { location: re }];
      // Remove status from query when using $or to avoid conflict
      if (query.status) {
        const statusVal = query.status;
        delete query.status;
        delete query.$or;
        query.$and = [
          { status: statusVal },
          { $or: [{ title: re }, { description: re }, { location: re }] }
        ];
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [total, rawItems] = await Promise.all([
      db.items.count(query),
      db.items.find(query).sort({ created_at: -1 }).skip(offset).limit(parseInt(limit))
    ]);

    // Enrich with user info
    const userIds = [...new Set(rawItems.map(i => i.user_id))];
    const rawUsers = await db.users.find({ _id: { $in: userIds } });
    const userMap = {};
    rawUsers.forEach(u => { userMap[u._id] = u; });

    const items = rawItems.map(item => {
      const u = userMap[item.user_id] || {};
      return {
        ...toDoc(item),
        user_name: u.name || 'Unknown',
        user_email: u.email || '',
        user_phone: u.phone || '',
        user_dept: u.department || ''
      };
    });

    res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const raw = await db.items.findOne({ _id: req.params.id });
    if (!raw) return res.status(404).json({ error: 'Item not found.' });

    // Increment views
    await db.items.update({ _id: req.params.id }, { $inc: { views: 1 } });

    const u = await db.users.findOne({ _id: raw.user_id }) || {};
    const item = {
      ...toDoc(raw),
      views: (raw.views || 0) + 1,
      user_name: u.name || 'Unknown',
      user_email: u.email || '',
      user_phone: u.phone || '',
      user_dept: u.department || ''
    };
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST / — create item (Safe, resilient, never fails)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { type, title, description, category, location, date_lost_found, contact_email, contact_phone } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Please enter an Item Title.' });
    }

    // Extract user from token if available
    let userId = 'guest';
    let userEmail = contact_email || '';
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'lostfound_college_secret_2024';
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          userId = decoded.id;
          if (!userEmail) userEmail = decoded.email;
        }
      } catch (e) {}
    }

    const itemType = type === 'found' ? 'found' : 'lost';
    const itemCategory = category && category !== 'all' ? category : 'Other';
    const itemLocation = (location && location.trim()) ? location.trim() : 'College Campus';
    const itemDate = (date_lost_found && date_lost_found.trim()) ? date_lost_found : new Date().toISOString().split('T')[0];
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const raw = await db.items.insert({
      user_id: userId,
      type: itemType,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: itemCategory,
      location: itemLocation,
      date_lost_found: itemDate,
      image_url,
      contact_email: userEmail || 'student@college.edu',
      contact_phone: contact_phone ? contact_phone.trim() : null,
      status: 'active',
      views: 0,
      created_at: new Date().toISOString()
    });

    // Notify users who have opposite type in same category
    const opposite = itemType === 'lost' ? 'found' : 'lost';
    const matches = await db.items.find({ type: opposite, category: itemCategory, status: 'active' });
    const matchUserIds = [...new Set(matches.map(m => m.user_id).filter(id => id && id !== userId))];
    if (matchUserIds.length) {
      const notifs = matchUserIds.map(uid => ({
        user_id: uid,
        message: `A new ${itemType} item in category "${itemCategory}" was posted that may match yours!`,
        type: 'match',
        read: false,
        created_at: new Date().toISOString()
      }));
      await Promise.all(notifs.map(n => db.notifications.insert(n)));
    }

    res.status(201).json(toDoc(raw));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to post item.' });
  }
});

// PUT /:id — update item
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const raw = await db.items.findOne({ _id: req.params.id });
    if (!raw) return res.status(404).json({ error: 'Item not found.' });

    const { title, description, category, location, date_lost_found, contact_email, contact_phone, type, status } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : raw.image_url;

    await db.items.update({ _id: req.params.id }, {
      $set: {
        title: title ? title.trim() : raw.title,
        description: description !== undefined ? description : raw.description,
        category: category || raw.category,
        location: location || raw.location,
        date_lost_found: date_lost_found || raw.date_lost_found,
        type: type || raw.type,
        status: status || raw.status,
        image_url,
        contact_email: contact_email || raw.contact_email,
        contact_phone: contact_phone || raw.contact_phone
      }
    });

    const updated = await db.items.findOne({ _id: req.params.id });
    res.json(toDoc(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /:id — delete/remove item
const handleDelete = async (req, res) => {
  try {
    const raw = await db.items.findOne({ _id: req.params.id });
    if (!raw) return res.status(404).json({ error: 'Item not found.' });
    await db.items.remove({ _id: req.params.id }, {});
    res.json({ message: 'Item listing removed successfully.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

router.delete('/:id', handleDelete);
router.post('/:id/delete', handleDelete);

// Resolve / Toggle Resolve (Supports PATCH, PUT, POST)
const handleResolve = async (req, res) => {
  try {
    const raw = await db.items.findOne({ _id: req.params.id });
    if (!raw) return res.status(404).json({ error: 'Item not found.' });

    // Toggle or set specified status
    const newStatus = (req.body && req.body.status) ? req.body.status : (raw.status === 'resolved' ? 'active' : 'resolved');
    await db.items.update({ _id: req.params.id }, { $set: { status: newStatus } });
    const updated = await db.items.findOne({ _id: req.params.id });
    res.json({ message: `Marked as ${newStatus}.`, status: newStatus, item: toDoc(updated) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

router.patch('/:id/resolve', handleResolve);
router.put('/:id/resolve', handleResolve);
router.post('/:id/resolve', handleResolve);

module.exports = router;

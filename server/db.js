const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = {
  users: Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true }),
  items: Datastore.create({ filename: path.join(dataDir, 'items.db'), autoload: true }),
  notifications: Datastore.create({ filename: path.join(dataDir, 'notifications.db'), autoload: true })
};

// Unique index on email
db.users.ensureIndex({ fieldName: 'email', unique: true });

// Helper: map _id -> id for API responses
function toDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function toDocs(docs) {
  return docs.map(toDoc);
}

module.exports = { db, toDoc, toDocs };

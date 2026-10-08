const { db } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding sample data...');

  const userCount = await db.users.count({});
  if (userCount > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  const password_hash = bcrypt.hashSync('password123', 10);

  // Users
  const user1 = await db.users.insert({
    name: 'Aarav Sharma',
    email: 'aarav@college.edu',
    password_hash,
    college_id: 'CS2023042',
    phone: '+91 98765 43210',
    department: 'Computer Science',
    year: '3rd Year',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  });

  const user2 = await db.users.insert({
    name: 'Priya Patel',
    email: 'priya@college.edu',
    password_hash,
    college_id: 'EC2022019',
    phone: '+91 98123 45678',
    department: 'Electronics & Comm.',
    year: '4th Year',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  });

  const user3 = await db.users.insert({
    name: 'Rohan Verma',
    email: 'rohan@college.edu',
    password_hash,
    college_id: 'ME2024088',
    phone: '+91 97654 32109',
    department: 'Mechanical Engg.',
    year: '2nd Year',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  });

  // Items
  await db.items.insert({
    user_id: user1._id,
    type: 'lost',
    title: 'Silver MacBook Air M2 in Space Gray Case',
    description: 'Left inside Central Library 2nd floor reading hall near table 14. Has anime stickers on top cover.',
    category: 'Electronics',
    location: 'Central Library, 2nd Floor',
    date_lost_found: '2026-09-18',
    image_url: null,
    contact_email: 'aarav@college.edu',
    contact_phone: '+91 98765 43210',
    status: 'active',
    views: 42,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  });

  await db.items.insert({
    user_id: user2._id,
    type: 'found',
    title: 'boAt Airdopes 141 (Black Case)',
    description: 'Found on bench outside Nescafe Canteen. Case is fully charged.',
    category: 'Electronics',
    location: 'Nescafe Canteen Area',
    date_lost_found: '2026-09-19',
    image_url: null,
    contact_email: 'priya@college.edu',
    contact_phone: '+91 98123 45678',
    status: 'active',
    views: 29,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  });

  await db.items.insert({
    user_id: user3._id,
    type: 'lost',
    title: 'Blue Metal Water Bottle (Milton)',
    description: 'Lost after 4th period Lab practical in Physics Block Room 204.',
    category: 'Accessories',
    location: 'Physics Building Lab 204',
    date_lost_found: '2026-09-19',
    image_url: null,
    contact_email: 'rohan@college.edu',
    contact_phone: '+91 97654 32109',
    status: 'active',
    views: 14,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString()
  });

  await db.items.insert({
    user_id: user1._id,
    type: 'found',
    title: 'College Library Smart Card & ID',
    description: 'Found near Sports Complex badminton court entrance. Name printed on card is "Sneha Reddy".',
    category: 'ID Cards',
    location: 'Sports Complex Entrance',
    date_lost_found: '2026-09-20',
    image_url: null,
    contact_email: 'aarav@college.edu',
    contact_phone: '+91 98765 43210',
    status: 'active',
    views: 8,
    created_at: new Date().toISOString()
  });

  await db.items.insert({
    user_id: user2._id,
    type: 'lost',
    title: 'Black Wildcraft Backpack with Engineering Drawing Kit',
    description: 'Contains T-square, drawing sheets, and calculator. Lost near Mechanical Block ground floor.',
    category: 'Bags',
    location: 'Mechanical Block Ground Floor',
    date_lost_found: '2026-09-17',
    image_url: null,
    contact_email: 'priya@college.edu',
    contact_phone: '+91 98123 45678',
    status: 'resolved',
    views: 56,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  });

  console.log('✅ Seeding complete! Demo users: aarav@college.edu / priya@college.edu / rohan@college.edu (Password: password123)');
}

seed().catch(console.error);

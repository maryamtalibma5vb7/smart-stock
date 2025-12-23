const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const count = await usersCol.countDocuments();
    console.log('Existing users count:', count);
    if (count === 0) {
      const sample = [
        { name: 'admin', email: 'admin@local', role: 'admin', createdAt: new Date() },
        { name: 'demo', email: 'demo@local', role: 'user', createdAt: new Date() }
      ];
      const r = await usersCol.insertMany(sample);
      console.log('Inserted users:', r.insertedCount);
    } else {
      console.log('Users collection already has data; skipping insert.');
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(2);
  }
})();

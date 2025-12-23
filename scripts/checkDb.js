const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Mongoose connected. readyState=', mongoose.connection.readyState);
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collections:');
    cols.forEach(c => console.log(' -', c.name));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(2);
  }
})();

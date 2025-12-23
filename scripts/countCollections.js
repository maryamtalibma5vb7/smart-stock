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
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collection counts:');
    for (const c of cols) {
      const count = await db.collection(c.name).countDocuments();
      console.log(` - ${c.name}: ${count}`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  }
})();

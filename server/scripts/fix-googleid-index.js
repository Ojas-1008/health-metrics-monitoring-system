import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop old googleId index variants if present
    for (const idx of indexes) {
      if (idx.name.includes('googleId')) {
        console.log('Dropping index:', idx.name);
        await collection.dropIndex(idx.name).catch((e) => {
          console.warn('Warning dropping index', idx.name, e.message);
        });
      }
    }

    // Create partial unique index: only enforce uniqueness when googleId is a string
    await collection.createIndex(
      { googleId: 1 },
      { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
    );
    console.log('Created partial unique index on googleId (string only)');

    // Optional: Update existing docs with null googleId to unset the field
    const res = await collection.updateMany(
      { googleId: null },
      { $unset: { googleId: '' } }
    );
    if (res.modifiedCount) {
      console.log(`Unset googleId on ${res.modifiedCount} documents`);
    }

    console.log('Index fix completed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing googleId index:', err);
    process.exit(1);
  }
};

run();

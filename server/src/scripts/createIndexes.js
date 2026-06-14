/* eslint-disable no-console -- CLI maintenance script; output goes to stdout by design */
import mongoose from 'mongoose';
import config from '../config/env.js';
import models from '../models/index.js';

const run = async () => {
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to MongoDB: ${mongoose.connection.host}\n`);

  let failures = 0;
  const entries = Object.entries(models);

  for (const [name, Model] of entries) {
    try {
      // syncIndexes creates missing indexes and drops ones no longer in the schema.
      // eslint-disable-next-line no-await-in-loop -- sequential to keep output ordered
      await Model.syncIndexes();
      // eslint-disable-next-line no-await-in-loop -- sequential to keep output ordered
      const indexes = await Model.listIndexes();
      const names = indexes.map((idx) => idx.name).join(', ');
      console.log(`✅ ${name} (${Model.collection.name}): ${indexes.length} indexes [${names}]`);
    } catch (err) {
      failures += 1;
      console.error(`❌ ${name} FAILED: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log(`\n${entries.length - failures}/${entries.length} collections indexed.`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});

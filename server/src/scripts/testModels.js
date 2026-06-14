/* eslint-disable no-console -- CLI diagnostic script; output goes to stdout by design */
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
      // A trivial query confirms the schema is registered and the connection works.
      // eslint-disable-next-line no-await-in-loop -- sequential checks keep output readable
      await Model.findOne({}).lean();
      console.log(`✅ ${name} OK`);
    } catch (err) {
      failures += 1;
      console.error(`❌ ${name} FAILED: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log(`\n${entries.length - failures}/${entries.length} models passed.`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});

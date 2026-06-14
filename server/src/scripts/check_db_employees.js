import mongoose from 'mongoose';
import config from '../config/env.js';
import Employee from '../models/Employee.model.js';
import '../models/User.model.js'; // Ensure User is registered

async function main() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('Connected to MongoDB');

  const employees = await Employee.find({}).populate('user').lean();
  console.log('Employees count:', employees.length);
  if (employees.length > 0) {
    console.log('Sample employee record:');
    console.log(JSON.stringify(employees, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(console.error);

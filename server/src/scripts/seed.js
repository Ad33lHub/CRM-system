/* eslint-disable no-console -- CLI seeding script; output goes to stdout by design */
import mongoose from 'mongoose';
import config from '../config/env.js';
import { User, Client, Lead, Project } from '../models/index.js';

const run = async () => {
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to MongoDB: ${mongoose.connection.host}\n`);

  // Safety check — skip if the super admin already exists.
  const existing = await User.findOne({ email: 'superadmin@crm.com' });
  if (existing) {
    console.log('Already seeded — super admin exists. Skipping.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // 1. Super Admin
  const superAdmin = await User.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@crm.com',
    password: 'Admin@12345',
    role: 'super_admin',
    isEmailVerified: true,
    isActive: true,
  });
  console.log(`✅ Super Admin created: ${superAdmin.id} (${superAdmin.email})`);

  // 2. Admin
  const admin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@crm.com',
    password: 'Admin@12345',
    role: 'admin',
    isEmailVerified: true,
  });
  console.log(`✅ Admin created: ${admin.id} (${admin.email})`);

  // 3. Manager
  const manager = await User.create({
    firstName: 'Ahmed',
    lastName: 'Khan',
    email: 'manager@crm.com',
    password: 'Manager@12345',
    role: 'manager',
  });
  console.log(`✅ Manager created: ${manager.id} (${manager.email})`);

  // 4. Developer
  const developer = await User.create({
    firstName: 'Sara',
    lastName: 'Ali',
    email: 'dev@crm.com',
    password: 'Dev@12345',
    role: 'developer',
  });
  console.log(`✅ Developer created: ${developer.id} (${developer.email})`);

  // 5. Sample Client
  const client = await Client.create({
    companyName: 'TechCorp Pvt Ltd',
    industry: 'technology',
    contacts: [{ name: 'Hassan Raza', email: 'hassan@techcorp.com', isPrimary: true }],
    status: 'active',
    source: 'referral',
    createdBy: superAdmin.id,
  });
  console.log(`✅ Client created: ${client.id} (${client.companyName})`);

  // 6. Sample Lead
  const lead = await Lead.create({
    title: 'E-commerce Platform Development',
    contactName: 'Usman Tariq',
    contactEmail: 'usman@startup.com',
    stage: 'qualified',
    budget: { min: 500000, max: 1000000, currency: 'PKR' },
    assignedTo: manager.id,
    createdBy: superAdmin.id,
  });
  console.log(`✅ Lead created: ${lead.id} (${lead.title})`);

  // 7. Sample Project
  const project = await Project.create({
    name: 'TechCorp CRM Module',
    client: client.id,
    status: 'active',
    priority: 'high',
    team: [
      { user: manager.id, role: 'pm' },
      { user: developer.id, role: 'developer' },
    ],
    budget: { estimated: 750000, currency: 'PKR' },
    createdBy: superAdmin.id,
  });
  console.log(`✅ Project created: ${project.id} (${project.name})`);

  console.log('\n✅ Database seeded successfully');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});

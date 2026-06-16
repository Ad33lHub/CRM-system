/* eslint-disable no-console -- one-off dev/test provisioning script */
/**
 * Provision a known client-portal login for testing.
 *   node src/scripts/seedPortalClient.js
 * Creates/links: a Client, a Project for it, and a client-role User
 *   client@crm.com / Client@12345
 */
import mongoose from 'mongoose';
import config from '../config/env.js';
import { User, Client, Project } from '../models/index.js';

const EMAIL = 'client@crm.com';
const PASSWORD = 'Client@12345';

async function run() {
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`Connected: ${mongoose.connection.host}`);

  const owner =
    (await User.findOne({ role: { $in: ['super_admin', 'admin'] } }).select('_id')) || null;
  const manager = await User.findOne({ role: 'manager' }).select('_id');

  // 1. Client
  let client = await Client.findOne({ companyName: 'TechCorp Pvt Ltd', isDeleted: { $ne: true } });
  if (!client) {
    client = await Client.create({
      companyName: 'TechCorp Pvt Ltd',
      industry: 'technology',
      contacts: [{ name: 'Hassan Raza', email: 'hassan@techcorp.com', isPrimary: true }],
      status: 'active',
      source: 'referral',
      createdBy: owner?._id,
    });
    console.log(`Created client: ${client.companyName}`);
  } else {
    console.log(`Using existing client: ${client.companyName}`);
  }

  // 2. Project for that client (so the portal has something to show)
  let project = await Project.findOne({ client: client._id });
  if (!project) {
    project = await Project.create({
      name: 'TechCorp CRM Module',
      client: client._id,
      status: 'active',
      priority: 'high',
      team: manager ? [{ user: manager._id, role: 'pm' }] : [],
      milestones: [
        { title: 'Discovery & requirements', status: 'completed', completionPercent: 100 },
        { title: 'Design', status: 'in_progress', completionPercent: 60 },
        { title: 'Development', status: 'pending', completionPercent: 10 },
      ],
      budget: { estimated: 750000, currency: 'PKR' },
      startDate: new Date(),
      deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      createdBy: owner?._id,
    });
    console.log(`Created project: ${project.name}`);
  } else {
    console.log(`Using existing project: ${project.name}`);
  }

  // 3. Portal user
  let user = await User.findOne({ email: EMAIL });
  if (user) {
    user.password = PASSWORD;
    user.role = 'client';
    user.clientId = client._id;
    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();
    console.log(`Updated portal user: ${EMAIL}`);
  } else {
    user = await User.create({
      firstName: 'Hassan',
      lastName: 'Raza',
      email: EMAIL,
      password: PASSWORD,
      role: 'client',
      clientId: client._id,
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`Created portal user: ${EMAIL}`);
  }

  console.log('\n──────── TEST CREDENTIAL ────────');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Client:   ${client.companyName} (${client._id})`);
  console.log('─────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

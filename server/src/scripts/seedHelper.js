/* eslint-disable no-console -- Seeding helper for developer setup; output goes to stdout */
import { User, Client, Lead, Project } from '../models/index.js';

export async function seedInMemoryDb() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('Database already seeded. Skipping auto-seed.');
    return;
  }

  console.log('Seeding local in-memory database with default development records...');

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
  console.log(`   ✅ Super Admin created: ${superAdmin.email}`);

  // 2. Admin
  const admin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@crm.com',
    password: 'Admin@12345',
    role: 'admin',
    isEmailVerified: true,
  });
  console.log(`   ✅ Admin created: ${admin.email}`);

  // 3. Manager
  const manager = await User.create({
    firstName: 'Ahmed',
    lastName: 'Khan',
    email: 'manager@crm.com',
    password: 'Manager@12345',
    role: 'manager',
  });
  console.log(`   ✅ Manager created: ${manager.email}`);

  // 4. Developer
  const developer = await User.create({
    firstName: 'Sara',
    lastName: 'Ali',
    email: 'dev@crm.com',
    password: 'Dev@12345',
    role: 'developer',
  });
  console.log(`   ✅ Developer created: ${developer.email}`);

  // 5. Sample Client
  const client = await Client.create({
    companyName: 'TechCorp Pvt Ltd',
    industry: 'technology',
    contacts: [{ name: 'Hassan Raza', email: 'hassan@techcorp.com', isPrimary: true }],
    status: 'active',
    source: 'referral',
    createdBy: superAdmin.id,
  });
  console.log(`   ✅ Client created: ${client.companyName}`);

  // 6. Sample Lead
  const lead = await Lead.create({
    fullName: 'Usman Tariq',
    email: 'usman@startup.com',
    stage: 'Qualified',
    source: 'Referral',
    value: 750000,
    assignedTo: manager.id,
    createdBy: superAdmin.id,
  });
  console.log(`   ✅ Lead created: ${lead.fullName}`);

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
  console.log(`   ✅ Project created: ${project.name}`);

  console.log('✅ Local in-memory database seeded successfully!');
}

/**
 * Seed Script — Creates default Admin, Manager, and Student accounts
 *
 * Run once with:
 *   node seed.js
 *
 * This script is safe to run multiple times — it skips accounts
 * that already exist (checked by email).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@mess.com',
    password: 'Admin@1234',
    role: 'admin',
  },
  {
    name: 'Hostel Manager - H01',
    email: 'manager1@mess.com',
    password: 'Manager@1234',
    role: 'manager',
    hostelId: 'H01',
    contactNumber: '9876543210',
  },
  {
    name: 'Hostel Manager - H02',
    email: 'manager2@mess.com',
    password: 'Manager@1234',
    role: 'manager',
    hostelId: 'H02',
    contactNumber: '9876543211',
  },
  {
    name: 'Student One',
    email: 'student1@mess.com',
    password: 'Student@1234',
    role: 'student',
    registrationNumber: 'STU-2025-001',
    hostelId: 'H01',
    contactNumber: '9000000001',
  },
  {
    name: 'Student Two',
    email: 'student2@mess.com',
    password: 'Student@1234',
    role: 'student',
    registrationNumber: 'STU-2025-002',
    hostelId: 'H01',
    contactNumber: '9000000002',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        console.log(`⚠️  Skipping — user already exists: ${userData.email}`);
        continue;
      }

      // Password hashing happens automatically in User model pre-save hook
      await User.create(userData);
      console.log(`✅ Created [${userData.role}]: ${userData.email}`);
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Admin    → admin@mess.com       / Admin@1234');
    console.log('  Manager1 → manager1@mess.com    / Manager@1234  (hostelId: H01)');
    console.log('  Manager2 → manager2@mess.com    / Manager@1234  (hostelId: H02)');
    console.log('  Student1 → student1@mess.com    / Student@1234  (hostelId: H01)');
    console.log('  Student2 → student2@mess.com    / Student@1234  (hostelId: H01)');
    console.log('─────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

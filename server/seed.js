/**
 * Seed Script — Creates default Admin and Manager accounts
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
    name: 'Mess Manager - M01',
    email: 'manager1@mess.com',
    password: 'Manager@1234',
    role: 'manager',
    messId: 'M01',
    contactNumber: '9876543210',
  },
  {
    name: 'Mess Manager - M02',
    email: 'manager2@mess.com',
    password: 'Manager@1234',
    role: 'manager',
    messId: 'M02',
    contactNumber: '9876543211',
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
    console.log('  Admin    → admin@mess.com     / Admin@1234');
    console.log('  Manager1 → manager1@mess.com  / Manager@1234  (messId: M01)');
    console.log('  Manager2 → manager2@mess.com  / Manager@1234  (messId: M02)');
    console.log('─────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

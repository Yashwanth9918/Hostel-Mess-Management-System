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
    name: 'Mess Manager — BH-1',
    email: 'manager1@mess.com',
    password: 'Manager@1234',
    role: 'manager',
    hostelId: 'BH-1',
    contactNumber: '9876543210',
  },
  {
    name: 'Rahul Sharma',
    email: 'student1@mess.com',
    password: 'Student@1234',
    role: 'student',
    registrationNumber: 'IIT2025001',
    hostelId: 'BH-1',
    contactNumber: '9000000001',
  },
  {
    name: 'Priya Gupta',
    email: 'student2@mess.com',
    password: 'Student@1234',
    role: 'student',
    registrationNumber: 'IIT2025002',
    hostelId: 'BH-1',
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
        // Update the existing user with new hostelId and other fields
        existing.name = userData.name;
        existing.role = userData.role;
        existing.hostelId = userData.hostelId || existing.hostelId;
        existing.contactNumber = userData.contactNumber || existing.contactNumber;
        existing.registrationNumber = userData.registrationNumber || existing.registrationNumber;
        await existing.save();
        console.log(`🔄 Updated existing user: ${userData.email} (hostelId: ${userData.hostelId || 'N/A'})`);
        continue;
      }

      // Password hashing happens automatically in User model pre-save hook
      await User.create(userData);
      console.log(`✅ Created [${userData.role}]: ${userData.email}`);
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Admin    → admin@mess.com       / Admin@1234');
    console.log('  Manager  → manager1@mess.com    / Manager@1234  (BH-1)');
    console.log('  Student1 → student1@mess.com    / Student@1234  (BH-1)');
    console.log('  Student2 → student2@mess.com    / Student@1234  (BH-1)');
    console.log('─────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

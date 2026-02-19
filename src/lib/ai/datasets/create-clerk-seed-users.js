#!/usr/bin/env node

/**
 * Create Clerk users for seed data
 * 
 * This script creates users in Clerk that match the seed users in the database.
 * After running this, you can login with these emails and passwords.
 * 
 * Usage:
 *   node src/lib/ai/datasets/create-clerk-seed-users.js
 * 
 * Requires: CLERK_SECRET_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.error('❌ Missing CLERK_SECRET_KEY in .env.local');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: clerkSecretKey });

// Seed users - matching the database seed data
// Note: Using @example.com domain (reserved for documentation/testing) as Clerk doesn't accept .test domain
const seedUsers = [
  {
    email: 'budget.traveler@example.com',
    password: 'SeedUser123!',
    firstName: 'Budget',
    lastName: 'Traveler',
    clerkUserId: 'seed_budget_traveler_001',
  },
  {
    email: 'luxury.traveler@example.com',
    password: 'SeedUser123!',
    firstName: 'Luxury',
    lastName: 'Traveler',
    clerkUserId: 'seed_luxury_traveler_002',
  },
  {
    email: 'solo.introvert@example.com',
    password: 'SeedUser123!',
    firstName: 'Solo',
    lastName: 'Introvert',
    clerkUserId: 'seed_solo_introvert_003',
  },
  {
    email: 'extrovert.group@example.com',
    password: 'SeedUser123!',
    firstName: 'Extrovert',
    lastName: 'Group-Friendly',
    clerkUserId: 'seed_extrovert_group_004',
  },
  {
    email: 'short.trip@example.com',
    password: 'SeedUser123!',
    firstName: 'Short',
    lastName: 'Trip',
    clerkUserId: 'seed_short_trip_005',
  },
  {
    email: 'long.trip@example.com',
    password: 'SeedUser123!',
    firstName: 'Long',
    lastName: 'Trip',
    clerkUserId: 'seed_long_trip_006',
  },
];

async function createClerkUser(userData) {
  try {
    // Check if user already exists
    try {
      const existingUsers = await clerk.users.getUserList({
        emailAddress: [userData.email],
      });
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`ℹ️  User already exists: ${userData.email}`);
        return existingUsers[0].id;
      }
    } catch (err) {
      // User doesn't exist, continue to create
    }

    // Create user in Clerk
    const user = await clerk.users.createUser({
      emailAddress: [userData.email],
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      skipPasswordChecks: true, // For test users
      skipPasswordRequirement: true,
      skipEmailVerification: true, // Skip email verification for test users
    });

    console.log(`✅ Created Clerk user: ${userData.email} (ID: ${user.id})`);
    return user.id;
  } catch (error) {
    console.error(`❌ Error creating Clerk user ${userData.email}:`, error.message);
    if (error.errors && error.errors.length > 0) {
      console.error(`   Details:`, JSON.stringify(error.errors, null, 2));
    }
    if (error.statusCode) {
      console.error(`   Status Code:`, error.statusCode);
    }
    // Log full error for debugging
    console.error(`   Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return null;
  }
}

async function main() {
  console.log('🔐 Creating Clerk users for seed data...\n');

  const createdUsers = [];
  for (const userData of seedUsers) {
    const clerkId = await createClerkUser(userData);
    if (clerkId) {
      createdUsers.push({ ...userData, clerkId });
    }
  }

  console.log(`\n✅ Created ${createdUsers.length}/${seedUsers.length} Clerk users\n`);
  
  console.log('='.repeat(60));
  console.log('📋 LOGIN CREDENTIALS');
  console.log('='.repeat(60));
  console.log('All users use password: SeedUser123!');
  console.log('\nEmails:');
  seedUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email}`);
  });
  console.log('\n💡 You can now login with these credentials in your app!');
}

main().catch(console.error);


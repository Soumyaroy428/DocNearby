import { getMongoDb, isMongoConfigured } from './mongodb';
import { DEMO_PROVIDERS } from '../data/mock-providers';

export async function initMongoDatabase() {
  if (!isMongoConfigured()) {
    console.log('[MongoDB] MONGODB_URI not configured. Skipping MongoDB initialization.');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const db = await getMongoDb();
    console.log(`[MongoDB] Connected successfully to database: ${db.databaseName}`);

    // 1. Providers Collection & Indexes
    const providersCol = db.collection('providers');
    await providersCol.createIndex({ 'facilities.location': '2dsphere' }, { sparse: true });
    await providersCol.createIndex({ verificationStatus: 1 });
    await providersCol.createIndex({ specialties: 1 });
    await providersCol.createIndex({ 'facilities.city': 1 });
    await providersCol.createIndex({ 'facilities.locality': 1 });

    // Seed providers if empty
    const count = await providersCol.countDocuments();
    if (count === 0) {
      console.log(`[MongoDB] Providers collection is empty. Seeding ${DEMO_PROVIDERS.length} demo providers...`);
      await providersCol.insertMany(DEMO_PROVIDERS);
      console.log(`[MongoDB] Seeded demo providers successfully.`);
    } else {
      console.log(`[MongoDB] Providers collection already contains ${count} records.`);
    }

    // 2. Users Collection & Indexes
    const usersCol = db.collection('users');
    await usersCol.createIndex({ email: 1 }, { unique: true });

    // 3. Saved Providers Collection & Indexes
    const savedCol = db.collection('saved_providers');
    await savedCol.createIndex({ userId: 1 });
    await savedCol.createIndex({ userId: 1, providerId: 1 }, { unique: true });

    // 4. Submissions Collection & Indexes
    const submissionsCol = db.collection('submissions');
    await submissionsCol.createIndex({ status: 1 });
    await submissionsCol.createIndex({ submittedByUserId: 1 });

    console.log('[MongoDB] All collections and indexes initialized successfully.');
    return { success: true };
  } catch (error) {
    console.error('[MongoDB] Error connecting to MongoDB Atlas:', error);
    return { success: false, error };
  }
}


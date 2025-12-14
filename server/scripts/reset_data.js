const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Member, Assignment, Chore } = require('../models');

async function resetData() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        console.log('Connecting to MongoDB...');
        // Force database name to 'sweepy'
        await mongoose.connect(uri, { dbName: 'sweepy' });
        console.log('✅ Connected to MongoDB\n');

        console.log('🗑️  Clearing Assignments...');
        const deletedAssignments = await Assignment.deleteMany({});
        console.log(`   Deleted ${deletedAssignments.deletedCount} assignments`);

        console.log('🔄 Resetting Member Points...');
        const updatedMembers = await Member.updateMany({}, { total_points: 0 });
        console.log(`   Reset points for ${updatedMembers.modifiedCount} members`);

        // Note: Not deleting members or chores, only resetting assignments and points
        // If you want to delete members too, uncomment:
        // await Member.deleteMany({});
        // await Chore.deleteMany({});

        console.log('\n✅ Database reset complete.');
    } catch (err) {
        console.error('❌ Error resetting data:', err);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

resetData();

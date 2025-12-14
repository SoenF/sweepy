const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Assignment, Member, Chore } = require('../models');

async function run() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        console.log('Connecting to MongoDB...');
        // Force database name to 'sweepy'
        await mongoose.connect(uri, { dbName: 'sweepy' });
        console.log('✅ Connected to MongoDB\n');

        // Fetch assignments using Mongoose syntax
        const assignments = await Assignment.find()
            .populate('member_id')
            .populate('chore_id')
            .sort({ date: -1 })
            .limit(5);

        console.log('--- Recent Assignments ---');

        if (assignments.length === 0) {
            console.log('No assignments found.');
        } else {
            assignments.forEach(a => {
                console.log(`ID: ${a._id}, Status: ${a.status}, Date: ${a.date}, Member: ${a.member_id?.name || 'Unknown'}, Chore: ${a.chore_id?.name || 'Unknown'}`);
            });
        }

        console.log(`\nTotal: ${assignments.length} assignments`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

run();

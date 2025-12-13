
const mongoose = require('mongoose');
const { Member, Chore, Assignment, Family } = require('../models');
const schedulerService = require('../services/schedulerService');
const { format, addDays } = require('date-fns');
const path = require('path');

// Connect to DB
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sweepy';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Setup test data
        const family = await Family.create({ family_name: 'RotationFamily_' + Date.now(), email: 'rot@test.com', password_hash: 'hash' });
        const memberA = await Member.create({ name: 'A', family_id: family._id });
        const memberB = await Member.create({ name: 'B', family_id: family._id });
        const memberC = await Member.create({ name: 'C', family_id: family._id });

        console.log('Members created: A, B, C');

        // Create a daily chore assigned to A, B, C
        const chore = await Chore.create({
            name: 'Rotation Chore',
            difficulty: 1,
            frequency_value: 1,
            frequency_type: 'days',
            auto_assign: true,
            assigned_members: [memberA._id, memberB._id, memberC._id],
            family_id: family._id
        });

        console.log('1. Generating initial schedule (5 days)...');
        // A -> B -> C -> A -> B
        await schedulerService.generateAssignments(5, family._id);

        const assignments1 = await Assignment.find({ chore_id: chore._id, family_id: family._id }).sort({ date: 1 }).populate('member_id');
        const names1 = assignments1.map(a => a.member_id.name).join(' -> ');
        console.log(`Initial Rotation: ${names1}`);

        // Verify basic rotation (random start, but sequential after)
        // We can't guarantee A starts, but we can guarantee the sequence order in the array [A, B, C]
        // Actually, the service sorts members by _id usually.
        // Let's just output it.

        // UPDATE: Remove B. New list: [A, C]
        console.log('2. Updating chore: Removing Member B...');
        chore.assigned_members = [memberA._id, memberC._id];
        await chore.save();

        // Regenerate
        console.log('3. Regenerating schedule...');
        await schedulerService.generateAssignments(5, family._id);

        const assignments2 = await Assignment.find({ chore_id: chore._id, family_id: family._id }).sort({ date: 1 }).populate('member_id');
        const names2 = assignments2.map(a => a.member_id.name).join(' -> ');
        console.log(`New Rotation:     ${names2}`);

        // Check if B is present in future assignments (it shouldn't be, except maybe past ones if we kept them?)
        // generateAssignments deletes future pending assignments.
        // If "today" was pending, it should be regenerated.

        const hasB = assignments2.some(a => a.member_id.name === 'B');
        if (hasB) {
            console.error('ERROR: Member B is still present in the schedule!');
        } else {
            console.log('SUCCESS: Member B is gone.');
        }

        // Check sequence. Should be A -> C -> A -> C...
        // Note: The "next" member depends on the LAST assignment.
        // If the last assignment (before today) was B, and B is gone, who is next?
        // Logic should handle finding the "next" valid member after B's position (or B's ID).

        // Cleanup
        await Assignment.deleteMany({ family_id: family._id });
        await Chore.deleteMany({ family_id: family._id });
        await Member.deleteMany({ family_id: family._id });
        await Family.deleteMany({ _id: family._id });

        mongoose.disconnect();

    } catch (err) {
        console.error(err);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

run();

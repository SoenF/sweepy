const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const schedulerService = require('../services/schedulerService');
const { Chore, Assignment, Member, Family } = require('../models');
const { format, addDays } = require('date-fns');

// Mock data creation and test
async function testScheduler() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');

        // Get or create test family
        let family = await Family.findOne({ family_name: 'TestDelayFamily' });
        if (!family) {
            family = await Family.create({
                family_name: 'TestDelayFamily',
                email: 'testdelay@test.com',
                password_hash: 'test'
            });
        }

        // Ensure we have at least one member
        let member = await Member.findOne({ family_id: family._id });
        if (!member) {
            member = await Member.create({
                name: 'TestMember',
                family_id: family._id
            });
        }

        console.log("Creating test chore with 10 days frequency...");

        // Clean up old test chores
        const oldChore = await Chore.findOne({ name: 'TEST_DELAY_CHORE', family_id: family._id });
        if (oldChore) {
            await Assignment.deleteMany({ chore_id: oldChore._id });
            await Chore.deleteOne({ _id: oldChore._id });
        }

        const chore = await Chore.create({
            name: 'TEST_DELAY_CHORE',
            difficulty: 1,
            frequency_value: 10,
            frequency_type: 'days', // Change to 'weeks' to test different scenarios
            auto_assign: true,
            family_id: family._id
        });

        console.log("Generating assignments...");
        const assignments = await schedulerService.generateAssignments(family._id);

        const myAssignments = await Assignment.find({ chore_id: chore._id })
            .sort({ date: 1 });

        if (myAssignments.length > 0) {
            const firstDate = myAssignments[0].date;
            console.log(`First assignment date: ${firstDate}`);

            const today = format(new Date(), 'yyyy-MM-dd');
            console.log(`Today is: ${today}`);

            // Expected: Today + 5 days (half of 10 days)
            const expected = format(addDays(new Date(), 5), 'yyyy-MM-dd');
            console.log(`Expected first date (~today + 5): ${expected}`);

            if (firstDate === expected) {
                console.log("✅ SUCCESS: Delay logic worked.");
            } else {
                console.log("⚠️  FAILURE: Delay logic did not work as expected.");
                console.log(`   Expected: ${expected}, Got: ${firstDate}`);
            }
        } else {
            console.log("❌ No assignments generated for test chore.");
        }

        // Cleanup
        await Assignment.deleteMany({ chore_id: chore._id });
        await Chore.deleteOne({ _id: chore._id });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

testScheduler();

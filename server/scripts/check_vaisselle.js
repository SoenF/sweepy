const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Chore, Member } = require('../models');

async function checkVaisselleChore() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        await mongoose.connect(uri);

        console.log('\n🔍 Searching for chore "vaisselle"...\n');

        const vaisselle = await Chore.findOne({ name: /vaisselle/i });

        if (!vaisselle) {
            console.log('❌ No chore named "vaisselle" found in MongoDB');
            console.log('\n📋 All chores in database:');
            const allChores = await Chore.find();
            allChores.forEach(c => console.log(`  - ${c.name}`));
        } else {
            console.log('✅ Found chore "vaisselle":');
            console.log(`   Name: ${vaisselle.name}`);
            console.log(`   ID: ${vaisselle._id}`);
            console.log(`   Family ID: ${vaisselle.family_id}`);
            console.log(`   Auto-assign: ${vaisselle.auto_assign}`);
            console.log(`   Assigned Members (IDs): ${JSON.stringify(vaisselle.assigned_members)}`);

            if (vaisselle.assigned_members && vaisselle.assigned_members.length > 0) {
                console.log('\n👥 Fetching member details...');
                const members = await Member.find({
                    _id: { $in: vaisselle.assigned_members }
                });

                console.log(`   Found ${members.length} members:`);
                members.forEach(m => {
                    console.log(`     - ${m.name} (ID: ${m._id})`);
                });

                // Check if phantom members
                const memberNames = members.map(m => m.name);
                const phantomNames = ['i!li!l', 'oçloujl'];
                const hasPhantoms = phantomNames.some(p => memberNames.includes(p));

                if (hasPhantoms) {
                    console.log('\n❌ PHANTOM MEMBERS FOUND IN MONGODB!');
                    console.log('   This should NOT happen - phantom data is in MongoDB!');
                } else {
                    console.log('\n✅ No phantom members (normal members only)');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkVaisselleChore();

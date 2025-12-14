const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Member, Chore, Assignment, Family } = require('../models');

async function verifyDatabase() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        console.log('\n🔍 ============ DATABASE VERIFICATION ============\n');

        console.log('📡 Connecting to MongoDB...');
        console.log('🔗 URI Format:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

        await mongoose.connect(uri);

        console.log('\n✅ MongoDB Connected Successfully!');
        console.log('🖥️  Host:', mongoose.connection.host);
        console.log('📊 Database Name:', mongoose.connection.db.databaseName);
        console.log('🔌 Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');

        // List all families
        console.log('\n🏠 ============ FAMILIES ============');
        const families = await Family.find();
        if (families.length === 0) {
            console.log('⚠️  No families found in database');
        } else {
            families.forEach(family => {
                console.log(`\nFamily: ${family.family_name}`);
                console.log(`  - Email: ${family.email}`);
                console.log(`  - ID: ${family._id}`);
            });
        }

        // List all members
        console.log('\n👥 ============ MEMBERS ============');
        const members = await Member.find().populate('family_id');
        if (members.length === 0) {
            console.log('⚠️  No members found in database');
        } else {
            console.log(`\nTotal Members: ${members.length}`);
            members.forEach(member => {
                console.log(`\nMember: ${member.name}`);
                console.log(`  - ID: ${member._id}`);
                console.log(`  - Family: ${member.family_id?.family_name || 'Unknown'}`);
                console.log(`  - Points: ${member.total_points}`);
            });
        }

        // Check for phantom members
        console.log('\n🔎 ============ PHANTOM MEMBER CHECK ============');
        const phantomNames = ['i!li!l', 'oçloujl'];
        let foundPhantoms = false;

        for (const name of phantomNames) {
            const phantom = await Member.findOne({ name });
            if (phantom) {
                console.log(`❌ PHANTOM FOUND: "${name}" exists in MongoDB`);
                console.log(`   - This should NOT exist`);
                console.log(`   - Family ID: ${phantom.family_id}`);
                foundPhantoms = true;
            } else {
                console.log(`✅ "${name}" NOT in MongoDB (expected)`);
            }
        }

        if (!foundPhantoms) {
            console.log('\n✅ No phantom members found in MongoDB');
            console.log('⚠️  If backend logs show phantom members, they come from SQLite');
        }

        // List all chores
        console.log('\n🧹 ============ CHORES ============');
        const chores = await Chore.find().populate('family_id');
        if (chores.length === 0) {
            console.log('⚠️  No chores found in database');
        } else {
            console.log(`\nTotal Chores: ${chores.length}`);
            chores.forEach(chore => {
                console.log(`\nChore: ${chore.name}`);
                console.log(`  - ID: ${chore._id}`);
                console.log(`  - Family: ${chore.family_id?.family_name || 'Unknown'}`);
                console.log(`  - Frequency: ${chore.frequency_value} ${chore.frequency_type}`);
                console.log(`  - Auto-assign: ${chore.auto_assign}`);
                console.log(`  - Assigned Members: ${chore.assigned_members?.length || 0}`);
            });
        }

        // Sample assignments
        console.log('\n📅 ============ RECENT ASSIGNMENTS ============');
        const assignments = await Assignment.find()
            .populate('member_id')
            .populate('chore_id')
            .sort({ date: -1 })
            .limit(10);

        if (assignments.length === 0) {
            console.log('⚠️  No assignments found in database');
        } else {
            console.log(`\nShowing last ${assignments.length} assignments:\n`);
            assignments.forEach(assignment => {
                console.log(`${assignment.date} | Status: ${assignment.status.padEnd(10)} | Member: ${assignment.member_id?.name || 'Unknown'} | Chore: ${assignment.chore_id?.name || 'Unknown'}`);
            });
        }

        // Database statistics
        console.log('\n📊 ============ STATISTICS ============');
        const stats = {
            families: await Family.countDocuments(),
            members: await Member.countDocuments(),
            chores: await Chore.countDocuments(),
            assignments: await Assignment.countDocuments(),
            completedAssignments: await Assignment.countDocuments({ status: 'completed' }),
            pendingAssignments: await Assignment.countDocuments({ status: 'pending' })
        };

        console.log(`\nFamilies:             ${stats.families}`);
        console.log(`Members:              ${stats.members}`);
        console.log(`Chores:               ${stats.chores}`);
        console.log(`Total Assignments:    ${stats.assignments}`);
        console.log(`  - Completed:        ${stats.completedAssignments}`);
        console.log(`  - Pending:          ${stats.pendingAssignments}`);

        // Check for SQLite file
        console.log('\n💾 ============ SQLITE FILE CHECK ============');
        const fs = require('fs');
        const sqlitePaths = [
            path.join(__dirname, '../../sweepy.sqlite'),
            path.join(__dirname, '../sweepy.sqlite'),
            path.join(__dirname, 'sweepy.sqlite')
        ];

        let sqliteFound = false;
        for (const sqlitePath of sqlitePaths) {
            if (fs.existsSync(sqlitePath)) {
                console.log(`⚠️  SQLite file found: ${sqlitePath}`);
                const fileStats = fs.statSync(sqlitePath);
                console.log(`   - Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
                console.log(`   - Modified: ${fileStats.mtime}`);
                console.log(`   - This file may contain phantom data`);
                sqliteFound = true;
            }
        }

        if (!sqliteFound) {
            console.log('✅ No SQLite files found');
        }

        console.log('\n🎯 ============ CONCLUSION ============\n');
        if (foundPhantoms) {
            console.log('❌ Phantom members exist IN MongoDB - data cleanup needed');
        } else if (sqliteFound) {
            console.log('⚠️  Phantom members likely in SQLite file (not MongoDB)');
            console.log('✅ Solution: Migrate scripts to use MongoDB only');
        } else {
            console.log('✅ Database appears clean');
            console.log('✅ All scripts should use MongoDB');
        }

        console.log('\n================================================\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}

// Run the verification
verifyDatabase();

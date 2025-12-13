const { Sequelize } = require('sequelize');
const path = require('path');
const { Member, Assignment, Chore } = require('../models');

// Initialize standalone connection if needed, or use existing config
// We can just require the models index which sets up the connection
// But we need to make sure the app isn't locking the DB if sqlite (WAL mode handles it usually)

async function resetData() {
    try {
        console.log('Clearing Assignments...');
        await Assignment.destroy({ where: {}, truncate: true });

        console.log('Resetting Member Points...');
        await Member.update({ total_points: 0 }, { where: {} });

        // User said "pareil pour les membres", could mean delete.
        // But removing members breaks the setup. I'll stick to points.
        // If "pareil pour les membres" meant "delete members", I'd do:
        // await Member.destroy({ where: {}, truncate: true });
        // But let's assume points/history.

        console.log('Database reset complete.');
    } catch (err) {
        console.error('Error resetting data:', err);
    }
}

resetData();

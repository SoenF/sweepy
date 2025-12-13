const { Assignment, Member, Chore } = require('../models');

async function run() {
    try {
        const assignments = await Assignment.findAll({
            include: [Member, Chore],
            limit: 5,
            order: [['date', 'DESC']]
        });

        console.log('--- Recent Assignments ---');
        assignments.forEach(a => {
            console.log(`ID: ${a.id}, Status: ${a.status}, Date: ${a.date}, Member: ${a.Member?.name}, Chore: ${a.Chore?.name}`);
        });
    } catch (err) {
        console.error(err);
    }
}

run();

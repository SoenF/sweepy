const schedulerService = require('../services/schedulerService');
const { Chore, Assignment } = require('../models');
const { format, addDays } = require('date-fns');

// Mock data creation and test
async function testScheduler() {
    try {
        console.log("Creating test chore with 10 days frequency...");
        // clean up old test chores
        const oldChore = await Chore.findOne({ where: { name: 'TEST_DELAY_CHORE' } });
        if (oldChore) {
            await Assignment.destroy({ where: { chore_id: oldChore.id } });
            await oldChore.destroy();
        }

        const chore = await Chore.create({
            name: 'TEST_DELAY_CHORE',
            difficulty: 1,
            frequency_value: 10,
            frequency_type: 'days', // Change to 'weeks' to test that failure case
            auto_assign: true
        });

        console.log("Generating assignments...");
        const assignments = await schedulerService.generateAssignments(30);

        const myAssignments = assignments.filter(a => a.chore_id === chore.id).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (myAssignments.length > 0) {
            const firstDate = myAssignments[0].date;
            console.log(`First assignment date: ${firstDate}`);

            const today = format(new Date(), 'yyyy-MM-dd');
            console.log(`Today is: ${today}`);

            // Expected: Today + 5 days
            const expected = format(addDays(new Date(), 5), 'yyyy-MM-dd');
            console.log(`Expected first date (~today + 5): ${expected}`);

            if (firstDate === expected) {
                console.log("SUCCESS: Delay logic worked.");
            } else {
                console.log("FAILURE: Delay logic did not work as expected.");
            }
        } else {
            console.log("No assignments generated for test chore.");
        }

    } catch (err) {
        console.error(err);
    }
}

testScheduler();

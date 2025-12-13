const { Chore, Assignment, Member } = require('../models');
const assignmentService = require('./assignmentService');
const { addDays, addWeeks, addMonths, format, parseISO } = require('date-fns');

/**
 * Generate assignments for the next N days.
 * @param {number} daysToPlan - How many days into the future to plan.
 */
exports.generateAssignments = async (daysToPlan = 365) => {
    const chores = await Chore.find();
    if (!chores.length) return [];

    const today = new Date();
    const endDate = addDays(today, daysToPlan);

    const assignmentsCreated = [];

    // Ensure we have members
    const members = await Member.find();
    if (!members.length) return [];

    for (const chore of chores) {
        if (!chore.auto_assign) continue;

        // 0. REGENERATION: Clear future pending assignments
        const todayStr = format(today, 'yyyy-MM-dd');

        await Assignment.deleteMany({
            chore_id: chore._id,
            date: { $gt: todayStr },
            status: 'pending'
        });

        // 1. Find the last assignment for this chore
        const lastAssignment = await Assignment.findOne({ chore_id: chore._id })
            .sort({ date: -1 });

        // 2. Determine start date for generation
        let nextDate;
        if (lastAssignment) {
            // Calculate next occurrence based on last date
            // Assuming date is stored as "YYYY-MM-DD"
            const lastDate = parseISO(lastAssignment.date);
            nextDate = calculateNextDate(lastDate, chore.frequency_value, chore.frequency_type);

            // If nextDate is in the past or today, catch up to tomorrow
            if (nextDate <= today) {
                nextDate = addDays(today, 1);
            }
        } else {
            // First time assignment
            let daysValue = chore.frequency_value;
            if (chore.frequency_type === 'weeks') daysValue = chore.frequency_value * 7;
            if (chore.frequency_type === 'months') daysValue = chore.frequency_value * 30;

            if (daysValue > 3) {
                const delay = Math.ceil(daysValue / 2);
                nextDate = addDays(today, delay);
            } else {
                nextDate = addDays(today, 1);
            }
        }

        // 3. Loop until endDate
        while (nextDate <= endDate) {
            const dateStr = format(nextDate, 'yyyy-MM-dd');

            // Check if assignment already exists
            const exists = await Assignment.findOne({
                chore_id: chore._id,
                date: dateStr
            });

            if (!exists) {
                // Assign member
                const member = await assignmentService.selectMemberForChore(chore, dateStr);
                if (member) {
                    const assignment = await Assignment.create({
                        chore_id: chore._id,
                        member_id: member._id,
                        date: dateStr,
                        status: 'pending'
                    });
                    assignmentsCreated.push(assignment);
                }
            }

            // Advance to next date
            nextDate = calculateNextDate(nextDate, chore.frequency_value, chore.frequency_type);
        }
    }

    return assignmentsCreated;
};

// Helper: Calculate next date
function calculateNextDate(currentDate, value, type) {
    switch (type) {
        case 'days': return addDays(currentDate, value);
        case 'weeks': return addWeeks(currentDate, value);
        case 'months': return addMonths(currentDate, value);
        default: return addDays(currentDate, value);
    }
}

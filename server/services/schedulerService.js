const { Chore, Assignment } = require('../models');
const assignmentService = require('./assignmentService');
const { addDays, addWeeks, addMonths, format, parseISO } = require('date-fns');
const { Op } = require('sequelize');

/**
 * Generate assignments for the next N days.
 * @param {number} daysToPlan - How many days into the future to plan.
 */
exports.generateAssignments = async (daysToPlan = 365) => {
    const chores = await Chore.findAll();
    const today = new Date();
    const endDate = addDays(today, daysToPlan);

    const assignmentsCreated = [];

    for (const chore of chores) {
        if (!chore.auto_assign) continue;

        // 0. REGENERATION: Clear future pending assignments to reshuffle dynamic changes (e.g. new members)
        // We delete any 'pending' task strictly AFTER today.
        // This ensures we keep today's task (if it exists) as the anchor for rotation.
        const todayStr = format(today, 'yyyy-MM-dd');
        await Assignment.destroy({
            where: {
                chore_id: chore.id,
                date: { [Op.gt]: todayStr },
                status: 'pending'
            }
        });

        // 1. Find the last assignment for this chore
        const lastAssignment = await Assignment.findOne({
            where: { chore_id: chore.id },
            order: [['date', 'DESC']]
        });

        // 2. Determine start date for generation
        let nextDate;
        if (lastAssignment) {
            // Calculate next occurrence based on last date
            const lastDate = parseISO(lastAssignment.date);
            nextDate = calculateNextDate(lastDate, chore.frequency_value, chore.frequency_type);

            // If nextDate is in the past or today (due to gap without running), catch up to tomorrow
            if (nextDate <= today) {
                nextDate = addDays(today, 1);
            }
        } else {
            // First time assignment
            // Rule: if frequency > 3 days, wait half the days. Otherwise start tomorrow.
            // "si fréquence > 3 jours, alors on attends la moitié des jours pour commencer"

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
            // Format date as YYYY-MM-DD for consistency
            const dateStr = format(nextDate, 'yyyy-MM-dd');

            // Check if assignment already exists (double check)
            const exists = await Assignment.findOne({
                where: { chore_id: chore.id, date: dateStr }
            });

            if (!exists) {
                // Assign member
                const member = await assignmentService.selectMemberForChore(chore, dateStr);
                if (member) {
                    const assignment = await Assignment.create({
                        chore_id: chore.id,
                        member_id: member.id,
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

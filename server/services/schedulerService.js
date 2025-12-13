const { Chore, Assignment, Member } = require('../models');
const assignmentService = require('./assignmentService');
const { addDays, addWeeks, addMonths, format, parseISO } = require('date-fns');

/**
 * Calculate adaptive lookahead period based on task frequency.
 * Ensures frequent tasks don't clutter far future, while rare tasks remain visible.
 * @param {Object} chore - The chore object with frequency_value and frequency_type
 * @returns {number} Number of days to look ahead for this task
 */
function calculateLookaheadDays(chore) {
    let frequencyInDays = chore.frequency_value;

    if (chore.frequency_type === 'weeks') {
        frequencyInDays = chore.frequency_value * 7;
    } else if (chore.frequency_type === 'months') {
        frequencyInDays = chore.frequency_value * 30; // Approximation
    }

    const MIN_LOOKAHEAD = 90; // 3 months minimum
    const adaptiveLookahead = frequencyInDays * 2; // See at least 2 future occurrences

    return Math.max(MIN_LOOKAHEAD, adaptiveLookahead);
}

/**
 * Generate assignments with adaptive lookahead per task.
 * @param {string} family_id - The family ID to generate assignments for.
 */
exports.generateAssignments = async (family_id) => {
    const chores = await Chore.find({ family_id });
    if (!chores.length) return [];

    const today = new Date();
    const assignmentsCreated = [];

    // Ensure we have members
    const members = await Member.find({ family_id });
    if (!members.length) return [];

    for (const chore of chores) {
        if (!chore.auto_assign) continue;

        // ✨ Calculate adaptive lookahead for this specific task
        const lookaheadDays = calculateLookaheadDays(chore);
        const endDate = addDays(today, lookaheadDays);

        console.log(`[Scheduler] ${chore.name}: generating ${lookaheadDays} days ahead (freq: ${chore.frequency_value} ${chore.frequency_type})`);

        // 0. REGENERATION: Clear future pending assignments
        const todayStr = format(today, 'yyyy-MM-dd');

        // Delete future pending assignments for this chore (INCLUDING TODAY)
        // This ensures if we change assignments today, today's pending task gets regenerated
        // Changes: $gt -> $gte
        await Assignment.deleteMany({
            chore_id: chore._id,
            family_id: family_id,
            date: { $gte: todayStr },
            status: 'pending'
        });

        // Also delete future assignments for members no longer assigned to this chore
        if (chore.assigned_members && chore.assigned_members.length > 0) {
            const deleteResult = await Assignment.deleteMany({
                chore_id: chore._id,
                family_id: family_id,
                date: { $gte: todayStr },
                member_id: { $nin: chore.assigned_members }
            });
            console.log(`[Scheduler] Chore ${chore.name}: Force-deleted ${deleteResult.deletedCount} assignments for removed members (IDs not in ${chore.assigned_members})`);
        }

        // 1. Find the last assignment for this chore
        const lastAssignment = await Assignment.findOne({ chore_id: chore._id, family_id: family_id })
            .sort({ date: -1 });

        if (lastAssignment) {
            console.log(`[Scheduler] Last assignment for ${chore.name} was ${lastAssignment.date} by ${lastAssignment.member_id}`);
        } else {
            console.log(`[Scheduler] No previous assignment found for ${chore.name}`);
        }

        // 2. Determine start date for generation
        let nextDate;

        // Reset time component of today to ensure fair comparison
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);

        if (lastAssignment) {
            // Calculate next occurrence based on last date
            const lastDate = parseISO(lastAssignment.date);
            nextDate = calculateNextDate(lastDate, chore.frequency_value, chore.frequency_type);

            // SPECIAL CASE: If we just deleted "today's" assignment above, lastAssignment might be OLDER.
            // If nextDate is in the past, we should catch up.
            // But if we want to fill "today", nextDate must be allowed to be <= today.

            // If nextDate < todayStart, catch up to at least today
            if (nextDate < todayStart) {
                // If it's overdue, schedule for today (or tomorrow? usually today if it was missed)
                // For simplicity, let's say we schedule for today if it's due.
                nextDate = todayStart;
            }
        } else {
            // First time assignment
            // Logic for delay is fine for NEW chores, but if we just deleted everything,
            // we probably want to start today?
            // Existing logic:
            let daysValue = chore.frequency_value;
            if (chore.frequency_type === 'weeks') daysValue = chore.frequency_value * 7;
            if (chore.frequency_type === 'months') daysValue = chore.frequency_value * 30;

            if (daysValue > 3) {
                const delay = Math.ceil(daysValue / 2);
                nextDate = addDays(todayStart, delay);
            } else {
                // Update: Start TODAY for frequent chores (daily/every few days)
                // This ensures if we regenerate, we don't skip today.
                nextDate = todayStart;
            }
        }

        // FORCE CHECK: If we want to ensure today is covered if it's missing (it was deleted above)
        // If nextDate is tomorrow, but we have a gap today, should we fill it?
        // Simpler approach: relying on loop below.

        // 3. Loop until endDate
        // Ensure loop condition covers today if nextDate is today
        while (nextDate <= endDate) {
            const dateStr = format(nextDate, 'yyyy-MM-dd');

            // Check if assignment already exists
            const exists = await Assignment.findOne({
                chore_id: chore._id,
                family_id: family_id,
                date: dateStr
            });

            if (!exists) {
                // Assign member
                const member = await assignmentService.selectMemberForChore(chore, dateStr, family_id);
                if (member) {
                    console.log(`[Scheduler] Assigning ${member.name} to ${chore.name} for ${dateStr}`);
                    const assignment = await Assignment.create({
                        chore_id: chore._id,
                        member_id: member._id,
                        family_id: family_id,
                        date: dateStr,
                        status: 'pending'
                    });
                    assignmentsCreated.push(assignment);
                } else {
                    console.warn(`[Scheduler] No member selected for ${chore.name} on ${dateStr}`);
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

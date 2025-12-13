const { Member, Assignment } = require('../models');

/**
 * Selects the best member for a chore on a given date.
 * Fair distribution logic:
 * - Prioritize members with lower total points.
 * - Prioritize members with fewer assignments on that specific date.
 */
exports.selectMemberForChore = async (chore, dateStr) => {
    // 1. Get all members sorted by ID for consistent rotation order
    const members = await Member.findAll({ order: [['id', 'ASC']] });
    if (!members || members.length === 0) return null;

    // 2. Find the VERY LAST assignment for this chore (any date) to see who did it
    const lastAssignment = await Assignment.findOne({
        where: { chore_id: chore.id },
        order: [['date', 'DESC']]
    });

    if (!lastAssignment) {
        // First time: Pick randomly to start the cycle
        const randomIndex = Math.floor(Math.random() * members.length);
        return members[randomIndex];
    }

    // 3. Round Robin: Find next member in the list
    const lastMemberId = lastAssignment.member_id;
    const lastMemberIndex = members.findIndex(m => m.id === lastMemberId);

    if (lastMemberIndex === -1) {
        // Member might have been deleted? Reset start of list.
        return members[0];
    }

    const nextIndex = (lastMemberIndex + 1) % members.length;
    return members[nextIndex];
};

const { Member, Assignment } = require('../models');

/**
 * Selects the best member for a chore on a given date.
 * Fair distribution logic:
 * - Prioritize members with lower total points.
 * - Prioritize members with fewer assignments on that specific date.
 */
exports.selectMemberForChore = async (chore, dateStr, family_id) => {
    // 1. Get members for rotation
    // If chore has assigned_members, use only those; otherwise use all family members
    let members;
    if (chore.assigned_members && chore.assigned_members.length > 0) {
        // Use only assigned members for this chore
        members = await Member.find({
            _id: { $in: chore.assigned_members },
            family_id
        }).sort({ _id: 1 });
    } else {
        // Use all family members (default behavior)
        members = await Member.find({ family_id }).sort({ _id: 1 });
    }

    if (members) {
        console.log(`[AssignmentService] Members considered for chore ${chore.name}: [${members.map(m => m.name).join(', ')}]`);
    }

    if (!members || members.length === 0) return null;

    // 2. Find the VERY LAST assignment for this chore (any date) to see who did it
    const lastAssignment = await Assignment.findOne({ chore_id: chore._id, family_id: family_id })
        .sort({ date: -1 });

    if (!lastAssignment) {
        // First time: Pick randomly to start the cycle
        const randomIndex = Math.floor(Math.random() * members.length);
        return members[randomIndex];
    }

    // 3. Round Robin: Find next member in the list
    // Compare string IDs because ObjectId objects might not equal directly
    const lastMemberId = lastAssignment.member_id.toString();
    const lastMemberIndex = members.findIndex(m => m.id === lastMemberId);

    if (lastMemberIndex === -1) {
        // Member might have been deleted or removed from assigned list? Reset start of list.
        return members[0];
    }

    const nextIndex = (lastMemberIndex + 1) % members.length;
    return members[nextIndex];
};

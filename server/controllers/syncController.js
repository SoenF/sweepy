const { Member, Chore, Assignment, PointHistory } = require('../models');

/**
 * Sync Controller
 * Handles data synchronization between mobile apps and MongoDB
 */

/**
 * GET /api/sync/data
 * Full data sync - returns all family data for initial sync or refresh
 */
exports.getFullSync = async (req, res) => {
    try {
        const { family_id } = req;

        // Fetch all family data in parallel for efficiency
        const [members, chores, assignments, pointHistory] = await Promise.all([
            Member.find({ family_id }).sort({ total_points: -1 }).lean(),
            Chore.find({ family_id }).lean(),
            Assignment.find({ family_id })
                .populate('chore_id', 'name difficulty')
                .populate('member_id', 'name avatar')
                .lean(),
            PointHistory.find({ family_id }).sort({ created_at: -1 }).limit(100).lean()
        ]);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                members,
                chores,
                assignments,
                pointHistory
            }
        });
    } catch (err) {
        console.error('Full sync error:', err);
        res.status(500).json({
            error: 'Sync failed',
            message: 'Could not retrieve family data'
        });
    }
};

/**
 * POST /api/sync/changes
 * Batch sync - processes multiple offline changes in one request
 * Request body: { changes: [{ type: 'create_member', data: {...} }, ...] }
 */
exports.applyBatchChanges = async (req, res) => {
    try {
        const { family_id } = req;
        const { changes } = req.body;

        if (!Array.isArray(changes)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Changes must be an array'
            });
        }

        const results = [];
        const errors = [];

        // Process each change sequentially to maintain order
        for (let i = 0; i < changes.length; i++) {
            const change = changes[i];

            try {
                const result = await processChange(change, family_id);
                results.push({
                    index: i,
                    type: change.type,
                    success: true,
                    data: result
                });
            } catch (err) {
                errors.push({
                    index: i,
                    type: change.type,
                    error: err.message
                });
            }
        }

        res.json({
            success: errors.length === 0,
            applied: results,
            failed: errors,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Batch sync error:', err);
        res.status(500).json({
            error: 'Sync failed',
            message: 'Could not process changes'
        });
    }
};

/**
 * POST /api/sync/push
 * Single change sync - processes one change immediately
 * Request body: { type: 'create_member', data: {...} }
 */
exports.pushSingleChange = async (req, res) => {
    try {
        const { family_id } = req;
        const { type, data } = req.body;

        if (!type || !data) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Type and data are required'
            });
        }

        const result = await processChange({ type, data }, family_id);

        res.json({
            success: true,
            type,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Push sync error:', err);
        res.status(400).json({
            error: 'Change failed',
            message: err.message
        });
    }
};

/**
 * Process a single change based on type
 * @param {Object} change - { type, data }
 * @param {String} family_id - Family ID from auth token
 * @returns {Object} Result of the operation
 */
async function processChange(change, family_id) {
    const { type, data } = change;

    // Ensure family_id is always set (security)
    const secureData = { ...data, family_id };

    switch (type) {
        // ===== MEMBER OPERATIONS =====
        case 'create_member':
            return await Member.create(secureData);

        case 'update_member':
            if (!data._id && !data.id) {
                throw new Error('Member ID required for update');
            }
            const memberId = data._id || data.id;
            const updatedMember = await Member.findOneAndUpdate(
                { _id: memberId, family_id },
                secureData,
                { new: true, runValidators: true }
            );
            if (!updatedMember) {
                throw new Error('Member not found or access denied');
            }
            return updatedMember;

        case 'delete_member':
            if (!data._id && !data.id) {
                throw new Error('Member ID required for delete');
            }
            const memberToDelete = data._id || data.id;
            const deletedMember = await Member.findOneAndDelete({
                _id: memberToDelete,
                family_id
            });
            if (!deletedMember) {
                throw new Error('Member not found or access denied');
            }
            // Also delete related assignments
            await Assignment.deleteMany({ member_id: memberToDelete, family_id });
            return { deleted: true, id: memberToDelete };

        // ===== CHORE OPERATIONS =====
        case 'create_chore':
            return await Chore.create(secureData);

        case 'update_chore':
            if (!data._id && !data.id) {
                throw new Error('Chore ID required for update');
            }
            const choreId = data._id || data.id;
            const updatedChore = await Chore.findOneAndUpdate(
                { _id: choreId, family_id },
                secureData,
                { new: true, runValidators: true }
            );
            if (!updatedChore) {
                throw new Error('Chore not found or access denied');
            }
            return updatedChore;

        case 'delete_chore':
            if (!data._id && !data.id) {
                throw new Error('Chore ID required for delete');
            }
            const choreToDelete = data._id || data.id;
            const deletedChore = await Chore.findOneAndDelete({
                _id: choreToDelete,
                family_id
            });
            if (!deletedChore) {
                throw new Error('Chore not found or access denied');
            }
            // Also delete related assignments
            await Assignment.deleteMany({ chore_id: choreToDelete, family_id });
            return { deleted: true, id: choreToDelete };

        // ===== ASSIGNMENT OPERATIONS =====
        case 'complete_assignment':
            if (!data.assignmentId && !data._id && !data.id) {
                throw new Error('Assignment ID required');
            }
            const assignmentId = data.assignmentId || data._id || data.id;
            const assignment = await Assignment.findOne({
                _id: assignmentId,
                family_id
            }).populate('chore_id');

            if (!assignment) {
                throw new Error('Assignment not found or access denied');
            }

            // Toggle completion
            const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
            assignment.status = newStatus;

            if (newStatus === 'completed') {
                assignment.completed_at = new Date();

                // Award points
                const points = assignment.chore_id?.difficulty || 1;
                await Member.findByIdAndUpdate(assignment.member_id, {
                    $inc: { total_points: points }
                });

                // Record point history
                await PointHistory.create({
                    family_id,
                    member_id: assignment.member_id,
                    points,
                    reason: `Completed: ${assignment.chore_id?.name || 'task'}`,
                    assignment_id: assignment._id
                });
            } else {
                // Deduct points if uncompleting
                const points = assignment.chore_id?.difficulty || 1;
                await Member.findByIdAndUpdate(assignment.member_id, {
                    $inc: { total_points: -points }
                });
                assignment.completed_at = null;
            }

            await assignment.save();
            return assignment;

        case 'update_points':
            if (!data.member_id && !data.memberId) {
                throw new Error('Member ID required for point update');
            }
            const memberForPoints = data.member_id || data.memberId;
            const pointsToAdd = data.points || 0;
            const updatedMemberPoints = await Member.findOneAndUpdate(
                { _id: memberForPoints, family_id },
                { $inc: { total_points: pointsToAdd } },
                { new: true }
            );
            if (!updatedMemberPoints) {
                throw new Error('Member not found or access denied');
            }
            return updatedMemberPoints;

        default:
            throw new Error(`Unknown change type: ${type}`);
    }
}

module.exports = exports;

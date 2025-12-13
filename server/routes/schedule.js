const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

const { Assignment, Member, Chore } = require('../models');

// GET /api/schedule?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query;
        const query = {};

        if (start && end) {
            // String comparison works for YYYY-MM-DD
            query.date = { $gte: start, $lte: end };
        }

        const assignments = await Assignment.find(query)
            .populate('member_id')
            .populate('chore_id');

        // Ideally we should map the result to flat structure if frontend expects it
        // Or ensure frontend handles populated objects { member_id: { ... } }
        // The original Sequelize include: [Member] output assignments with .Member key.
        // Mongoose populates member_id field.
        // We might need to transform or frontend update.
        // Let's assume frontend checks assignment.Member or assignment.member_id.
        // To be safe, let's keep it simple: frontend likely needs to be checked or we conform.
        // Quick fix: user requested rewriting to make it work. I'll rely on frontend adaptability or transformation.

        // Actually, Sequelize `include: [Member]` produces `assignment.Member`.
        // Mongoose `populate('member_id')` replaces `assignment.member_id` with the object.
        // This is a Breaking Change for frontend if I don't transform.
        // Let's transform:

        const converted = assignments.map(a => {
            const obj = a.toObject();
            return {
                ...obj,
                Member: obj.member_id,
                Chore: obj.chore_id,
                // Ensure IDs are consistent
                id: obj._id,
            };
        });

        res.json(converted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/schedule/generate
router.post('/generate', async (req, res) => {
    try {
        const { days } = req.body;
        const assignments = await schedulerService.generateAssignments(days || 30);
        res.json({ message: 'Schedule updated', count: assignments.length, assignments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/schedule/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { member_id } = req.body; // Optional reassign

        const assignment = await Assignment.findById(id).populate('chore_id').populate('member_id');
        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

        const previousStatus = assignment.status;
        const newStatus = previousStatus === 'pending' ? 'completed' : 'pending';

        // 1. Reassign if requested and completing
        if (newStatus === 'completed' && member_id && member_id !== assignment.member_id._id.toString()) {
            assignment.member_id = member_id;
            // Need to repopulate to get member object for points logic
            // Or just fetch the new member separately
            // Let's verify new member exists
            const newMember = await Member.findById(member_id);
            if (newMember) {
                assignment.member_id = newMember; // set the object or ID? Mongoose supports assigning ID.
                // Actually better to assign ID and let save handle. 
                // But for the logic below we need the 'Member' object.
            }
        }

        // 2. Points Logic
        const difficulty = assignment.chore_id ? assignment.chore_id.difficulty : 1;
        const points = difficulty * 10;

        // Use the current member associated (whether changed or not)
        // assignment.member_id is now a populated object (Document)
        const member = await Member.findById(assignment.member_id._id || assignment.member_id); // Handle if it's ID or Object

        if (member) {
            if (newStatus === 'completed' && previousStatus !== 'completed') {
                member.total_points += points;
            } else if (newStatus === 'pending' && previousStatus === 'completed') {
                member.total_points -= points;
            }
            await member.save();
        }

        assignment.status = newStatus;
        if (member_id) assignment.member_id = member_id; // ensure ID is saved
        await assignment.save();

        // Return similar structure to GET
        // Re-fetch to be clean
        const updated = await Assignment.findById(id).populate('member_id').populate('chore_id');
        const obj = updated.toObject();
        res.json({
            ...obj,
            Member: obj.member_id,
            Chore: obj.chore_id,
            id: obj._id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

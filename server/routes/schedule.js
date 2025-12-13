const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

const { Assignment, Member, Chore } = require('../models');
const { Op } = require('sequelize');

// GET /api/schedule?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query;
        const where = {};
        if (start && end) {
            where.date = { [Op.between]: [start, end] };
        }

        const assignments = await Assignment.findAll({
            where,
            include: [Member, Chore]
        });
        res.json(assignments);
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
        const { member_id } = req.body; // Optional: If specified, reassign completion to this member

        const assignment = await Assignment.findByPk(id, { include: [Chore, Member] });
        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

        const previousStatus = assignment.status;
        const newStatus = previousStatus === 'pending' ? 'completed' : 'pending';

        // 1. If completing, and a specific member did it, update the assignment
        // (Only allow reassignment if we are moving to completed state)
        if (newStatus === 'completed' && member_id && member_id !== assignment.member_id) {
            // Reassign
            await assignment.update({ member_id });
            // Reload with new member
            await assignment.reload({ include: [Chore, Member] });
        }

        // 2. Calculate points
        // Difficulty 1, 2, 3 -> 10, 20, 30 points
        const points = (assignment.Chore ? assignment.Chore.difficulty : 1) * 10;
        const member = await Member.findByPk(assignment.member_id);

        if (!member) {
            // Should not happen if data integrity is good, but safe to check
            await assignment.update({ status: newStatus });
            return res.json(assignment);
        }

        // 3. Update Points and Status
        if (newStatus === 'completed' && previousStatus !== 'completed') {
            await member.increment('total_points', { by: points });
        } else if (newStatus === 'pending' && previousStatus === 'completed') {
            await member.decrement('total_points', { by: points });
        }

        await assignment.update({ status: newStatus });

        // Return updated assignment
        res.json(assignment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

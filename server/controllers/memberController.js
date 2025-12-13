const { Member } = require('../models');

exports.getAllMembers = async (req, res) => {
    try {
        const members = await Member.find().sort({ total_points: -1 }); // Default sort by rank
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const member = await Member.create({ name, avatar });
        res.status(201).json(member);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, avatar } = req.body;
        const member = await Member.findByIdAndUpdate(
            id,
            { name, avatar },
            { new: true, runValidators: true }
        );
        if (!member) return res.status(404).json({ error: 'Member not found' });
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findByIdAndDelete(id);
        if (!member) return res.status(404).json({ error: 'Member not found' });
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPoints = async (req, res) => {
    try {
        await Member.updateMany({}, { total_points: 0 });
        res.json({ message: 'All points reset to 0' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const { Member } = require('../models');

exports.getAllMembers = async (req, res) => {
    try {
        const members = await Member.find({ family_id: req.family_id }).sort({ total_points: -1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const member = await Member.create({
            name,
            avatar,
            family_id: req.family_id
        });
        res.status(201).json(member);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, avatar } = req.body;
        const member = await Member.findOneAndUpdate(
            { _id: id, family_id: req.family_id },
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
        const member = await Member.findOneAndDelete({ _id: id, family_id: req.family_id });
        if (!member) return res.status(404).json({ error: 'Member not found' });
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPoints = async (req, res) => {
    try {
        await Member.updateMany({ family_id: req.family_id }, { total_points: 0 });
        res.json({ message: 'All points reset to 0' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


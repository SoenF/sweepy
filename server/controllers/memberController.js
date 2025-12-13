const { Member, Assignment } = require('../models');

exports.getAllMembers = async (req, res) => {
    try {
        const members = await Member.findAll();
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
        const member = await Member.findByPk(id);
        if (!member) return res.status(404).json({ error: 'Member not found' });

        await member.update({ name, avatar });
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findByPk(id);
        if (!member) return res.status(404).json({ error: 'Member not found' });

        // Optional: Delete associated assignments/history or handle cascading
        // Sequelize defaults might handle cascading if configured, or we can leave it.
        await member.destroy();
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPoints = async (req, res) => {
    try {
        await Member.update({ total_points: 0 }, { where: {} });
        res.json({ message: 'All points reset to 0' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

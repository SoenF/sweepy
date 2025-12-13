const { Chore, Assignment } = require('../models');

exports.getAllChores = async (req, res) => {
    try {
        const chores = await Chore.findAll();
        res.json(chores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createChore = async (req, res) => {
    try {
        const { name, difficulty, frequency_value, frequency_type, auto_assign } = req.body;
        const chore = await Chore.create({
            name,
            difficulty,
            frequency_value,
            frequency_type,
            auto_assign
        });
        // Trigger scheduling logic here later?
        res.status(201).json(chore);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateChore = async (req, res) => {
    try {
        const { id } = req.params;
        // update fields
        const chore = await Chore.findByPk(id);
        if (!chore) return res.status(404).json({ error: 'Chore not found' });

        await chore.update(req.body);
        res.json(chore);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteChore = async (req, res) => {
    try {
        const { id } = req.params;
        const chore = await Chore.findByPk(id);
        if (!chore) return res.status(404).json({ error: 'Chore not found' });

        // Cascade delete assignments
        await Assignment.destroy({ where: { chore_id: id } });

        await chore.destroy();
        res.json({ message: 'Chore deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

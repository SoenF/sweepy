const { Chore, Assignment } = require('../models');

exports.getAllChores = async (req, res) => {
    try {
        const chores = await Chore.find({ family_id: req.family_id });
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
            auto_assign,
            family_id: req.family_id
        });
        res.status(201).json(chore);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateChore = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[ChoreController] Updating chore ${id} with:`, JSON.stringify(req.body));

        const chore = await Chore.findOneAndUpdate(
            { _id: id, family_id: req.family_id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!chore) return res.status(404).json({ error: 'Chore not found' });

        console.log(`[ChoreController] Updated chore assigned_members:`, chore.assigned_members);
        res.json(chore);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteChore = async (req, res) => {
    try {
        const { id } = req.params;
        const chore = await Chore.findOneAndDelete({ _id: id, family_id: req.family_id });
        if (!chore) return res.status(404).json({ error: 'Chore not found' });

        // Cascade delete assignments for this family only
        await Assignment.deleteMany({ chore_id: id, family_id: req.family_id });

        res.json({ message: 'Chore deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


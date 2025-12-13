const Member = require('./Member');
const Chore = require('./Chore');
const Assignment = require('./Assignment');
const PointHistory = require('./PointHistory');

// Associations

// Assignment belongs to properties
Assignment.belongsTo(Member, { foreignKey: 'member_id' });
Assignment.belongsTo(Chore, { foreignKey: 'chore_id' });

// Member relationships
Member.hasMany(Assignment, { foreignKey: 'member_id' });
Member.hasMany(PointHistory, { foreignKey: 'member_id' });

// Chore relationships
Chore.hasMany(Assignment, { foreignKey: 'chore_id' });
Chore.hasMany(PointHistory, { foreignKey: 'chore_id' });

// PointHistory relationships
PointHistory.belongsTo(Member, { foreignKey: 'member_id' });
PointHistory.belongsTo(Chore, { foreignKey: 'chore_id' });

module.exports = {
    Member,
    Chore,
    Assignment,
    PointHistory
};

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointHistory = sequelize.define('PointHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
    // Foreign keys (member_id, chore_id) added via associations
});

module.exports = PointHistory;

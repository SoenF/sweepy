const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chore = sequelize.define('Chore', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    difficulty: {
        type: DataTypes.INTEGER, // e.g. 1-3
        defaultValue: 1
    },
    frequency_value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    frequency_type: {
        type: DataTypes.ENUM('days', 'weeks', 'months'),
        allowNull: false
    },
    auto_assign: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Chore;

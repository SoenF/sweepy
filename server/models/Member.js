const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Member = sequelize.define('Member', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING, // URL or local path
        allowNull: true
    },
    total_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Member;

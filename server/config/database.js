const { Sequelize } = require('sequelize');
const path = require('path');

// Store sqlite file in the root of the project (so both server/client can technically see it if needed, or just keep it in server)
// Keeping it in server root or project root. Let's put in project root.
const storagePath = path.join(__dirname, '../../sweepy.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false
});

module.exports = sequelize;

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const { Member, Chore, Assignment, PointHistory } = require('./models');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/members', require('./routes/members'));
app.use('/api/chores', require('./routes/chores'));
app.use('/api/schedule', require('./routes/schedule'));

// Basic route
app.get('/', (req, res) => {
    res.send('Sweepy API is running');
});

// Database synchronization and server start
sequelize.authenticate()
    .then(() => console.log('Database connected.'))
    .catch(err => console.error('Unable to connect to the database:', err));

// Sync all defined models to the DB
sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to sync database:', err);
    });

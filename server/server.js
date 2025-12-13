const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Use Mongoose connection
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/chores', require('./routes/chores'));
app.use('/api/schedule', require('./routes/schedule'));

// Basic route
app.get('/', (req, res) => {
    res.send('Sweepy API is running with MongoDB');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

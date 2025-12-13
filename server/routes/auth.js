const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Family } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { family_name, password } = req.body;

        // Validation
        if (!family_name || !password) {
            return res.status(400).json({ error: 'Family name and password are required' });
        }

        if (family_name.length < 3) {
            return res.status(400).json({ error: 'Family name must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if family already exists
        const existingFamily = await Family.findOne({ family_name });
        if (existingFamily) {
            return res.status(409).json({ error: 'Family name already exists' });
        }

        // Create new family
        const family = new Family({
            family_name,
            password_hash: password // Will be hashed by pre-save hook
        });

        await family.save();

        // Generate JWT token
        const token = jwt.sign(
            { family_id: family._id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Family created successfully',
            token,
            family: {
                id: family._id,
                family_name: family.family_name
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create family account' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { family_name, password } = req.body;

        // Validation
        if (!family_name || !password) {
            return res.status(400).json({ error: 'Family name and password are required' });
        }

        // Find family
        const family = await Family.findOne({ family_name });
        if (!family) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await family.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { family_id: family._id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            family: {
                id: family._id,
                family_name: family.family_name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/database'); // Import the database connection
const dotenv = require('dotenv');
const sql = require('mssql');

dotenv.config();

// Signup Route
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        const pool = await connectDB();
        // Check if user already exists
        const existingUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT TOP 1 * FROM users WHERE username = @username');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const request = pool.request();
        request.input('username', sql.NVarChar, username);
        request.input('password', sql.NVarChar, hashedPassword);

        const result = await request.query`
            INSERT INTO users (username, password)
            OUTPUT INSERTED.id
            VALUES (@username, @password)
        `;

        const userId = result.recordset[0].id;

        // Fetch the newly created user
        const newUserResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT TOP 1 * FROM users WHERE id = @userId');
        const newUser = newUserResult.recordset[0];

        // Generate JWT token
        const token = jwt.sign({ id: newUser.id, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'User created successfully', token: token });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Signup failed', error: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        const pool = await connectDB();

        // Find the user
        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT TOP 1 id, username, password FROM users WHERE username = @username');
        const user = userResult.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Logged in successfully', token: token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth'); // Import the middleware
const sql = require('mssql');

// Get all notes for a user (requires authentication)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .query('SELECT * FROM notes WHERE userId = @userId');

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error getting notes:', error);
        res.status(500).json({ message: 'Failed to get notes', error: error.message });
    }
});

// Create a new note (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
    const { title, category, content, color, pinned, textColor, position, width, height } = req.body;

    try {
        const pool = await connectDB();
        const request = pool.request();

        request.input('userId', sql.Int, req.user.id);
        request.input('title', sql.NVarChar, title);
        request.input('category', sql.NVarChar, category);
        request.input('content', sql.NVarChar, content);
        request.input('color', sql.NVarChar, color);
        request.input('pinned', sql.Bit, pinned);
        request.input('textColor', sql.NVarChar, textColor);
        request.input('position', sql.NVarChar, JSON.stringify(position)); // Store position as JSON string
        request.input('width', sql.NVarChar, width);
        request.input('height', sql.NVarChar, height);

        const result = await request.query`
            INSERT INTO notes (userId, title, category, content, color, pinned, textColor, position, width, height)
            OUTPUT INSERTED.id
            VALUES (@userId, @title, @category, @content, @color, @pinned, @textColor, @position, @width, @height)
        `;

        const noteId = result.recordset[0].id;
        res.status(201).json({ message: 'Note created successfully', noteId: noteId });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Failed to create note', error: error.message });
    }
});

// Get a single note by ID (requires authentication)
router.get('/:id', authenticateToken, async (req, res) => {
    const noteId = req.params.id;

    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('noteId', sql.Int, noteId)
            .input('userId', sql.Int, req.user.id)
            .query('SELECT * FROM notes WHERE id = @noteId AND userId = @userId');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error('Error getting note:', error);
        res.status(500).json({ message: 'Failed to get note', error: error.message });
    }
});

// Update a note by ID (requires authentication)
router.put('/:id', authenticateToken, async (req, res) => {
    const noteId = req.params.id;
    const { title, category, content, color, pinned, textColor, position, width, height } = req.body;

    try {
        const pool = await connectDB();
        const request = pool.request();

        request.input('noteId', sql.Int, noteId);
        request.input('userId', sql.Int, req.user.id);
        request.input('title', sql.NVarChar, title);
        request.input('category', sql.NVarChar, category);
        request.input('content', sql.NVarChar, content);
        request.input('color', sql.NVarChar, color);
        request.input('pinned', sql.Bit, pinned);
        request.input('textColor', sql.NVarChar, textColor);
        request.input('position', sql.NVarChar, JSON.stringify(position)); // Store position as JSON string
        request.input('width', sql.NVarChar, width);
        request.input('height', sql.NVarChar, height);

        const result = await request.query`
            UPDATE notes SET
                title = @title,
                category = @category,
                content = @content,
                color = @color,
                pinned = @pinned,
                textColor = @textColor,
                position = @position,
                width = @width,
                height = @height
            WHERE id = @noteId AND userId = @userId
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note updated successfully' });
    } catch (error) {
        console.error('Error updating note:', error); //This is the line you add
        res.status(500).json({ message: 'Failed to update note', error: error.message });
    }
});

// Delete a note by ID (requires authentication)
router.delete('/:id', authenticateToken, async (req, res) => {
    const noteId = req.params.id;

    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('noteId', sql.Int, noteId)
            .input('userId', sql.Int, req.user.id)
            .query('DELETE FROM notes WHERE id = @noteId AND userId = @userId');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Failed to delete note', error: error.message });
    }
});

module.exports = router;
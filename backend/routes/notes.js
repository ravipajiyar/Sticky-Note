const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth'); // Import the middleware
const sql = require('mssql');


router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit + 1)
            .query(`
                SELECT id, title, category, content, color, pinned, textColor, position, width, height
                FROM notes 
                WHERE userId = @userId 
                ORDER BY id DESC 
                OFFSET @offset ROWS 
                FETCH NEXT @limit ROWS ONLY
            `);

        const hasMore = result.recordset.length > limit;
        
        // Remove the extra record if we have more
        const notes = hasMore ? result.recordset.slice(0, limit) : result.recordset;

        res.status(200).json({
            notes: notes,
            currentPage: page,
            hasMore: hasMore
        });
    } catch (error) {
        console.error('Error getting notes:', error);
        res.status(500).json({ message: 'Failed to get notes', error: error.message });
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
            .query(`
                SELECT id, title, category, content, color, pinned, textColor, position, width, height
                FROM notes 
                WHERE id = @noteId AND userId = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error('Error getting note:', error);
        res.status(500).json({ message: 'Failed to get note', error: error.message });
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

        const query = `
        INSERT INTO notes (userId, title, category, content, color, pinned, textColor, position, width, height)
        OUTPUT INSERTED.id
        VALUES (@userId, @title, @category, @content, @color, @pinned, @textColor, @position, @width, @height)
        `;
        const result = await request.query(query);

        const noteId = result.recordset[0].id;
        res.status(201).json({ message: 'Note created successfully', noteId: noteId });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Failed to create note', error: error.message });
    }
});

// Update a note by ID (requires authentication)
router.put('/:id', authenticateToken, async (req, res) => {
    const noteId = req.params.id;
    const updates = req.body;
    
    try {
        // First, get the current note to maintain existing values (only fetch what's needed)
        const pool = await connectDB();
        const getNoteResult = await pool.request()
            .input('noteId', sql.Int, noteId)
            .input('userId', sql.Int, req.user.id)
            .query(`
                SELECT title, category, content, color, pinned, textColor, position, width, height
                FROM notes 
                WHERE id = @noteId AND userId = @userId
            `);
            
        if (getNoteResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        // Current note data
        const currentNote = getNoteResult.recordset[0];
        
        // Prepare the update request with all fields (updated or existing)
        const request = pool.request();
        request.input('noteId', sql.Int, noteId);
        request.input('userId', sql.Int, req.user.id);
        request.input('title', sql.NVarChar, updates.title || currentNote.title);
        request.input('category', sql.NVarChar, updates.category || currentNote.category);
        request.input('content', sql.NVarChar, updates.content || currentNote.content);
        request.input('color', sql.NVarChar, updates.color || currentNote.color);
        request.input('pinned', sql.Bit, updates.pinned !== undefined ? updates.pinned : currentNote.pinned);
        request.input('textColor', sql.NVarChar, updates.textColor || currentNote.textColor);
        
        // Handle position specially since it's stored as a JSON string
        const position = updates.position 
            ? JSON.stringify(updates.position) 
            : currentNote.position;
        request.input('position', sql.NVarChar, position);
        
        request.input('width', sql.NVarChar, updates.width || currentNote.width);
        request.input('height', sql.NVarChar, updates.height || currentNote.height);

        const query = `
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
        
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Note not found or not updated' });
        }

        res.status(200).json({ message: 'Note updated successfully' });
    } catch (error) {
        console.error('Error updating note:', error);
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
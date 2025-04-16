class Note {
    constructor(id, userId, title, category, content, color, pinned, textColor, position, width, height) {
        this.id = id;
        this.userId = userId; // Link to the user who owns the note
        this.title = title;
        this.category = category;
        this.content = content;
        this.color = color;
        this.pinned = pinned;
        this.textColor = textColor;
        this.position = position; // Store as JSON string: {left: x, top: y}
        this.width = width;
        this.height = height;
    }
}

module.exports = Note;
class NoteView {
    constructor(note, onDelete, onPin, onCategoryChange, onContentChange, onTitleChange, onColorChange, onResize, onTextColorChange, onDrag) {
        this.note = note;
        this.onDelete = onDelete;
        this.onPin = onPin;
        this.onCategoryChange = onCategoryChange;
        this.onContentChange = onContentChange;
        this.onTitleChange = onTitleChange;
        this.onColorChange = onColorChange;
        this.onResize = onResize;
        this.onTextColorChange = onTextColorChange;
        this.onDrag = onDrag;
        this.element = this.createNoteElement(note);
        this.setupEventListeners();
    }

    createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = `note note-${note.color}`;
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-title" contenteditable="true" ${note.title === 'Click to edit title' ? 'data-default="true"' : ''}>${note.title}</div>
                <select class="note-category-dropdown">
                    <option value="Personal" ${note.category === 'Personal' ? 'selected' : ''}>Personal</option>
                    <option value="Work" ${note.category === 'Work' ? 'selected' : ''}>Work</option>
                    <option value="Important" ${note.category === 'Important' ? 'selected' : ''}>Important</option>
                </select>
                <div class="delete-note">×</div>
            </div>
            <div class="note-content" contenteditable="true" ${note.content === '<p>Type your note here...</p>' ? 'data-default="true"' : ''}>${note.content}</div>
            <div class="note-footer">
                <div class="color-options">
                    <div class="color-option color-blue ${note.color === 'blue' ? 'selected' : ''}"></div>
                    <div class="color-option color-green ${note.color === 'green' ? 'selected' : ''}"></div>
                    <div class="color-option color-yellow ${note.color === 'yellow' ? 'selected' : ''}"></div>
                    <div class="color-option color-orange ${note.color === 'orange' ? 'selected' : ''}"></div>
                    <div class="color-option color-red ${note.color === 'red' ? 'selected' : ''}"></div>
                </div>
                <div class="text-color-options">
                    <div class="text-color-option text-black ${!note.textColor || note.textColor === '#000' ? 'selected' : ''}">A</div>
                    <div class="text-color-option text-blue ${note.textColor === '#2196F3' ? 'selected' : ''}">A</div>
                    <div class="text-color-option text-green ${note.textColor === '#4CAF50' ? 'selected' : ''}">A</div>
                    <div class="text-color-option text-red ${note.textColor === '#F44336' ? 'selected' : ''}">A</div>
                </div>
                <div class="pin-note">📌</div>
            </div>
            <div class="resize-handle">◢</div>
        `;

        // Apply saved styles
        if (note.textColor) {
            noteElement.querySelector('.note-content').style.color = note.textColor;
            noteElement.querySelector('.note-title').style.color = note.textColor;
        }
        if (note.width) {
            noteElement.style.width = note.width;
        }
        if (note.height) {
            noteElement.style.height = note.height;
        }
        if (note.position) {
            noteElement.style.position = 'absolute';
            noteElement.style.left = note.position.left + 'px';
            noteElement.style.top = note.position.top + 'px';
        }
        const pinElement = noteElement.querySelector('.pin-note');
        pinElement.style.opacity = note.pinned ? 1 : 0.5;

        return noteElement;
    }

    setupEventListeners() {
        const noteElement = this.element;
        const deleteBtn = noteElement.querySelector('.delete-note');
        const titleElement = noteElement.querySelector('.note-title');
        const categoryDropdown = noteElement.querySelector('.note-category-dropdown');
        const contentElement = noteElement.querySelector('.note-content');
        const colorOptions = noteElement.querySelectorAll('.color-option');
        const pinElement = noteElement.querySelector('.pin-note');
        const resizeHandle = noteElement.querySelector('.resize-handle');
        const textColorOptions = noteElement.querySelectorAll('.text-color-option');

        // Make title editable on click
        titleElement.addEventListener('click', () => {
            titleElement.contentEditable = true;
            if (titleElement.getAttribute('data-default') === 'true') {
                titleElement.textContent = '';
                titleElement.removeAttribute('data-default');
            }
            titleElement.focus();
        });

        titleElement.addEventListener('blur', () => {
            titleElement.contentEditable = false;
            if (titleElement.textContent.trim() === '') {
                titleElement.textContent = 'Untitled';
            }
            this.onTitleChange(this.note.id, titleElement.textContent);
        });

        contentElement.addEventListener('focus', () => {
            if (contentElement.getAttribute('data-default') === 'true') {
                contentElement.innerHTML = '';
                contentElement.removeAttribute('data-default');
            }
        });

        contentElement.addEventListener('blur', () => {
            if (contentElement.innerHTML.trim() === '') {
                contentElement.innerHTML = '<p>Type your note here...</p>';
                contentElement.setAttribute('data-default', 'true');
            }
            this.onContentChange(this.note.id, contentElement.innerHTML);
        });

        deleteBtn.addEventListener('click', () => {
            this.onDelete(this.note.id);
        });

        categoryDropdown.addEventListener('change', () => {
            this.onCategoryChange(this.note.id, categoryDropdown.value);
        });

        colorOptions.forEach(colorOption => {
            colorOption.addEventListener('click', () => {
                const colorName = colorOption.className.split(' ')[1].replace('color-', '');
                this.onColorChange(this.note.id, colorName);

                // Remove 'selected' class from all color options
                colorOptions.forEach(option => {
                    option.classList.remove('selected');
                });

                // Add 'selected' class to the clicked color option
                colorOption.classList.add('selected');
            });
        });

        pinElement.addEventListener('click', () => {
            this.onPin(this.note.id, !this.note.pinned);
        });

        // Make notes draggable - but only if not pinned
        $(noteElement).draggable({
            handle: '.note-header',
            containment: '.notes-grid',
            stack: '.note',
            start: (event, ui) => {
                // Only allow dragging if the note is not pinned
                if (this.note.pinned) {
                    return false;
                }
                $(noteElement).addClass('dragging');
            },
            stop: (event, ui) => {
                $(noteElement).removeClass('dragging');
                this.onDrag(this.note.id, {left: ui.position.left, top: ui.position.top});
            }
        });

        // Resizing functionality
        let initialWidth, initialHeight, initialX, initialY, resizingNote = null;

        const startResize = (e) => {
            e.stopPropagation();
            e.preventDefault();

            resizingNote = noteElement;
            const rect = resizingNote.getBoundingClientRect();

            initialWidth = rect.width;
            initialHeight = rect.height;
            initialX = e.clientX;
            initialY = e.clientY;

            resizingNote.classList.add('resizing');

            document.addEventListener('mousemove', resizeNote);
            document.addEventListener('mouseup', stopResize);
        };

        const resizeNote = (e) => {
            if (!resizingNote) return;

            const newWidth = initialWidth + (e.clientX - initialX);
            const newHeight = initialHeight + (e.clientY - initialY);

            // Set minimum size
            if (newWidth > 150) {
                resizingNote.style.width = newWidth + 'px';
            }

            if (newHeight > 100) {
                resizingNote.style.height = newHeight + 'px';
            }
        };

        const stopResize = () => {
            if (resizingNote) {
                resizingNote.classList.remove('resizing');
                document.removeEventListener('mousemove', resizeNote);
                document.removeEventListener('mouseup', stopResize);

                this.onResize(this.note.id, resizingNote.style.width, resizingNote.style.height);

                resizingNote = null;
            }
        };

        resizeHandle.addEventListener('mousedown', startResize);

        textColorOptions.forEach(textColorOption => {
            textColorOption.addEventListener('click', () => {
                const colorClass = textColorOption.className.split(' ')[1];
                let textColor;

                // Map class names to actual colors
                switch (colorClass) {
                    case 'text-black':
                        textColor = '#000';
                        break;
                    case 'text-blue':
                        textColor = '#2196F3';
                        break;
                    case 'text-green':
                        textColor = '#4CAF50';
                        break;
                    case 'text-red':
                        textColor = '#F44336';
                        break;
                    default:
                        textColor = '#000';
                }

                // Apply color to note content and title
                noteElement.querySelector('.note-content').style.color = textColor;
                noteElement.querySelector('.note-title').style.color = textColor;

                this.onTextColorChange(this.note.id, textColor);

                // Remove 'selected' class from all text color options
                textColorOptions.forEach(option => {
                    option.classList.remove('selected');
                });

                // Add 'selected' class to the clicked text color option
                textColorOption.classList.add('selected');
            });
        });
    }
}
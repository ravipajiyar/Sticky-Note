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
                <div class="note-controls">
                    <select class="note-category-dropdown">
                        <option value="Personal" ${note.category === 'Personal' ? 'selected' : ''}>Personal</option>
                        <option value="Work" ${note.category === 'Work' ? 'selected' : ''}>Work</option>
                        <option value="Ideas" ${note.category === 'Ideas' ? 'selected' : ''}>Ideas</option>
                    </select>
                    <div class="pin-note" title="Pin/Unpin Note">📌</div>
                    <div class="delete-note" title="Delete Note">×</div>
                </div>
            </div>
            <div class="note-content" contenteditable="true" ${note.content === '<p>Type your note here...</p>' ? 'data-default="true"' : ''}>${note.content}</div>
            <div class="note-footer">
                <div class="color-selector">
                    <div class="color-toggle" title="Background Color">🎨</div>
                    <div class="color-options hidden">
                        <div class="color-option color-blue ${note.color === 'blue' ? 'selected' : ''}" title="Blue"></div>
                        <div class="color-option color-green ${note.color === 'green' ? 'selected' : ''}" title="Green"></div>
                        <div class="color-option color-yellow ${note.color === 'yellow' ? 'selected' : ''}" title="Yellow"></div>
                        <div class="color-option color-orange ${note.color === 'orange' ? 'selected' : ''}" title="Orange"></div>
                        <div class="color-option color-red ${note.color === 'red' ? 'selected' : ''}" title="Red"></div>
                    </div>
                </div>
<div class="text-color-selector">
    <div class="text-color-toggle" title="Text Color">Aa</div>
    <div class="text-color-options hidden">
        <div class="text-color-option text-black ${!note.textColor || note.textColor === '#000' ? 'selected' : ''}" title="Black"></div>
        <div class="text-color-option text-blue ${note.textColor === '#2196F3' ? 'selected' : ''}" title="Blue"></div>
        <div class="text-color-option text-green ${note.textColor === '#4CAF50' ? 'selected' : ''}" title="Green"></div>
        <div class="text-color-option text-red ${note.textColor === '#F44336' ? 'selected' : ''}" title="Red"></div>
    </div>
</div>
                <div class="resize-handle" title="Resize">◢</div>
            </div>
        `;
    
        // Apply saved styles
        if (note.textColor) {
            const contentEl = noteElement.querySelector('.note-content');
            const titleEl = noteElement.querySelector('.note-title');
            if (contentEl) contentEl.style.color = note.textColor;
            if (titleEl) titleEl.style.color = note.textColor;
            
            // Store original text color for dark mode toggling
            noteElement.dataset.originalTextColor = note.textColor;
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
        
        // Update the pin element to use classes instead of opacity
        const pinElement = noteElement.querySelector('.pin-note');
        if (note.pinned) {
            pinElement.classList.add('pinned');
            pinElement.classList.remove('unpinned');
        } else {
            pinElement.classList.add('unpinned');
            pinElement.classList.remove('pinned');
        }
        
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
    const colorToggle = noteElement.querySelector('.color-toggle');
    const colorOptionsContainer = noteElement.querySelector('.color-options');
    const textColorToggle = noteElement.querySelector('.text-color-toggle');
    const textColorOptionsContainer = noteElement.querySelector('.text-color-options');


    if (this.note.pinned) {
        pinElement.classList.add('pinned');
        pinElement.classList.remove('unpinned');
    } else {
        pinElement.classList.add('unpinned');
        pinElement.classList.remove('pinned');
    }

    colorToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop propagation to prevent document click handler
        colorOptionsContainer.classList.toggle('hidden');
        colorToggle.classList.toggle('active');
        // Close text color options if open
        textColorOptionsContainer.classList.add('hidden');
        textColorToggle.classList.remove('active');
    });
    
    // Text color toggle
    textColorToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop propagation to prevent document click handler
        textColorOptionsContainer.classList.toggle('hidden');
        textColorToggle.classList.toggle('active');
        // Close background color options if open
        colorOptionsContainer.classList.add('hidden');
        colorToggle.classList.remove('active');
    });
    
        // Toggle text color options visibility
        textColorToggle.addEventListener('click', () => {
            textColorOptionsContainer.classList.toggle('hidden');
            textColorToggle.classList.toggle('active');
        });

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
            colorOption.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop propagation
                const colorClasses = colorOption.className.split(' ');
                const colorClass = colorClasses.find(cls => cls.startsWith('color-'));
                if (colorClass) {
                    const colorName = colorClass.replace('color-', '');
                    
                    // Remove existing color class from note element
                    const noteClasses = noteElement.className.split(' ');
                    const filteredClasses = noteClasses.filter(cls => !cls.startsWith('note-') || cls === 'note');
                    noteElement.className = [...filteredClasses, `note-${colorName}`].join(' ');
                    
                    // Call controller function
                    this.onColorChange(this.note.id, colorName);
                    
                    // Update UI - remove selected class from all options
                    colorOptions.forEach(opt => opt.classList.remove('selected'));
                    colorOption.classList.add('selected');
                    
                    // Hide options after selection
                    colorOptionsContainer.classList.add('hidden');
                    colorToggle.classList.remove('active');
                }
            });
        });
        


        pinElement.addEventListener('click', () => {
            const newPinnedState = !this.note.pinned;
            this.onPin(this.note.id, newPinnedState);
            
            // Update the UI immediately for better user experience
            if (newPinnedState) {
                pinElement.classList.add('pinned');
                pinElement.classList.remove('unpinned');
            } else {
                pinElement.classList.add('unpinned');
                pinElement.classList.remove('pinned');
            }
        });
        // pinElement.addEventListener('click', () => {
        //     this.onPin(this.note.id, !this.note.pinned);
        // });

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
            textColorOption.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop propagation
                const colorClasses = textColorOption.className.split(' ');
                const colorClass = colorClasses.find(cls => cls.startsWith('text-'));
                if (colorClass) {
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
                    const contentElement = noteElement.querySelector('.note-content');
                    const titleElement = noteElement.querySelector('.note-title');
                    
                    if (contentElement) contentElement.style.color = textColor;
                    if (titleElement) titleElement.style.color = textColor;
                    
                    // Call controller function
                    this.onTextColorChange(this.note.id, textColor);
                    
                    // Update UI - remove selected class from all options
                    textColorOptions.forEach(opt => opt.classList.remove('selected'));
                    textColorOption.classList.add('selected');
                    
                    // Hide options after selection
                    textColorOptionsContainer.classList.add('hidden');
                    textColorToggle.classList.remove('active');
                }
            });
        });
        

        // Hide text color options when clicking elsewhere
        document.addEventListener('click', (e) => {
            colorOptionsContainer.classList.add('hidden');
    colorToggle.classList.remove('active');
    textColorOptionsContainer.classList.add('hidden');
    textColorToggle.classList.remove('active');
            if (!colorOptionsContainer.contains(e.target) && e.target !== colorToggle) {
                colorOptionsContainer.classList.add('hidden');
            }
            if (!textColorOptionsContainer.contains(e.target) && e.target !== textColorToggle) {
                textColorOptionsContainer.classList.add('hidden');
            }
        });
    }
}
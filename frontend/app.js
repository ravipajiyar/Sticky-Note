document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const addNoteBtn = document.querySelector('.btn-primary');
    const searchBar = document.querySelector('.search-bar');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const notesGrid = document.querySelector('.notes-grid');
    const statusBar = document.querySelector('.status-bar');
    const appContainer = document.querySelector('.app-container');
    const searchContainer = document.querySelector('.search-container');

    // State
    let notes = [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let categoryFilterDropdown, pinnedFilterDropdown; // Declare here
    // Initialize Filters

    // Function to create and append filter dropdowns
    function setupFilterDropdowns() {
        categoryFilterDropdown = document.createElement('select');
        categoryFilterDropdown.className = 'filter-dropdown';
        categoryFilterDropdown.innerHTML = `
            <option value="All">All Categories</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Important">Important</option>
        `;

        pinnedFilterDropdown = document.createElement('select');
        pinnedFilterDropdown.className = 'filter-dropdown';
        pinnedFilterDropdown.innerHTML = `
            <option value="All">All Notes</option>
            <option value="Pinned">Pinned Only</option>
            <option value="Unpinned">Unpinned Only</option>
        `;

        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';

        const categoryLabel = document.createElement('span');
        categoryLabel.textContent = 'Category: ';
        categoryLabel.className = 'filter-label';

        const pinnedLabel = document.createElement('span');
        pinnedLabel.textContent = 'Status: ';
        pinnedLabel.className = 'filter-label';

        filterContainer.appendChild(categoryLabel);
        filterContainer.appendChild(categoryFilterDropdown);
        filterContainer.appendChild(pinnedLabel);
        filterContainer.appendChild(pinnedFilterDropdown);

        searchContainer.appendChild(filterContainer);

        // Add event listeners to filter notes when dropdown values change
        categoryFilterDropdown.addEventListener('change', filterNotes);
        pinnedFilterDropdown.addEventListener('change', filterNotes);
    }


    //Initialize status bar function
    function updateStatusBarWithFilters() {
        const visibleNotes = notes.filter(note => note.element.style.display !== 'none').length;
        const totalNotes = notes.length;
        const pinnedNotes = notes.filter(note => note.pinned).length;
        const categoryFilter = categoryFilterDropdown.value;
        const pinnedFilter = pinnedFilterDropdown.value;
        const searchText = searchBar.value.toLowerCase();

        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

        // Update status message based on filters
        let statusMessage = `${totalNotes} notes • ${pinnedNotes} pinned`;

        // Add filter info if any filters are active
        if (categoryFilter !== 'All' || pinnedFilter !== 'All' || searchText) {
            statusMessage += ` • Showing ${visibleNotes} filtered notes`;
        }

        statusMessage += ` • Last saved: Today ${timeString}`;

        statusBar.textContent = statusMessage;
    }

    // Call this to update the status bar after any changes
    function updateStatusBar() {
        updateStatusBarWithFilters();
    }

    // Filter function here
    function filterNotes() {
        const categoryFilter = categoryFilterDropdown.value;
        const pinnedFilter = pinnedFilterDropdown.value;
        const searchText = searchBar.value.toLowerCase();

        notes.forEach(note => {
            const noteElement = note.element;
            const title = note.title.toLowerCase();
            const category = note.category.toLowerCase();
            const content = note.content.toLowerCase();
            const isPinned = note.pinned;

            // Check if note meets all filter criteria
            const matchesCategory = categoryFilter === 'All' || category.toLowerCase() === categoryFilter.toLowerCase();
            const matchesPinned = pinnedFilter === 'All' ||
                (pinnedFilter === 'Pinned' && isPinned) ||
                (pinnedFilter === 'Unpinned' && !isPinned);
            const matchesSearch = title.includes(searchText) ||
                content.includes(searchText) ||
                category.includes(searchText);

            // Show note only if it matches all filters
            if (matchesCategory && matchesPinned && matchesSearch) {
                noteElement.style.display = 'flex';
            } else {
                noteElement.style.display = 'none';
            }
        });

        // Update status bar with filtered count
        updateStatusBarWithFilters();
    }

    // Rearrange notes (pinned on top)
    function rearrangeNotes() {
        // Sort notes array
        notes.sort((a, b) => {
            // Pinned notes come first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });

        // Remove all notes from grid
        notesGrid.innerHTML = '';

        // Re-add in sorted order
        notes.forEach(note => {
            notesGrid.appendChild(note.element);
        });

        updateStatusBar();
    }

    // Function to handle creating a new note
    function createNewNote() {
        const newNote = new Note();  // Use the Note class from the Model

        const noteView = new NoteView(
            newNote,
            deleteNote,
            pinNote,
            updateNoteCategory,
            updateNoteContent,
            updateNoteTitle,
            updateNoteColor,
            resizeNote,
            updateNoteTextColor,
            dragNote
        );

        notes.push(newNote);
        newNote.element = noteView.element;  // Store the element in the note object
        notesGrid.appendChild(noteView.element);
        updateStatusBar();
        saveNotes();  // Save notes after creating a new one
    }

    // Function to save notes
    function saveNotes() {
        Note.saveNotes(notes)  // Use the static method to save all notes
            .then(() => {
                // Update the status bar to indicate notes were saved
                const date = new Date();
                const hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const timeString = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

                // Update the status message with the save time
                statusBar.textContent = statusBar.textContent.replace(/Last saved:.*/, `Last saved: Today ${timeString}`);
            })
            .catch(error => console.error('Failed to save notes:', error));
    }

    // Function to load notes
    function loadNotes() {
        Note.loadNotes()  // Use the static method to load all notes
            .then(savedNotes => {
                if (savedNotes && savedNotes.length > 0) {
                    notesGrid.innerHTML = '';
                    notes = savedNotes.map(savedNote => {
                        const note = new Note(
                            savedNote.id,
                            savedNote.title,
                            savedNote.category,
                            savedNote.content,
                            savedNote.color,
                            savedNote.pinned,
                            savedNote.textColor,
                            savedNote.position,
                            savedNote.width,
                            savedNote.height
                        );
                        const noteView = new NoteView(
                            note,
                            deleteNote,
                            pinNote,
                            updateNoteCategory,
                            updateNoteContent,
                            updateNoteTitle,
                            updateNoteColor,
                            resizeNote,
                            updateNoteTextColor,
                            dragNote
                        );
                        note.element = noteView.element;  // Store the element in the note object
                        return note;
                    });
                    notes.forEach(note => notesGrid.appendChild(note.element)); // Append elements after they are created

                    rearrangeNotes(); // Rearrange notes after loading
                    updateStatusBar(); //Update status bar after loading
                }
            })
            .catch(error => console.error('Failed to load notes:', error));
    }


    //Controller functions starts here
    function deleteNote(noteId) {
        // Create overlay for the entire screen
        const overlay = document.createElement('div');
        overlay.className = 'delete-overlay';

        // Create confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'delete-confirmation';
        confirmDialog.innerHTML = `
        <div class="delete-message">Are you sure you want to delete this note?</div>
        <div class="delete-actions">
            <button class="delete-cancel">Cancel</button>
            <button class="delete-confirm">Delete</button>
        </div>
    `;

        // Add the overlay and dialog to the body
        overlay.appendChild(confirmDialog);
        document.body.appendChild(overlay);

        // Add event listeners to the buttons
        confirmDialog.querySelector('.delete-cancel').addEventListener('click', function () {
            overlay.remove();
        });

        confirmDialog.querySelector('.delete-confirm').addEventListener('click', function () {
            const noteToDelete = notes.find(note => note.id === noteId);
            if (noteToDelete) {
                noteToDelete.element.remove(); // Remove from DOM
            }
            notes = notes.filter(note => note.id !== noteId); // Remove from array
            updateStatusBar();
            saveNotes();
            overlay.remove();
        });
    }

    // Controller function to update a note's pinned state
    function pinNote(noteId, pinned) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.pinned = pinned;
            const pinElement = note.element.querySelector('.pin-note');
            pinElement.style.opacity = pinned ? 1 : 0.5;
            rearrangeNotes(); //Re update the status bar
            saveNotes(); // Save notes after pinning
        }
    }

    // Controller function to update a note's category
    function updateNoteCategory(noteId, category) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.category = category;
            saveNotes(); // Save notes after category update
        }
    }

    // Controller function to update a note's content
    function updateNoteContent(noteId, content) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.content = content;
            saveNotes(); // Save notes after content update
        }
    }

    // Controller function to update a note's title
    function updateNoteTitle(noteId, title) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.title = title;
            saveNotes(); // Save notes after title update
        }
    }

    // Controller function to update a note's color
    function updateNoteColor(noteId, color) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.color = color;
            note.element.className = `note note-${color}`;  // Update the class
            saveNotes(); // Save notes after color update
        }
    }

    // Controller function to handle note resizing
    function resizeNote(noteId, width, height) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.width = width;
            note.height = height;
            saveNotes(); // Save notes after resize
        }
    }

    function updateNoteTextColor(noteId, textColor) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.textColor = textColor;
            saveNotes(); // Save notes after text color update
        }
    }

    // Controller function to handle note dragging
    function dragNote(noteId, position) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            note.position = position;
            saveNotes(); // Save notes after drag
        }
    }


    // Dark mode toggle
    function toggleDarkMode() {
        darkMode = !darkMode;
        localStorage.setItem('darkMode', darkMode);

        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    // Set fullscreen function
    function setFullscreen() {
        appContainer.style.height = '100vh';
        appContainer.style.maxHeight = '100vh';

        const headerHeight = document.querySelector('.header').offsetHeight;
        const toolbarHeight = document.querySelector('.toolbar').offsetHeight;
        const statusBarHeight = statusBar.offsetHeight;

        const notesGridHeight = `calc(100vh - ${headerHeight + toolbarHeight + statusBarHeight}px)`;
        notesGrid.style.height = notesGridHeight;
        notesGrid.style.minHeight = notesGridHeight;
    }

    // all eventlisteners here
    addNoteBtn.addEventListener('click', createNewNote);
    searchBar.addEventListener('input', filterNotes);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    window.addEventListener('resize', setFullscreen);

    // Apply dark mode on initial load if it was previously enabled initially
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Initial setup and loading
    setupFilterDropdowns();
    loadNotes();
    setFullscreen();

    // Add CSS for fullscreen and note styling
    const fullscreenStyle = document.createElement('style');
    fullscreenStyle.innerHTML = `
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
        }

        .app-container {
            height: 100vh;
            max-height: 100vh;
            display: flex;
            flex-direction: column;
            border-radius: 0;
        }

        .notes-grid {
            flex: 1;
            overflow-y: auto;
        }

        .note-header {
            display: flex;
            align-items: center;
            padding: 8px 10px;
        }

        .note-title {
            font-weight: bold;
            flex: 2;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            outline: none; /* Added to remove the outline */
        }

        .note-category-dropdown {
            margin-left: 8px;
            font-size: 12px;
            padding: 2px 4px;
            border: none;
            background-color: transparent;
            color: #666;
            cursor: pointer;
            flex: 1;
        }

        [data-default="true"] {
            color: #888;
            font-style: italic;
        }

        .note-content[data-default="true"] {
            color: #888;
        }
    `;

    document.head.appendChild(fullscreenStyle);

    const deleteDialogStyle = document.createElement('style');
    deleteDialogStyle.innerHTML = `
    .delete-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(3px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .delete-confirmation {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px;
        width: 300px;
        max-width: 90%;
    }
    
    .delete-message {
        font-size: 16px;
        margin-bottom: 16px;
        text-align: center;
    }
    
    .delete-actions {
        display: flex;
        justify-content: space-between;
    }
    
    .delete-cancel, .delete-confirm {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .delete-cancel {
        background-color: #f1f1f1;
    }
    
    .delete-confirm {
        background-color: #ff5252;
        color: white;
    }
    
    body.dark-mode .delete-confirmation {
        background-color: #333;
        color: #fff;
    }
    
    body.dark-mode .delete-cancel {
        background-color: #555;
        color: #eee;
    }
`;

    document.head.appendChild(deleteDialogStyle);

    const dragStyles = document.createElement('style');
    dragStyles.innerHTML = `
            .note {
                position: relative;
                z-index: 1;
            }
            .note.dragging {
                z-index: 100;
                opacity: 0.8;
            }
            .note.ui-draggable-dragging {
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
        `;
    document.head.appendChild(dragStyles);

    const textColorStyles = document.createElement('style');
    textColorStyles.innerHTML = `
    .text-color-options {
        display: flex;
        margin-right: 10px;
    }
    
    .text-color-option {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin: 0 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-weight: bold;
        border: 1px solid #ddd;
    }
    
    .text-color-option.selected {
        border: 2px solid #333;
    }
    
    .text-black { color: #000; }
    .text-blue { color: #2196F3; }
    .text-green { color: #4CAF50; }
    .text-red { color: #F44336; }
    
    body.dark-mode .text-color-option.selected {
        border-color: #fff;
    }
`;
    document.head.appendChild(textColorStyles);

    // Add CSS for category dropdown
    const style = document.createElement('style');
    style.innerHTML = `
            .note-category-dropdown {
                margin-left: 8px;
                font-size: 12px;
                padding: 2px 4px;
                border: none;
                background-color: transparent;
                color: #666;
                cursor: pointer;
                flex: 1;
            }
            .note-title {
                flex: 2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .note-header {
                display: flex;
                align-items: center;
            }
            
            /* Styling for dark mode */
            body.dark-mode .note-category-dropdown {
                background-color: rgba(0,0,0,0.1);
                color: #ddd;
            }
        `;
    document.head.appendChild(style);
});
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const addNoteBtn = document.querySelector('.btn-primary');
    const searchBar = document.querySelector('.search-bar');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const notesGrid = document.querySelector('.notes-grid');
    const statusBar = document.querySelector('.status-bar');
    const appContainer = document.querySelector('.app-container');
    const categoryFilterDropdown = document.createElement('select');
    const pinnedFilterDropdown = document.createElement('select');

    
    // State
    let notes = [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let resizingNote = null;
    let initialX, initialY, initialWidth, initialHeight;

    let db;
    setupIndexedDB().then(database => {
    db = database;
    loadNotes();
    }).catch(error => {
    console.error('Failed to initialize IndexedDB:', error);
    });

    // loadNotes();

    //indexed db setup here 
    function setupIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('NotesAppDB', 2);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject('Error opening IndexedDB');
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notes')) {
                const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                notesStore.createIndex('pinned', 'pinned', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };
    });
    }


    // for the fullscreen of the app
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
    
    // Set fullscreen on load and resize
    setFullscreen();
    window.addEventListener('resize', setFullscreen);
    
    function setupFilterDropdowns() {
        categoryFilterDropdown.className = 'filter-dropdown';
        categoryFilterDropdown.innerHTML = `
            <option value="All">All Categories</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Important">Important</option>
        `;
        
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
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(filterContainer);
        
        // Add event listeners to filter notes when dropdown values change
        categoryFilterDropdown.addEventListener('change', filterNotes);
        pinnedFilterDropdown.addEventListener('change', filterNotes);
    }
    function filterNotes() {
        const categoryFilter = categoryFilterDropdown.value;
        const pinnedFilter = pinnedFilterDropdown.value;
        const searchText = searchBar.value.toLowerCase();
        
        notes.forEach(note => {
            const noteElement = note.element;
            const title = note.title.toLowerCase();
            const category = note.category.toLowerCase();
            const content = noteElement.querySelector('.note-content').textContent.toLowerCase();
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

    // this will Initialize existing notes from DOM
    document.querySelectorAll('.note').forEach(noteEl => {
        const note = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: noteEl.querySelector('.note-title').textContent,
            category: noteEl.querySelector('.note-category-dropdown') ? 
                    noteEl.querySelector('.note-category-dropdown').value : 'Personal',
            content: noteEl.querySelector('.note-content').innerHTML,
            color: noteEl.classList[1].replace('note-', ''),
            pinned: noteEl.querySelector('.pin-note') !== null,
            element: noteEl
        };
        notes.push(note);
        
        // Add event listeners to existing notes
        setupNoteEventListeners(noteEl, note);
    });
    
    updateStatusBar();
    
    // Apply dark mode on initial load if it was previously enabled initially
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Event Listeners
    addNoteBtn.addEventListener('click', createNewNote);
    searchBar.addEventListener('input', searchNotes);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // all Functions starts from here
    
    // Create a new note function 
    function createNewNote() {
        const id = Date.now();
        const color = 'yellow'; 
        
        const noteElement = document.createElement('div');
    noteElement.className = `note note-${color}`;
    noteElement.innerHTML = `
        <div class="note-header">
            <div class="note-title" contenteditable="true" placeholder="Click to add title" data-default="true"></div>
            <select class="note-category-dropdown">
                <option value="Personal" selected>Personal</option>
                <option value="Work">Work</option>
                <option value="Important">Important</option>
            </select>
            <div class="delete-note">×</div>
        </div>
        <div class="note-content" contenteditable="true" placeholder="Type your note here..." data-default="true"></div>
        <div class="note-footer">
            <div class="color-options">
                <div class="color-option color-blue"></div>
                <div class="color-option color-green"></div>
                <div class="color-option color-yellow selected"></div>
                <div class="color-option color-orange"></div>
                <div class="color-option color-red"></div>
            </div>
        <div class="text-color-options">
            <div class="text-color-option text-black selected">A</div>
            <div class="text-color-option text-blue">A</div>
            <div class="text-color-option text-green">A</div>
            <div class="text-color-option text-red">A</div>
        </div>
            <div class="pin-note">📌</div>
        </div>
        <div class="resize-handle">◢</div>
    `;
        
        notesGrid.appendChild(noteElement);
        
        const note = {
            id,
            title: 'Click to edit title',
            category: 'Personal',
            content: '<p>Type your note here...</p>',
            color,
            pinned: true,
            textColor: '#000', // Default text color
            element: noteElement
        };
        
        notes.push(note);
        setupNoteEventListeners(noteElement, note);
        updateStatusBar();
        saveNotes();
    }
    

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
    // Set up event listeners for a note
    function setupNoteEventListeners(noteElement, noteObject) {
        const deleteBtn = noteElement.querySelector('.delete-note');
        const titleElement = noteElement.querySelector('.note-title');
        
        const textColorOptions = noteElement.querySelectorAll('.text-color-option');

        if (noteObject.textColor) {
            // Apply the saved text color
            noteElement.querySelector('.note-content').style.color = noteObject.textColor;
            noteElement.querySelector('.note-title').style.color = noteObject.textColor;
            
            // Set the correct option as selected
            textColorOptions.forEach(option => {
                option.classList.remove('selected');
                if (option.classList.contains(`text-${noteObject.textColor.replace('#', '')}`)) {
                    option.classList.add('selected');
                }
            });
        }

        textColorOptions.forEach(textColorOption => {
            textColorOption.addEventListener('click', function() {
                const colorClass = this.className.split(' ')[1];
                let textColor;
                
                // Map class names to actual colors
                switch(colorClass) {
                    case 'text-black': textColor = '#000'; break;
                    case 'text-blue': textColor = '#2196F3'; break;
                    case 'text-green': textColor = '#4CAF50'; break;
                    case 'text-red': textColor = '#F44336'; break;
                    default: textColor = '#000';
                }
                
                // Apply color to note content and title
                noteElement.querySelector('.note-content').style.color = textColor;
                noteElement.querySelector('.note-title').style.color = textColor;
                
                // Save the text color in the note object
                noteObject.textColor = textColor;
                
                // Remove 'selected' class from all text color options
                textColorOptions.forEach(option => {
                    option.classList.remove('selected');
                });
                
                // Add 'selected' class to the clicked text color option
                this.classList.add('selected');
                
                saveNotes();
            });
        });
        // the editable category with a dropdown if it exists
        const oldCategoryElement = noteElement.querySelector('.note-category');
        if (oldCategoryElement) {

            const categoryDropdown = document.createElement('select');
            categoryDropdown.className = 'note-category-dropdown';
            
            const categories = ['Personal', 'Work', 'Important'];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                if (noteObject.category === category) {
                    option.selected = true;
                }
                categoryDropdown.appendChild(option);
            });
            
            oldCategoryElement.parentNode.replaceChild(categoryDropdown, oldCategoryElement);
        }
        
        const categoryDropdown = noteElement.querySelector('.note-category-dropdown');
        
        if (categoryDropdown) {
            categoryDropdown.addEventListener('change', function() {
                noteObject.category = this.value;
                saveNotes();
            });
        }
        
        const contentElement = noteElement.querySelector('.note-content');
        const colorOptions = noteElement.querySelectorAll('.color-option');
        const pinElement = noteElement.querySelector('.pin-note');
        const resizeHandle = noteElement.querySelector('.resize-handle');
        
        // Make title editable on click
        titleElement.addEventListener('click', function() {
            titleElement.contentEditable = true;
            // Clear default text when focused
            if (titleElement.getAttribute('data-default') === 'true') {
                titleElement.textContent = '';
                titleElement.removeAttribute('data-default');
            }
            titleElement.focus();
        });
        
        titleElement.addEventListener('blur', function() {
            titleElement.contentEditable = false;
            if (titleElement.textContent.trim() === '') {
                titleElement.textContent = 'Untitled';
            }
            noteObject.title = titleElement.textContent;
            saveNotes();
        });
        
        // Auto-clear default content and save content on changes
        contentElement.addEventListener('focus', function() {
            if (contentElement.getAttribute('data-default') === 'true') {
                contentElement.innerHTML = '';
                contentElement.removeAttribute('data-default');
            }
        });
        
        // Save content on blur
        titleElement.addEventListener('blur', function() {
            titleElement.contentEditable = false;
            if (titleElement.textContent.trim() === '') {
                titleElement.textContent = 'Untitled';
            }
            noteObject.title = titleElement.textContent;
            saveNotes();  // Save notes when title changes
        });
        contentElement.addEventListener('blur', function() {
            if (contentElement.innerHTML.trim() === '') {
                contentElement.innerHTML = '<p>Type your note here...</p>';
                contentElement.setAttribute('data-default', 'true');
            }
            noteObject.content = contentElement.innerHTML;
            saveNotes();  // Save notes when content changes
        });
        // Delete note
        deleteBtn.addEventListener('click', function() {
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
            
            // Position the dialog over the note
            confirmDialog.style.position = 'absolute';
            confirmDialog.style.top = '50%';
            confirmDialog.style.left = '50%';
            confirmDialog.style.transform = 'translate(-50%, -50%)';
            confirmDialog.style.zIndex = '100';
            
            // Add the dialog to the note
            noteElement.appendChild(confirmDialog);
            
            // Add event listeners to the buttons
            confirmDialog.querySelector('.delete-cancel').addEventListener('click', function() {
                confirmDialog.remove();
            });
            
            confirmDialog.querySelector('.delete-confirm').addEventListener('click', function() {
                noteElement.remove();
                notes = notes.filter(note => note.id !== noteObject.id);
                updateStatusBar();
                saveNotes();
            });
        });
        

        const deleteDialogStyle = document.createElement('style');
        deleteDialogStyle.innerHTML = `
            .delete-confirmation {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px;
                width: 80%;
                max-width: 250px;
            }
            
            .delete-message {
                font-size: 14px;
                margin-bottom: 12px;
                text-align: center;
            }
            
            .delete-actions {
                display: flex;
                justify-content: space-between;
            }
            
            .delete-cancel, .delete-confirm {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
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

        // Change note color
        colorOptions.forEach(colorOption => {
            colorOption.addEventListener('click', function() {
                const colorClasses = ['blue', 'green', 'yellow', 'orange', 'red', 'pink'];
                const colorName = this.className.split(' ')[1].replace('color-', '');
                
                // Remove all color classes
                colorClasses.forEach(color => {
                    noteElement.classList.remove(`note-${color}`);
                });
                
                // Add the selected color class
                noteElement.classList.add(`note-${colorName}`);
                noteObject.color = colorName;
                
                // Apply dark mode styling to the note if dark mode is enabled
                if (darkMode) {
                    applyDarkModeToNote(noteElement);
                }
                
                saveNotes();
            });
        });
        
        // Toggle pin
        pinElement.addEventListener('click', function() {
            noteObject.pinned = !noteObject.pinned;
            if (noteObject.pinned) {
                pinElement.style.opacity = 1;
            } else {
                pinElement.style.opacity = 0.5;
            }
            rearrangeNotes();
            saveNotes();  // Save notes when pin state changes
        });

        // Make notes draggable - but only if not pinned
        $(noteElement).draggable({
            handle: '.note-header',
            containment: '.notes-grid',
            stack: '.note',
            start: function(event, ui) {
                // Only allow dragging if the note is not pinned
                if (noteObject.pinned) {
                    return false;
                }
                $(this).addClass('dragging');
            },
            stop: function(event, ui) {
                $(this).removeClass('dragging');
                // Save the position
                noteObject.position = {
                    left: ui.position.left,
                    top: ui.position.top
                };
                saveNotes();
            }
        });
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
        
        // Make notes resizable
        resizeHandle.addEventListener('mousedown', startResize);
        
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
    }

    // Resizing functionality
    function startResize(e) {
        e.stopPropagation();
        e.preventDefault();
        
        resizingNote = this.parentElement;
        const rect = resizingNote.getBoundingClientRect();
        
        initialWidth = rect.width;
        initialHeight = rect.height;
        initialX = e.clientX;
        initialY = e.clientY;
        
        resizingNote.classList.add('resizing');
        
        document.addEventListener('mousemove', resizeNote);
        document.addEventListener('mouseup', stopResize);
    }
    function resizeNote(e) {
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
    }
    function stopResize() {
        if (resizingNote) {
            resizingNote.classList.remove('resizing');
            document.removeEventListener('mousemove', resizeNote);
            document.removeEventListener('mouseup', stopResize);
            
            // Find the note object
            const noteObject = notes.find(note => note.element === resizingNote);
            if (noteObject) {
                noteObject.width = resizingNote.style.width;
                noteObject.height = resizingNote.style.height;
                saveNotes();
            }
            
            resizingNote = null;
        }
    }
    
    function searchNotes() {
        filterNotes(); // Use the combined filter function
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

    function updateStatusBarWithFilters() {
        const visibleNotes = notes.filter(note => note.element.style.display !== 'none').length;
        const totalNotes = notes.length;
        const pinnedNotes = notes.filter(note => note.pinned).length;
        const categoryFilter = categoryFilterDropdown.value;
        const pinnedFilter = pinnedFilterDropdown.value;
        
        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
        
        // Update status message based on filters
        let statusMessage = `${totalNotes} notes • ${pinnedNotes} pinned`;
        
        // Add filter info if any filters are active
        if (categoryFilter !== 'All' || pinnedFilter !== 'All' || searchBar.value) {
            statusMessage += ` • Showing ${visibleNotes} filtered notes`;
        }
        
        statusMessage += ` • Last saved: Today ${timeString}`;
        
        statusBar.textContent = statusMessage;
    }
    

    setupFilterDropdowns();

    // Replace existing updateStatusBar function with this call
    function updateStatusBar() {
        updateStatusBarWithFilters();
    }

// color change functionality
    colorOptions.forEach(colorOption => {
    colorOption.addEventListener('click', function() {
        const colorClasses = ['blue', 'green', 'yellow', 'orange', 'red', 'pink'];
        const colorName = this.className.split(' ')[1].replace('color-', '');
        
        // Remove all color classes
        colorClasses.forEach(color => {
            noteElement.classList.remove(`note-${color}`);
        });
        
        // Add the selected color class
        noteElement.classList.add(`note-${colorName}`);
        noteObject.color = colorName;
        
        // Remove 'selected' class from all color options
        colorOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add 'selected' class to the clicked color option
        this.classList.add('selected');
        
        // Apply dark mode styling to the note if dark mode is enabled
        if (darkMode) {
            applyDarkModeToNote(noteElement);
        }
        
        saveNotes();
    });
    
    // Set initial selected state based on note color
    if (colorOption.className.includes(`color-${noteObject.color}`)) {
        colorOption.classList.add('selected');
    }
    });



//  saveNotes function 
    function saveNotes() {
        setupIndexedDB().then(db => {
            const transaction = db.transaction(['notes'], 'readwrite');
            const notesStore = transaction.objectStore('notes');
        
            // Clear all existing notes
            const clearRequest = notesStore.clear();
        
            clearRequest.onsuccess = () => {
            // Add all current notes
                notes.forEach(note => {
                // Create a serializable version of the note
                    const serializedNote = {
                        id: note.id,
                        title: note.title,
                        category: note.category,
                        content: note.content,
                        color: note.color,
                        textColor: note.textColor || '#000',
                        pinned: note.pinned,
                        width: note.element.style.width || '',
                        height: note.element.style.height || '',
                        position: note.position || null
                    };
                
                    notesStore.add(serializedNote);
                });
        };
        
        transaction.oncomplete = () => {
            // Update the status bar to indicate notes were saved
            const date = new Date();
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
            
            // Update the status message with the save time
            const statusMessage = statusBar.textContent.split(' • ');
            statusMessage[statusMessage.length - 1] = `Last saved: Today ${timeString}`;
            statusBar.textContent = statusMessage.join(' • ');
        };
        
        transaction.onerror = (event) => {
            console.error('Transaction error:', event.target.error);
        };
    }).catch(error => {
        console.error('Failed to save notes:', error);
    });
}

//load notes

function loadNotes() {
    setupIndexedDB().then(db => {
        const transaction = db.transaction(['notes'], 'readonly');
        const notesStore = transaction.objectStore('notes');
        const getRequest = notesStore.getAll();
        
        getRequest.onsuccess = (event) => {
            const savedNotes = event.target.result;
            
            if (savedNotes && savedNotes.length > 0) {
                // Clear existing notes
                notesGrid.innerHTML = '';
                notes = [];
                
                savedNotes.forEach(savedNote => {
                    // Create note element
                    const noteElement = document.createElement('div');
                    noteElement.className = `note note-${savedNote.color}`;
                    noteElement.innerHTML = `
                        <div class="note-header">
                            <div class="note-title" contenteditable="true" ${savedNote.title === 'Click to edit title' ? 'data-default="true"' : ''}>${savedNote.title}</div>
                            <select class="note-category-dropdown">
                                <option value="Personal" ${savedNote.category === 'Personal' ? 'selected' : ''}>Personal</option>
                                <option value="Work" ${savedNote.category === 'Work' ? 'selected' : ''}>Work</option>
                                <option value="Important" ${savedNote.category === 'Important' ? 'selected' : ''}>Important</option>
                            </select>
                            <div class="delete-note">×</div>
                        </div>
                        <div class="note-content" contenteditable="true" ${savedNote.content === '<p>Type your note here...</p>' ? 'data-default="true"' : ''}>${savedNote.content}</div>
                        <div class="note-footer">
                            <div class="color-options">
                                <div class="color-option color-blue ${savedNote.color === 'blue' ? 'selected' : ''}"></div>
                                <div class="color-option color-green ${savedNote.color === 'green' ? 'selected' : ''}"></div>
                                <div class="color-option color-yellow ${savedNote.color === 'yellow' ? 'selected' : ''}"></div>
                                <div class="color-option color-orange ${savedNote.color === 'orange' ? 'selected' : ''}"></div>
                                <div class="color-option color-red ${savedNote.color === 'red' ? 'selected' : ''}"></div>
                            </div>
                            <div class="text-color-options">
                        <div class="text-color-option text-black ${!savedNote.textColor || savedNote.textColor === '#000' ? 'selected' : ''}">A</div>
                        <div class="text-color-option text-blue ${savedNote.textColor === '#2196F3' ? 'selected' : ''}">A</div>
                        <div class="text-color-option text-green ${savedNote.textColor === '#4CAF50' ? 'selected' : ''}">A</div>
                        <div class="text-color-option text-red ${savedNote.textColor === '#F44336' ? 'selected' : ''}">A</div>
                    </div>
                            <div class="pin-note">📌</div>
                        </div>
                        <div class="resize-handle">◢</div>
                    `;
                    
                    if (savedNote.textColor) {
                        noteElement.querySelector('.note-content').style.color = savedNote.textColor;
                        noteElement.querySelector('.note-title').style.color = savedNote.textColor;
                    }
                    
                    // Set width and height if they exist
                    if (savedNote.width) {
                        noteElement.style.width = savedNote.width;
                    }
                    if (savedNote.height) {
                        noteElement.style.height = savedNote.height;
                    }
                    if (savedNote.position) {
                        noteElement.style.position = 'absolute';
                        noteElement.style.left = savedNote.position.left + 'px';
                        noteElement.style.top = savedNote.position.top + 'px';
                    }
                    const pinElement = noteElement.querySelector('.pin-note');
                    pinElement.style.opacity = savedNote.pinned ? 1 : 0.5;
                    
                    notesGrid.appendChild(noteElement);
                    
                    // Create note object
                    const note = {
                        id: savedNote.id,
                        title: savedNote.title,
                        category: savedNote.category,
                        content: savedNote.content,
                        color: savedNote.color,
                        pinned: savedNote.pinned,
                        textColor: savedNote.textColor || '#000',
                        position: savedNote.position,
                        element: noteElement,
                    };
                    
                    notes.push(note);
                    setupNoteEventListeners(noteElement, note);
                });
                
                // Rearrange notes to show pinned ones on top
                rearrangeNotes();
                updateStatusBar();
            }
        };
        
        getRequest.onerror = (event) => {
            console.error('Error loading notes:', event.target.error);
        };
    }).catch(error => {
        console.error('Failed to load notes:', error);
    });
}


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
    
    loadNotes();

});
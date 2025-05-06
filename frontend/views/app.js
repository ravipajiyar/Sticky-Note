document.addEventListener('DOMContentLoaded',  function () {
    const floatingAddButton = document.getElementById('floatingAddButton');
    const notesGrid = document.querySelector('.notes-grid');
    const statusBar = document.querySelector('.status-bar');
    const appContainer = document.querySelector('.app-container');
    const textColorToggle = document.querySelector('.text-color-toggle');
    const textColorOptionsContainer = document.querySelector('.text-color-options');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const colorOptionsContainer = document.getElementById('colorOptionsContainer');
    

    const controlsContainer = document.querySelector('.controls');

    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('input', filterNotes);
    let currentPage = 1;
    let isLoading = false;
    let hasMoreNotes = true;
    
    const loginForm = document.querySelector('.login-form');
    const signupForm = document.querySelector('.signup-form');
    
    // Reset forms if they exist
    if(loginForm) loginForm.reset();
    if(signupForm) signupForm.reset();
    
    // Directly clear all text and password inputs as a fallback
    const allInputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]');
    allInputs.forEach(input => {
        input.value = '';
    });
    // State
    let notes = [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const toggleSwitch = document.querySelector('.dark-mode-toggle .toggle-switch');
        if (toggleSwitch) {
            toggleSwitch.classList.add('active');
        }
    }

    //Load the notes
    loadNotes();

    const categoryLinks = document.querySelectorAll('.sidebar-nav li a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            const category = this.textContent.trim();
            filterNotesByCategory(category);
        });
    });
    
    // // Check authentication status
    // const checkAuth = () => {
    //     const token = localStorage.getItem('token');
    //     return !!token;
    // };

    // if (checkAuth()) {
    //     appContainer.classList.add('authenticated');
    //     loadNotes(); // Load notes if authenticated
    // } else {
    //     window.location.href = 'auth.html';
    // }

    // Fix for export-notes-btn event listener
const exportNotesBtn = document.querySelector('.export-notes-btn');
exportNotesBtn.addEventListener('click', function(e) {
    e.preventDefault();
    exportNotes();
});

// Fix for import-notes-input event listener
const importNotesInput = document.getElementById('import-notes-input');
importNotesInput.addEventListener('change', function(e) {
    importNotes(e);
});

// Export notes function
function exportNotes() {
    try {
        // Create a copy of the notes array without the DOM elements
        const notesToExport = notes.map(note => {
            const { element, ...noteData } = note;
            // Convert position object to string for proper JSON serialization
            if (noteData.position && typeof noteData.position !== 'string') {
                noteData.position = JSON.stringify(noteData.position);
            }
            return noteData;
        });

        // Create a JSON string
        const notesJson = JSON.stringify(notesToExport, null, 2);

        // Create a blob from the JSON string
        const blob = new Blob([notesJson], { type: 'application/json' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.download = `sticky_notes_export_${new Date().toISOString().split('T')[0]}.json`;

        // Append link to body, click it, and then remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Notes exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting notes:', error);
        showNotification('Failed to export notes. Please try again.', 'error');
    }
}

// Import notes function
function importNotes(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let importedNotes = JSON.parse(e.target.result);
                
                // Show confirmation dialog
                if (notes.length > 0) {
                    if (!confirm('Importing notes will merge with your existing notes. Continue?')) {
                        importNotesInput.value = ''; // Reset the file input
                        return;
                    }
                }

                // Process each imported note
                importedNotes.forEach(async (importedNote) => {
                    try {
                        // Check if note already exists
                        const existingNote = notes.find(note => note.id === importedNote.id);
                        
                        if (existingNote) {
                            // Update existing note
                            await updateNoteOnServer(importedNote);
                        } else {
                            // Create new note
                            await createNoteOnServer(importedNote);
                        }
                    } catch (err) {
                        console.error('Error processing imported note:', err);
                    }
                });

                // Reload notes from server
                setTimeout(() => loadNotes(), 500);
                showNotification('Notes imported successfully!', 'success');
            } catch (error) {
                console.error('Error parsing imported notes:', error);
                showNotification('Invalid file format. Please use a proper JSON export.', 'error');
            }
            
            // Reset the file input
            importNotesInput.value = '';
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error importing notes:', error);
        showNotification('Failed to import notes. Please try again.', 'error');
        importNotesInput.value = '';
    }
}

    async function exportNotes() {
        try {
            // Create a copy of the notes array without the DOM elements
            const notesToExport = notes.map(note => {
                const { element, ...noteData } = note;
                // Convert position object to string for proper JSON serialization
                if (noteData.position) {
                    noteData.position = JSON.stringify(noteData.position);
                }
                return noteData;
            });

            // Create a JSON string
            const notesJson = JSON.stringify(notesToExport, null, 2);

            // Create a blob from the JSON string
            const blob = new Blob([notesJson], { type: 'application/json' });

            // Create a URL for the blob
            const url = URL.createObjectURL(blob);

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = `sticky_notes_export_${new Date().toISOString().split('T')[0]}.json`;

            // Append link to body, click it, and then remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success notification
            showNotification('Notes exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting notes:', error);
            showNotification('Failed to export notes. Please try again.', 'error');
        }
    }

    async function importNotes(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedNotes = JSON.parse(e.target.result);
                    
                    // Show confirmation dialog
                    if (notes.length > 0) {
                        if (!confirm('Importing notes will merge with your existing notes. Continue?')) {
                            importNotesInput.value = ''; // Reset the file input
                            return;
                        }
                    }

                    // Import notes one by one
                    for (const importedNote of importedNotes) {
                        // Check if this note already exists (by id)
                        const existingNote = notes.find(note => note.id === importedNote.id);
                        
                        if (existingNote) {
                            // Update existing note
                            await updateNoteOnServer(importedNote);
                        } else {
                            // Create new note
                            await createNoteOnServer(importedNote);
                        }
                    }

                    // Reload notes from server
                    await loadNotes();
                    showNotification('Notes imported successfully!', 'success');
                } catch (error) {
                    console.error('Error parsing imported notes:', error);
                    showNotification('Invalid file format. Please use a proper JSON export.', 'error');
                }
                
                // Reset the file input
                importNotesInput.value = '';
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing notes:', error);
            showNotification('Failed to import notes. Please try again.', 'error');
            // Reset the file input
            importNotesInput.value = '';
        }
    }

    async function updateNoteOnServer(noteData) {
        try {
            // Convert position string back to object if needed
            if (typeof noteData.position === 'string') {
                noteData.position = JSON.parse(noteData.position);
            }
            
            const response = await fetch(`http://localhost:3001/notes/${noteData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(noteData)
            });

            if (!response.ok) {
                console.error('Failed to update imported note:', response.status);
            }
        } catch (error) {
            console.error('Error updating imported note:', error);
        }
    }

    async function createNoteOnServer(noteData) {
        try {
            // Remove id since server will generate a new one
            const { id, ...newNoteData } = noteData;
            
            // Convert position string back to object if needed
            if (typeof newNoteData.position === 'string') {
                newNoteData.position = JSON.parse(newNoteData.position);
            }

            const response = await fetch('http://localhost:3001/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cookies.getItem('token')}`
                },
                body: JSON.stringify(newNoteData)
            });

            if (!response.ok) {
                console.error('Failed to create imported note:', response.status);
            }
        } catch (error) {
            console.error('Error creating imported note:', error);
        }
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-notification';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            document.body.removeChild(notification);
        };
        notification.appendChild(closeBtn);
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
    function filterNotesByCategory(category) {
        console.group('Filter Notes by Category');
        console.log('Category:', category);
        
        let odataFilter = '';
        if (category && category !== 'All Notes' && category !== 'Recent') {
            if (category === 'Pinned') {
                odataFilter = 'pinned eq true';
            } else {
                // Proper OData syntax with single quotes
                const escapedCategory = category.replace(/'/g, "''");
                odataFilter = `category eq '${escapedCategory}'`;
            }
        }
        
        console.log('Generated OData filter:', odataFilter);
        console.groupEnd();
        loadNotes(1, false, odataFilter, category);
    }
    
    // Fix for filterNotes 
    function filterNotes() {
        const searchTerm = searchBar.value.toLowerCase();
        let odataFilter = '';
        
        if (searchTerm) {
            // Escape single quotes in search term for OData
            const escapedSearchTerm = searchTerm.replace(/'/g, "''");
            // Build valid OData filter
            odataFilter = `contains(title, '${escapedSearchTerm}') or contains(content, '${escapedSearchTerm}') or contains(category, '${escapedSearchTerm}')`;
        }
        
        // Remove encoding from here - will be encoded in loadNotes
        console.log("OData Filter Search:", odataFilter);
        
        currentPage = 1;
        hasMoreNotes = true;
        loadNotes(1, false, odataFilter);
    }
    

   
    
  
    async function saveNotes() {
        //No need to save notes as backend is saving it
                const date = new Date();
                const hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const timeString = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

                // Update the status message with the save time
                statusBar.textContent = statusBar.textContent.replace(/Last saved:.*/, `Last saved: Today ${timeString}`);
    }




    async function loadNotes(page = 1, append = false, odataFilter = '', category = '') {
        try {
            if (isLoading || (!hasMoreNotes && page > 1)) return;
    
            isLoading = true;
    
            // Show loading indicator
            const loadingIndicator = document.getElementById('loading-indicator') || createLoadingIndicator();
            loadingIndicator.style.display = 'flex';
    
            let url = `http://localhost:3001/notes?page=${page}&limit=10`;
    
            if (odataFilter) {
                // Encode the filter string for URL here
                const encodedFilter = encodeURIComponent(odataFilter);
                url += `&$filter=${encodedFilter}`;
            }
    
            console.log("Request URL:", url);
    
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    credentials: "include"
                }
            });
    
            if (response.ok) {
                const data = await response.json();
                let savedNotes = data.notes;
    
                //Sort and filter for recent Category
                if(category === "Recent"){
                    savedNotes = savedNotes.sort((a, b) => b.id - a.id).slice(0,5);
                }
    
                // Update pagination info
                currentPage = data.currentPage;
                hasMoreNotes = data.hasMore;
    
                if (!append) {
                    notesGrid.innerHTML = '';
                    notes = [];
                }
    
                if (savedNotes && savedNotes.length > 0) {
                    const newNotes = savedNotes.map(savedNote => {
                        const note = new Note(
                            savedNote.id,
                            savedNote.title,
                            savedNote.category,
                            savedNote.content,
                            savedNote.color,
                            savedNote.pinned,
                            savedNote.textColor,
                            savedNote.position ? JSON.parse(savedNote.position) : null,
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
    
                    // Add new notes to the notes array
                    notes = [...notes, ...newNotes];
    
                    // Append elements to grid
                    newNotes.forEach(note => notesGrid.appendChild(note.element));
    
                    updateStatusBar();
    
                    // If no more notes, hide loading indicator
                    if (!hasMoreNotes) {
                        loadingIndicator.style.display = 'none';
                    }
                } else if (page === 1) {
                    notesGrid.innerHTML = '<div class="no-notes">No notes found.</div>';
                    loadingIndicator.style.display = 'none';
                }
            } else {
                console.error('Failed to load notes:', response.status);
                showNotification('Failed to load notes. Please try again.', 'error');
                loadingIndicator.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            showNotification('Error loading notes. Please try again.', 'error');
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        } finally {
            isLoading = false;
        }
    }


    function createLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><span>Loading more notes...</span>';
        
        // Add to the end of notes grid instead of app container
        notesGrid.appendChild(loadingIndicator);
        return loadingIndicator;
    }
    
    // Add scroll event listener after your other event listeners
    function setupInfiniteScroll() {
        // Check if we're close to the bottom of the page when scrolling
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Trigger loading when user is within 200px of the bottom
            if (scrollPosition + windowHeight >= documentHeight - 200) {
                if (!isLoading && hasMoreNotes) {
                    loadNotes(currentPage + 1, true);
                }
            }
        });
    }
    
    // Initialize infinite scroll after other event listeners
    setupInfiniteScroll();
    //Controller functions starts here
    async function deleteNote(noteId) {
        // Create overlay for the entire screen
        const overlay = document.createElement('div');
        overlay.className = 'delete-overlay';

        // Create confirmation dialog
        const confirmDialog = document.createElement('div');
    confirmDialog.className = 'delete-confirmation';
    confirmDialog.innerHTML = `
        <div class="delete-header">
            <h3>Delete Note</h3>
        </div>
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

        confirmDialog.querySelector('.delete-confirm').addEventListener('click', async function () {
           try {
                const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const noteToDelete = notes.find(note => note.id === noteId);
                    if (noteToDelete) {
                        noteToDelete.element.remove(); // Remove from DOM
                    }
                    notes = notes.filter(note => note.id !== noteId); // Remove from array
                     updateStatusBar();
                    saveNotes();
                    overlay.remove();
                } else {
                    console.error('Failed to delete note:', response.status);
                    showNotification('Failed to delete note. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                showNotification('Error deleting note. Please try again.', 'error');
            }
        });
    }

    // Controller function to update a note's pinned state
    async function pinNote(noteId, pinned) {
    try {
        // Make a PUT request to update the pinned state of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                pinned: pinned
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.pinned = pinned;
                updateStatusBar();
                saveNotes(); // Save notes after pinning
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}


    // Controller function to update a note's category
    async function updateNoteCategory(noteId, category) {
    try {
        // Make a PUT request to update the category of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                category: category
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.category = category;
                saveNotes(); // Save notes after category update
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}


    // Controller function to update a note's content
    async function updateNoteContent(noteId, content) {
    try {
        // Make a PUT request to update the content of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                content: content
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.content = content;
                saveNotes(); // Save notes after content update
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}


    // Controller function to update a note's title
    async function updateNoteTitle(noteId, title) {
    try {
        // Make a PUT request to update the title of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                title: title
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.title = title;
                saveNotes(); // Save notes after title update
            }

        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}

    // Controller function to update a note's color
    async function updateNoteColor(noteId, color) {
    try {
        // Make a PUT request to update the color of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                color: color
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.color = color;
                note.element.className = `note note-${note.color}`;  // Update the class
                saveNotes(); // Save notes after color update
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}

    // Controller function to handle note resizing
    async function resizeNote(noteId, width, height) {
    try {
        // Make a PUT request to update the width and height of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                width: width,
                height: height
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.width = width;
                note.height = height;
                saveNotes(); // Save notes after resize
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}


    async function updateNoteTextColor(noteId, textColor) {
    try {
        // Make a PUT request to update the textColor of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                textColor: textColor
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.textColor = textColor;
                saveNotes(); // Save notes after text color update
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}


    // Controller function to handle note dragging
    async function dragNote(noteId, position) {
    try {
        // Make a PUT request to update the position of the note
        const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                position: position
            })
        });

        if (response.ok) {
            const note = notes.find(note => note.id === noteId);
            if (note) {
                note.position = position;
                saveNotes(); // Save notes after drag
            }
        } else {
            console.error('Failed to update note:', response.status);
            showNotification('Failed to update note. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Error updating note. Please try again.', 'error');
    }
}

     function updateStatusBar() {
        // No need to save to local storage, just update status bar
        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

        const pinnedCount = notes.filter(note => note.pinned).length;
        statusBar.textContent = `${notes.length} notes • ${pinnedCount} pinned • Last saved: Today ${timeString}`;
    }
    // Attach event listener to the add note button
    floatingAddButton.addEventListener('click', async () => {
        try {
            // Make a POST request to create a new note on the server
            const response = await fetch('http://localhost:3001/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: 'Click to edit title',
                    category: 'Personal',
                    content: '<p>Type your note here...</p>',
                    color: 'yellow',
                    pinned: false,
                    textColor: '#000000',
                    position: null,
                    width: '',
                    height: ''
                })
            });

            if (response.ok) {
                const data = await response.json();
                const newNote = new Note(
                    data.noteId,
                    'Click to edit title',
                    'Personal',
                    '<p>Type your note here...</p>',
                    'yellow',
                    false,
                    '#000000',
                    null,
                    '',
                    ''
                );

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
                newNote.element = noteView.element;
                notesGrid.appendChild(noteView.element);
                updateStatusBar();
                saveNotes();
            } else {
                console.error('Failed to create note:', response.status);
                showNotification('Failed to create note. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error creating note:', error);
            showNotification('Error creating note. Please try again.', 'error');
        }
    });


// Hide text color options when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!colorOptionsContainer.contains(e.target) && e.target !== colorToggle) {
        colorOptionsContainer.classList.add('hidden');
        colorToggle.classList.remove('active');
    }
    if (!textColorOptionsContainer.contains(e.target) && e.target !== textColorToggle) {
        textColorOptionsContainer.classList.add('hidden');
        textColorToggle.classList.remove('active');
    }
});

// Add text color toggle event listener
if (textColorToggle) {
    textColorToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        textColorOptionsContainer.classList.toggle('hidden');
        textColorToggle.classList.toggle('active');
        // Close color options if open
        colorOptionsContainer.classList.add('hidden');
        colorToggle.classList.remove('active');
    });
}

darkModeToggle.addEventListener('click', function() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    
    const toggleSwitch = this.querySelector('.toggle-switch');
    if (darkMode) {
        document.body.classList.add('dark-mode');
        toggleSwitch.classList.add('active');
    } else {
        document.body.classList.remove('dark-mode');
        toggleSwitch.classList.remove('active');
    }
    
    // Update all notes' text colors for better contrast in dark mode
    notes.forEach(note => {
        const noteContent = note.element.querySelector('.note-content');
        const noteTitle = note.element.querySelector('.note-title');
        
        if (darkMode) {
            // Store original text color if not in dark mode already
            if (!note.element.dataset.originalTextColor) {
                note.element.dataset.originalTextColor = note.textColor || '#000';
            }
            // Use light text in dark mode for better visibility
            noteContent.style.color = '#fff';
            noteTitle.style.color = '#fff';
        } else {
            // Restore original text color
            const originalColor = note.element.dataset.originalTextColor || note.textColor || '#000';
            noteContent.style.color = originalColor;
            noteTitle.style.color = originalColor;
        }
    });
});

});
const NoteModel = {
    notes: [],
    db: null,
    darkMode: localStorage.getItem('darkMode') === 'true',
    setupIndexedDB: function() { // Keep setupIndexedDB within the Model
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open('NotesAppDB', 2);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject('Error opening IndexedDB');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', {
                        keyPath: 'id'
                    });
                    notesStore.createIndex('pinned', 'pinned', {
                        unique: false
                    });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;  // Correctly set this.db
                resolve(this.db);
            };
        });
    },

    loadNotes: function() {
        return new Promise((resolve, reject) => { // Return a Promise for async handling
            if (!this.db) {
                reject('Database not initialized');
                return;
            }

            const transaction = this.db.transaction(['notes'], 'readonly');
            const notesStore = transaction.objectStore('notes');
            const getRequest = notesStore.getAll();

            getRequest.onsuccess = (event) => {
                const savedNotes = event.target.result;
                resolve(savedNotes); // Resolve with savedNotes
            };

            getRequest.onerror = (event) => {
                console.error('Error loading notes:', event.target.error);
                reject('Error loading notes');
            };
        });
    },

    saveNotes: function() {
         return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['notes'], 'readwrite');
            const notesStore = transaction.objectStore('notes');

            // Clear all existing notes
            const clearRequest = notesStore.clear();

            clearRequest.onsuccess = () => {
                // Add all current notes
                this.notes.forEach(note => {
                    // Create a serializable version of the note
                    const serializedNote = {
                        id: note.id,
                        title: note.title,
                        category: note.category,
                        content: note.content,
                        color: note.color,
                        pinned: note.pinned,
                        width: note.element.style.width || '',
                        height: note.element.style.height || '',
                        position: note.position || null
                    };

                    notesStore.add(serializedNote);
                });
                 resolve(); // Resolve when notes are saved
            };

            transaction.oncomplete = () => {
               resolve(); // Resolve when transaction is complete
               console.log("Save complete");
            };

            transaction.onerror = (event) => {
                console.error('Transaction error:', event.target.error);
                reject('Transaction error');
            };
        });
    },

    addNote: function(note) {
        this.notes.push(note);
        return this.saveNotes(); // Chain saveNotes after adding a note
    },

    deleteNote: function(noteId) {
        this.notes = this.notes.filter(note => note.id !== noteId);
        return this.saveNotes(); // Chain saveNotes after deleting a note
    },

    updateNote: function(updatedNote) {
         const index = this.notes.findIndex(note => note.id === updatedNote.id);
         if (index !== -1) {
            this.notes[index] = updatedNote;
            return this.saveNotes();
         }
         return Promise.reject('Note not found');
    },
    setDarkMode: function(darkModeEnabled) {
        this.darkMode = darkModeEnabled;
        localStorage.setItem('darkMode', darkModeEnabled);
    }
};
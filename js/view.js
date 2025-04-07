const NoteView = {
    addNoteBtn: document.querySelector('.btn-primary'),
    searchBar: document.querySelector('.search-bar'),
    darkModeToggle: document.querySelector('.dark-mode-toggle'),
    notesGrid: document.querySelector('.notes-grid'),
    statusBar: document.querySelector('.status-bar'),
    appContainer: document.querySelector('.app-container'),
    categoryFilterDropdown: document.createElement('select'),
    pinnedFilterDropdown: document.createElement('select'),

    init: function() {
        this.setupFilterDropdowns();
        this.setFullscreen();
        window.addEventListener('resize', this.setFullscreen.bind(this));
    },
    renderNotes: function(notes) {
        this.notesGrid.innerHTML = '';
        notes.forEach(note => {
            this.notesGrid.appendChild(this.createNoteElement(note));
        });
    },
    createNoteElement: function(note) {
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
                <div class="pin-note">📌</div>
            </div>
            <div class="resize-handle">◢</div>
        `;
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
    },
    updateStatusBar: function(totalNotes, pinnedNotes, visibleNotes, lastSavedTime) {
        let statusMessage = `${totalNotes} notes • ${pinnedNotes} pinned`;

        if (this.categoryFilterDropdown.value !== 'All' || this.pinnedFilterDropdown.value !== 'All' || this.searchBar.value) {
            statusMessage += ` • Showing ${visibleNotes} filtered notes`;
        }

        statusMessage += ` • Last saved: Today ${lastSavedTime}`;

        this.statusBar.textContent = statusMessage;
    },

    setFullscreen: function() {
        this.appContainer.style.height = '100vh';
        this.appContainer.style.maxHeight = '100vh';

        const headerHeight = document.querySelector('.header').offsetHeight;
        const toolbarHeight = document.querySelector('.toolbar').offsetHeight;
        const statusBarHeight = this.statusBar.offsetHeight;

        const notesGridHeight = `calc(100vh - ${headerHeight + toolbarHeight + statusBarHeight}px)`;
        this.notesGrid.style.height = notesGridHeight;
        this.notesGrid.style.minHeight = notesGridHeight;
    },

    setupFilterDropdowns: function() {
        this.categoryFilterDropdown.className = 'filter-dropdown';
        this.categoryFilterDropdown.innerHTML = `
            <option value="All">All Categories</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Important">Important</option>
        `;

        this.pinnedFilterDropdown.className = 'filter-dropdown';
        this.pinnedFilterDropdown.innerHTML = `
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
        filterContainer.appendChild(this.categoryFilterDropdown);
        filterContainer.appendChild(pinnedLabel);
        filterContainer.appendChild(this.pinnedFilterDropdown);

        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(filterContainer);
    }

};
// ── Note Boards Webview Script ───────────────────────────────────────────────
// Runs inside the panel webview. All forms are rendered inline (no Joplin dialogs).

(function () {
	'use strict';

	var dragSrcEl = null;
	var dragSrcNoteId = null;

	// ── Section toggling ────────────────────────────────────────────────────
	function showSection(id) {
		var ids = ['board-view', 'board-form', 'note-search'];
		for (var i = 0; i < ids.length; i++) {
			var el = document.getElementById(ids[i]);
			if (el) el.style.display = ids[i] === id ? 'block' : 'none';
		}
	}

	// ── Toast notification ──────────────────────────────────────────────────
	function showToast(message) {
		var toast = document.getElementById('toast');
		if (!toast) return;
		toast.textContent = message;
		toast.style.display = 'block';
		setTimeout(function () { toast.style.display = 'none'; }, 2500);
	}

	// ── Escape helpers ──────────────────────────────────────────────────────
	function escapeHtml(s) {
		var d = document.createElement('div');
		d.textContent = s;
		return d.innerHTML;
	}

	function escapeAttr(s) {
		return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	// ── Search helper ───────────────────────────────────────────────────────
	function doSearch() {
		var queryEl = document.getElementById('search-query');
		var resultsDiv = document.getElementById('search-results');
		if (!queryEl || !resultsDiv) return;

		var query = queryEl.value.trim();
		resultsDiv.innerHTML = '<div class="search-loading">Searching...</div>';

		webviewApi.postMessage({ type: 'searchNotes', query: query }).then(function (notes) {
			if (!notes || notes.length === 0) {
				resultsDiv.innerHTML = '<div class="search-empty">No matching notes found.</div>';
				return;
			}
			var html = '';
			for (var i = 0; i < notes.length; i++) {
				html += '<div class="search-result-item" data-note-id="' + escapeAttr(notes[i].id) + '">' +
					'<span>' + escapeHtml(notes[i].title) + '</span></div>';
			}
			resultsDiv.innerHTML = html;
		}).catch(function () {
			resultsDiv.innerHTML = '<div class="search-empty">Search failed.</div>';
		});
	}

	// ── Event delegation ────────────────────────────────────────────────────
	document.addEventListener('click', function (e) {
		var target = e.target;

		// Tab click → switch board
		var tab = target.closest('.board-tab:not(.new-board)');
		if (tab) {
			var boardId = tab.getAttribute('data-board-id');
			if (boardId) webviewApi.postMessage({ type: 'switchBoard', boardId: boardId });
			return;
		}

		// New board → show board form
		if (target.closest('#btn-new-board')) {
			document.getElementById('form-board-id').value = '';
			document.getElementById('form-board-name').value = '';
			document.getElementById('form-board-icon').value = '📋';
			document.getElementById('form-board-color').value = '#4a9fd5';
			document.getElementById('board-form-title').textContent = 'New Board';
			document.getElementById('form-board-submit').textContent = 'Create';
			showSection('board-form');
			document.getElementById('form-board-name').focus();
			return;
		}

		// Add note → show search panel
		if (target.closest('#btn-add-note')) {
			document.getElementById('search-query').value = '';
			document.getElementById('search-results').innerHTML = '';
			showSection('note-search');
			document.getElementById('search-query').focus();
			return;
		}

		// Edit board → show board form pre-filled
		if (target.closest('#btn-edit-board')) {
			var btn = target.closest('#btn-edit-board');
			document.getElementById('form-board-id').value = btn.getAttribute('data-board-id') || '';
			document.getElementById('form-board-name').value = btn.getAttribute('data-name') || '';
			document.getElementById('form-board-icon').value = btn.getAttribute('data-icon') || '📋';
			document.getElementById('form-board-color').value = btn.getAttribute('data-color') || '#4a9fd5';
			document.getElementById('board-form-title').textContent = 'Edit Board';
			document.getElementById('form-board-submit').textContent = 'Save';
			showSection('board-form');
			document.getElementById('form-board-name').focus();
			return;
		}

		// Delete board
		if (target.closest('#btn-delete-board')) {
			if (confirm('Delete this board? Notes will not be deleted.')) {
				webviewApi.postMessage({ type: 'deleteBoard' });
			}
			return;
		}

		// Board form submit
		if (target.closest('#form-board-submit')) {
			var name = document.getElementById('form-board-name').value.trim();
			if (!name) { document.getElementById('form-board-name').focus(); return; }
			webviewApi.postMessage({
				type: 'submitBoard',
				boardId: document.getElementById('form-board-id').value || null,
				name: name,
				icon: document.getElementById('form-board-icon').value.trim() || '📋',
				color: document.getElementById('form-board-color').value || '#4a9fd5'
			});
			return;
		}

		// Board form cancel
		if (target.closest('#form-board-cancel')) {
			showSection('board-view');
			return;
		}

		// Search submit
		if (target.closest('#search-submit')) {
			doSearch();
			return;
		}

		// Search cancel
		if (target.closest('#search-cancel')) {
			showSection('board-view');
			return;
		}

		// Search result click → add note to board
		var resultItem = target.closest('.search-result-item');
		if (resultItem) {
			var noteId = resultItem.getAttribute('data-note-id');
			if (noteId) webviewApi.postMessage({ type: 'addNote', noteId: noteId });
			return;
		}

		// Remove card
		var removeBtn = target.closest('.card-remove');
		if (removeBtn) {
			e.stopPropagation();
			var removeId = removeBtn.getAttribute('data-note-id');
			if (removeId) webviewApi.postMessage({ type: 'removeNote', noteId: removeId });
			return;
		}

		// Card click → open note
		var card = target.closest('.note-card');
		if (card) {
			var openId = card.getAttribute('data-note-id');
			if (openId) {
				webviewApi.postMessage({ type: 'openNote', noteId: openId });
			}
			return;
		}
	});

	// Search with Enter key
	document.addEventListener('keydown', function (e) {
		if (e.target && e.target.id === 'search-query' && e.key === 'Enter') {
			e.preventDefault();
			doSearch();
		}
	});

	// ── Drag and drop for grid positioning ──────────────────────────────────

	document.addEventListener('dragstart', function (e) {
		var card = e.target.closest('.note-card');
		if (!card) return;
		dragSrcEl = card;
		dragSrcNoteId = card.getAttribute('data-note-id');
		var cell = card.closest('.grid-cell');
		if (cell) cell.classList.add('dragging');
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', dragSrcNoteId);
	});

	document.addEventListener('dragend', function () {
		document.querySelectorAll('.dragging').forEach(function (el) {
			el.classList.remove('dragging');
		});
		document.querySelectorAll('.drag-over').forEach(function (el) {
			el.classList.remove('drag-over');
		});
		dragSrcEl = null;
		dragSrcNoteId = null;
	});

	document.addEventListener('dragover', function (e) {
		var cell = e.target.closest('.grid-cell');
		if (!cell) return;
		if (dragSrcEl && cell.contains(dragSrcEl)) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		document.querySelectorAll('.drag-over').forEach(function (el) {
			el.classList.remove('drag-over');
		});
		cell.classList.add('drag-over');
	});

	document.addEventListener('dragleave', function (e) {
		var cell = e.target.closest('.grid-cell');
		if (cell) cell.classList.remove('drag-over');
	});

	document.addEventListener('drop', function (e) {
		e.preventDefault();
		var targetCell = e.target.closest('.grid-cell');
		if (!targetCell || !dragSrcNoteId) return;
		if (dragSrcEl && targetCell.contains(dragSrcEl)) return;

		targetCell.classList.remove('drag-over');

		var newPosition = parseInt(targetCell.getAttribute('data-position'), 10);
		var targetCard = targetCell.querySelector('.note-card');
		var swapNoteId = targetCard ? targetCard.getAttribute('data-note-id') : null;

		webviewApi.postMessage({
			type: 'moveNote',
			noteId: dragSrcNoteId,
			newPosition: newPosition,
			swapNoteId: swapNoteId
		});
	});
})();

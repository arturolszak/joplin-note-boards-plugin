import joplin from 'api';
import { SettingItemType, MenuItemLocation, ToolbarButtonLocation } from 'api/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BoardNote {
	noteId: string;
	position: number;
}

interface Board {
	id: string;
	name: string;
	icon: string;       // emoji character
	color: string;      // hex color for the board header
	notes: BoardNote[];
}

interface BoardsData {
	boards: Board[];
	activeBoardId: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function loadBoards(): Promise<BoardsData> {
	try {
		const raw = await joplin.settings.value('boards.data');
		if (!raw) return { boards: [], activeBoardId: null };
		const data: BoardsData = JSON.parse(raw);
		// Migration: assign positions to notes that don't have them
		for (const board of data.boards) {
			for (let i = 0; i < board.notes.length; i++) {
				if ((board.notes[i] as any).position === undefined || (board.notes[i] as any).position === null) {
					board.notes[i].position = i;
				}
			}
		}
		return data;
	} catch {
		return { boards: [], activeBoardId: null };
	}
}

async function saveBoards(data: BoardsData): Promise<void> {
	await joplin.settings.setValue('boards.data', JSON.stringify(data));
}

// ─── Platform detection ─────────────────────────────────────────────────────

async function isDesktop(): Promise<boolean> {
	try {
		const info = await joplin.versionInfo();
		return info.platform === 'desktop';
	} catch {
		return true; // fallback: assume desktop
	}
}

// ─── Panel HTML builder ─────────────────────────────────────────────────────

async function buildBoardHtml(data: BoardsData): Promise<string> {
	const board = data.boards.find(b => b.id === data.activeBoardId);
	const showSnippet = await joplin.settings.value('boards.showSnippet');
	const snippetLength = (await joplin.settings.value('boards.cardSnippetLength')) || 120;
	const cardSize = (await joplin.settings.value('boards.cardSize')) || 80;
	const gridColumns = (await joplin.settings.value('boards.gridColumns')) || 4;

	// Board tabs
	const tabs = data.boards.map(b => {
		const active = b.id === data.activeBoardId ? 'active' : '';
		const icon = escapeHtml(b.icon || '📋');
		const name = escapeHtml(b.name);
		return `<button class="board-tab ${active}" data-board-id="${escapeAttr(b.id)}" title="${name}">${icon} ${name}</button>`;
	}).join('');

	let gridHtml = '';
	if (board) {
		// Build position → card HTML map
		const posMap = new Map<number, string>();
		for (const bn of board.notes) {
			try {
				const note = await joplin.data.get(['notes', bn.noteId], { fields: ['id', 'title', 'body', 'is_todo', 'todo_completed'] });
				const title = escapeHtml(note.title || 'Untitled');
				const todoClass = note.is_todo ? (note.todo_completed ? 'todo-done' : 'todo-pending') : '';
				const todoIcon = note.is_todo ? (note.todo_completed ? '✅' : '⬜') : '';

				let snippetHtml = '';
				if (showSnippet && cardSize >= 120) {
					const snippet = escapeHtml(getSnippet(note.body || '', snippetLength));
					snippetHtml = `<div class="card-snippet">${snippet}</div>`;
				}

				posMap.set(bn.position,
					`<div class="grid-cell occupied" data-position="${bn.position}">` +
					`<div class="note-card ${todoClass}" draggable="true" data-note-id="${escapeAttr(note.id)}">` +
					`<div class="card-header">` +
					`<span class="card-todo-icon">${todoIcon}</span>` +
					`<span class="card-title">${title}</span>` +
					`<button class="card-remove" data-note-id="${escapeAttr(note.id)}" title="Remove from board">✕</button>` +
					`</div>` +
					snippetHtml +
					`</div></div>`
				);
			} catch {
				posMap.set(bn.position,
					`<div class="grid-cell occupied" data-position="${bn.position}">` +
					`<div class="note-card missing" data-note-id="${escapeAttr(bn.noteId)}">` +
					`<div class="card-header">` +
					`<span class="card-title">⚠ Not found</span>` +
					`<button class="card-remove" data-note-id="${escapeAttr(bn.noteId)}" title="Remove">✕</button>` +
					`</div></div></div>`
				);
			}
		}

		const maxPos = board.notes.length > 0 ? Math.max(...board.notes.map(n => n.position)) : -1;
		const minCells = maxPos + 1;
		const totalRows = Math.max(Math.ceil(minCells / gridColumns), 1) + 1;
		const totalCells = totalRows * gridColumns;

		const cells: string[] = [];
		for (let i = 0; i < totalCells; i++) {
			if (posMap.has(i)) {
				cells.push(posMap.get(i)!);
			} else {
				cells.push(`<div class="grid-cell empty" data-position="${i}"></div>`);
			}
		}
		gridHtml = cells.join('');
	}

	const boardActions = board
		? `<div class="board-actions">` +
		  `<button id="btn-add-note" title="Search and add a note to this board">+ Add Note</button>` +
		  `<button id="btn-edit-board" title="Edit board settings"` +
		  ` data-board-id="${escapeAttr(board.id)}"` +
		  ` data-name="${escapeAttr(board.name)}"` +
		  ` data-icon="${escapeAttr(board.icon)}"` +
		  ` data-color="${escapeAttr(board.color)}">⚙ Settings</button>` +
		  `<button id="btn-delete-board" title="Delete this board">🗑 Delete</button>` +
		  `</div>`
		: '';

	const emptyState = board && board.notes.length === 0
		? `<div class="empty-state">No notes on this board yet.<br>Click <strong>+ Add Note</strong> to search and add notes.</div>`
		: '';

	const noBoardState = data.boards.length === 0
		? `<div class="empty-state">No boards created yet.<br>Click <strong>+ New Board</strong> to create one.</div>`
		: (!board ? `<div class="empty-state">Select a board tab above.</div>` : '');

	const boardColor = board ? board.color || '#4a9fd5' : '#4a9fd5';
	const sizeVars = `--card-size: ${cardSize}px; --grid-columns: ${gridColumns};`;

	return `
		<div class="boards-container" style="${sizeVars}">
			<div id="board-view">
				<div class="board-tabs-bar" style="border-bottom-color: ${escapeAttr(boardColor)}">
					<div class="board-tabs">${tabs}</div>
					<button id="btn-new-board" class="board-tab new-board" title="Create a new board">+</button>
				</div>
				${boardActions}
				<div class="board-grid" id="board-grid">
					${gridHtml}
					${emptyState}
					${noBoardState}
				</div>
			</div>
			<div id="board-form" class="panel-form" style="display:none;">
				<h3 id="board-form-title">New Board</h3>
				<input type="hidden" id="form-board-id" value="" />
				<div class="form-group">
					<label>Board Name</label>
					<input type="text" id="form-board-name" placeholder="My Board" />
				</div>
				<div class="form-group">
					<label>Icon (emoji)</label>
					<input type="text" id="form-board-icon" placeholder="📋" maxlength="4" />
				</div>
				<div class="form-group">
					<label>Header Color</label>
					<input type="color" id="form-board-color" value="#4a9fd5" />
				</div>
				<div class="form-actions">
					<button id="form-board-submit" class="btn-primary">Create</button>
					<button id="form-board-cancel" class="btn-secondary">Cancel</button>
				</div>
			</div>
			<div id="note-search" class="panel-form" style="display:none;">
				<h3>Add Note to Board</h3>
				<div class="search-bar">
					<input type="text" id="search-query" placeholder="Search (empty = recent notes)..." />
					<button id="search-submit" class="btn-primary">Search</button>
				</div>
				<div id="search-results"></div>
				<div class="form-actions">
					<button id="search-cancel" class="btn-secondary">Back</button>
				</div>
			</div>
			<div id="toast" class="toast" style="display:none;"></div>
		</div>
	`;
}

function getSnippet(body: string, maxLen: number): string {
	const clean = body
		.replace(/^#+\s+/gm, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[*_~`]/g, '')
		.replace(/\n+/g, ' ')
		.trim();
	if (clean.length <= maxLen) return clean;
	return clean.substring(0, maxLen) + '…';
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function escapeAttr(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

// ─── Plugin entry point ─────────────────────────────────────────────────────

joplin.plugins.register({
	onStart: async function () {
		// ── Register settings ─────────────────────────────────────────────
		await joplin.settings.registerSection('noteBoards', {
			label: 'Note Boards Plugin',
			iconName: 'fas fa-border-all',
			description: 'Configure Note Boards plugin settings.',
		});

		await joplin.settings.registerSettings({
			'boards.data': {
				value: '',
				type: SettingItemType.String,
				label: 'Board data (JSON)',
				description: 'Internal storage for board configurations. Do not edit manually.',
				public: false,
				section: 'noteBoards',
			},
			'boards.showSnippet': {
				value: true,
				type: SettingItemType.Bool,
				label: 'Show note text on cards',
				description: 'Display a text preview snippet below the note title (only when card size >= 120px).',
				public: true,
				section: 'noteBoards',
			},
			'boards.cardSnippetLength': {
				value: 120,
				type: SettingItemType.Int,
				label: 'Card snippet length',
				description: 'Maximum number of characters shown in each card preview.',
				public: true,
				section: 'noteBoards',
				minimum: 0,
				maximum: 500,
				step: 10,
			},
			'boards.cardSize': {
				value: 80,
				type: SettingItemType.Int,
				label: 'Card size (px)',
				description: 'Width and height of each square card in the grid.',
				public: true,
				section: 'noteBoards',
				minimum: 40,
				maximum: 200,
				step: 5,
			},
			'boards.gridColumns': {
				value: 4,
				type: SettingItemType.Int,
				label: 'Grid columns',
				description: 'Number of columns in the card grid.',
				public: true,
				section: 'noteBoards',
				minimum: 2,
				maximum: 10,
				step: 1,
			},
		});

		// ── Detect platform ────────────────────────────────────────────────
		const desktop = await isDesktop();

		// ── Create panel ──────────────────────────────────────────────────
		const panel = await joplin.views.panels.create('boardPanel');
		await joplin.views.panels.addScript(panel, 'webview/board.css');
		await joplin.views.panels.addScript(panel, 'webview/board.js');
		// On desktop, start hidden — user toggles via command/menu
		if (desktop) {
			await joplin.views.panels.show(panel, false);
		}

		async function refreshPanel() {
			try {
				const data = await loadBoards();
				const html = await buildBoardHtml(data);
				await joplin.views.panels.setHtml(panel, html);
			} catch (e) {
				console.error('Note Boards: refreshPanel error', e);
			}
		}

		// ── Handle webview messages ───────────────────────────────────────
		await joplin.views.panels.onMessage(panel, async (msg: any) => {
			if (!msg || !msg.type) return;

			try {
				const data = await loadBoards();

				switch (msg.type) {
					case 'switchBoard': {
						data.activeBoardId = msg.boardId;
						await saveBoards(data);
						await refreshPanel();
						break;
					}
					case 'submitBoard': {
						if (msg.boardId) {
							const board = data.boards.find(b => b.id === msg.boardId);
							if (board) {
								board.name = msg.name || board.name;
								board.icon = msg.icon || board.icon;
								board.color = msg.color || board.color;
							}
						} else {
							const newBoard: Board = {
								id: generateId(),
								name: msg.name || 'New Board',
								icon: msg.icon || '📋',
								color: msg.color || '#4a9fd5',
								notes: [],
							};
							data.boards.push(newBoard);
							data.activeBoardId = newBoard.id;
						}
						await saveBoards(data);
						await refreshPanel();
						break;
					}
					case 'deleteBoard': {
						data.boards = data.boards.filter(b => b.id !== data.activeBoardId);
						data.activeBoardId = data.boards.length > 0 ? data.boards[0].id : null;
						await saveBoards(data);
						await refreshPanel();
						break;
					}
					case 'searchNotes': {
						const board = data.boards.find(b => b.id === data.activeBoardId);
						const existingIds = board ? board.notes.map(n => n.noteId) : [];
						let notes: any[] = [];
						try {
							if (msg.query) {
								const res = await joplin.data.get(['search'], { query: msg.query, fields: ['id', 'title'], limit: 20 });
								notes = res.items || [];
							} else {
								const res = await joplin.data.get(['notes'], { fields: ['id', 'title'], order_by: 'updated_time', order_dir: 'DESC', limit: 20 });
								notes = res.items || [];
							}
						} catch (e) {
							console.error('Note Boards: search error', e);
						}
						notes = notes.filter((n: any) => !existingIds.includes(n.id));
						return notes.map((n: any) => ({ id: n.id, title: n.title || 'Untitled' }));
					}
					case 'addNote': {
						const board = data.boards.find(b => b.id === data.activeBoardId);
						if (!board || !msg.noteId) break;
						const usedPositions = new Set(board.notes.map(n => n.position));
						let newPos = 0;
						while (usedPositions.has(newPos)) newPos++;
						board.notes.push({ noteId: msg.noteId, position: newPos });
						await saveBoards(data);
						await refreshPanel();
						break;
					}
					case 'removeNote': {
						const board = data.boards.find(b => b.id === data.activeBoardId);
						if (!board) break;
						board.notes = board.notes.filter(n => n.noteId !== msg.noteId);
						await saveBoards(data);
						await refreshPanel();
						break;
					}
					case 'openNote': {
						try {
							await joplin.commands.execute('openNote', msg.noteId);
							// On mobile, dismiss the plugin panel popup entirely
							if (!await isDesktop()) {
								try {
									await joplin.commands.execute('dismissPluginPanels');
								} catch {
									// Command may not exist on older Joplin versions
								}
							}
						} catch {
							console.error('Note Boards: openNote error');
						}
						break;
					}
					case 'moveNote': {
						const board = data.boards.find(b => b.id === data.activeBoardId);
						if (!board) break;
						const note = board.notes.find(n => n.noteId === msg.noteId);
						if (!note) break;
						if (msg.swapNoteId) {
							const swapNote = board.notes.find(n => n.noteId === msg.swapNoteId);
							if (swapNote) {
								const oldPos = note.position;
								note.position = swapNote.position;
								swapNote.position = oldPos;
							}
						} else {
							note.position = msg.newPosition;
						}
						await saveBoards(data);
						await refreshPanel();
						break;
					}
				}
			} catch (e) {
				console.error('Note Boards: message handler error', e);
			}
		});

		// ── Register commands ─────────────────────────────────────────────
		await joplin.commands.register({
			name: 'noteBoards.toggle',
			label: 'Toggle Note Boards Panel',
			iconName: 'fas fa-border-all',
			execute: async () => {
				try {
					const visible = await joplin.views.panels.visible(panel);
					if (visible) {
						await joplin.views.panels.hide(panel);
					} else {
						await refreshPanel();
						await joplin.views.panels.show(panel);
					}
				} catch (e) {
					console.error('Note Boards: toggle error', e);
				}
			},
		});

		await joplin.commands.register({
			name: 'noteBoards.newBoard',
			label: 'Note Boards: Create New Board',
			iconName: 'fas fa-plus',
			execute: async () => {
				try {
					await refreshPanel();
					await joplin.views.panels.show(panel);
				} catch (e) {
					console.error('Note Boards: newBoard error', e);
				}
			},
		});

		await joplin.commands.register({
			name: 'noteBoards.addNote',
			label: 'Note Boards: Add Note to Board',
			iconName: 'fas fa-plus-circle',
			execute: async () => {
				try {
					await refreshPanel();
					await joplin.views.panels.show(panel);
				} catch (e) {
					console.error('Note Boards: addNote error', e);
				}
			},
		});

		// ── Toolbar button (both desktop & mobile) ─────────────────────────
		try {
			await joplin.views.toolbarButtons.create(
				'noteBoardsToggle',
				'noteBoards.toggle',
				ToolbarButtonLocation.NoteToolbar,
			);
		} catch (e) {
			console.error('Note Boards: toolbarButtons.create error', e);
		}

		// ── Desktop-only: Tools menu ──────────────────────────────────────
		if (desktop) {
			try {
				await joplin.views.menus.create('noteBoardsMenu', 'Note Boards', [
					{ commandName: 'noteBoards.toggle' },
					{ commandName: 'noteBoards.newBoard' },
					{ commandName: 'noteBoards.addNote' },
				], MenuItemLocation.Tools);
			} catch (e) {
				console.error('Note Boards: menus.create error', e);
			}
		}

		// ── Initial refresh ──────────────────────────────────────────────
		await refreshPanel();

		// On mobile, auto-show the panel
		if (!desktop) {
			try {
				await joplin.views.panels.show(panel);
			} catch (e) {
				console.error('Note Boards: show panel on mobile error', e);
			}
		}
	},
});

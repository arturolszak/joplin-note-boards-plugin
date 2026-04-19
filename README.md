# Note Boards — Joplin Plugin

Create visual boards with card-like shortcuts to your notes. Organise, reorder, and quickly access notes from customisable grid boards — on desktop **and** mobile.

## Features

- **Multiple boards** — create as many boards as you need (e.g. "Work", "Reading List", "Travel")
- **Grid layout** — notes are displayed as square cards on a configurable grid
- **Drag-and-drop** — reorder cards by dragging them to empty cells or swapping with other cards
- **Inline forms** — all board/note editing happens inside the panel (no popups)
- **Search & add** — find notes by title and add them to a board with one tap
- **Mobile-first** — fully functional on Joplin Android / iOS; auto-closes the panel when opening a note
- **Customisable** — per-board emoji icon and header colour; global card size, column count, and snippet settings
- **Syncs across devices** — board data is stored in Joplin settings

## Installation

1. Download the `.jpl` file from the [Releases](https://github.com/arturolszak/joplin-note-boards-plugin/releases) page (or build from source — see below)
2. In Joplin, go to **Settings → Plugins**
3. Click the gear icon (⚙) and select **Install from file**
4. Choose the `.jpl` file
5. Restart Joplin

### Requirements

| Platform | Minimum version |
|----------|-----------------|
| Desktop  | Joplin 2.10+    |
| Mobile   | Joplin 3.0.3+   |

## Getting Started

### Desktop

- **Tools → Note Boards** menu with toggle, new-board, and add-note commands
- **Toolbar button** (grid icon) on the note toolbar
- The panel appears on the right side of the editor

### Mobile (Android / iOS)

1. Open any note
2. Tap the **grid icon** in the note toolbar
3. The board UI opens in a plugin panel overlay
4. Tapping a card opens the note and automatically dismisses the panel

## Usage

### Creating a Board

1. Tap the **+ New Board** button
2. Enter a name, pick an emoji icon, and choose a header colour
3. Tap **Create**

### Adding Notes

1. Switch to the target board tab
2. Tap **🔍 Add Note**
3. Search by title (or leave empty to browse recent notes)
4. Tap a result to add it — notes already on the board are filtered out

### Opening a Note

Tap/click any card. On mobile the panel closes automatically; on desktop the note opens in the editor.

### Removing a Note

Click the **✕** button on a card (visible on hover on desktop, always visible on mobile). This only removes the shortcut — the note itself is **not** deleted.

### Reordering

Drag a card and drop it onto another card to **swap** positions, or onto an empty cell to **move** it.

### Editing / Deleting a Board

- **⚙ Settings** — rename, change icon or colour
- **🗑 Delete** — removes the board and its shortcuts (notes are kept)

## Settings

Go to **Settings → Note Boards Plugin** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Show note text on cards | Display a text snippet below the title (only when card size ≥ 120 px) | On |
| Card snippet length | Max characters in the snippet | 120 |
| Card size | Width & height of each card (40–200 px) | 80 px |
| Grid columns | Number of columns in the grid (2–10) | 4 |

## Platform Support

| Feature | Desktop | Mobile |
|---------|---------|--------|
| View boards & cards | ✅ | ✅ |
| Create / edit / delete boards | ✅ | ✅ |
| Add / remove notes | ✅ | ✅ |
| Open note from card | ✅ | ✅ |
| Drag-and-drop reorder | ✅ | ✅ |
| Auto-close panel on note open | — | ✅ |
| Tools menu | ✅ | ❌ |
| Toolbar button | ✅ | ✅ |

## Building from Source

```bash
npm install
npm run dist
```

The plugin archive is created at `publish/com.crestreach.note-boards.jpl`.

## License

[BSD 2-Clause](LICENSE)

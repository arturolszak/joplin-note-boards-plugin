# Note Boards — Joplin Plugin

Create visual boards with card-like shortcuts to your notes. Organize, reorder, and quickly access notes from customizable boards.

## Installation

1. Download the `.jpl` file from `publish/com.github.joplin.plugin.note-boards.jpl`
2. In Joplin, go to **Settings → Plugins**
3. Click the gear icon (⚙) and select **Install from file**
4. Choose the `.jpl` file
5. Restart Joplin

## Getting Started

### Desktop

After installation, the plugin adds:

- **Tools → Note Boards** menu with three commands
- A **toolbar button** (grid icon) in the note toolbar

To open the boards panel, do one of:

- Click **Tools → Note Boards → Toggle Note Boards Panel**
- Click the grid icon (⊞) in the note toolbar

The panel appears on the right side of the app.

### Mobile (Android / iOS)

On mobile, plugin panels appear in a **tabbed dialog**. After installation:

1. Open any note
2. Tap the **grid icon** (⊞) in the note toolbar to open the Note Boards panel
3. The board UI appears in a dialog overlay

## Usage

### Creating a Board

1. Click the **+** button in the tab bar (or use **Tools → Note Boards → Create New Board** on desktop)
2. Fill in the dialog:
   - **Board Name** — give your board a name (e.g., "Work", "Reading List")
   - **Icon** — pick an emoji (default: 📋)
   - **Header Color** — choose a color for the board tab accent
3. Click **Create**

### Adding Notes to a Board

1. In the boards panel, make sure the target board tab is active
2. Click **+ Add Note**
3. Type a search term in the dialog and click **Search** (leave empty to see recent notes)
4. Pick a note from the results and click **Add to Board**

Notes already on the board are automatically filtered out.

On desktop, you can also use **Tools → Note Boards → Add Note to Board**.

### Opening a Note from a Board

Click/tap any card to open that note in the editor.

### Removing a Note from a Board

Hover over a card (desktop) and click the **✕** button in the top-right corner of the card. On mobile, the ✕ button is always visible.

This only removes the shortcut from the board — the actual note is not deleted.

### Reordering Notes (Desktop)

Drag and drop cards to reorder them within a board. Grab a card and drop it onto another card to swap positions.

> **Note:** Drag-and-drop is not supported on mobile touch devices.

### Switching Between Boards

Click/tap the board tabs at the top of the panel.

### Editing a Board

1. Select the board tab you want to edit
2. Click **⚙ Settings**
3. Update the name, icon, or color
4. Click **Save**

### Deleting a Board

1. Select the board tab
2. Click **🗑 Delete**
3. Confirm the deletion

Notes are **not** deleted — only the board and its card shortcuts are removed.

## Settings

Go to **Settings → Note Boards** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| Show note text on cards | Display a text preview snippet below the note title | On |
| Compact square cards | Smaller square cards with only the title — fits more on screen | Off |
| Card snippet length | Maximum characters in the text preview (when snippets are on) | 120 |

## Tips

- You can add the same note to multiple boards
- Todo notes show a checkbox icon (⬜ pending, ✅ completed)
- Completed todos appear with a strikethrough title
- If a note is deleted from Joplin, its card shows "⚠ Note not found" — remove it with ✕
- Board data is stored in Joplin settings and syncs across devices

## Platform Support

| Feature | Desktop | Mobile |
|---------|---------|--------|
| View boards & cards | ✅ | ✅ |
| Create / edit / delete boards | ✅ | ✅ |
| Add / remove notes | ✅ | ✅ |
| Open note from card | ✅ | ✅ |
| Drag-and-drop reorder | ✅ | ❌ |
| Tools menu | ✅ | ❌ |
| Toolbar button | ✅ | ✅ |

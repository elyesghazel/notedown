# Notedown

A powerful, high-performance Markdown note-taking platform designed for speed, organization, and a premium editing experience.

![Notedown Interface](https://via.placeholder.com/800x400?text=Notedown+Markdown+Editor)

## ✨ Core Features

### 🚀 Advanced Editing & Preview
- **Interactive Image Resizing**: Hover over an image in the preview pane and drag the blue handle to resize. Your Markdown code updates automatically.
- **Dual-Pane Interface**: Edit in real-time with GFM (GitHub Flavored Markdown) support.
- **Image Paste & Drag-and-Drop**: Paste images directly into the editor for instant upload and embedding.
- **Formatting Toolbar**: Bold, italic, lists, quotes, links, task lists, and table insert at a click.
- **Auto-Pair Markdown**: Auto-closes pairs like ** and __ while typing for faster formatting.
- **Camera/Image Insert**: Snap a photo or pick an image and insert it as Markdown.
- **Find in File (Ctrl+F)**: Search for text within the current document with a sleek, distraction-free widget.

### 📄 PDF Workflow
- **PDF Upload & Embed**: Upload PDFs and embed them inline in notes.
- **PDF Preview Controls**: Resize the viewer and toggle a quick preview panel.
- **Smart Download**: Downloads preserve the correct `.pdf` extension.
- **PDF Export**: High-quality PDF generation powered by Puppeteer with long code blocks wrapped correctly.

### 🔍 Search & Quick Actions
- **Global Full-Text Search (Ctrl+K)**: Search file names and contents across all workspaces with context snippets.
- **Power Command Palette (Ctrl+Shift+P)**: Access actions like "Quick Note", "Home", and "Sign Out" instantly.
- **Quick Capture**: A dedicated button to jot down timestamped notes instantly in your private Inbox.
- **PDF Search**: PDFs are indexed alongside notes for quick discovery.

### 📁 Structure & Organization
- **Multi-Level Hierarchy**: Workspaces > Spaces > Folders > Documents.
- **Intuitive Sidebar**: Drag-and-drop hierarchy with right-click context menus for all file operations (Rename, Delete, New Folder, New Doc).
- **Persistent Folder State**: Keeps your expanded folders open as you work.
- **Public Publishing**: Publish notes to a unique, shareable URL with one click.
- **Published Manager**: See and manage all live and snapshot links in one place.

### ☁️ Optional WebDAV Storage
- **WebDAV Sync for PDFs**: Route PDF uploads to WebDAV instead of local storage.
- **Secure Proxy**: Server-side WebDAV file access with auth shielding.
- **Flexible Storage**: Toggle local vs WebDAV per user in Settings.

## 🛠 Tech Stack
- **Frontend**: Next.js 16+, React, Tailwind CSS, Lucide Icons.
- **Editor**: ReactMarkdown, Remark-GFM, Rehype-Highlight (Highlight.js).
- **Backend**: Next.js API Routes, BcryptJS for secure hashing, JWT via Jose.
- **Data**: Local file-based JSON storage (zero external DB dependency required for small-medium teams).
- **Containerization**: Docker & Docker Compose.

## 🐳 Getting Started (Docker)

The easiest way to deploy Notedown is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/elyesghazel/notedown.git
   cd notedown
   ```

2. **Start the application**:
   ```bash
   docker compose up -d --build
   ```

3. **Access the app**:
   Open `http://localhost:3000` in your browser.

### Data Persistence
Notedown persists all your data and uploaded files in two local directories:
- `data_storage/`: Stores your JSON "databases" (users, workspaces, notes).
- `uploads_storage/`: Stores all pasted and uploaded files (images and PDFs).

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` / `Cmd+K` | Open Global Search |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Open Command Palette |
| `Ctrl+F` / `Cmd+F` | Find in Current Document |
| `Ctrl+B` / `Cmd+B` | Bold |
| `Ctrl+I` / `Cmd+I` | Italic |
| `Esc` | Close Dialogs / Find Widget |
| `Enter` (in Find) | Next Match |
| `Shift+Enter` (in Find) | Previous Match |

## 📐 Image Resizing Syntax

While you can use the interactive drag handles, you can also resize images manually using the alt-text pipe syntax:

```markdown
![My Image | 300](/uploads/example.png)      <!-- Lock width at 300px -->
![My Image =400x300](/uploads/example.png)   <!-- Set width and height -->
```

## ⚙️ WebDAV Setup (Optional)

Configure WebDAV in the Settings page to store PDFs remotely:

1. Enable WebDAV.
2. Provide URL, username, password, and base path.
3. Toggle "Prefer WebDAV for PDFs" to route new PDF uploads remotely.

If WebDAV is disabled, PDFs are stored locally under `uploads_storage/`.

## 📄 License
This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). 

- **Permitted**: Personal use, self-hosting, research, and non-profit use.
- **Prohibited**: Selling the software, charging for access, or any use primarily directed toward commercial advantage or monetary compensation.


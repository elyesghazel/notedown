# Notedown

A powerful, high-performance Markdown Note-Taking Platform designed for speed, organization, and a premium editing experience.

![Notedown Interface](https://via.placeholder.com/800x400?text=Notedown+Markdown+Editor)

## ✨ Core Features

### 🚀 Advanced Editing & Preview
- **Interactive Image Resizing**: Hover over an image in the preview pane and drag the blue handle to resize. Your Markdown code updates automatically!
- **Dual-Pane Interface**: Edit in real-time with GFM (GitHub Flavored Markdown) support.
- **Image Paste & Drag-and-Drop**: Paste images directly into the editor for instant upload and embedding.
- **Formatting Toolbar**: Bold, italic, lists, quotes, links, and task lists at a click.
- **Auto-Pair Markdown**: Auto-closes pairs like ** and __ while typing for faster formatting.
- **Camera/Image Insert**: Snap a photo or pick an image and insert it as Markdown.
- **Find in File (Ctrl+F)**: Search for text within the current document with a sleek, distraction-free widget.

### 🔍 Search & Quick Actions
- **Global Full-Text Search (Ctrl+K)**: Search through file names AND file contents across all your workspaces, complete with context snippets.
- **Power Command Palette (Ctrl+Shift+P)**: Access system actions like "Quick Note", "Home", and "Sign Out" instantly.
- **Quick Capture**: A dedicated button to jot down timestamped notes instantly in your private Inbox.

### 📁 Structure & Organization
- **Multi-Level Hierarchy**: Workspaces > Spaces > Folders > Documents.
- **Intuitive Sidebar**: Drag-and-drop hierarchy with right-click context menus for all file operations (Rename, Delete, New Folder, New Doc).
- **Public Publishing**: Publish your notes to a unique, shareable URL with one click.
- **PDF Export**: High-quality PDF generation powered by Puppeteer.

## 🛠 Tech Stack
- **Frontend**: Next.js 15+, React, Tailwind CSS, Lucide Icons.
- **Editor**: ReactMarkdown, Remark-GFM, Rehype-Highlight (Highlight.js).
- **Backend**: Next.js API Routes, BcryptJS for secure hashing, JWT via Jose.
- **Data**: Local file-based JSON storage (Zero external DB dependency required for small-medium teams).
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
Notedown is configured to persist all your data and uploaded images in two local directories:
- `data_storage/`: Stores your JSON "databases" (users, workspaces, notes).
- `uploads_storage/`: Stores all pasted and uploaded images.

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

## 📄 License
This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). 

- **Permitted**: Personal use, self-hosting, research, and non-profit use.
- **Prohibited**: Selling the software, charging for access, or any use primarily directed toward commercial advantage or monetary compensation.


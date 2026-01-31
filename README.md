# Tesla Sentry Mode Viewer

A web-based viewer for Tesla Sentry Mode and Dashcam recordings. Simple, fast, and runs entirely in your browser - no uploads, no servers, just you and your footage.

**[Open Web Viewer](https://mrkl21full.github.io/SentryModeViewer/)**

![Tesla Sentry Mode Viewer](src/image/TeslaSentryMode.png?raw=true "Main viewer interface")

## What's This?

Think of it as a portable version of Tesla's built-in Sentry Mode viewer. Grab your recordings from your USB drive, drop them in, and watch all camera angles simultaneously. It's built with vanilla JavaScript and works completely offline - your videos never leave your computer.

## Features

- **Multi-camera grid view** - See all 4 cameras (front, rear, left, right) at once in a 2x2 grid
- **B-Pillar camera support** - Automatically detects and displays left and right pillar cameras on HW4-equipped vehicles
- **Single camera view** - Click any thumbnail to focus on one camera fullscreen
- **Synchronized playback** - All cameras play in perfect sync
- **Timeline with event markers** - Jump straight to the interesting parts
- **15 second skip** - Quick navigation through your footage
- **Real-time timestamp** - Shows exact date and time as you scrub through
- **Dynamic favicon** - Shows playback state (playing/paused/loading) in your tab

## How to Use

1. **Get your recordings** - Copy the folder from your Tesla's USB drive (works with both `TeslaCam/SentryClips/[timestamp]` and `TeslaCam/SavedClips/[timestamp]`)
2. **Click the hamburger menu** in the top-left corner
3. **Select your folder** - Pick the directory with your `.mp4` files
4. **That's it!** Hit play and watch

The viewer automatically detects:
- All 4 main cameras (front, back, left repeater, right repeater)
- B-Pillar cameras on HW4-equipped Teslas (left pillar, right pillar)
- Event markers from `event.json` (if present)

## Installation

Want to run it locally? Here's how:

**Quick start:**
```bash
git clone https://github.com/Mrkl21full/SentryModeViewer.git
cd SentryModeViewer
```

Then just open `index.html` in your browser. Done.

**Or download:**
- Click the green "Code" button → "Download ZIP"
- Extract and open `index.html`

**For developers:**
```bash
cd src
npm install
npm run watch  # Auto-compile SCSS
```

## Privacy & Security

Your videos stay on your computer. Period.

The viewer uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read files directly from your disk. Nothing gets uploaded, nothing gets sent anywhere. It's all processed in your browser using Blob URLs.

## Browser Support

Works best in:
- Chrome/Edge (full support)
- Firefox (full support)
- Safari (limited - no File System Access API, uses file picker fallback)

## Known Quirks

- **Video freeze?** Occasionally a video might freeze while others keep playing. Click between camera views 2-3 times and it'll sort itself out.
- **Timeline accuracy** - Sometimes the progress bar might drift slightly from the actual playback position. It's close enough for navigation though.
- **File naming** - Tesla's file naming format is expected: `YYYY-MM-DD_HH-MM-SS-[camera].mp4`

## Tech Stack

- Vanilla JavaScript (no frameworks, just pure JS)
- SCSS for styling
- Font Awesome icons
- Inter font (Google Fonts)

## Screenshots

**Directory selection:**

![Directory picker](src/image/TeslaSentryMode_Directory.png?raw=true "Selecting recording folder")

**Grid view with all cameras:**

All 4 (or 6) cameras playing simultaneously with synchronized timeline.

## Contributing

Found a bug? Have an idea? PRs are welcome! This started as a weekend project and it's been growing ever since.

## License

GPL-3.0 - See [LICENSE](LICENSE) file for details.

---

**Tip:** If you're viewing a lot of footage, use the "Jump to Event" button when available - it'll take you straight to when something actually happened.

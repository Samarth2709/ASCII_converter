# ASCII Art Studio

A modern web app that converts live webcam video and images to ASCII art in real time. Built with vanilla JavaScript and Vite.

## Features

- Real-time Webcam → ASCII mode
- Image → ASCII mode with drag‑and‑drop or file picker
- Adjustable Detail control (0.5×–5.0×)
- Multiple character sets (dense, blocks, extended)
- Responsive layout with dynamic resolution display
- High‑performance canvas processing

## Project Structure

```
ASCII_Art_Converter/
├── src/
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   ├── main.js                 # App entry (tabs, render loop, wiring)
│   │   ├── modules/
│   │   │   ├── asciiConverter.js   # ImageData → ASCII
│   │   │   ├── resolutionCalculator.js
│   │   │   ├── uiController.js
│   │   │   └── videoManager.js
│   │   └── utils/
│   │       └── performance.js
│   ├── assets/
│   │   └── images/
│   └── config/
│       └── app.config.js           # Tunable defaults (charset, detail, video)
├── public/
│   └── favicon.svg
├── tests/
├── docs/
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser with webcam support

### Install and Run

```bash
git clone <repository-url>
cd ASCII_Art_Converter
npm install
npm run dev
```

The dev server opens at `http://localhost:3000`.

### Build & Preview

```bash
npm run build
npm run preview
```

## Usage

The app has two tabs:

### Webcam → ASCII
- Grant camera permission when prompted.
- Use the Detail slider to increase or decrease resolution.
- Choose a Charset for different looks (dense, blocks, extended).
- The resolution readout shows the current ASCII grid size.

### Image → ASCII
- Click the drop area or drag an image file onto it.
- Adjust Detail and pick a Charset as above.
- The output auto-fits the available space.

## Controls

- Detail: scales the ASCII grid density. Higher values produce finer output at greater compute cost.
- Charset: maps brightness to character ramps (`@%#*+=-:.`, `█▓▒░ .`, or the extended ramp).

## Configuration

Defaults are defined in `src/config/app.config.js`:

- `ascii.defaultCharset`, `ascii.charsets` and `ascii.defaultDetail`
- `video.facingMode` and `video.constraints` (e.g., 1280×720)
- `ui.showResolution`, `ui.theme`
- Feature flags under `features` (e.g., upload/save toggles for future extensions)

Update these values to change the app’s initial behavior without touching code paths.

## Testing & Linting

```bash
npm test           # run Jest tests
npm run test:watch # watch mode
npm run lint       # ESLint
npm run lint:fix   # auto-fix
```

## Browser & Permissions

- Requires a secure origin for webcam access: use `localhost` during development or HTTPS in production.
- Works on current Chrome/Edge, Firefox, and Safari versions.

## Troubleshooting

- No webcam video: ensure the site is `localhost` or HTTPS and camera permission is granted; reload the page after allowing access.
- Blank/low‑contrast output: try the blocks charset (`█▓▒░ .`) or increase Detail.
- High CPU usage: lower Detail or reduce camera resolution via `app.config.js`.

## License

MIT License. See `LICENSE`.
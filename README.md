# ASCII Art Converter

A real-time webcam to ASCII art converter web application built with vanilla JavaScript.

## Features

- Real-time webcam capture and ASCII conversion
- Adjustable detail level and sensitivity
- Multiple character sets (dense, blocks, extended)
- Responsive design
- High-performance rendering

## Project Structure

```
ASCII_Art_Converter/
├── src/                    # Source code
│   ├── js/                 # JavaScript files
│   │   └── main.js        # Main application logic
│   ├── css/               # Stylesheets
│   │   └── main.css       # Main styles
│   ├── assets/            # Static assets
│   │   └── images/        # Image files
│   └── index.html         # Main HTML file
├── public/                # Public static files
├── dist/                  # Build output (generated)
├── config/                # Configuration files
├── docs/                  # Documentation
│   └── README.md          # Original project documentation
├── tests/                 # Test files
├── package.json           # Node.js dependencies and scripts
├── vite.config.js         # Vite configuration
├── .eslintrc.json         # ESLint configuration
└── .gitignore            # Git ignore rules
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with webcam support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ASCII_Art_Converter
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`.

### Building for Production

Build the application:
```bash
npm run build
```

The optimized files will be in the `dist/` directory.

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Linting

Check code style:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## Usage

1. Allow webcam access when prompted
2. Adjust the detail level slider to change ASCII resolution
3. Select different character sets for various artistic effects
4. The ASCII art updates in real-time based on your webcam feed

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - see LICENSE file for details
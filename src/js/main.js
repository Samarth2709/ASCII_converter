/**
 * Main Application Entry Point
 * ASCII Art Converter - Real-time webcam to ASCII conversion
 */

import { AsciiConverter } from './modules/asciiConverter.js';
import { VideoManager } from './modules/videoManager.js';
import { ResolutionCalculator } from './modules/resolutionCalculator.js';
import { UIController } from './modules/uiController.js';
import { config } from '../../config/app.config.js';

class AsciiArtApp {
  constructor() {
    // Get DOM elements
    this.elements = {
      videoElement: document.getElementById('video'),
      canvas: document.getElementById('offscreen'),
      asciiDisplay: document.getElementById('asciiDisplay'),
      charsetSelect: document.getElementById('charsetSelect'),
      detailRange: document.getElementById('detailRange'),
      detailValue: document.getElementById('detailValue'),
      sensitivityRange: document.getElementById('sensitivityRange'),
      sensitivityValue: document.getElementById('sensitivityValue'),
      resolutionDisplay: document.getElementById('resolutionDisplay'),
    };

    // Initialize modules
    this.asciiConverter = new AsciiConverter(config.ascii.defaultCharset);
    this.videoManager = new VideoManager(this.elements.videoElement);
    this.resolutionCalculator = new ResolutionCalculator();
    this.uiController = new UIController(this.elements);

    // Canvas context
    this.ctx = this.elements.canvas.getContext('2d', { willReadFrequently: true });

    // State
    this.detailFactor = config.ascii.defaultDetail;
    this.animationId = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize UI
      this.initUI();

      // Start video capture
      await this.videoManager.start(config.video.constraints);

      // Start rendering loop
      this.startRenderLoop();
    } catch (error) {
      this.uiController.showError(`Error initializing app: ${error.message}`);
      console.error('Initialization error:', error);
    }
  }

  /**
   * Initialize UI event handlers
   */
  initUI() {
    this.uiController.init({
      onCharsetChange: (e) => {
        this.asciiConverter.setCharset(e.target.value);
      },
      onDetailChange: (e) => {
        this.detailFactor = Number(e.target.value);
        this.uiController.updateDetailLabel();
      },
      onSensitivityChange: (e) => {
        this.asciiConverter.setSensitivity(Number(e.target.value));
        this.uiController.updateSensitivityLabel();
      },
    });
  }

  /**
   * Start the rendering loop
   */
  startRenderLoop() {
    const render = () => {
      if (!this.videoManager.isVideoRunning()) return;

      // Calculate optimal resolution
      const containerRect = this.elements.asciiDisplay.parentElement.getBoundingClientRect();
      const videoDimensions = this.videoManager.getDimensions();
      const videoAspectRatio = videoDimensions.width / videoDimensions.height;
      
      const { cols, rows, fontSize } = this.resolutionCalculator.calculate(
        containerRect,
        videoAspectRatio,
        this.detailFactor
      );

      // Update canvas size
      this.elements.canvas.width = cols;
      this.elements.canvas.height = rows;

      // Update ASCII display style
      this.uiController.updateAsciiStyle({
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize}px`,
      });

      // Draw scaled video frame to canvas
      this.ctx.drawImage(this.elements.videoElement, 0, 0, cols, rows);
      
      // Get image data and convert to ASCII
      const imageData = this.ctx.getImageData(0, 0, cols, rows);
      const ascii = this.asciiConverter.convertToAscii(imageData, cols, rows);

      // Update displays
      this.uiController.updateAsciiDisplay(ascii);
      this.uiController.updateResolution(cols, rows);

      // Continue loop
      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * Stop the application
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.videoManager.stop();
    this.uiController.destroy();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AsciiArtApp();
    app.init();
  });
} else {
  const app = new AsciiArtApp();
  app.init();
}
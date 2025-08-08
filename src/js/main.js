/**
 * Main Application Entry Point
 * ASCII Art Studio - Webcam and Image to ASCII conversion
 */

import { AsciiConverter } from './modules/asciiConverter.js';
import { VideoManager } from './modules/videoManager.js';
import { ResolutionCalculator } from './modules/resolutionCalculator.js';
import { UIController } from './modules/uiController.js';
import { config } from '../config/app.config.js';

class AsciiArtApp {
  constructor() {
    // Tabs (kept for potential future use)
    this.tabButtons = {
      webcam: document.getElementById('tabWebcamBtn'),
      image: document.getElementById('tabImageBtn'),
    };
    
    // Main UI elements
    this.mainContent = document.querySelector('.main-content');
    this.sidebar = document.querySelector('.sidebar');
    this.asciiStage = document.querySelector('.ascii-stage');

    // Shared hidden drawing elements
    this.videoElement = document.getElementById('video');
    this.canvas = document.getElementById('offscreen');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    // Ensure hidden elements are measurable and not display:none
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.left = '-99999px';
    this.videoElement.style.top = '0';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '-99999px';
    this.canvas.style.top = '0';

    // Global control elements
    this.globalEls = {
      charsetSelect: document.getElementById('charsetSelect'),
      detailRange: document.getElementById('detailRange'),
      detailValue: document.getElementById('detailValue'),
    };

    // Unified display elements
    this.displayEls = {
      asciiDisplay: document.getElementById('asciiDisplay'),
      resolutionDisplay: document.getElementById('resolutionDisplay'),
      modeIndicator: document.getElementById('modeIndicator'),
      dropZone: document.getElementById('dropZone'),
      imageInput: document.getElementById('imageInput'),
    };

    // Modules (separate converters to keep independent settings)
    this.webcamConverter = new AsciiConverter(config.ascii.defaultCharset);
    this.imageConverter = new AsciiConverter(config.ascii.defaultCharset);
    this.videoManager = new VideoManager(this.videoElement);
    this.resolutionCalculator = new ResolutionCalculator();

    // State
    this.detail = config.ascii.defaultDetail; // Single detail setting for both modes
    this.animationId = null;
    this.lastImage = null;
    this.fpsLast = performance.now();
    this.fps = 0;
    this.webcamActive = true; // Track if webcam should be running
    this.currentMode = 'webcam'; // Track current display mode

    // Global UI Controller
    this.globalUI = new UIController({
      charsetSelect: this.globalEls.charsetSelect,
      detailRange: this.globalEls.detailRange,
      detailValue: this.globalEls.detailValue,
    });

    // Unified display UI Controller
    this.displayUI = new UIController({
      asciiDisplay: this.displayEls.asciiDisplay,
      resolutionDisplay: this.displayEls.resolutionDisplay,
    });
  }

  async init() {
    try {
      this.initTabButtons(); // Simple button functionality
      this.initGlobalUI();
      this.initDisplayUI();
      this.initImageUpload();
      await this.startWebcam();
      this.startRenderLoop();
      this.installDebugOverlay();
      
      // Debug: test ASCII display with known content
      setTimeout(() => {
        const currentContent = this.displayEls.asciiDisplay.textContent;
        console.log('[Debug] ASCII display content length:', currentContent.length);
        console.log('[Debug] ASCII display element:', this.displayEls.asciiDisplay);
        console.log('[Debug] ASCII display parent:', this.displayEls.asciiDisplay.parentElement);
        
        // Force a bright test pattern
        this.displayEls.asciiDisplay.style.color = '#00ff00'; // Bright green
        this.displayEls.asciiDisplay.style.fontSize = '16px';
        this.displayEls.asciiDisplay.style.fontFamily = 'monospace';
        this.displayEls.asciiDisplay.textContent = 'TEST: If you see this GREEN text, display works!\n' + currentContent.substring(0, 200);
        
        setTimeout(() => {
          console.log('[Debug] Removing test styles');
          this.displayEls.asciiDisplay.style.color = '';
          this.displayEls.asciiDisplay.style.fontSize = '';
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error('Initialization error:', error);
      this.displayUI.showError(`Error: ${error.message}`);
    }
  }

  initTabButtons() {
    // Webcam button switches to webcam mode
    const switchToWebcam = async () => {
      if (this.currentMode === 'webcam') return;
      
      this.currentMode = 'webcam';
      this.updateModeIndicator();
      this.updateButtonStates();
      
      try {
        await this.startWebcam();
        this.startRenderLoop();
      } catch (_) {
        // Error is surfaced via UI in startWebcam
      }
    };

    // Image button switches to image mode and optionally opens file picker
    const switchToImage = () => {
      if (this.currentMode === 'image') {
        // If already in image mode, open file picker
        this.displayEls.imageInput.click();
        return;
      }
      
      this.currentMode = 'image';
      this.updateModeIndicator();
      this.updateButtonStates();
      
      // Stop webcam when switching to image mode
      this.stopRenderLoop();
      this.videoManager.stop();
      
      // If we have an image, display it, otherwise prompt for upload
      if (this.lastImage) {
        this.convertImageToAscii(this.lastImage);
      } else {
        this.displayEls.imageInput.click();
      }
    };

    this.tabButtons.webcam.addEventListener('click', switchToWebcam);
    this.tabButtons.image.addEventListener('click', switchToImage);

    // When display area resizes and an image is loaded, re-render to fit layout
    const resizeObserver = new ResizeObserver(() => {
      if (this.currentMode === 'image' && this.lastImage) {
        this.convertImageToAscii(this.lastImage);
      }
    });
    resizeObserver.observe(this.asciiStage);
  }

  initGlobalUI() {
    this.globalUI.init({
      onCharsetChange: (e) => {
        // Update both converters with the same charset
        const charset = e.target.value;
        this.webcamConverter.setCharset(charset);
        this.imageConverter.setCharset(charset);
      },
      onDetailChange: (e) => {
        // Update single detail value for both modes
        this.detail = Number(e.target.value);
        this.globalUI.updateDetailLabel();
        
        // Only re-render image if we're currently in image mode
        if (this.currentMode === 'image' && this.lastImage) {
          this.convertImageToAscii(this.lastImage);
        }
      },
    });
  }

  initDisplayUI() {
    this.displayUI.init({});
  }

  initImageUpload() {

    // Image uploader interactions
    const openPicker = () => this.displayEls.imageInput.click();
    this.displayEls.dropZone.addEventListener('click', openPicker);
    this.displayEls.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker();
      }
    });

    const handleFiles = (files) => {
      if (!files || !files[0]) return;
      const file = files[0];
      const img = new Image();
      img.onload = () => {
        this.lastImage = img;
        // Switch to image mode when image is loaded
        this.currentMode = 'image';
        this.updateModeIndicator();
        this.updateButtonStates();
        this.stopRenderLoop();
        this.videoManager.stop();
        this.convertImageToAscii(img);
      };
      img.onerror = () => this.displayUI.showError('Failed to load image.');
      img.src = URL.createObjectURL(file);
    };

    this.displayEls.imageInput.addEventListener('change', (e) => handleFiles(e.target.files));

    this.displayEls.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.displayEls.dropZone.classList.add('dragging');
    });
    this.displayEls.dropZone.addEventListener('dragleave', () => {
      this.displayEls.dropZone.classList.remove('dragging');
    });
    this.displayEls.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.displayEls.dropZone.classList.remove('dragging');
      handleFiles(e.dataTransfer.files);
    });
  }

  updateModeIndicator() {
    if (this.currentMode === 'webcam') {
      this.displayEls.modeIndicator.textContent = 'Webcam Mode';
      this.displayEls.modeIndicator.classList.remove('image-mode');
    } else {
      this.displayEls.modeIndicator.textContent = 'Image Mode';
      this.displayEls.modeIndicator.classList.add('image-mode');
    }
  }

  updateButtonStates() {
    this.tabButtons.webcam.classList.toggle('is-active', this.currentMode === 'webcam');
    this.tabButtons.image.classList.toggle('is-active', this.currentMode === 'image');
    this.tabButtons.webcam.setAttribute('aria-selected', String(this.currentMode === 'webcam'));
    this.tabButtons.image.setAttribute('aria-selected', String(this.currentMode === 'image'));
  }

  async startWebcam() {
    try {
      const mediaConstraints = {
        video: {
          facingMode: config.video?.facingMode ?? 'user',
          ...(config.video?.constraints ?? {}),
        },
        audio: false,
      };
      await this.videoManager.start(mediaConstraints);
    } catch (error) {
      this.displayUI.showError(`Webcam error: ${error.message}`);
    }
  }

  startRenderLoop() {
    if (this.animationId) return; // already running
    const render = () => {
      if (!this.webcamActive) {
        this.animationId = null;
        return;
      }

      // If video not yet running (permission dialog, startup), keep polling
      if (!this.videoManager.isVideoRunning()) {
        this.animationId = requestAnimationFrame(render);
        return;
      }

      // Calculate optimal resolution
      const containerRect = this.displayEls.asciiDisplay.parentElement.getBoundingClientRect();
      const videoDimensions = this.videoManager.getDimensions();
      const videoAspectRatio = videoDimensions.width / videoDimensions.height;

      const { cols, rows, fontSize } = this.resolutionCalculator.calculate(
        containerRect,
        videoAspectRatio,
        this.detail
      );

      // Update canvas size
      this.canvas.width = cols;
      this.canvas.height = rows;

      // Update ASCII display style
      this.displayUI.updateAsciiStyle({
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize}px`,
      });
      
      // Debug font size
      if (Math.random() < 0.02) {
        console.log('[Render] Font size:', fontSize, 'px');
      }

      // Draw scaled video frame to canvas
      this.ctx.drawImage(this.videoElement, 0, 0, cols, rows);

      // Get image data and convert to ASCII
      const imageData = this.ctx.getImageData(0, 0, cols, rows);
      
      // Debug: check if we're getting valid image data
      const pixelSample = imageData.data.slice(0, 12); // First 3 pixels RGBA
      const hasData = pixelSample.some(v => v > 0);
      if (!hasData) {
        console.warn('[Render] Image data appears empty. First pixels:', pixelSample);
      }
      
      const ascii = this.webcamConverter.convertToAscii(imageData, cols, rows);
      
      // Debug: log a sample of the ASCII output
      if (Math.random() < 0.05) { // Log 5% of frames
        const preview = ascii.substring(0, 100).replace(/\n/g, '\\n');
        console.log('[Render] ASCII preview:', preview, '... Length:', ascii.length);
      }

      // Update displays
      this.displayUI.updateAsciiDisplay(ascii);
      this.displayUI.updateResolution(cols, rows);

      // Debug overlay
      this.updateDebugOverlay({
        cols,
        rows,
        fontSize,
        video: videoDimensions,
      });

      // FPS calculation
      const now = performance.now();
      const dt = now - this.fpsLast;
      if (dt >= 100) { // Update FPS more frequently
        // Count frames per second based on time between updates
        this.fps = 1000 / (dt / (this.frameCount || 1));
        this.fpsLast = now;
        this.frameCount = 0;
      }
      this.frameCount = (this.frameCount || 0) + 1;

      // Continue loop
      this.animationId = requestAnimationFrame(render);
    };

    this.animationId = requestAnimationFrame(render);
  }

  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  convertImageToAscii(image) {
    // Determine container and aspect ratio based on image natural size
    const containerRect = this.displayEls.asciiDisplay.parentElement.getBoundingClientRect();
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;

    const { cols, rows, fontSize } = this.resolutionCalculator.calculate(
      containerRect,
      imageAspectRatio,
      this.detail
    );

    // Prepare canvas
    this.canvas.width = cols;
    this.canvas.height = rows;

    // Style output
    this.displayUI.updateAsciiStyle({
      fontSize: `${fontSize}px`,
      lineHeight: `${fontSize}px`,
    });

    // Draw scaled image to canvas
    this.ctx.clearRect(0, 0, cols, rows);
    this.ctx.drawImage(image, 0, 0, cols, rows);

    // Convert
    const imageData = this.ctx.getImageData(0, 0, cols, rows);
    const ascii = this.imageConverter.convertToAscii(imageData, cols, rows);

    // Animate in
    this.displayEls.asciiDisplay.classList.add('enter');
    requestAnimationFrame(() => {
      this.displayEls.asciiDisplay.classList.add('enter-active');
      this.displayUI.updateAsciiDisplay(ascii);
      this.displayUI.updateResolution(cols, rows);
      setTimeout(() => {
        this.displayEls.asciiDisplay.classList.remove('enter');
        this.displayEls.asciiDisplay.classList.remove('enter-active');
      }, 260);
    });
  }

  stop() {
    this.stopRenderLoop();
    this.videoManager.stop();
    this.globalUI.destroy();
    this.displayUI.destroy();
  }

  installDebugOverlay() {
    if (document.getElementById('debugOverlay')) return;
    const el = document.createElement('div');
    el.id = 'debugOverlay';
    el.style.position = 'fixed';
    el.style.left = '12px';
    el.style.bottom = '12px';
    el.style.zIndex = '9999';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = '#bdbdbd';
    el.style.padding = '6px 8px';
    el.style.borderRadius = '6px';
    el.style.fontSize = '12px';
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'pre';
    el.textContent = 'Starting…';
    document.body.appendChild(el);
  }

  updateDebugOverlay({ cols, rows, fontSize, video }) {
    const el = document.getElementById('debugOverlay');
    if (!el) return;
    el.textContent = `Video: ${video.width}x${video.height}\nASCII: ${cols}x${rows} @ ${fontSize.toFixed(1)}px\nFPS (approx): ${this.fps.toFixed(1)}`;
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
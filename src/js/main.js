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
    // Tabs
    this.tabButtons = {
      webcam: document.getElementById('tabWebcamBtn'),
      image: document.getElementById('tabImageBtn'),
    };
    this.panels = {
      webcam: document.getElementById('panelWebcam'),
      image: document.getElementById('panelImage'),
    };

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

    // Webcam tab elements
    this.webcamEls = {
      asciiDisplay: document.getElementById('asciiWebcam'),
      charsetSelect: document.getElementById('charsetSelectWebcam'),
      detailRange: document.getElementById('detailRangeWebcam'),
      detailValue: document.getElementById('detailValueWebcam'),
      resolutionDisplay: document.getElementById('resolutionWebcam'),
    };

    // Image tab elements
    this.imageEls = {
      asciiDisplay: document.getElementById('asciiImage'),
      charsetSelect: document.getElementById('charsetSelectImage'),
      detailRange: document.getElementById('detailRangeImage'),
      detailValue: document.getElementById('detailValueImage'),
      resolutionDisplay: document.getElementById('resolutionImage'),
      dropZone: document.getElementById('dropZone'),
      imageInput: document.getElementById('imageInput'),
    };

    // Modules (separate converters to keep independent settings)
    this.webcamConverter = new AsciiConverter(config.ascii.defaultCharset);
    this.imageConverter = new AsciiConverter(config.ascii.defaultCharset);
    this.videoManager = new VideoManager(this.videoElement);
    this.resolutionCalculator = new ResolutionCalculator();

    // State
    this.activeTab = 'webcam';
    this.webcamDetail = config.ascii.defaultDetail;
    this.imageDetail = config.ascii.defaultDetail;
    this.animationId = null;
    this.lastImage = null;
    this.fpsLast = performance.now();
    this.fps = 0;

    // UI Controllers per tab
    this.webcamUI = new UIController({
      asciiDisplay: this.webcamEls.asciiDisplay,
      charsetSelect: this.webcamEls.charsetSelect,
      detailRange: this.webcamEls.detailRange,
      detailValue: this.webcamEls.detailValue,
      resolutionDisplay: this.webcamEls.resolutionDisplay,
    });

    this.imageUI = new UIController({
      asciiDisplay: this.imageEls.asciiDisplay,
      charsetSelect: this.imageEls.charsetSelect,
      detailRange: this.imageEls.detailRange,
      detailValue: this.imageEls.detailValue,
      resolutionDisplay: this.imageEls.resolutionDisplay,
    });
  }

  async init() {
    try {
      this.initTabs();
      this.initWebcamUI();
      this.initImageUI();
      await this.startWebcam();
      this.startRenderLoop();
      this.installDebugOverlay();
      
      // Debug: test ASCII display with known content
      setTimeout(() => {
        const currentContent = this.webcamEls.asciiDisplay.textContent;
        console.log('[Debug] ASCII display content length:', currentContent.length);
        console.log('[Debug] ASCII display element:', this.webcamEls.asciiDisplay);
        console.log('[Debug] ASCII display parent:', this.webcamEls.asciiDisplay.parentElement);
        
        // Force a bright test pattern
        this.webcamEls.asciiDisplay.style.color = '#00ff00'; // Bright green
        this.webcamEls.asciiDisplay.style.fontSize = '16px';
        this.webcamEls.asciiDisplay.style.fontFamily = 'monospace';
        this.webcamEls.asciiDisplay.textContent = 'TEST: If you see this GREEN text, display works!\n' + currentContent.substring(0, 200);
        
        setTimeout(() => {
          console.log('[Debug] Removing test styles');
          this.webcamEls.asciiDisplay.style.color = '';
          this.webcamEls.asciiDisplay.style.fontSize = '';
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error('Initialization error:', error);
      this.webcamUI.showError(`Error: ${error.message}`);
    }
  }

  initTabs() {
    const activate = async (tab) => {
      if (this.activeTab === tab) return;
      // Update buttons
      Object.values(this.tabButtons).forEach(btn => btn.classList.remove('is-active'));
      this.tabButtons[tab].classList.add('is-active');
      this.tabButtons.webcam.setAttribute('aria-selected', String(tab === 'webcam'));
      this.tabButtons.image.setAttribute('aria-selected', String(tab === 'image'));

      // Update panels
      Object.values(this.panels).forEach(panel => {
        panel.classList.remove('is-active');
        panel.hidden = true;
      });
      this.panels[tab].classList.add('is-active');
      this.panels[tab].hidden = false;

      // Handle lifecycle
      this.activeTab = tab;
      if (tab === 'webcam') {
        try {
          await this.startWebcam();
        } catch (_) {
          // Error is surfaced via UI in startWebcam
        }
        this.startRenderLoop();
      } else {
        // stop webcam render loop; keep stream to quickly resume or stop fully
        this.stopRenderLoop();
        this.videoManager.stop();
      }
    };

    this.tabButtons.webcam.addEventListener('click', () => activate('webcam'));
    this.tabButtons.image.addEventListener('click', () => activate('image'));

    // When switching to image tab and an image is already loaded, re-render to fit layout
    const resizeObserver = new ResizeObserver(() => {
      if (this.activeTab === 'image' && this.lastImage) {
        this.convertImageToAscii(this.lastImage);
      }
    });
    resizeObserver.observe(this.panels.image);
  }

  initWebcamUI() {
    this.webcamUI.init({
      onCharsetChange: (e) => this.webcamConverter.setCharset(e.target.value),
      onDetailChange: (e) => {
        this.webcamDetail = Number(e.target.value);
        this.webcamUI.updateDetailLabel();
      },
    });
  }

  initImageUI() {
    this.imageUI.init({
      onCharsetChange: (e) => this.imageConverter.setCharset(e.target.value),
      onDetailChange: (e) => {
        this.imageDetail = Number(e.target.value);
        this.imageUI.updateDetailLabel();
        if (this.lastImage) {
          this.convertImageToAscii(this.lastImage);
        }
      },
    });

    // Image uploader interactions
    const openPicker = () => this.imageEls.imageInput.click();
    this.imageEls.dropZone.addEventListener('click', openPicker);
    this.imageEls.dropZone.addEventListener('keydown', (e) => {
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
        this.convertImageToAscii(img);
      };
      img.onerror = () => this.imageUI.showError('Failed to load image.');
      img.src = URL.createObjectURL(file);
    };

    this.imageEls.imageInput.addEventListener('change', (e) => handleFiles(e.target.files));

    this.imageEls.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.imageEls.dropZone.classList.add('dragging');
    });
    this.imageEls.dropZone.addEventListener('dragleave', () => {
      this.imageEls.dropZone.classList.remove('dragging');
    });
    this.imageEls.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.imageEls.dropZone.classList.remove('dragging');
      handleFiles(e.dataTransfer.files);
    });
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
      this.webcamUI.showError(`Webcam error: ${error.message}`);
    }
  }

  startRenderLoop() {
    if (this.animationId) return; // already running
    const render = () => {
      if (this.activeTab !== 'webcam') {
        this.animationId = null;
        return;
      }

      // If video not yet running (permission dialog, startup), keep polling
      if (!this.videoManager.isVideoRunning()) {
        this.animationId = requestAnimationFrame(render);
        return;
      }

      // Calculate optimal resolution
      const containerRect = this.webcamEls.asciiDisplay.parentElement.getBoundingClientRect();
      const videoDimensions = this.videoManager.getDimensions();
      const videoAspectRatio = videoDimensions.width / videoDimensions.height;

      const { cols, rows, fontSize } = this.resolutionCalculator.calculate(
        containerRect,
        videoAspectRatio,
        this.webcamDetail
      );

      // Update canvas size
      this.canvas.width = cols;
      this.canvas.height = rows;

      // Update ASCII display style
      const displayFontSize = Math.max(fontSize, 8); // Ensure minimum font size
      this.webcamUI.updateAsciiStyle({
        fontSize: `${displayFontSize}px`,
        lineHeight: `${displayFontSize}px`,
      });
      
      // Debug font size
      if (Math.random() < 0.02) {
        console.log('[Render] Font size:', displayFontSize, 'px');
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
      this.webcamUI.updateAsciiDisplay(ascii);
      this.webcamUI.updateResolution(cols, rows);

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
    const containerRect = this.imageEls.asciiDisplay.parentElement.getBoundingClientRect();
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;

    const { cols, rows, fontSize } = this.resolutionCalculator.calculate(
      containerRect,
      imageAspectRatio,
      this.imageDetail
    );

    // Prepare canvas
    this.canvas.width = cols;
    this.canvas.height = rows;

    // Style output
    this.imageUI.updateAsciiStyle({
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
    this.imageEls.asciiDisplay.classList.add('enter');
    requestAnimationFrame(() => {
      this.imageEls.asciiDisplay.classList.add('enter-active');
      this.imageUI.updateAsciiDisplay(ascii);
      this.imageUI.updateResolution(cols, rows);
      setTimeout(() => {
        this.imageEls.asciiDisplay.classList.remove('enter');
        this.imageEls.asciiDisplay.classList.remove('enter-active');
      }, 260);
    });
  }

  stop() {
    this.stopRenderLoop();
    this.videoManager.stop();
    this.webcamUI.destroy();
    this.imageUI.destroy();
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
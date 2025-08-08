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
    } catch (error) {
      console.error('Initialization error:', error);
      this.webcamUI.showError(`Error: ${error.message}`);
    }
  }

  initTabs() {
    const activate = (tab) => {
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
        this.startWebcam();
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
      if (this.activeTab !== 'webcam' || !this.videoManager.isVideoRunning()) {
        this.animationId = null;
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
      this.webcamUI.updateAsciiStyle({
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize}px`,
      });

      // Draw scaled video frame to canvas
      this.ctx.drawImage(this.videoElement, 0, 0, cols, rows);

      // Get image data and convert to ASCII
      const imageData = this.ctx.getImageData(0, 0, cols, rows);
      const ascii = this.webcamConverter.convertToAscii(imageData, cols, rows);

      // Update displays
      this.webcamUI.updateAsciiDisplay(ascii);
      this.webcamUI.updateResolution(cols, rows);

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
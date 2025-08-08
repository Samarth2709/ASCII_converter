/**
 * Video Manager Module
 * Handles webcam access and video stream management
 */

export class VideoManager {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
    this.isRunning = false;
  }

  /**
   * Initialize webcam and start video stream
   * @param {Object} constraints - MediaStream constraints
   * @returns {Promise<void>}
   */
  async start(constraints = { video: { facingMode: 'user' }, audio: false }) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam not supported. Use a modern browser and ensure secure origin (localhost or https).');
      }
      const normalizedConstraints = this.#normalizeMediaConstraints(constraints);
      // Debug: log constraints
      console.info('[VideoManager] Requesting getUserMedia with constraints:', normalizedConstraints);
      this.stream = await navigator.mediaDevices.getUserMedia(normalizedConstraints);
      console.info('[VideoManager] getUserMedia resolved. Tracks:', this.stream.getTracks().map(t => ({ kind: t.kind, label: t.label })));
      this.videoElement.srcObject = this.stream;
      // Ensure metadata is loaded so videoWidth/Height are available
      if (this.videoElement.readyState >= 2) {
        await this.videoElement.play();
        this.isRunning = true;
        console.info('[VideoManager] Video playing immediately. Dimensions:', this.getDimensions());
      } else {
        await new Promise((resolve) => {
          const onLoaded = async () => {
            this.videoElement.removeEventListener('loadedmetadata', onLoaded);
            await this.videoElement.play();
            this.isRunning = true;
            console.info('[VideoManager] Video metadata loaded. Dimensions:', this.getDimensions());
            resolve();
          };
          this.videoElement.addEventListener('loadedmetadata', onLoaded, { once: true });
        });
      }
    } catch (error) {
      console.error('Failed to access webcam:', error);
      throw new Error(`Permission denied or no webcam available: ${error.message}`);
    }
  }

  /**
   * Normalize various constraint shapes into a valid MediaStreamConstraints object
   * @param {any} constraintsInput
   * @returns {MediaStreamConstraints}
   */
  #normalizeMediaConstraints(constraintsInput) {
    // If it's already valid (has video or audio keys), return as-is
    if (constraintsInput && (Object.prototype.hasOwnProperty.call(constraintsInput, 'video') || Object.prototype.hasOwnProperty.call(constraintsInput, 'audio'))) {
      return constraintsInput;
    }

    // If it's an object that likely contains width/height/facingMode, wrap under video
    if (constraintsInput && typeof constraintsInput === 'object') {
      return { video: { facingMode: 'user', ...constraintsInput }, audio: false };
    }

    // Fallback to default
    return { video: { facingMode: 'user' }, audio: false };
  }

  /**
   * Stop video stream and release resources
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
    this.isRunning = false;
  }

  /**
   * Get video dimensions
   * @returns {{width: number, height: number}}
   */
  getDimensions() {
    return {
      width: this.videoElement.videoWidth || 640,
      height: this.videoElement.videoHeight || 480,
    };
  }

  /**
   * Check if video is running
   * @returns {boolean}
   */
  isVideoRunning() {
    return this.isRunning;
  }
}

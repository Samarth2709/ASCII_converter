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
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      this.isRunning = true;
    } catch (error) {
      console.error('Failed to access webcam:', error);
      throw new Error(`Permission denied or no webcam available: ${error.message}`);
    }
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

/**
 * ASCII Converter Module
 * Handles the conversion of image data to ASCII characters
 */

export class AsciiConverter {
  constructor(charset = '@%#*+=-:. ') {
    this.charset = charset;
    this.sensitivityFactor = 1.0;
  }

  /**
   * Set the character set for conversion
   * @param {string} charset - The character set to use
   */
  setCharset(charset) {
    this.charset = charset;
  }

  /**
   * Set the sensitivity factor for luminance adjustment
   * @param {number} factor - The sensitivity factor
   */
  setSensitivity(factor) {
    this.sensitivityFactor = factor;
  }

  /**
   * Convert luminance value to ASCII character
   * @param {number} luminance - Luminance value (0-1)
   * @returns {string} ASCII character
   */
  getCharForLuminance(luminance) {
    // Apply sensitivity adjustment
    const adjustedLum = Math.min(1, Math.max(0, (luminance - 0.5) * this.sensitivityFactor + 0.5));
    // Map dark (0) -> densest char at start of charset, bright (1) -> lightest char at end
    const index = Math.floor(adjustedLum * (this.charset.length - 1));
    return this.charset[index] || ' ';
  }

  /**
   * Calculate luminance from RGB values
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {number} Luminance value (0-1)
   */
  calculateLuminance(r, g, b) {
    // Standard sRGB luminance calculation
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  /**
   * Convert image data to ASCII string
   * @param {ImageData} imageData - Canvas image data
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {string} ASCII representation
   */
  convertToAscii(imageData, cols, rows) {
    const data = imageData.data;
    let ascii = '';
    
    // Debug logging for first frame
    if (!this._debugged) {
      console.log('[AsciiConverter] Charset:', this.charset);
      console.log('[AsciiConverter] Charset length:', this.charset.length);
      this._debugged = true;
    }

    for (let y = 0; y < rows; y++) {
      let rowStr = '';
      for (let x = 0; x < cols; x++) {
        const idx = (y * cols + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luminance = this.calculateLuminance(r, g, b);
        const char = this.getCharForLuminance(luminance);
        
        // Debug: log first pixel of first row
        if (x === 0 && y === 0 && Math.random() < 0.1) {
          console.log('[AsciiConverter] First pixel RGB:', r, g, b, 'Lum:', luminance.toFixed(2), 'Char:', char);
        }
        
        rowStr += char;
      }
      ascii += rowStr + '\n';
    }

    return ascii;
  }
}

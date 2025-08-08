/**
 * Resolution Calculator Module
 * Calculates optimal ASCII grid dimensions based on available space
 */

export class ResolutionCalculator {
  constructor() {
    this.baseFontSize = 10;
    this.charWidthRatio = 0.6; // Monospace character width to height ratio
  }

  /**
   * Calculate optimal columns and rows for ASCII display
   * @param {DOMRect} containerRect - Container dimensions
   * @param {number} videoAspectRatio - Video aspect ratio (width/height)
   * @param {number} detailFactor - Detail level factor
   * @returns {{cols: number, rows: number, fontSize: number}}
   */
  calculate(containerRect, videoAspectRatio, detailFactor = 1.0) {
    // Account for padding
    const availableWidth = containerRect.width - 48;
    const availableHeight = containerRect.height - 48;

    // Calculate font size based on detail factor - smaller font for higher detail
    // This keeps the overall display size constant while changing resolution
    // Use a more aggressive scaling for higher detail levels (up to 5x)
    const fontSize = Math.max(2, this.baseFontSize / Math.sqrt(detailFactor));

    // Character dimensions at this font size
    const charWidth = fontSize * this.charWidthRatio;
    const charHeight = fontSize;

    // Calculate how many characters fit in the available space
    const maxCols = Math.floor(availableWidth / charWidth);
    const maxRows = Math.floor(availableHeight / charHeight);

    // Fit to aspect ratio constraints
    let cols = maxCols;
    let rows = Math.floor(cols / videoAspectRatio);

    if (rows > maxRows) {
      rows = maxRows;
      cols = Math.floor(rows * videoAspectRatio);
    }

    // Ensure minimum dimensions but allow higher resolution for high detail
    return {
      cols: Math.max(20, cols),
      rows: Math.max(15, rows),
      fontSize,
    };
  }

  /**
   * Update font size calculation parameters
   * @param {number} baseFontSize - Base font size
   * @param {number} charWidthRatio - Character width to height ratio
   */
  updateParameters(baseFontSize, charWidthRatio) {
    this.baseFontSize = baseFontSize;
    this.charWidthRatio = charWidthRatio;
  }
}

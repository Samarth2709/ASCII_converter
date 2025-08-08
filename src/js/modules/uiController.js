/**
 * UI Controller Module
 * Manages UI elements and user interactions
 */

export class UIController {
  constructor(elements) {
    this.elements = elements;
    this.listeners = new Map();
  }

  /**
   * Initialize UI event listeners
   * @param {Object} callbacks - Event callback functions
   */
  init(callbacks) {
    // Charset selection
    if (callbacks.onCharsetChange) {
      this.addEventListener(this.elements.charsetSelect, 'change', callbacks.onCharsetChange);
    }

    // Detail range
    if (callbacks.onDetailChange && this.elements.detailRange) {
      this.addEventListener(this.elements.detailRange, 'input', callbacks.onDetailChange);
    }

    // Sensitivity range
    if (callbacks.onSensitivityChange && this.elements.sensitivityRange) {
      this.addEventListener(this.elements.sensitivityRange, 'input', callbacks.onSensitivityChange);
    }

    // Update initial labels
    this.updateDetailLabel();
    this.updateSensitivityLabel();
  }

  /**
   * Add event listener and track it
   * @private
   */
  addEventListener(element, event, callback) {
    if (!element) return;
    
    element.addEventListener(event, callback);
    
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    this.listeners.get(element).push({ event, callback });
  }

  /**
   * Update detail value label
   */
  updateDetailLabel() {
    if (!this.elements.detailRange || !this.elements.detailValue) return;
    const value = Number(this.elements.detailRange.value);
    this.elements.detailValue.textContent = `${value.toFixed(2)}×`;
  }

  /**
   * Update sensitivity value label
   */
  updateSensitivityLabel() {
    if (!this.elements.sensitivityRange || !this.elements.sensitivityValue) return;
    const value = Number(this.elements.sensitivityRange.value);
    this.elements.sensitivityValue.textContent = `${value.toFixed(2)}×`;
  }

  /**
   * Update resolution display
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   */
  updateResolution(cols, rows) {
    if (this.elements.resolutionDisplay) {
      this.elements.resolutionDisplay.textContent = `Resolution: ${cols}×${rows}`;
    }
  }

  /**
   * Display error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (this.elements.asciiDisplay) {
      this.elements.asciiDisplay.textContent = message;
    }
  }

  /**
   * Update ASCII display
   * @param {string} ascii - ASCII art string
   */
  updateAsciiDisplay(ascii) {
    if (this.elements.asciiDisplay) {
      this.elements.asciiDisplay.textContent = ascii;
      
      // Debug: force visibility
      if (!this._debuggedDisplay) {
        console.log('[UIController] ASCII display element:', this.elements.asciiDisplay);
        console.log('[UIController] Display computed style:', window.getComputedStyle(this.elements.asciiDisplay).color);
        console.log('[UIController] Display visibility:', window.getComputedStyle(this.elements.asciiDisplay).visibility);
        console.log('[UIController] Display opacity:', window.getComputedStyle(this.elements.asciiDisplay).opacity);
        this._debuggedDisplay = true;
      }
    }
  }

  /**
   * Update ASCII display style
   * @param {Object} styles - CSS styles to apply
   */
  updateAsciiStyle(styles) {
    if (this.elements.asciiDisplay) {
      Object.assign(this.elements.asciiDisplay.style, styles);
    }
  }

  /**
   * Clear ASCII display
   */
  clearDisplay() {
    if (this.elements.asciiDisplay) {
      this.elements.asciiDisplay.textContent = '';
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.listeners.forEach((eventList, element) => {
      eventList.forEach(({ event, callback }) => {
        element.removeEventListener(event, callback);
      });
    });
    this.listeners.clear();
  }
}

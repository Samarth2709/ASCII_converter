// Application configuration
export const config = {
  // ASCII conversion settings
  ascii: {
    defaultColumns: 165,
    minColumns: 60,
    maxColumns: 200,
    defaultCharset: '@%#*+=-:. ',
    charsets: {
      dense: '@%#*+=-:. ',
      blocks: '█▓▒░ .',
      extended: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\\^`\'. ',
    },
    defaultDetail: 1.0,
    minDetail: 0.5,
    maxDetail: 5.0,
    detailStep: 0.05,
  },

  // Video settings
  video: {
    facingMode: 'user',
    constraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },

  // Performance settings
  performance: {
    targetFPS: 30,
    enableWebGL: false,
  },

  // UI settings
  ui: {
    theme: 'dark',
    showResolution: true,
    showFPS: false,
  },

  // Feature flags
  features: {
    enableSave: false,
    enableUpload: false,
    enableShare: false,
    enableFilters: false,
  },
};

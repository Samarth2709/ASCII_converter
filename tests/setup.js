// Jest setup file

// Mock getUserMedia for testing
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() => 
    Promise.resolve({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    })
  ),
};

// Mock HTMLMediaElement.play
HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});

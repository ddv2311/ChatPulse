// Import buffer
import { Buffer } from 'buffer';

// Polyfills for simple-peer library
window.global = window;
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: function(cb) { setTimeout(cb, 0); }
};

// Add Buffer to window
window.Buffer = Buffer;

// Only include Buffer polyfill if it's not already defined
if (typeof window.Buffer === 'undefined') {
  try {
    window.Buffer = require('buffer/').Buffer;
  } catch (e) {
    console.warn('Buffer polyfill not available');
  }
} 
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'prisma');
const dest = path.join(__dirname, 'dist', 'prisma');

// Remove destination if it exists
if (fs.existsSync(dest)) {
  try {
    fs.rmSync(dest, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch (err) {
    console.warn('Warning: Could not remove old prisma directory:', err.message);
  }
}

// Copy with retry logic for Windows file locking
let attempts = 0;
const maxAttempts = 3;

function copyWithRetry() {
  try {
    fs.cpSync(source, dest, { recursive: true, force: true });
    console.log('✓ Successfully copied prisma directory to dist');
  } catch (err) {
    attempts++;
    if (attempts < maxAttempts && (err.code === 'EPIPE' || err.code === 'EBUSY')) {
      console.log(`Retry ${attempts}/${maxAttempts}...`);
      setTimeout(copyWithRetry, 500);
    } else if (err.code === 'EPIPE' || err.code === 'EBUSY') {
      // If it's still locked after retries, just skip it - the old files should still work
      console.warn('⚠ Warning: Some files are locked, using existing files');
      process.exit(0);
    } else {
      throw err;
    }
  }
}

copyWithRetry();

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Copy Prisma generated client from workspace package to web app
 * This ensures Netlify Functions can find the Prisma binaries
 */

const sourceDir = path.join(__dirname, '../../../packages/db/prisma/generated/client');
const targetDir = path.join(__dirname, '../prisma/generated/client');

console.log('🔧 Copying Prisma binaries for Netlify deployment...');
console.log('Source:', sourceDir);
console.log('Target:', targetDir);

// Check if source exists
if (!fs.existsSync(sourceDir)) {
  console.warn('⚠️  Prisma client not found. Run `pnpm db:generate` first.');
  process.exit(0); // Don't fail the build
}

// Create target directory
fs.mkdirSync(path.dirname(targetDir), { recursive: true });

// Copy recursively
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Remove old target if exists
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  copyRecursive(sourceDir, targetDir);
  console.log('✅ Prisma binaries copied successfully');

  // Verify critical files exist
  const libQueryEngine = path.join(targetDir, 'libquery_engine-rhel-openssl-3.0.x.so.node');
  if (fs.existsSync(libQueryEngine)) {
    console.log('✅ AWS Lambda binary found:', path.basename(libQueryEngine));
  } else {
    console.warn('⚠️  AWS Lambda binary not found. Deployment may fail.');
  }

} catch (error) {
  console.error('❌ Failed to copy Prisma binaries:', error.message);
  process.exit(1);
}

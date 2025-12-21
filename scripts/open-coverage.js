#!/usr/bin/env node
/**
 * Opens a generated coverage HTML report in headless Chrome when COVERAGE_PREVIEW is truthy.
 * Usage: COVERAGE_PREVIEW=1 node scripts/open-coverage.js <path-to-coverage-index.html>
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const shouldPreview = process.env.COVERAGE_PREVIEW;
  if (!shouldPreview || shouldPreview === '0' || shouldPreview === 'false') {
    return;
  }

  const target = process.argv[2];
  if (!target) {
    console.warn('No coverage path supplied to open-coverage script.');
    return;
  }

  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) {
    console.warn(`Coverage file not found: ${resolved}`);
    return;
  }

  let chromeLauncher;
  try {
    chromeLauncher = require('chrome-launcher');
  } catch (error) {
    console.warn('chrome-launcher is required to preview coverage in headless Chrome.');
    return;
  }

  const fileUrl = `file://${resolved}`;
  const chrome = await chromeLauncher.launch({
    startingUrl: fileUrl,
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
  });

  console.log(`Opened coverage report in headless Chrome: ${fileUrl}`);
  setTimeout(() => chrome.kill(), 5000);
}

main().catch((error) => {
  console.error('Failed to open coverage report', error);
});

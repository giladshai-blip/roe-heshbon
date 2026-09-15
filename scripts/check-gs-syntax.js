#!/usr/bin/env node
// Static syntax check for the two canonical Apps Script files.
// Apps Script is close enough to plain JS that `node --check` catches
// real syntax errors, even though SpreadsheetApp/PropertiesService/etc.
// are undefined here (we never execute the file, only parse it).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const files = ['src/Code.gs', 'src/Dashboard.gs'];
const repoRoot = path.join(__dirname, '..');
let failed = false;

for (const relPath of files) {
  const srcPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(srcPath)) {
    console.error(`✗ ${relPath}: file not found`);
    failed = true;
    continue;
  }
  const tmpPath = path.join(os.tmpdir(), path.basename(relPath).replace(/\.gs$/, '') + '.check.js');
  fs.copyFileSync(srcPath, tmpPath);
  try {
    execFileSync(process.execPath, ['--check', tmpPath], { stdio: 'pipe' });
    console.log(`✓ ${relPath}: syntax OK`);
  } catch (e) {
    failed = true;
    console.error(`✗ ${relPath}: syntax error`);
    console.error(String(e.stderr || e.message));
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

process.exit(failed ? 1 : 0);

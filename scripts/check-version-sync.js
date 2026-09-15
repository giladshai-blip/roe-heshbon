#!/usr/bin/env node
// Guards against the exact drift that slipped through before: README
// claiming an old stable version while src/Code.gs and src/Dashboard.gs
// had already moved on (or the two .gs files disagreeing on which
// Dashboard version the installed Core expects).
'use strict';
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

function must(regex, text, label) {
  const m = text.match(regex);
  if (!m) throw new Error(`could not find ${label}`);
  return m[1];
}

const code = read('src/Code.gs');
const dashboard = read('src/Dashboard.gs');
const readme = read('README.md');

const codeCoreVersion = must(/^\s*VERSION:\s*'V([\d.]+)'/m, code, 'V56.VERSION in src/Code.gs');
const codeDashboardVersion = must(/^\s*DASHBOARD_VERSION:\s*'V([\d.]+)'/m, code, 'V56.DASHBOARD_VERSION in src/Code.gs');
const dashboardOwnVersion = must(/^\s*VERSION:\s*'Dashboard V([\d.]+)'/m, dashboard, 'DASHBOARD_V56.VERSION in src/Dashboard.gs');
const readmeCoreVersion = must(/Core \*\*V([\d.]+)\*\*/, readme, 'Core version banner in README.md');
const readmeDashboardVersion = must(/Dashboard \*\*V([\d.]+)\*\*/, readme, 'Dashboard version banner in README.md');

const checks = [
  ['README Core version', readmeCoreVersion, 'src/Code.gs V56.VERSION', codeCoreVersion],
  ['README Dashboard version', readmeDashboardVersion, 'src/Code.gs V56.DASHBOARD_VERSION', codeDashboardVersion],
  ['src/Dashboard.gs own VERSION', dashboardOwnVersion, 'src/Code.gs V56.DASHBOARD_VERSION', codeDashboardVersion],
];

let failed = false;
for (const [aLabel, aVal, bLabel, bVal] of checks) {
  if (aVal === bVal) {
    console.log(`✓ ${aLabel} (${aVal}) matches ${bLabel} (${bVal})`);
  } else {
    failed = true;
    console.error(`✗ ${aLabel} (${aVal}) does NOT match ${bLabel} (${bVal})`);
  }
}

if (failed) {
  console.error('\nVersion drift detected. Update README.md and/or the .gs version constants so all three agree.');
  process.exit(1);
}

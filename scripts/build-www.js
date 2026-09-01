#!/usr/bin/env node
/* Assembles the web assets into www/ for Capacitor. */
const fs = require('fs');
const path = require('path');

const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
const DIRS = ['css', 'js', 'vendor', 'icons'];

fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www', { recursive: true });
FILES.forEach((f) => fs.copyFileSync(f, path.join('www', f)));
DIRS.forEach((d) => fs.cpSync(d, path.join('www', d), { recursive: true }));
console.log('www/ assembled:', fs.readdirSync('www').join(', '));

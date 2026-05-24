const fs = require('fs');
const path = require('path');

const root = __dirname;
const dist = path.join(root, 'dist');
const files = ['index.html', 'style.css', 'script.js'];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.writeFileSync(path.join(dist, '_redirects'), '/* /index.html 200\n');

console.log('Build erfolgreich: dist wurde erstellt.');

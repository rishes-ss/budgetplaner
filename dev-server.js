const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 5173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split('?')[0]);
  const requestedFile = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(root, requestedFile);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  const fallback = path.join(root, 'index.html');
  const target = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : fallback;
  const ext = path.extname(target);

  response.writeHead(200, { 'Content-Type': types[ext] || 'text/plain; charset=utf-8' });
  fs.createReadStream(target).pipe(response);
});

server.listen(port, () => {
  console.log(`Budgetplaner laeuft auf http://localhost:${port}`);
});

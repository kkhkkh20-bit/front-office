const fs = require('node:fs/promises');
const http = require('node:http');

/* 각 검사 실행이 서버와 포트를 소유한다. 작업 공간이나 다른 파일은 제공하지 않는다. */
async function startHtmlServer(file) {
  const html = await fs.readFile(file);
  const server = http.createServer((request, response) => {
    if (request.url !== '/' || request.method !== 'GET') {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(html);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  let closing;
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close() {
      if (!closing) closing = new Promise((resolve, reject) => {
        server.close(error => error && error.code !== 'ERR_SERVER_NOT_RUNNING' ? reject(error) : resolve());
      });
      return closing;
    },
  };
}
module.exports = { startHtmlServer };

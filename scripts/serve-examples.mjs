import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDirectory = path.resolve(__dirname, '..');
const defaultPort = Number.parseInt(process.env.PORT ?? '4174', 10);

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.cts': 'text/plain; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ts': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (request, response) => {
    if (! request.url) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Bad request');

        return;
    }

    const requestUrl = new URL(request.url, 'http://localhost');
    const pathname = requestUrl.pathname === '/' ? '/examples/basic.html' : requestUrl.pathname;
    const requestedPath = path.normalize(decodeURIComponent(pathname)).replace(/^([\\/])+/, '');
    const absolutePath = path.resolve(rootDirectory, requestedPath);

    if (! absolutePath.startsWith(rootDirectory)) {
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');

        return;
    }

    try {
        await access(absolutePath);
        const fileStats = await stat(absolutePath);

        if (fileStats.isDirectory()) {
            response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Directory listing is disabled');

            return;
        }

        const extension = path.extname(absolutePath);
        const contentType = mimeTypes[extension] ?? 'application/octet-stream';

        response.writeHead(200, {
            'Cache-Control': 'no-cache',
            'Content-Length': fileStats.size,
            'Content-Type': contentType,
        });

        createReadStream(absolutePath).pipe(response);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
    }
});

server.listen(defaultPort, '127.0.0.1', () => {
    console.log(`Examples server running at http://127.0.0.1:${defaultPort}`);
    console.log(`Basic example: http://127.0.0.1:${defaultPort}/examples/basic.html`);
    console.log(`HTTP template example: http://127.0.0.1:${defaultPort}/examples/http-template-client.html`);
});
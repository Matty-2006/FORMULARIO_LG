// Servidor solo para probar en tu computadora (no se usa en Netlify).
// Uso: npm run local  ->  http://localhost:8888/?k=prueba
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { handle } from './netlify/lib/core.mjs';

const PUBLIC = join(import.meta.dirname, 'public');
const DB = join(import.meta.dirname, '.datos-local.json');
const KEY = process.env.APP_KEY || 'prueba';
const tipos = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

const leer = async () => { try { return JSON.parse(await readFile(DB, 'utf8')); } catch { return {}; } };
const store = {
  get: async (k) => (await leer())[k] ?? null,
  set: async (k, v) => { const d = await leer(); d[k] = v; await writeFile(DB, JSON.stringify(d, null, 2)); },
  delete: async (k) => { const d = await leer(); delete d[k]; await writeFile(DB, JSON.stringify(d, null, 2)); },
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const r = await handle(new Request(url, { method: req.method, headers: req.headers, body }), store, KEY);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(await r.text());
  }
  const ruta = url.pathname === '/' ? '/index.html' : url.pathname;
  try {
    const f = await readFile(join(PUBLIC, ruta.replace(/\.\./g, '')));
    res.writeHead(200, { 'content-type': tipos[extname(ruta)] || 'application/octet-stream' });
    res.end(f);
  } catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(8888, () => console.log(`Listo: http://localhost:8888/?k=${KEY}`));

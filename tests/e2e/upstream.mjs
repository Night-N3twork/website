import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.UPSTREAM_PORT ?? 3900);
const HOST = '127.0.0.1';
const AVATAR =
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#141831"/><circle cx="40" cy="31" r="14" fill="#EDEBF5"/><path d="M12 78c3-17 14-26 28-26s25 9 28 26z" fill="#EDEBF5"/></svg>';
const FIXTURES = {
  '/api/status-page/all': 'uptime/status-page.json',
  '/api/status-page/heartbeat/all': 'uptime/heartbeat.json',
};
const MEMBERS = /^\/discord\/guilds\/\d+\/members$/;

const fixture = (name) => readFile(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8');

function send(res, status, body, type) {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

async function answer(req, res) {
  const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
  if (url.pathname === '/health') return send(res, 200, 'ok', 'text/plain');
  if (url.pathname.startsWith('/cdn/')) return send(res, 200, AVATAR, 'image/svg+xml');
  if (MEMBERS.test(url.pathname)) return send(res, 200, url.searchParams.has('after') ? '[]' : await fixture('discord/members.json'), 'application/json');
  const name = FIXTURES[url.pathname];
  if (!name) return send(res, 404, '{}', 'application/json');
  return send(res, 200, await fixture(name), 'application/json');
}

createServer((req, res) => {
  answer(req, res).catch(() => send(res, 500, '{}', 'application/json'));
}).listen(PORT, HOST);

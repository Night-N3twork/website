import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.UPSTREAM_PORT ?? 3900);
const HOST = '127.0.0.1';
const AVATAR = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAAABc2X6AAAA+0lEQVR42u3Zuw1CQRBDURdBQBv0XxIiJIcIIT7vAzurXftKbuBoInt0OJ6iIsCAAQMGDBgwYMCAAQMGDBhwv1zOV3PwXbgcH/AqtSdbQ2k7mDWattqsAbWlZo2prTNrWG2RGfBI2gozYMCAAVdqm5u5MGDAgMPBlIcAcFwfTlw8EjetxNUycZdO/DyE/pZ4lwIGDBgwbakruGiybCvX+NS2bM1CbcXWXNT/2ZpU+7NZk1J/Zmt27V6zDLS7zPLQbjfLRrvRLCftFrPMtKtm+WmXzbLULpgBu2i/mWWs/WiOB5tp383ZYEvtizkYbKx9NgMOAdtrH+a4xeMGjJmZEzmZVXQAAAAASUVORK5CYII=',
  'base64',
);
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
  if (url.pathname.startsWith('/cdn/')) return send(res, 200, AVATAR, 'image/png');
  if (MEMBERS.test(url.pathname)) return send(res, 200, url.searchParams.has('after') ? '[]' : await fixture('discord/members.json'), 'application/json');
  const name = FIXTURES[url.pathname];
  if (!name) return send(res, 404, '{}', 'application/json');
  return send(res, 200, await fixture(name), 'application/json');
}

createServer((req, res) => {
  answer(req, res).catch(() => send(res, 500, '{}', 'application/json'));
}).listen(PORT, HOST);

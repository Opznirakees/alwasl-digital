import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

// HTTPS keeps production CSP active, including WebKit's insecure-request upgrade.
const port = Number(process.env.PORT || 3000);
const upstreamPort = port + 1;
const directory = mkdtempSync(join(tmpdir(), 'alwasl-e2e-tls-'));
const key = join(directory, 'key.pem');
const cert = join(directory, 'cert.pem');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
  '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });

const child = spawn('bun', ['run', 'start'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(upstreamPort) },
});
const server = Bun.serve({
  hostname: '127.0.0.1',
  port,
  tls: { key: readFileSync(key), cert: readFileSync(cert) },
  async fetch(request) {
    const url = new URL(request.url);
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-proto', 'https');
    headers.set('x-forwarded-host', url.host);
    headers.set('accept-encoding', 'identity');
    url.protocol = 'http:';
    url.hostname = '127.0.0.1';
    url.port = String(upstreamPort);
    try {
      const response = await fetch(new Request(url, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',
      }));
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete('transfer-encoding');
      responseHeaders.delete('connection');
      responseHeaders.delete('content-length');
      return new Response(response.body, { status: response.status, headers: responseHeaders });
    } catch {
      return new Response('Test server starting', { status: 503 });
    }
  },
});
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  server.stop(true);
  child.kill('SIGTERM');
  rmSync(directory, { recursive: true, force: true });
  process.exit(code);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
child.on('error', () => stop(1));
child.on('exit', (code) => stop(code ?? 1));

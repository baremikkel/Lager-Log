// Generates a self-signed certificate for local-network HTTPS (needed for camera access on other devices).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { hostname, networkInterfaces } from 'node:os';

const lanIps = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net && net.family === 'IPv4' && !net.internal)
  .map((net) => net.address);

// Also cover the computer's name (e.g. lager-log.local on the Raspberry Pi), so the
// certificate keeps working if the IP address changes.
const name = hostname().toLowerCase();
const dnsNames = ['localhost', name, `${name}.local`].filter((n, i, all) => n && all.indexOf(n) === i);

const altNames = [...dnsNames.map((n) => `DNS:${n}`), 'IP:127.0.0.1', ...lanIps.map((ip) => `IP:${ip}`)].join(',');

// On Windows, OpenSSL is usually not on PATH but ships with Git for Windows.
function findOpenssl() {
  const candidates = ['openssl'];
  if (process.platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
      'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
    );
  }
  for (const candidate of candidates) {
    if (candidate !== 'openssl' && !existsSync(candidate)) continue;
    try {
      execFileSync(candidate, ['version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // try the next one
    }
  }
  console.error('OpenSSL was not found. On Windows, install Git for Windows (includes OpenSSL) or OpenSSL itself.');
  process.exit(1);
}

mkdirSync('certs', { recursive: true });
execFileSync(findOpenssl(), [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
  '-keyout', 'certs/key.pem',
  '-out', 'certs/cert.pem',
  '-subj', '/CN=Lager-Log local',
  '-addext', `subjectAltName=${altNames}`,
], { stdio: 'inherit' });

console.log(`\nCertificate written to certs/ for: ${altNames}`);
console.log('Add to .env:\n  SSL_KEY_FILE=certs/key.pem\n  SSL_CERT_FILE=certs/cert.pem');

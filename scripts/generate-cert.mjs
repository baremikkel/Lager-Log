// Generates a self-signed certificate for local-network HTTPS (needed for camera access on other devices).
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const lanIps = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net && net.family === 'IPv4' && !net.internal)
  .map((net) => net.address);

const altNames = ['DNS:localhost', 'IP:127.0.0.1', ...lanIps.map((ip) => `IP:${ip}`)].join(',');

mkdirSync('certs', { recursive: true });
execFileSync('openssl', [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
  '-keyout', 'certs/key.pem',
  '-out', 'certs/cert.pem',
  '-subj', '/CN=Lager-Log local',
  '-addext', `subjectAltName=${altNames}`,
], { stdio: 'inherit' });

console.log(`\nCertificate written to certs/ for: ${altNames}`);
console.log('Add to .env:\n  SSL_KEY_FILE=certs/key.pem\n  SSL_CERT_FILE=certs/cert.pem');

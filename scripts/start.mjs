// One-command start for Lager-Log on Windows, Linux and macOS.
//
//   npm start              development mode (watchers + auto-restart)
//   npm run start:prod     production build, then run it
//   add "-- --no-docker" to either to use your own PostgreSQL instead of Docker
//
// Steps: check tools -> check .env -> start the database (Docker) -> wait until
// it is ready -> create tables/default categories -> npm install (if needed) -> run.
// Uses only Node's built-in modules so it works before `npm install`.

import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const isWindows = process.platform === 'win32';
const isProd = process.argv.includes('--prod');
const skipDocker = process.argv.includes('--no-docker');

const REQUIRED_ENV = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const REQUIRED_ENV_DOCKER = ['PGADMIN_EMAIL', 'PGADMIN_PASSWORD'];
const MIN_NODE_MAJOR = 20;
const DB_READY_TIMEOUT_S = 60;

function step(message) {
  console.log(`\n\x1b[36m==>\x1b[0m ${message}`);
}

function fail(message) {
  console.error(`\n\x1b[31mError:\x1b[0m ${message}`);
  process.exit(1);
}

/** Runs a command and returns true if it exited with code 0. */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: isWindows, ...options });
  return result.status === 0;
}

function commandWorks(command, args) {
  return spawnSync(command, args, { stdio: 'ignore', shell: isWindows }).status === 0;
}

function readEnvFile(file) {
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Tools ------------------------------------------------------------------
step('Checking tools');

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < MIN_NODE_MAJOR) {
  fail(`Node.js ${MIN_NODE_MAJOR} or newer is required (you have ${process.versions.node}). Get it from https://nodejs.org`);
}
console.log(`Node.js ${process.versions.node}`);

if (!skipDocker) {
  if (!commandWorks('docker', ['compose', 'version'])) {
    fail(
      'Docker Compose was not found.\n' +
        (isWindows
          ? 'Install Docker Desktop (https://www.docker.com/products/docker-desktop/) and make sure it is running.'
          : 'Install Docker Engine with the Compose plugin (https://docs.docker.com/engine/install/).') +
        '\nIf you use your own PostgreSQL, start with --no-docker.',
    );
  }
  if (!commandWorks('docker', ['info'])) {
    fail(
      isWindows
        ? 'Docker is not running. Start Docker Desktop, wait until it is ready, and try again.'
        : 'Docker is not running, or your user is not allowed to use it.\n' +
            'Start it with "sudo systemctl start docker", or add yourself to the docker group:\n' +
            '  sudo usermod -aG docker $USER   (then log out and back in)',
    );
  }
}

// 2. Configuration ------------------------------------------------------------
step('Checking .env');

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  fail('No .env found, so one was created from .env.example.\nFill in the values in .env (see README) and run the start script again.');
}

const env = readEnvFile('.env');
const required = skipDocker ? REQUIRED_ENV : [...REQUIRED_ENV, ...REQUIRED_ENV_DOCKER];
const missing = required.filter((key) => !env[key]);
if (missing.length > 0) {
  fail(`These values are missing in .env: ${missing.join(', ')}`);
}
console.log('.env is filled in');

// 3. Database -----------------------------------------------------------------
if (!skipDocker) {
  step('Starting the database (Docker)');
  if (!run('docker', ['compose', 'up', '-d'])) fail('Could not start the containers with "docker compose up -d".');

  step('Waiting for PostgreSQL to be ready');
  let ready = false;
  for (let i = 0; i < DB_READY_TIMEOUT_S; i++) {
    if (commandWorks('docker', ['compose', 'exec', '-T', 'db', 'pg_isready', '-q', '-U', env.DB_USER, '-d', env.DB_NAME])) {
      ready = true;
      break;
    }
    await sleep(1000);
  }
  if (!ready) fail(`PostgreSQL was not ready within ${DB_READY_TIMEOUT_S} seconds. Check the log with "docker compose logs db".`);
  console.log('PostgreSQL is ready');

  step('Creating tables and default categories (safe to run repeatedly)');
  const psql = spawn(
    'docker',
    ['compose', 'exec', '-T', '-e', 'PGOPTIONS=-c client_min_messages=warning', 'db', 'psql', '-q', '-v', 'ON_ERROR_STOP=1', '-U', env.DB_USER, '-d', env.DB_NAME],
    { stdio: ['pipe', 'inherit', 'inherit'], shell: isWindows },
  );
  createReadStream(path.join('src', 'services', 'database', 'setup.sql')).pipe(psql.stdin);
  const psqlCode = await new Promise((resolve) => psql.on('close', resolve));
  if (psqlCode !== 0) {
    fail(
      'The database could not be set up.\n' +
        'If you changed DB_USER/DB_PASSWORD/DB_NAME after the database was first created,\n' +
        'they no longer match. See "Troubleshooting" in the README.',
    );
  }
  console.log('Database is ready');
}

// 4. Dependencies ---------------------------------------------------------------
// Also reinstall when package.json/package-lock.json changed after the last install
// (e.g. after a git pull that added packages), otherwise new imports fail to build.
const installMarker = path.join('node_modules', '.package-lock.json');
const dependenciesChanged =
  !existsSync(installMarker) ||
  ['package.json', 'package-lock.json'].some(
    (file) => existsSync(file) && statSync(file).mtimeMs > statSync(installMarker).mtimeMs,
  );
if (dependenciesChanged) {
  step('Installing dependencies (npm install), this takes a while the first time');
  if (!run('npm', ['install'])) fail('npm install failed.');
}

// 5. Run ------------------------------------------------------------------------
const httpsEnabled = env.SSL_KEY_FILE && env.SSL_CERT_FILE;
const httpsPort = env.HTTPS_PORT || '3443';
console.log('\n\x1b[32mStarting Lager-Log\x1b[0m');
console.log('  http://localhost:3000');
if (httpsEnabled) console.log(`  https://localhost:${httpsPort}   (from a phone/tablet: https://<this-computer's-IP>:${httpsPort})`);
if (!skipDocker) console.log('  pgAdmin: http://localhost:5050');
console.log('Stop with Ctrl+C. The database keeps running; stop it with "docker compose stop".\n');

if (isProd) {
  step('Building production version');
  if (!run('npm', ['run', 'build:prod'])) fail('Build failed.');
  run('node', [path.join('dist', 'server.js')], { shell: false });
} else {
  run('npm', ['run', 'dev']);
}

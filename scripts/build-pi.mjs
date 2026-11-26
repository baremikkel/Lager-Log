// Builds a ready-to-run package for the Raspberry Pi in release/lager-log (+ release/lager-log.tar.gz).
//
//   npm run build:pi
//
// A Pi Zero can't build the project itself (esbuild and Tailwind have no ARMv6 version),
// so the production build happens here and only the finished files are copied to the Pi.
// See "Raspberry Pi" in the README for how to install it.

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const isWindows = process.platform === 'win32';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: isWindows });
  if (result.status !== 0) {
    console.error(`\n"${command} ${args.join(' ')}" failed.`);
    process.exit(1);
  }
}

console.log('==> Building production version');
run('npm', ['run', 'build:prod']);

const releaseRoot = path.join(root, 'release');
const target = path.join(releaseRoot, 'lager-log');
console.log(`\n==> Collecting files in ${path.relative(root, target)}`);
rmSync(releaseRoot, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

// Everything the server needs at runtime (see src/server.ts), plus database and setup scripts.
const files = [
  'dist',
  'views',
  'src/public/images',
  'src/services/database/setup.sql',
  'src/services/database/seed_fruit_vegetables.sql',
  'scripts/db-setup.mjs',
  'scripts/generate-cert.mjs',
  'deploy',
  'package.json',
  'package-lock.json',
  '.env.example',
];
for (const file of files) {
  if (!existsSync(file)) continue; // e.g. no images folder yet
  cpSync(file, path.join(target, file), { recursive: true });
}

console.log('==> Packing release/lager-log.tar.gz');
run('tar', ['-czf', 'release/lager-log.tar.gz', '-C', 'release', 'lager-log']);

console.log('\nDone. Copy it to the Pi with:');
console.log('  scp release/lager-log.tar.gz lager-log:~');

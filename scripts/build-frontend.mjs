import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { context, build } from 'esbuild';

const sourceDirectory = path.resolve('src/public/ts');
const outputDirectory = path.resolve('dist/public/js');

async function findTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findTypeScriptFiles(entryPath)
        : entry.isFile() && entry.name.endsWith('.ts')
          ? [entryPath]
          : [];
    }),
  );
  return files.flat();
}

const entryPoints = await findTypeScriptFiles(sourceDirectory);
if (entryPoints.length === 0) {
  throw new Error(`No TypeScript entry points found in ${sourceDirectory}`);
}

const options = {
  entryPoints,
  bundle: true,
  minify: process.argv.includes('--minify'),
  outbase: sourceDirectory,
  outdir: outputDirectory,
};

if (process.argv.includes('--watch')) {
  const watcher = await context(options);
  await watcher.watch();
  console.log(`Watching ${sourceDirectory} for frontend changes`);
} else {
  await build(options);
}

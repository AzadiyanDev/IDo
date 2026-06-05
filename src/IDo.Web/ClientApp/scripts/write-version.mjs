import { mkdir, readFile, writeFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const version = `${packageJson.version}+${stamp}`;

await mkdir(new URL('../public', import.meta.url), { recursive: true });
await writeFile(
  new URL('../public/version.json', import.meta.url),
  `${JSON.stringify({ version, builtAtUtc: now.toISOString() }, null, 2)}\n`,
  'utf8'
);

console.log(`Wrote version ${version}`);

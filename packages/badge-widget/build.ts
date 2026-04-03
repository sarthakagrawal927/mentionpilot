import { build } from 'esbuild';

const watch = process.argv.includes('--watch');

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: 'dist/mentionpilot-badge.min.js',
  ...(watch ? { watch: true } : {}),
});

if (!watch) {
  // Also build unminified for debugging
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: false,
    format: 'iife',
    target: 'es2020',
    outfile: 'dist/mentionpilot-badge.js',
  });
}

// Build script — minifies JS and CSS using esbuild
// Usage: npm run build
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');

async function minify() {
  const files = [
    { src: 'app.js', out: 'app.min.js', loader: 'js' },
    { src: 'admin.js', out: 'admin.min.js', loader: 'js' },
    { src: 'secure-storage.js', out: 'secure-storage.min.js', loader: 'js' },
    { src: 'app.css', out: 'app.min.css', loader: 'css' },
    { src: 'admin.css', out: 'admin.min.css', loader: 'css' },
  ];

  for (const f of files) {
    const content = readFileSync(f.src, 'utf8');
    const result = await build({
      stdin: { contents: content, loader: f.loader },
      write: false,
      minify: true,
      target: ['es2020'],
    });
    writeFileSync(f.out, result.outputFiles[0].text);
    const savings = ((1 - result.outputFiles[0].text.length / content.length) * 100).toFixed(0);
    console.log(`${f.src} → ${f.out} (${savings}% smaller)`);
  }
}

minify().catch(e => { console.error(e); process.exit(1); });

import { mkdir,copyFile,readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root=new URL('../',import.meta.url),ui=new URL('../../ui/',import.meta.url);
const {version}=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))throw Error('Package version cannot be used in asset filenames.');
await mkdir(new URL('fonts/',ui),{recursive:true});
const fonts=[['sans',[400,500,600,700]],['mono',[400,500,600]]];
for(const [family,weights] of fonts){
  for(const weight of weights){
    const file=`ibm-plex-${family}-latin-${weight}-normal.woff2`;
    await copyFile(new URL(`node_modules/@fontsource/ibm-plex-${family}/files/${file}`,root),new URL(`fonts/${file}`,ui));
  }
  await copyFile(new URL(`node_modules/@fontsource/ibm-plex-${family}/LICENSE`,root),new URL(`fonts/ibm-plex-${family}-LICENSE.txt`,ui));
}
await copyFile(new URL('styles.css',root),new URL('styles.css',ui));
await build({entryPoints:[fileURLToPath(new URL('app.js',root))],bundle:true,format:'iife',platform:'browser',target:'es2020',outfile:fileURLToPath(new URL('app.js',ui)),logLevel:'info'});
const template=await readFile(new URL('index.html',ui),'utf8');
if(!template.includes('href="styles.css"')||!template.includes('src="app.js"'))throw Error('The compatible HTML entry must reference styles.css and app.js.');
const versioned=template.replace('href="styles.css"',`href="styles-${version}.css"`).replace('src="app.js"',`src="app-${version}.js"`);
await Promise.all([
  copyFile(new URL('app.js',ui),new URL(`app-${version}.js`,ui)),
  copyFile(new URL('styles.css',ui),new URL(`styles-${version}.css`,ui)),
  writeFile(new URL(`index-${version}.html`,ui),versioned,'utf8')
]);
console.log(`Versioned entry: index-${version}.html`);

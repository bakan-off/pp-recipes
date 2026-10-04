import fs from 'node:fs/promises';
import path from 'node:path';
const enhanced=process.argv.includes('--enhanced');
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist');
for(const name of await fs.readdir('.'))if(/\.(html|jpg|png)$/.test(name))await fs.copyFile(name,path.join('dist',name));
await fs.cp('assets','dist/assets',{recursive:true});
if(enhanced){
 const {build}=await import('esbuild');
 await build({entryPoints:['src/enhancements.jsx'],bundle:true,minify:true,format:'iife',outfile:'dist/assets/enhancements.js',target:['es2020']});
 for(const name of await fs.readdir('dist'))if(name.endsWith('.html')){
  const p=path.join('dist',name);const html=await fs.readFile(p,'utf8');await fs.writeFile(p,html.replace('</body>','<script src="assets/enhancements.js" defer></script></body>'));
 }
}
console.log(enhanced?'Enhanced build complete: dist/':'Offline static build complete: dist/ (CSS motion, no external libraries)');

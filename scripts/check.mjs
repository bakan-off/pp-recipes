import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
for(const file of ['assets/app.js','assets/recipes-data.js','scripts/serve.mjs','scripts/build.mjs','scripts/check.mjs','scripts/test.mjs'])execFileSync(process.execPath,['--check',file]);
const context={window:{}};vm.runInNewContext(fs.readFileSync('assets/recipes-data.js','utf8'),context);
const recipes=context.window.RECIPES;assert.equal(recipes.length,16);assert.equal(recipes.reduce((n,r)=>n+r.variants.length,0),24);
for(const r of recipes){assert(fs.existsSync(r.slug));assert(fs.existsSync(r.image));assert(r.title);for(const v of r.variants){assert(v.baseServings>=1&&v.baseServings<=20);assert(v.total?.kcal>0);assert(v.per100?.kcal>0);assert(v.steps.length>0);assert(v.ingredients.some(i=>i.name&&i.amount));for(const m of v.total.macros)assert(Number.isFinite(m.value));}}
for(const name of fs.readdirSync('.').filter(n=>n.endsWith('.html'))){const html=fs.readFileSync(name,'utf8');assert(!html.includes('onclick='));assert(html.includes('assets/styles.css'));}
console.log('PASS: JS syntax; 16 routes; 24 variants; nutrition, ingredient and image references.');

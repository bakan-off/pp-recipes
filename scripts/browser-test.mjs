/* Real Chromium tests; starts and stops its own local server. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const BASE='http://127.0.0.1:4184',OUT=process.env.QA_DIR||'qa-output';fs.mkdirSync(OUT,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4184'},stdio:'ignore'});
let browser;const results=[],errors=[];let checks=0;
function ok(condition,message){assert(condition,message);checks++;}
try{
 for(let i=0;i<50;i++){try{await fetch(BASE);break;}catch{await new Promise(r=>setTimeout(r,100));}}
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))errors.push(`${r.status()} ${r.url()}`);});
 const c={window:{}};vm.runInNewContext(fs.readFileSync('assets/recipes-data.js','utf8'),c);const recipes=c.window.RECIPES;
 async function capture(name){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});await page.screenshot({path:`${OUT}/${name}.png`});}
 async function layout(){const d=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));ok(d.scroll<=d.w+1,`Horizontal page overflow ${d.scroll}/${d.w} at ${page.url()}`);}
 // Every route at phone, narrow-phone and desktop sizes; every variant loads too.
 if(!process.env.PP_SMOKE){
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:width>760?1000:844});
  for(const slug of ['index.html',...recipes.map(r=>r.slug),'editor.html']){
   await page.goto(`${BASE}/${slug}`);await page.locator('h1').waitFor();await layout();
   ok((await page.locator('h1').innerText()).trim().length>0,`Title missing ${slug}`);
   if(width===390||width===1440)await capture(`${width}-${slug.replace('.html','')}`);
  }
 }
 results.push('36 routes × 3 viewport widths: layout and rendering passed');
 for(const r of recipes)for(const v of r.variants){await page.goto(`${BASE}/${r.slug}?v=${v.id}`);ok(await page.evaluate(()=>window.PPRecipe.snapshot().variantId)===v.id,'Variant deep link');}
 results.push('66 variant deep links passed');console.log('Routes, layouts and variants passed');
 }
 await page.setViewportSize({width:390,height:844});await page.goto(`${BASE}/pp-khachapuri.html`);await page.locator('[data-scale-ing="3"]').click();await page.locator('#ing-input-3').fill('90');await page.locator('[data-apply-item-change="3"]').click();
 ok((await page.locator('#ing-row-3 .ing-amount').innerText()).startsWith('90'),'Single-item quantity');ok((await page.locator('#ing-row-0 .ing-amount').innerText()).startsWith('180'),'Other quantities untouched');
 await page.locator('#cooking-mode').click();await page.locator('#next-step').click();const step=await page.locator('#focus-body').innerText();ok(step.includes('90 г')&&!step.includes('180 г'),'Step quantity synchronized');ok(!step.includes('56 г белка'),'Stale embedded nutrition claim removed');ok(await page.locator('[id*="voice-control"]').count()===0,'No voice control');await capture('cooking-modified-mobile');await page.locator('#close-focus').click();
 await page.reload();ok(await page.evaluate(()=>window.PPRecipe.snapshot().activeSwaps[3]?.grams)===90,'Draft survives reload');await page.locator('#cooking-mode').click();ok((await page.locator('#focus-count').innerText()).includes('2'),'Cooking resumes');await page.locator('#close-focus').click();
 await page.locator('#detail-plan-btn').click();await page.locator('#planner-toggle').evaluate(el=>el.click());await page.locator('#planner-to-cart').click();const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('pp-shopping-cart-v1')));ok(cart.at(-1).items.some(x=>x.name.includes('GENIfit')&&x.amount.startsWith('15 ')),'Custom 90g/6 reaches planner shopping list as 15g per portion');await capture('shopping-mobile');await page.locator('#close-shopping').click();
 await page.locator('#save-personal-version').click();await page.locator('#version-form input[name="name"]').fill('Мой хачапури');await page.locator('#version-form textarea').fill('Проверочная заметка');await page.locator('#version-form button').click();ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('pp-versions-v2'))[0].name)==='Мой хачапури','Named version saved');
 await page.locator('[data-open-personal]').first().click();await capture('personal-mobile');await page.locator('#new-pantry').click();await page.locator('#pantry-form input[name="name"]').fill('Тестовый творог');for(const[k,v]of Object.entries({kcal:'120',p:'18',f:'4',c:'3'}))await page.locator(`#pantry-form input[name="${k}"]`).fill(v);await page.locator('#pantry-form button.primary').click();ok((await page.locator('#personal-dialog').innerText()).includes('Тестовый творог'),'Pantry saved');
 const backupDownload=page.waitForEvent('download');await page.locator('#export-personal').click();const backup=await backupDownload;await backup.saveAs(`${OUT}/roundtrip-backup.json`);const backupData=JSON.parse(fs.readFileSync(`${OUT}/roundtrip-backup.json`,'utf8'));ok(backupData.format==='pp-recipes-backup','Backup exported');
 await page.locator('#import-personal').setInputFiles(`${OUT}/roundtrip-backup.json`);await page.locator('#confirm-restore').waitFor();await page.locator('#cancel-restore').click();
 await page.locator('#import-personal').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"nope"}')});await page.waitForFunction(()=>document.getElementById('backup-result')?.innerText.includes('не загружена'));ok(true,'Invalid backup safely rejected');await page.locator('#import-personal').setInputFiles(`${OUT}/roundtrip-backup.json`);await page.locator('#confirm-restore').waitFor();await Promise.all([page.waitForNavigation(),page.locator('#confirm-restore').click()]);ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('pp-pantry-v2')).length)===1,'Backup restore roundtrip');
 await page.locator('[data-scale-ing="2"]').click();await page.locator('#ing-pop-2 .product-replacement summary').click();await page.locator('[data-pick-pantry="2"]').click();await page.locator('[data-pantry="0"]').click();ok(await page.locator('#ing-custom-name-2').inputValue()==='Тестовый творог','Pantry selects product');await page.locator('[data-apply-item-change="2"]').click();ok((await page.locator('#ing-row-2').innerText()).includes('Тестовый творог'),'Pantry replacement applied');
 // FatSecret UI / image export without changing barcode algorithm.
 await page.locator('#open-fatsecret-btn').click();ok(await page.locator('#fatsecret-body svg').count()>0,'FatSecret barcode renders');await capture('fatsecret-mobile');await page.locator('#close-fatsecret').click();
 await page.locator('.share-toolbar summary').click();await page.locator('#download-card-png').click();await page.locator('dialog[open] img').waitFor();ok(await page.locator('dialog[open] img').evaluate(el=>el.complete&&el.naturalWidth>0),'PNG card export renders');await capture('card-export-mobile');await page.keyboard.press('Escape');
 results.push('Recipe → modification → steps → reload → resume → planner → cart → saved version → pantry → backup passed');
 // Editor: create a real recipe, calculate from explicit labels, preview and download valid JSON.
 await page.goto(`${BASE}/editor.html`);for(const[k,v]of Object.entries({title:'Тестовый завтрак',shortTitle:'Тестовый завтрак',slug:'test-breakfast.html',description:'Проверка редактора.',image:'cheesecake.png'}))await page.locator(`[name="${k}"]`).fill(v);
 await page.locator('[data-ing="0"][data-field="name"]').fill('Творог 5%');await page.locator('[data-ing="0"][data-field="amount"]').fill('200 г');for(const[k,v]of Object.entries({kcal:'120',p:'18',f:'4',c:'3'}))await page.locator(`[data-ing="0"][data-macro="${k}"]`).fill(v);await page.locator('[data-step="0"][data-field="html"]').fill('<p>Подготовьте {{ingredient:0}}.</p>');await page.locator('#calculate-nutrition').click();await page.locator('#editor-preview').click();ok((await page.locator('#editor-preview-body').innerText()).includes('200 г'),'Editor token preview');await capture('editor-preview-mobile');await page.locator('#close-editor-preview').click();const jsonDownload=page.waitForEvent('download');await page.locator('button[type="submit"]').click();const json=await jsonDownload;await json.saveAs(`${OUT}/test-breakfast.json`);const rr=JSON.parse(fs.readFileSync(`${OUT}/test-breakfast.json`,'utf8'));ok(rr.variants[0].total.kcal===240,'Editor calculates nutrition from labels');ok(rr.variants[0].ingredients[0].nutrition.p===18,'Editor retains ingredient nutrition');
 await page.reload();ok(await page.locator('[name="title"]').inputValue()==='Тестовый завтрак','Editor draft survives reload');await capture('editor-mobile');console.log('Editor passed');
 await page.setViewportSize({width:1440,height:1000});await page.goto(BASE);await capture('home-desktop');await page.locator('#theme-toggle').click();await capture('home-dark-desktop');await page.goto(`${BASE}/caramel-cheesecake.html`);await page.locator('#toggle-compare-variants').click();ok(await page.locator('.variant-insight').count()===await page.evaluate(()=>window.PPRecipe.recipe.variants.length),'Comparison cards');await capture('comparison-dark-desktop');await page.locator('#cooking-mode').click();for(let i=0;i<20&&await page.locator('#focus-timers button').count()===0;i++)await page.locator('#next-step').click();await page.locator('#focus-timers button').first().click();ok(await page.locator('#kitchen-timer-widget').isVisible(),'Cooking timer starts');await capture('timer-dark-desktop');await page.keyboard.press('Escape');
 // HTML remains usable without JavaScript.
 const nojs=await browser.newContext({javaScriptEnabled:false});const np=await nojs.newPage();await np.goto(`${BASE}/pp-khachapuri.html`);ok(await np.locator('#ingredients li').count()>=6,'Static recipe ingredients without JS');ok(await np.locator('#method li').count()>=5,'Static recipe steps without JS');await nojs.close();
 // Genuine Service Worker offline navigation: query parameters map to cached document.
 const offline=await browser.newContext({serviceWorkers:'allow'});const op=await offline.newPage();await op.goto(BASE);await op.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service Worker install timed out')),10000))]));await op.reload();await op.goto(`${BASE}/pp-khachapuri.html`);await op.locator('h1').waitFor();await op.waitForTimeout(350);await offline.setOffline(true);await op.reload();ok((await op.locator('h1').innerText()).includes('хачапури'),'Previously opened recipe works offline');await offline.setOffline(false);await offline.close();
 ok(errors.length===0,'No browser / HTTP errors: '+errors.slice(0,8).join('; '));results.push('Dark theme, comparison, timer, PNG card, static HTML and offline reload passed');
 fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({passed:true,checks,results,errors},null,2));console.log(JSON.stringify({passed:true,checks,results,errors},null,2));await context.close();
}catch(e){fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({passed:false,checks,results,errors,failure:e.stack},null,2));console.error(e);process.exitCode=1;}
finally{await browser?.close();server.kill();}

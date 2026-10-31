import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const SITE_BASE='https://bakan-off.github.io/pp-recipes/';
const sync=process.argv.includes('--sync-html');
const ctx={window:{}};vm.runInNewContext(await fs.readFile('assets/recipes-data.js','utf8'),ctx);const recipes=ctx.window.RECIPES;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let images={};try{images=JSON.parse(await fs.readFile('assets/image-manifest.json','utf8'));}catch{}
await fs.writeFile('assets/image-map.js',`window.PPImages=${JSON.stringify(images)};\n`);
const macro=(n,l)=>n?.macros?.find(x=>x.label===l)?.value||0;
function image(src,alt,lazy=false){const a=images[src];return `<img src="${E(a?.[1]?.src||src)}" ${a?`srcset="${a.map(x=>E(x.src)+' '+x.width+'w').filter((x,i,ar)=>ar.indexOf(x)===i).join(', ')}" sizes="(max-width: 760px) 100vw, 600px"`:''} alt="${E(alt)}" width="${a?.[1]?.width||600}" height="${a?.[1]?.height||450}" ${lazy?'loading="lazy"':'fetchpriority="high"'} decoding="async">`;}
const nav=`<nav class="nav" aria-label="Основная навигация"><a class="brand" href="index.html">ПП · рецепты</a><a class="nav-link" href="index.html#catalog">Рецепты</a></nav>`;
function fallback(r){if(!r)return `<div class="shell">${nav}<main id="main"><section class="editorial-hero"><div class="hero-copy"><div class="eyebrow">Рецепты, которые подстраиваются под вас</div><h1>Ваши продукты.<br><em>Ваш рецепт.</em></h1><p>Высокобелковые блюда с расчётом КБЖУ. Выберите рецепт, измените продукты и готовьте пошагово.</p><a class="primary" href="#catalog">Выбрать рецепт</a></div>${image(recipes[0].image,recipes[0].shortTitle)}</section><section id="catalog"><h2>На вашей кухне</h2><div class="recipe-grid">${recipes.map(x=>`<a class="recipe-card" href="${E(x.slug)}">${image(x.image,x.shortTitle,true)}<div class="card-body"><h3>${E(x.shortTitle)}</h3><p>${E(x.time)} · ${x.variants[0].per100.kcal} ккал / 100 г</p></div></a>`).join('')}</div></section></main></div>`;
const v=r.variants.find(x=>x.id===r.defaultVariant)||r.variants[0];
return `<div class="shell">${nav}<main id="main"><article><section class="detail-hero"><div><p>${E(r.category)} · ${E(r.time)}</p><h1>${E(r.shortTitle)}</h1><p>${E(r.description)}</p><a class="primary" href="#ingredients">К ингредиентам</a></div><div class="detail-image">${image(r.image,r.shortTitle)}</div></section><section id="ingredients"><h2>Ингредиенты · ${v.baseServings} порций</h2><ul>${v.ingredients.map(x=>x.group?`<li><strong>${E(x.group)}</strong></li>`:`<li>${E(x.name)} — ${E(x.amount)}</li>`).join('')}</ul></section><section><h2>Пищевая ценность</h2><p>На 100 г: ${v.per100.kcal} ккал · Б ${macro(v.per100,'Белки')} г · Ж ${macro(v.per100,'Жиры')} г · У ${macro(v.per100,'Углеводы')} г</p></section><section id="method"><h2>Шаг за шагом</h2><ol class="steps">${v.steps.map(x=>`<li class="step"><div><h3>${E(x.title)}</h3>${x.html.replace(/<img\b[^>]*src="([^"]+)"[^>]*>/gi,(_,src)=>image(src,'Шаг приготовления',true)).replace(/\{\{ingredient:(\d+)\}\}/g,(_,i)=>E(v.ingredients[i]?.name||'')+' — '+E(v.ingredients[i]?.amount||''))}</div></li>`).join('')}</ol></section>${r.variants.length>1?`<section><h2>Другие варианты</h2>${r.variants.slice(1).map(x=>`<h3>${E(x.name)}</h3><ul>${x.ingredients.filter(y=>!y.group).map(y=>`<li>${E(y.name)} — ${E(y.amount)}</li>`).join('')}</ul>`).join('')}</section>`:''}</article></main></div>`;
}
function minutes(s){const m=String(s).match(/(\d+)(?:[–-](\d+))?\s*(мин|час)/);return m?(+(m[2]||m[1]))*(m[3]==='час'?60:1):null;}
function schema(r){const v=r.variants.find(x=>x.id===r.defaultVariant)||r.variants[0],m=minutes(r.time);return JSON.stringify({'@context':'https://schema.org','@type':'Recipe',name:r.shortTitle,description:r.description,image:[SITE_BASE+(images[r.image]?.[2]?.src||r.image)],author:{'@type':'Person',name:'Андрей Баканов'},recipeCategory:r.category,keywords:r.tags.join(', '),recipeYield:`${v.baseServings} порций`,...(m?{totalTime:`PT${m}M`}:{}),nutrition:{'@type':'NutritionInformation',servingSize:'100 г',calories:`${v.per100.kcal} kcal`,proteinContent:`${macro(v.per100,'Белки')} g`,fatContent:`${macro(v.per100,'Жиры')} g`,carbohydrateContent:`${macro(v.per100,'Углеводы')} g`},recipeIngredient:v.ingredients.filter(x=>!x.group).map(x=>`${x.name} — ${x.amount}`),recipeInstructions:v.steps.map((x,i)=>({'@type':'HowToStep',position:i+1,name:x.title,text:x.html.replace(/\{\{ingredient:(\d+)\}\}/g,(_,i)=>(v.ingredients[i]?.name||'')+' — '+(v.ingredients[i]?.amount||'')).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()}))}).replace(/</g,'\\u003c');}
const manifest={name:'ПП · рецепты — Ваши продукты. Ваш рецепт.',short_name:'ПП · рецепты',description:'Рецепты под ваши продукты и порции: КБЖУ, покупки и пошаговая готовка.',id:'./',start_url:'./index.html',scope:'./',display:'standalone',background_color:'#FAF8F5',theme_color:'#59674F',lang:'ru',icons:[192,512].map(n=>({src:`assets/icons/icon-${n}.png`,sizes:`${n}x${n}`,type:'image/png',purpose:'any maskable'}))};
const hash=createHash('sha256');for(const f of ['assets/app.js','assets/personal.js','assets/styles.css','assets/recipes-data.js','assets/image-map.js'])hash.update(await fs.readFile(f));const version=hash.digest('hex').slice(0,12);
const sw=`/* Generated from content hash; network-first documents and code, cached images. */
const CACHE='pp-recipes-${version}';
const CORE=['./index.html','./assets/app.js','./assets/styles.css','./assets/personal.js','./assets/recipes-data.js','./assets/image-map.js','./assets/fonts/editorial.woff','./assets/fonts/sans.woff','./assets/icons/icon-192.png','./assets/icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pp-recipes-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 const key=new Request(u.origin+u.pathname),image=/\\.(webp|png|jpg|woff|woff2)$/.test(u.pathname);
 e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(key);if(image&&hit)return hit;try{const response=await fetch(e.request);if(response.ok){await cache.put(key,response.clone());const keys=await cache.keys();if(keys.length>220)await cache.delete(keys.find(k=>/\\.(webp|jpg|png)$/.test(k.url))||keys[0]);}return response;}catch{if(hit)return hit;if(e.request.mode==='navigate')return new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Нет подключения</title><body style="font:18px/1.6 system-ui;padding:24px"><h1>Этот рецепт ещё не сохранён</h1><p>Подключитесь к сети и откройте его один раз. Уже открытые рецепты доступны офлайн.</p><a href="index.html">К сохранённому каталогу</a></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});return Response.error();}})());
});`;
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist');
for(const [name,contents] of [['manifest.webmanifest',JSON.stringify(manifest,null,2)],['sw.js',sw]]){await fs.writeFile('dist/'+name,contents);if(sync)await fs.writeFile(name,contents);}
for(const name of await fs.readdir('.')){
 if(/\.(jpg|png)$/.test(name))await fs.copyFile(name,'dist/'+name);
 if(!name.endsWith('.html'))continue;
 if(name==='editor.html'){await fs.copyFile(name,'dist/'+name);continue;}
 const r=recipes.find(x=>x.slug===name);let html=await fs.readFile(name,'utf8');
 html=html.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*rel="canonical"[^>]*>/g,'');
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${E(r?r.shortTitle+' | ПП · рецепты':'ПП · рецепты — Ваши продукты. Ваш рецепт.')}</title>`);
 html=html.replace(/<meta[^>]*property="og:(image|title|description)"[^>]*>/g,'');
 html=html.replace('</head>',`<link rel="canonical" href="${SITE_BASE+name}"><meta property="og:title" content="${E(r?r.shortTitle:'ПП · рецепты — Ваши продукты. Ваш рецепт.')}"><meta property="og:description" content="${E(r?r.description:'Рецепты под ваши продукты и порции: пересчёт КБЖУ, список покупок и пошаговая готовка.')}"><meta property="og:image" content="${SITE_BASE+(images[(r||recipes[0]).image]?.[2]?.src||(r||recipes[0]).image)}"><link rel="icon" href="assets/icons/icon-192.png"><link rel="apple-touch-icon" href="assets/icons/icon-192.png">${r?`<script type="application/ld+json" id="recipe-schema-ld">${schema(r)}</script>`:''}</head>`);
 if(!html.includes('rel="manifest"'))html=html.replace('</head>','<link rel="manifest" href="manifest.webmanifest"></head>');
 // Replace the entire generated app container, retaining page-specific head metadata.
 const from=html.indexOf('<div id="app">'),end=html.indexOf('<script',from);
 if(from<0||end<0)throw Error('Missing application shell in '+name);
 html=html.slice(0,from)+`<div id="app">${fallback(r)}</div><noscript><p class="shell">Интерактивный пересчёт, покупки и таймеры требуют JavaScript. Исходный рецепт доступен выше.</p></noscript><script defer src="assets/image-map.js"></script><script defer src="assets/recipes-data.js"></script><script defer src="assets/app.js"></script><script defer src="assets/personal.js"></script>`+'</body></html>\n';
 await fs.writeFile('dist/'+name,html);if(sync)await fs.writeFile(name,html);
}
await fs.cp('assets','dist/assets',{recursive:true});
for(const f of ['.nojekyll','robots.txt','sitemap.xml']){if(f==='.nojekyll')await fs.writeFile('dist/'+f,'');}
const sitemap=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['index.html',...recipes.map(x=>x.slug)].map(x=>`<url><loc>${SITE_BASE+x}</loc></url>`).join('')}</urlset>`;
for(const[name,body]of [['sitemap.xml',sitemap],['robots.txt',`User-agent: *\nAllow: /\nDisallow: /editor.html\nSitemap: ${SITE_BASE}sitemap.xml\n`]]){await fs.writeFile('dist/'+name,body);if(sync)await fs.writeFile(name,body);}
console.log(`Built ${recipes.length} recipes / ${recipes.reduce((n,r)=>n+r.variants.length,0)} variants. Static HTML + schema + responsive images + cache ${version}.`);

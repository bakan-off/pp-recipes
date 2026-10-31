/* Personal kitchen. No accounts, telemetry, network storage or microphone. */
(() => {
'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,def)=>{try{return JSON.parse(localStorage.getItem(key))??def;}catch{return def;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{notice('Не удалось сохранить: проверьте свободное место и настройки браузера.');return false;}};
function notice(text){let el=document.getElementById('personal-status');if(!el){el=document.createElement('p');el.id='personal-status';el.className='toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=text;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),4000);}
function download(name,value,type='application/json'){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
const numeric=(v,max=100000)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
function validState(s){
 if(!s||typeof s!=='object'||typeof s.slug!=='string')return false;
 const r=window.RECIPES.find(x=>x.slug===s.slug),v=r?.variants.find(x=>x.id===s.variantId);
 if(!v||!Number.isInteger(s.servings)||s.servings<1||s.servings>20||!(s.customRatio===null||numeric(s.customRatio,10)&&s.customRatio>0))return false;
 if(!s.activeSwaps||typeof s.activeSwaps!=='object'||Array.isArray(s.activeSwaps)||Object.keys(s.activeSwaps).length>v.ingredients.length)return false;
 for(const [k,x] of Object.entries(s.activeSwaps)){
  if(!/^\d+$/.test(k)||!v.ingredients[+k]||!x||!numeric(x.grams)||['kcal','p','f','c'].some(y=>!numeric(x[y],y==='kcal'?1000:100)))return false;
  for(const n of ['name','shortName'])if(typeof x[n]!=='string'||x[n].length>250)return false;
 }
 if(!Array.isArray(s.customAddedIngredients)||s.customAddedIngredients.length>50)return false;
 return s.customAddedIngredients.every(x=>x&&typeof x.name==='string'&&x.name.length<=250&&typeof x.id==='string'&&numeric(x.grams)&&['kcal','p','f','c'].every(y=>numeric(x[y],y==='kcal'?1000:100)));
}
window.PPStorage={validState};
const dlg=document.createElement('dialog');dlg.className='shopping-dialog personal-dialog';dlg.id='personal-dialog';dlg.setAttribute('aria-labelledby','personal-title');document.body.append(dlg);
function close(){dlg.close();}
function frame(title,body){dlg.innerHTML=`<div class="dialog-inner"><div class="dialog-header"><div><small>ВАШЕ МЕСТО НА КУХНЕ</small><h2 id="personal-title">${E(title)}</h2></div><button type="button" class="icon-button" id="personal-close" aria-label="Закрыть мою кухню">×</button></div>${body}</div>`;dlg.querySelector('#personal-close').onclick=close;if(!dlg.open)dlg.showModal();}
dlg.addEventListener('click',e=>{if(e.target===dlg){const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
const pantry=()=>read('pp-pantry-v2',[]);
function openPersonal(){
 const versions=read('pp-versions-v2',[]);
 frame('Моя кухня',`<p class="personal-intro">Любимые продукты, удачные версии и заметки. Всё хранится только в этом браузере — без регистрации.</p><div class="personal-actions"><button class="share-btn" id="personal-planner">Мой рацион на день</button><button class="share-btn" id="personal-favorites">Избранное</button></div><section class="personal-section"><h3>Мои продукты</h3><div class="pantry-list">${pantry().map((x,i)=>`<div class="personal-row"><div><strong>${E(x.name)}</strong><small>${x.kcal} ккал · Б ${x.p} · Ж ${x.f} · У ${x.c} / 100 г</small></div><button type="button" class="text-button" data-delete-pantry="${i}" aria-label="Удалить продукт ${E(x.name)}">Удалить</button></div>`).join('')||'<p class="muted">Добавьте КБЖУ с упаковки — их можно будет выбрать при замене.</p>'}</div><button class="primary" id="new-pantry">Добавить продукт</button></section><section class="personal-section"><h3>Мои версии рецептов</h3>${versions.map((x,i)=>`<div class="personal-row"><div><a href="${E(x.state.slug)}?personal=${E(x.id)}"><strong>${E(x.name)}</strong></a><small>${E(x.note||'Без заметки')}</small></div><button class="text-button" data-delete-version="${i}" aria-label="Удалить версию ${E(x.name)}">Удалить</button></div>`).join('')||'<p class="muted">Откройте рецепт, измените продукты и нажмите «Сохранить мою версию».</p>'}</section><section class="personal-section"><h3>Резервная копия</h3><p>Очистка данных браузера удалит сохранения. Экспортируйте JSON, чтобы перенести их на другое устройство. Импорт заменяет только данные этого сайта.</p><div class="personal-actions"><button class="share-btn" id="export-personal">Скачать копию</button><label class="share-btn file-label">Восстановить из файла<input type="file" id="import-personal" accept="application/json,.json" hidden></label></div><p id="backup-result" role="status"></p></section><a class="editor-link" href="editor.html">Открыть редактор рецептов →</a>`);
 dlg.querySelector('#personal-planner').onclick=()=>{close();document.getElementById('planner-toggle').click();};
 dlg.querySelector('#personal-favorites').onclick=()=>{sessionStorage.setItem('pp-catalog-state-v1',JSON.stringify({filter:'Избранное'}));location.href='index.html#catalog';};
 dlg.querySelector('#new-pantry').onclick=()=>productForm();
 dlg.querySelectorAll('[data-delete-pantry]').forEach(b=>b.onclick=()=>{const a=pantry();a.splice(+b.dataset.deletePantry,1);write('pp-pantry-v2',a);openPersonal();});
 dlg.querySelectorAll('[data-delete-version]').forEach(b=>b.onclick=()=>{const a=read('pp-versions-v2',[]);a.splice(+b.dataset.deleteVersion,1);write('pp-versions-v2',a);openPersonal();});
 dlg.querySelector('#export-personal').onclick=()=>{const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowedKey(k))data[k]=localStorage.getItem(k);}download('pp-recipes-backup.json',JSON.stringify({format:'pp-recipes-backup',version:2,exported:new Date().toISOString(),data},null,2));};
 dlg.querySelector('#import-personal').onchange=async e=>{
  const status=dlg.querySelector('#backup-result');try{
   const f=e.target.files[0];if(!f||f.size>1500000)throw Error('Выберите JSON до 1,5 МБ.');const b=JSON.parse(await f.text());validateBackup(b);
   frame('Восстановить копию?',`<p>Будут заменены сохранения этого сайта из файла (${Object.keys(b.data).length} записей). Сначала скачайте текущую копию, если хотите её сохранить.</p><div class="personal-actions"><button class="primary" id="confirm-restore">Восстановить</button><button class="share-btn" id="cancel-restore">Отмена</button></div>`);
   dlg.querySelector('#cancel-restore').onclick=openPersonal;
   dlg.querySelector('#confirm-restore').onclick=()=>{const before={};for(const k of Object.keys(b.data))before[k]=localStorage.getItem(k);try{for(const[k,v]of Object.entries(b.data))localStorage.setItem(k,v);location.reload();}catch(err){for(const[k,v]of Object.entries(before)){try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{}}notice('Не удалось восстановить копию. Исходные данные возвращены.');}};
  }catch(err){status.textContent='Копия не загружена: '+err.message;}
 };
}
const allowedKey=k=>['pp-favorites-v1','pp-shopping-cart-v1','pp-theme-v1','pp-daily-planner-v1','pp-pantry-v2','pp-versions-v2','pp-recent-v2'].includes(k)||/^pp-(?:recipe-draft-v2|cooking|checklist-v1):[a-z0-9-]+\.html:\d+$/.test(k);
function validateBackup(b){
 if(b?.format!=='pp-recipes-backup'||b.version!==2||!b.data||typeof b.data!=='object'||Array.isArray(b.data)||Object.keys(b.data).length>600)throw Error('Неподдерживаемый формат копии.');
 for(const[k,value]of Object.entries(b.data)){
  if(!allowedKey(k)||typeof value!=='string'||value.length>250000)throw Error('Недопустимая запись.');const v=k==='pp-theme-v1'?value:JSON.parse(value);
  if(k.startsWith('pp-recipe-draft')&&!validState(v))throw Error('Повреждена версия рецепта.');
  if(k==='pp-versions-v2'&&(!Array.isArray(v)||v.length>100||v.some(x=>!validState(x.state)||typeof x.id!=='string'||typeof x.name!=='string'||typeof x.note!=='string')))throw Error('Повреждены сохранённые версии.');
  if(k==='pp-pantry-v2'&&(!Array.isArray(v)||v.length>200||v.some(x=>typeof x.name!=='string'||x.name.length>250||['kcal','p','f','c'].some(y=>!numeric(x[y],y==='kcal'?1000:100)))))throw Error('Повреждены продукты.');
  if(k==='pp-favorites-v1'&&(!Array.isArray(v)||v.some(x=>typeof x!=='string'||!window.RECIPES.some(r=>r.slug===x))))throw Error('Повреждено избранное.');
  if(k==='pp-theme-v1'&&!['light','dark'].includes(v))throw Error('Повреждена тема.');
  if(k==='pp-shopping-cart-v1'&&(!Array.isArray(v)||v.length>100||v.some(x=>!x||typeof x.title!=='string'||!Array.isArray(x.items)||x.items.length>200||x.items.some(y=>typeof y.name!=='string'||typeof y.amount!=='string'))))throw Error('Повреждён список покупок.');
  if(k==='pp-daily-planner-v1'&&(!v?.goals||['kcal','protein','fat','carbs'].some(y=>!numeric(v.goals[y],10000))||!Array.isArray(v.items)||v.items.some(x=>(!window.RECIPES.some(r=>r.slug===x.slug)||!numeric(x.servings,20)||['oneServKcal','oneServP','oneServF','oneServC'].some(y=>!numeric(x[y],20000))||x.ingredients&&(!Array.isArray(x.ingredients)||x.ingredients.some(y=>typeof y.name!=='string'||typeof y.amount!=='string'))))))throw Error('Повреждён рацион.');
  if(k==='pp-recent-v2'&&(!Array.isArray(v)||v.length>20||v.some(x=>!window.RECIPES.some(r=>r.slug===x.slug))))throw Error('Повреждена история.');
  if(k.startsWith('pp-cooking:')&&(!Number.isInteger(v?.index)||v.index<0||v.index>100))throw Error('Повреждён шаг готовки.');
  if(k.startsWith('pp-checklist')&&(!Array.isArray(v)||v.some(x=>!Number.isInteger(x)||x<0||x>300)))throw Error('Повреждены отметки.');
 }
}
function productForm(callback){
 frame('Новый продукт',`<form id="pantry-form" class="personal-form"><label>Название с упаковки<input name="name" maxlength="120" required placeholder="Например, мой творог 5%"></label><p>Пищевая ценность на 100 г — по этикетке.</p><div class="personal-grid">${[['kcal','Ккал',1000],['p','Белки, г',100],['f','Жиры, г',100],['c','Углеводы, г',100]].map(([n,l,max])=>`<label>${l}<input name="${n}" type="number" required min="0" max="${max}" step="any"></label>`).join('')}</div><div class="personal-actions"><button class="primary">Сохранить продукт</button><button type="button" class="share-btn" id="pantry-cancel">Отмена</button></div></form>`);
 dlg.querySelector('#pantry-cancel').onclick=callback?close:openPersonal;
 dlg.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),x={name:f.get('name').trim()};if(!x.name)return;for(const k of ['kcal','p','f','c'])x[k]=+f.get(k);if(pantry().length>=200){notice('Сохранено уже 200 продуктов. Удалите ненужный.');return;}if(write('pp-pantry-v2',[...pantry(),x])){callback?callback(x):openPersonal();}};
}
function pickPantry(idx){
 const apply=x=>{close();document.querySelector(`#ing-pop-${idx} .product-replacement`).open=true;for(const[k,v]of Object.entries({name:x.name,kcal:x.kcal,p:x.p,f:x.f,c:x.c})){const el=document.getElementById(`ing-custom-${k}-${idx}`);el.value=v;}notice('Продукт выбран. Нажмите «Применить к продукту».');};
 frame('Выберите свой продукт',`<div class="pantry-list">${pantry().map((x,i)=>`<button type="button" class="pantry-choice" data-pantry="${i}"><strong>${E(x.name)}</strong><small>${x.kcal} ккал · Б ${x.p} · Ж ${x.f} · У ${x.c} / 100 г</small></button>`).join('')||'<p>Пока нет сохранённых продуктов.</p>'}</div><button class="primary" id="pantry-add">Добавить с этикетки</button>`);
 dlg.querySelectorAll('[data-pantry]').forEach(b=>b.onclick=()=>apply(pantry()[+b.dataset.pantry]));dlg.querySelector('#pantry-add').onclick=()=>productForm(apply);
}
function saveVersion(){
 const api=window.PPRecipe;if(!api)return;
 frame('Сохранить мою версию',`<form id="version-form" class="personal-form"><label>Название версии<input name="name" required maxlength="100" value="${E(api.recipe.shortTitle)} — мой вариант"></label><label>Заметка для следующей готовки<textarea name="note" maxlength="1000" rows="3" placeholder="Что получилось и что хочется изменить"></textarea></label><p>Сохранятся продукты, замены и выбранный объём. Оригинал останется без изменений.</p><button class="primary">Сохранить версию</button></form>`);
 dlg.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),a=read('pp-versions-v2',[]);if(a.length>=100){notice('Сохранено уже 100 версий. Удалите ненужную.');return;}if(write('pp-versions-v2',[{id:Date.now().toString(36),name:f.get('name').trim(),note:f.get('note').trim(),state:api.snapshot()},...a])){close();notice('Версия сохранена в «Моей кухне».');}};
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-open-personal],[data-pick-pantry],#save-personal-version');if(!t)return;if(t.hasAttribute('data-open-personal'))openPersonal();else if(t.id==='save-personal-version')saveVersion();else pickPantry(+t.dataset.pickPantry);});
if(window.PPRecipe){
 const api=window.PPRecipe,params=new URLSearchParams(window.PPInitialSearch),id=params.get('personal');
 let restoring=true;
 const state=id?read('pp-versions-v2',[]).find(x=>x.id===id)?.state:read(`pp-recipe-draft-v2:${api.recipe.slug}:${api.snapshot().variantId}`,null);
 if(state&&validState(state))api.apply({...state,servings:params.has('s')&&!id?Math.max(1,Math.min(20,+params.get('s')||state.servings)):state.servings});
 // Share links may carry only explicit, validated recipe changes; notes/products are never shared.
 const shared=params.get('c');if(shared){try{const x=JSON.parse(shared);if(validState(x)&&x.slug===api.recipe.slug)api.apply(x);else notice('Изменённый состав в ссылке не прошёл проверку. Открыт оригинал.');}catch{notice('Не удалось прочитать состав из ссылки.');}}
 restoring=false;
 window.addEventListener('pp:recipe-updated',()=>{if(!restoring){const state=api.snapshot();write(`pp-recipe-draft-v2:${state.slug}:${state.variantId}`,state);}});
 const a=read('pp-recent-v2',[]).filter(x=>x.slug!==api.recipe.slug);write('pp-recent-v2',[{slug:api.recipe.slug,at:Date.now()},...a].slice(0,8));
 const bar=document.createElement('nav');bar.className='mobile-recipe-bar';bar.setAttribute('aria-label','Быстрые действия рецепта');bar.innerHTML='<a href="#ingredients">Продукты</a><button type="button" id="mobile-cook">Готовить</button><button type="button" id="mobile-shopping">В покупки</button>';document.body.append(bar);bar.querySelector('#mobile-cook').onclick=()=>document.getElementById('cooking-mode').click();bar.querySelector('#mobile-shopping').onclick=()=>document.getElementById('add-to-cart').click();
 const saved=read(`pp-cooking:${api.recipe.slug}:${api.snapshot().variantId}`,null);if(saved&&!saved.done&&saved.index>0)document.getElementById('cooking-mode').textContent=`Продолжить с шага ${saved.index+1}`;
}else{
 const catalog=document.getElementById('catalog');if(!catalog)return;
 const demo=document.createElement('section');demo.className='live-demo';demo.id='live-recipe-demo';demo.innerHTML='<div><div class="eyebrow">ПОПРОБУЙТЕ ПРЯМО СЕЙЧАС</div><h2>Одна пачка.<br><em>Никаких подсчётов.</em></h2><p>Пример пересчёта пропорций сырников: измените количество творога — остальное подстроится. Это демонстрация, не отдельный рецепт.</p></div><div class="demo-calculator"><label for="demo-curd">Сколько у вас творога?</label><div class="demo-input"><input id="demo-curd" type="range" min="100" max="600" step="10" value="200"><output id="demo-curd-value">200 г</output></div><div class="demo-ingredients"><span>Творог<strong id="demo-curd-out">200 г</strong></span><span>Яичный белок<strong id="demo-eggs">30 г</strong></span><span>Рисовая мука<strong id="demo-flour">20 г</strong></span></div><p class="muted">В рецепте можно менять один продукт отдельно или масштабировать все пропорции.</p><a class="text-button" href="airfryer-syrniki.html">Попробовать на настоящем рецепте →</a></div>';
 catalog.after(demo);demo.querySelector('input').oninput=e=>{const g=+e.target.value;demo.querySelector('#demo-curd-value').textContent=g+' г';demo.querySelector('#demo-curd-out').textContent=g+' г';demo.querySelector('#demo-eggs').textContent=(g*.15).toLocaleString('ru-RU')+' г';demo.querySelector('#demo-flour').textContent=(g*.1).toLocaleString('ru-RU')+' г';};
 const recent=read('pp-recent-v2',[]).map(x=>window.RECIPES.find(r=>r.slug===x.slug)).filter(Boolean).slice(0,4);
 if(recent.length){const section=document.createElement('section');section.className='recent-section';section.innerHTML=`<div class="eyebrow">ЗНАКОМЫЕ ВКУСЫ</div><h2>Недавно открывали</h2><div class="recent-grid">${recent.map(r=>`<a href="${E(r.slug)}"><img src="${E(r.image)}" width="300" height="200" loading="lazy" alt=""><strong>${E(r.shortTitle)}</strong></a>`).join('')}</div>`;catalog.before(section);}
 // Shorter route on mobile without duplicating the search control.
 const link=document.createElement('a');link.className='mobile-search-link';link.href='#recipe-search';link.textContent='Найти рецепт или ингредиент →';document.querySelector('.hero-copy .eyebrow').after(link);
}
})();
;(() => {
 const map=window.PPImages||{};
 function enhance(img){let src=img.getAttribute('src')||'',name=src.split('/').pop();const a=map[name];if(!a)return;const choices=[...new Map(a.map(x=>[x.width,x])).values()];img.srcset=choices.map(x=>`${x.src} ${x.width}w`).join(', ');img.sizes=img.closest('.hero-cover,.detail-image')?'(max-width: 760px) 100vw, 640px':'(max-width: 760px) 100vw, 400px';img.decoding='async';img.src=a[1].src;}
 document.querySelectorAll('img').forEach(enhance);
 new MutationObserver(records=>{for(const r of records){if(r.type==='attributes')enhance(r.target);else for(const n of r.addedNodes){if(n.nodeType===1){if(n.tagName==='IMG')enhance(n);n.querySelectorAll('img').forEach(enhance);}}}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
 if('serviceWorker'in navigator){navigator.serviceWorker.ready.then(reg=>{const offer=()=>{if(!reg.waiting)return;let bar=document.getElementById('update-notice');if(bar)return;bar=document.createElement('div');bar.id='update-notice';bar.className='update-notice';bar.innerHTML='<span>Доступна новая версия сайта</span><button type="button">Обновить</button>';bar.querySelector('button').onclick=()=>{if(document.querySelector('dialog[open]')){alert('Сначала закройте открытое окно. Сохранённые версии останутся на месте.');return;}let reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloaded){reloaded=true;location.reload();}});reg.waiting.postMessage('SKIP_WAITING');};document.body.append(bar);};offer();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',()=>{if(reg.waiting&&navigator.serviceWorker.controller)offer();});});}).catch(()=>{});}
})();

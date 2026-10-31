import assert from 'node:assert/strict';
export function validateRecipe(r){
 assert(r&&typeof r==='object','Нужен объект рецепта');assert(/^[a-z0-9][a-z0-9-]*\.html$/.test(r.slug)&&!['index.html','editor.html'].includes(r.slug),'Недопустимый адрес рецепта');
 for(const k of ['title','shortTitle','description','category','time','difficulty','image'])assert(typeof r[k]==='string'&&r[k].trim()&&r[k].length<4000,`Проверьте поле ${k}`);
 assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(jpg|jpeg|png|webp)$/.test(r.image),'Обложка должна быть локальным файлом в корне');
 assert(Array.isArray(r.tags)&&r.tags.length<50&&r.tags.every(x=>typeof x==='string'),'Нужен массив tags');assert(Array.isArray(r.variants)&&r.variants.length>0&&r.variants.length<=30,'Нужны варианты');
 const ids=new Set();
 const safeHTML=html=>{assert(typeof html==='string'&&html.length<100000,'Слишком большой текст шага');assert(!/<\s*(script|iframe|object|embed|style|link|svg|math|form|input|button)\b|\bon\w+\s*=|javascript\s*:|data\s*:\s*text\/html/i.test(html),'Небезопасный HTML в рецепте');for(const m of html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi))assert(/^(?:[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:jpg|jpeg|png|webp)|assets\/images\/[a-zA-Z0-9._-]+\.webp)$/.test(m[1]),'Изображение шага должно быть локальным файлом');};
 for(const v of r.variants){
  assert(Number.isInteger(v.id)&&v.id>=1&&!ids.has(v.id),'Повторный или неверный id варианта');ids.add(v.id);
  assert(typeof v.name==='string'&&v.name.trim(),'Нужно имя варианта');assert(Number.isInteger(v.baseServings)&&v.baseServings>=1&&v.baseServings<=20,'Порций должно быть от 1 до 20');
  if(v.dishWeight!==undefined)assert(Number.isFinite(v.dishWeight)&&v.dishWeight>0&&v.dishWeight<=50000,'Недопустимый готовый вес');
  for(const key of ['total','per100']){const b=v[key];assert(Number.isFinite(b?.kcal)&&b.kcal>0,'Ккал должны быть положительными');for(const label of ['Белки','Жиры','Углеводы'])assert(b.macros?.some(x=>x.label===label&&Number.isFinite(x.value)&&x.value>=0),`Проверьте ${key}: ${label}`);}
  assert(Array.isArray(v.meta)&&v.meta.every(x=>typeof x.label==='string'&&typeof x.value==='string'),'Нужен meta с подписями');
  assert(Array.isArray(v.ingredients)&&v.ingredients.length>0&&v.ingredients.length<=150,'Нужны ингредиенты');
  for(const x of v.ingredients){if(x.group){assert(typeof x.group==='string','Неверная группа');continue;}assert(typeof x.name==='string'&&x.name.trim()&&typeof x.amount==='string'&&x.amount.trim(),'Заполните продукт и количество');if(x.nutrition){for(const k of ['kcal','p','f','c'])assert(Number.isFinite(x.nutrition[k])&&x.nutrition[k]>=0&&x.nutrition[k]<=(k==='kcal'?1000:100),'Недопустимые КБЖУ продукта');}}
  assert(Array.isArray(v.steps)&&v.steps.length>0&&v.steps.length<=100,'Нужны шаги');for(const x of v.steps){assert(typeof x.title==='string'&&x.title.trim(),'Нужно название шага');safeHTML(x.html);for(const m of x.html.matchAll(/\{\{ingredient:(\d+)\}\}/g))assert(v.ingredients[+m[1]]&&!v.ingredients[+m[1]].group,'Шаг ссылается на отсутствующий продукт');}
 }
 assert(ids.has(r.defaultVariant),'Основной вариант отсутствует');if(r.extraHtml)safeHTML(r.extraHtml);return r;
}

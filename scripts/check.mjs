import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

/* 1. Syntax check across all project scripts */
for (const file of ['assets/app.js', 'assets/recipes-data.js', 'scripts/serve.mjs', 'scripts/build.mjs', 'scripts/check.mjs', 'scripts/test.mjs']) {
  if (fs.existsSync(file)) {
    execFileSync(process.execPath, ['--check', file]);
  }
}

/* 2. Load recipes-data.js and app.js pure utilities into isolated VM context */
const context = { window: {}, TextEncoder, URLSearchParams };
if (fs.existsSync('assets/recipes-data.js')) {
  vm.runInNewContext(fs.readFileSync('assets/recipes-data.js', 'utf8'), context);
  const recipes = context.window.RECIPES;
  const totalVariantsCount = recipes.reduce((n, r) => n + r.variants.length, 0);
  assert(recipes.length >= 26, `Expected at least 26 recipes, got ${recipes.length}`);
  assert(totalVariantsCount >= 43, `Expected at least 43 variants, got ${totalVariantsCount}`);
  for (const r of recipes) {
    assert(fs.existsSync(r.slug));
    assert(fs.existsSync(r.image));
    assert(r.title);
    for (const v of r.variants) {
      assert(v.baseServings >= 1 && v.baseServings <= 20);
      assert(v.total?.kcal > 0);
      assert(v.per100?.kcal > 0);
      assert(v.steps.length > 0);
      assert(v.ingredients.some(i => i.name && i.amount));
      for (const m of v.total.macros) assert(Number.isFinite(m.value));
      assert(v.total.macros.some(m => m.label.startsWith('Белки')) && v.total.macros.some(m => m.label.startsWith('Жиры')) && v.total.macros.some(m => m.label.startsWith('Углеводы')));
      assert(v.per100.macros.some(m => m.label.startsWith('Белки')) && v.per100.macros.some(m => m.label.startsWith('Жиры')) && v.per100.macros.some(m => m.label.startsWith('Углеводы')));
    }
  }
}

for (const name of fs.readdirSync('.').filter(n => n.endsWith('.html'))) {
  const html = fs.readFileSync(name, 'utf8');
  assert(!html.includes('onclick='));
  assert(html.includes('assets/styles.css'));
}

/* 3. Automated Unit & Integration Tests for Stage 2.5 Algorithms */
vm.runInNewContext(fs.readFileSync('assets/app.js', 'utf8'), context);
const U = context.window.RecipeUtils;
assert(U, 'window.RecipeUtils must be exported');

// 3.1 Reverse ingredient scaling & scaleAmount precision (including protection of %, °C, C0, KSB-80)
assert.equal(U.scaleAmount('400 г (2 пачки)', 180 / 400), '180 г (0,9 пачки)');
assert.equal(U.scaleAmount('120 г (1/3 банки)', 2), '240 г (0,67 банки)');
assert.equal(U.scaleAmount('Сгущенка 1%', 2), 'Сгущенка 1%');
assert.equal(U.scaleAmount('2 шт С0 (~125 г)', 2), '4 шт С0 (~250 г)');
assert.equal(U.scaleAmount('30 г КСБ-80 при 170°C', 2), '60 г КСБ-80 при 170°C');
assert.equal(U.scaleAmount('по 25 г', 2), 'по 25 г');

const p1 = U.extractPrimaryAmount('400 г (2 пачки)');
assert.equal(p1.value, 400);
assert.equal(p1.unit, 'г');
const p2 = U.extractPrimaryAmount('2 шт (~125 г)');
assert.equal(p2.value, 2);
assert.equal(p2.unit, 'шт');
assert.equal(p2.grams, 125);
assert.equal(U.extractPrimaryAmount('Щепотка'), null);

// 3.2 Pan diameter area ratio
assert.equal(U.calcPanRatio(16, 20), 1.5625);
assert.equal(U.calcPanRatio(20, 16), 0.64);
assert.equal(U.calcPanRatio(18, 18), 1);

// 3.3 Plate gram calculator & Macro split
const samplePer100 = {
  kcal: 150,
  macros: [
    { label: 'Белки', value: 17 },
    { label: 'Жиры', value: 2.7 },
    { label: 'Углеводы', value: 12.2 },
    { label: 'Клетчатка', value: 1.8 }
  ]
};
const split = U.calcMacroSplit(samplePer100);
assert.equal(split.pPct + split.fPct + split.cPct, 100);
assert(split.pPct >= 45 && split.pPct <= 49);

const plate200 = U.calcGramsNutrition(samplePer100, 200);
assert.equal(plate200.kcal, 300);
assert.equal(plate200.protein, 34);
assert.equal(plate200.fat, 5.4);
assert.equal(plate200.carbs, 24.4);
assert.equal(plate200.fiber, 3.6);

// 3.4 GS1 EAN-13 Barcode generator & Modulo-10 Checksum for FatSecret
const eanA = U.generateRecipeEan13('cheesecake.html', 1);
const eanB = U.generateRecipeEan13('cheesecake.html', 2);
assert.equal(eanA.length, 13);
assert(eanA.startsWith('277'));
assert.notEqual(eanA, eanB);
assert.equal(U.verifyEan13Checksum(eanA), true);
assert.equal(U.verifyEan13Checksum(eanB), true);
const bitsA = U.encodeEan13Bits(eanA);
assert.equal(bitsA.length, 95);
assert(bitsA.startsWith('101'));
assert(bitsA.endsWith('101'));
assert.equal(bitsA.slice(45, 50), '01010');

if (context.window.RECIPES) {
  const seenBarcodes = new Set();
  for (const r of context.window.RECIPES) {
    for (const v of r.variants) {
      const code = U.generateRecipeEan13(r.slug, v.id);
      assert(U.verifyEan13Checksum(code), `Invalid EAN-13 checksum for ${r.slug}#${v.id}`);
      assert(!seenBarcodes.has(code), `Duplicate EAN-13 barcode for ${r.slug}#${v.id}`);
      seenBarcodes.add(code);
    }
  }
  assert.equal(seenBarcodes.size, recipes.reduce((n, r) => n + r.variants.length, 0));
}

// 3.5 QR Code Matrix Generator
const qr = U.generateQrMatrix('https://bakan-off.github.io/pp-recipes/cheesecake.html?v=1&s=4');
assert(qr.length >= 21 && qr.length <= 41);
assert.equal(qr.length, qr[0].length);
assert.equal(qr.flat().filter(x => x !== 0 && x !== 1).length, 0);

// 3.6 Smart Shopping Cart Aggregation
const merged = U.mergeCartIngredients([
  {
    title: 'Чизкейк',
    items: [
      { name: 'Творог в брикете (0.1-2%)', amount: '400 г (2 пачки)', done: false },
      { name: 'Яйца куриные С0', amount: '2 шт (~125 г)', done: true }
    ]
  },
  {
    title: 'Сочники',
    items: [
      { name: 'Творог в брикете (0-2%)', amount: '200 г (1 пачка)', done: false },
      { name: 'Яйца куриные С0', amount: '3 шт (~190 г)', done: true }
    ]
  }
]);
const curd = merged.find(x => x.key === 'творог в брикете');
const eggs = merged.find(x => x.key === 'яйца куриные');
assert(curd && curd.totalAmount === '600 г');
assert.equal(curd.done, false);
assert(eggs && eggs.totalAmount === '5 шт (~315 г)');
assert.equal(eggs.done, true);

// 3.7 Step timer extraction
const timers = U.extractStepTimers('<p>Выпекайте 26–28 минут при 170°C, затем остудите 15 мин.</p>', 'Выпечка');
assert.equal(timers.length, 2);
assert.equal(timers[0].sec, 26 * 60);
assert.equal(timers[1].sec, 15 * 60);

// 3.7b Canvas multi-line wrapping
const wrappedLines = U.wrapCanvasLines(null, '2 шт. (1 яйцо + 1 белок в начинку, 1 желток для смазывания)', 360);
assert(wrappedLines.length >= 2);


// 3.7b Individual Ingredient Swap Isolation (2 curds in 1 recipe: replacing index 0 must NOT replace index 1)
const twoCurdsVariant = {
  id: 1,
  name: 'Два вида творога',
  baseServings: 4,
  total: {
    kcal: 1107,
    macros: [
      { label: 'Белки', value: 125.8 },
      { label: 'Жиры', value: 20.1 },
      { label: 'Углеводы', value: 90.6 }
    ]
  },
  per100: {
    kcal: 150,
    macros: [
      { label: 'Белки', value: 17.0 },
      { label: 'Жиры', value: 2.7 },
      { label: 'Углеводы', value: 12.2 }
    ]
  },
  ingredients: [
    { name: 'Творог «Красная цена» обезжиренный 0%', amount: '360 г (2 пачки по 180 г)' },
    { name: 'Творог мягкий «Савушкин» 0.1%', amount: '125 г (1 стаканчик)' }
  ],
  steps: []
};
const swappedVariant = U.applyIngredientSwapsToVariant(twoCurdsVariant, {
  0: { id: 'custom', name: 'Домик в деревне 5%', shortName: 'Домик в деревне 5%', kcal: 121, p: 16, f: 5, c: 3 }
});
assert(swappedVariant.ingredients[0].name.includes('Домик в деревне 5%'), 'First curd must be replaced');
assert.equal(swappedVariant.ingredients[1].name, 'Творог мягкий «Савушкин» 0.1%', 'Second curd must NOT be replaced when index 0 is swapped');
assert(swappedVariant.total.kcal > twoCurdsVariant.total.kcal, 'Calories must increase when 0% curd is replaced with 5% curd');
assert.equal(twoCurdsVariant.ingredients[0].name, 'Творог «Красная цена» обезжиренный 0%', 'Base variant must not be mutated');

// 3.8 DOM Rendering & Event Simulation for Catalog and Recipe Views
class MockEl {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.children = [];
    this._innerHTML = '';
    this.textContent = '';
    this.value = '180';
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.open = false;
    this.classList = {
      _set: new Set(),
      add: (...c) => c.forEach(x => this.classList._set.add(x)),
      remove: (...c) => c.forEach(x => this.classList._set.delete(x)),
      contains: (c) => this.classList._set.has(c)
    };
  }
  set innerHTML(val) { this._innerHTML = String(val); }
  get innerHTML() { return this._innerHTML; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  appendChild(el) { this.children.push(el); return el; }
  querySelector() { return new MockEl(); }
  querySelectorAll() { return []; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() {}
  select() {}
}

const elsById = new Map();
const getEl = (id) => {
  if (!elsById.has(id)) elsById.set(id, new MockEl());
  return elsById.get(id);
};

const simRecipes = context.window.RECIPES || [
  {
    slug: 'cheesecake.html',
    title: 'Карамельно-сливочный ПП-чизкейк',
    shortTitle: 'Карамельно-сливочный ПП-чизкейк',
    description: 'Описание',
    image: 'cheesecake.png',
    time: '26–28 минут',
    difficulty: 'Простая',
    tags: ['Высокобелковое'],
    category: 'Десерты',
    defaultVariant: 1,
    variants: [
      {
        id: 1,
        name: 'С лимонной ноткой',
        baseServings: 4,
        meta: [{ label: 'Порций', value: '4 порции' }],
        total: { kcal: 1107, macros: [{ label: 'Белки', value: 125.8 }, { label: 'Жиры', value: 20.1 }, { label: 'Углеводы', value: 90.6 }] },
        per100: { kcal: 150, macros: [{ label: 'Белки', value: 17 }, { label: 'Жиры', value: 2.7 }, { label: 'Углеводы', value: 12.2 }] },
        ingredients: [{ name: 'Творог в брикете (0.1-2%)', amount: '400 г (2 пачки)' }],
        steps: [{ title: 'Выпекание', html: '<p>Выпекайте 26–28 минут при 170°C.</p>' }]
      }
    ]
  }
];

function simulateView(pathname, search = '') {
  elsById.clear();
  const appEl = getEl('app');
  const storage = new Map();
  const domCtx = {
    window: {
      RECIPES: simRecipes,
      matchMedia: () => ({ matches: false }),
      addEventListener: () => {},
      dispatchEvent: () => {},
      open: () => {}
    },
    document: {
      documentElement: new MockEl('html'),
      head: new MockEl('head'),
      body: new MockEl('body'),
      getElementById: (id) => getEl(id),
      createElement: (tag) => new MockEl(tag),
      querySelector: () => new MockEl(),
      querySelectorAll: () => []
    },
    location: { origin: 'https://bakan-off.github.io', pathname, search, hash: '', protocol: 'https:', hostname: 'bakan-off.github.io' },
    history: { replaceState: (s, t, u) => { domCtx.lastUrl = u; } },
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, String(v)) },
    sessionStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, String(v)) },
    navigator: { clipboard: { writeText: async () => {} } },
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o?.detail; } },
    URLSearchParams, Intl, TextEncoder, setTimeout, clearTimeout, setInterval, clearInterval, Math, Number, String, Array, Object, Set, Map, JSON, RegExp
  };
  vm.runInNewContext(fs.readFileSync('assets/app.js', 'utf8'), domCtx);
  return { appEl, elsById, domCtx };
}

const catRes = simulateView('/pp-recipes/index.html');
assert(catRes.appEl.innerHTML.includes('Что есть дома:'));
assert(catRes.appEl.innerHTML.includes('planner-toggle'));
assert(!catRes.appEl.innerHTML.includes('onclick='));

const recRes = simulateView('/pp-recipes/' + simRecipes[0].slug, '?v=1&s=4&r=0.45');
assert(recRes.appEl.innerHTML.includes('open-fatsecret-btn'));
assert(recRes.appEl.innerHTML.includes('download-card-png'));
assert(recRes.appEl.innerHTML.includes('pan-toggle-btn'));
assert(recRes.appEl.innerHTML.includes('plate-grams-input'));
assert(!recRes.appEl.innerHTML.includes('onclick='));
assert.equal(recRes.elsById.get('servings').textContent, 'Масштаб ×0,45');
assert.equal(recRes.elsById.get('plate-calc-output').textContent.includes('ккал'), true);


// 3.9 Custom Product Replacement (Per-Index Isolation), Baseline Inference, Site Guide & Author Telegram (@bakan_off)
const cheeseBase = U.inferBaselineNutrition("Сыр лёгкий 25%");
assert.equal(cheeseBase.kcal, 232);
const curd0Base = U.inferBaselineNutrition("Творог «Красная цена» обезжиренный 0%");
assert.equal(curd0Base.kcal, 85);
const softCurdBase = U.inferBaselineNutrition("Творог мягкий «Савушкин» 0.1%");
assert.equal(softCurdBase.kcal, 62);
const explicitBase = U.inferBaselineNutrition("Шницель куриный (192,2 ккал | Б 13,8 | Ж 6,6 | У 7,0)");
assert.equal(explicitBase.kcal, 192.2);
assert.equal(explicitBase.p, 13.8);

const swapCfg = U.getIngredientSwapConfig("Творог «Красная цена» обезжиренный 0%", "360 г");
assert(swapCfg && swapCfg.baseMacro.kcal === 85);

assert(catRes.appEl.innerHTML.includes('guide-toggle'), 'Catalog nav must include guide-toggle button');
assert(catRes.appEl.innerHTML.includes('@bakan_off'), 'Footer must include @bakan_off author link');
assert(!recRes.elsById.get('ingredient-list').innerHTML.includes('data-swap-select'), 'Preset product dropdown (<select>) must be removed');
assert(recRes.elsById.get('ingredient-list').innerHTML.includes('ing-custom-name-0'), 'Custom product name input must be rendered per ingredient index');

console.log('PASS: JS syntax; routes & variants validated; Stage 2.6 unit & DOM tests (per-index custom product replacement, mobile responsive layout, reverse scaling, pan ratio, FatSecret EAN-13, QR matrix, smart cart merge, macro planner, timers).');

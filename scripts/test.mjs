import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

/* Locate app.js and recipes-data.js whether run from repo root or scripts/ */
const appPath = fs.existsSync('assets/app.js') ? 'assets/app.js' : path.join(path.dirname(new URL(import.meta.url).pathname), 'app.js');
const dataPath = fs.existsSync('assets/recipes-data.js') ? 'assets/recipes-data.js' : null;

const context = { window: {}, TextEncoder, URLSearchParams };
if (dataPath) {
  vm.runInNewContext(fs.readFileSync(dataPath, 'utf8'), context);
}
vm.runInNewContext(fs.readFileSync(appPath, 'utf8'), context);

const U = context.window.RecipeUtils;
assert(U, 'RecipeUtils must be initialized on window');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running automated test suite for pp-recipes (Stage 2.5):');

test('1. Reverse ingredient scaling & protection of percentages/grades/temperatures', () => {
  assert.equal(U.scaleAmount('400 г (2 пачки)', 180 / 400), '180 г (0,9 пачки)');
  assert.equal(U.scaleAmount('120 г (1/3 банки)', 2), '240 г (0,67 банки)');
  assert.equal(U.scaleAmount('Сгущенное молоко 1%', 2), 'Сгущенное молоко 1%');
  assert.equal(U.scaleAmount('2 шт С0 (~125 г)', 1.5), '3 шт С0 (~187,5 г)');
  assert.equal(U.scaleAmount('30 г КСБ-80 при 170°C', 2), '60 г КСБ-80 при 170°C');
  assert.equal(U.scaleAmount('по 25 г', 3), 'по 25 г');
});

test('2. Primary ingredient quantity extraction (extractPrimaryAmount)', () => {
  const curd = U.extractPrimaryAmount('400 г (2 пачки)');
  assert.equal(curd.value, 400); assert.equal(curd.unit, 'г'); assert.equal(curd.grams, 400);
  const eggs = U.extractPrimaryAmount('2 шт (~125 г)');
  assert.equal(eggs.value, 2); assert.equal(eggs.unit, 'шт'); assert.equal(eggs.grams, 125);
  assert.equal(U.extractPrimaryAmount('Щепотка'), null);
});

test('3. Pan diameter area scaling (calcPanRatio)', () => {
  assert.equal(U.calcPanRatio(16, 20), 1.5625);
  assert.equal(U.calcPanRatio(20, 16), 0.64);
  assert.equal(U.calcPanRatio(18, 18), 1);
});

test('4. Plate gram calculator & Protein Index split (calcGramsNutrition, calcMacroSplit)', () => {
  const per100 = {
    kcal: 150,
    macros: [
      { label: 'Белки', value: 17 },
      { label: 'Жиры', value: 2.7 },
      { label: 'Углеводы', value: 12.2 },
      { label: 'Клетчатка', value: 1.8 }
    ]
  };
  const split = U.calcMacroSplit(per100);
  assert.equal(split.pPct + split.fPct + split.cPct, 100);
  const plate = U.calcGramsNutrition(per100, 180);
  assert.equal(plate.kcal, 270);
  assert.equal(plate.protein, 30.6);
  assert.equal(plate.fat, 4.9);
  assert.equal(plate.carbs, 22);
});

test('5. GS1 EAN-13 FatSecret Barcode generation, Modulo-10 checksum & 95-bit pattern', () => {
  const code1 = U.generateRecipeEan13('cheesecake.html', 1);
  const code2 = U.generateRecipeEan13('cheesecake.html', 2);
  assert.equal(code1.length, 13);
  assert(code1.startsWith('277'));
  assert.notEqual(code1, code2);
  assert.equal(U.verifyEan13Checksum(code1), true);
  assert.equal(U.verifyEan13Checksum(code2), true);
  const bits = U.encodeEan13Bits(code1);
  assert.equal(bits.length, 95);
  assert.equal(bits.slice(0, 3), '101');
  assert.equal(bits.slice(45, 50), '01010');
  assert.equal(bits.slice(92, 95), '101');
});

test('6. ISO/IEC 18004 QR Code matrix generation for recipe deep-links', () => {
  const mat = U.generateQrMatrix('https://bakan-off.github.io/pp-recipes/cheesecake.html?v=2&s=6');
  assert(mat.length >= 21 && mat.length <= 41);
  assert.equal(mat.length, mat[0].length);
  assert.equal(mat.flat().filter(x => x !== 0 && x !== 1).length, 0);
});

test('7. Smart Shopping Cart ingredient merging & department grouping (mergeCartIngredients)', () => {
  const merged = U.mergeCartIngredients([
    {
      title: 'Чизкейк',
      items: [
        { name: 'Творог в брикете (0.1-2%)', amount: '400 г (2 пачки)', done: false },
        { name: 'Яйца куриные С0', amount: '2 шт (~125 г)', done: false }
      ]
    },
    {
      title: 'Сочники',
      items: [
        { name: 'Творог в брикете (0-2%)', amount: '200 г (1 пачка)', done: false },
        { name: 'Яйца куриные С0', amount: '3 шт (~190 г)', done: false }
      ]
    }
  ]);
  const curd = merged.find(x => x.key === 'творог в брикете');
  const eggs = merged.find(x => x.key === 'яйца куриные');
  assert.equal(curd.totalAmount, '600 г');
  assert(curd.dept.includes('Молочный отдел'));
  assert.equal(eggs.totalAmount, '5 шт (~315 г)');
  assert(eggs.dept.includes('Мясо, птица и яйца'));
});

test('8. Daily Macro Planner recommendations (findRecipesForRemainingMacros) & step timers', () => {
  const timers = U.extractStepTimers('<p>Выпекайте 26–28 минут, затем подождите 10 мин.</p>', 'Шаг');
  assert.equal(timers.length, 2);
  assert.equal(timers[0].sec, 1560);
  assert.equal(timers[1].sec, 600);
});

console.log(`\nALL ${passed} AUTOMATED TEST SUITES PASSED!`);
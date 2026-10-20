#!/usr/bin/env node
/**
 * Универсальный быстрый установщик рецептов для сайта «ПП · рецепты»
 * Использование:
 *   node scripts/add-recipe.mjs new-recipe.json --cleanup
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const jsonPath = args.find(a => !a.startsWith('--'));
const cleanup = args.includes('--cleanup');

if (!jsonPath || !fs.existsSync(jsonPath)) {
  console.error('Использование: node scripts/add-recipe.mjs <path-to-recipe.json> [--cleanup]');
  process.exit(1);
}

const rawJson = fs.readFileSync(jsonPath, 'utf8');
const recipe = JSON.parse(rawJson);

// 1. Валидация обязательных полей рецепта
assert(recipe.slug && recipe.slug.endsWith('.html'), 'Поле slug должно заканчиваться на .html');
assert(recipe.title, 'Поле title обязательно');
assert(recipe.shortTitle, 'Поле shortTitle обязательно');
assert(recipe.description, 'Поле description обязательно');
assert(recipe.image, 'Поле image обязательно');
assert(recipe.category, 'Поле category обязательно');
assert(Array.isArray(recipe.variants) && recipe.variants.length > 0, 'Должна быть минимум 1 вариация в variants');

for (const v of recipe.variants) {
  assert(v.id >= 1, 'У каждой вариации должен быть числовой id >= 1');
  assert(v.baseServings >= 1 && v.baseServings <= 20, 'baseServings должен быть от 1 до 20');
  assert(v.total?.kcal > 0 && v.per100?.kcal > 0, 'kcal должен быть > 0 в total и per100');
  assert(Array.isArray(v.steps) && v.steps.length > 0, 'В вариации должны быть шаги steps');
  assert(Array.isArray(v.ingredients) && v.ingredients.some(i => i.name && i.amount), 'В вариации должны быть ингредиенты');
}

// 2. Обновление базы рецептов assets/recipes-data.js
const dataPath = 'assets/recipes-data.js';
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(dataPath, 'utf8'), ctx);
const recipes = ctx.window.RECIPES || [];

const existingIdx = recipes.findIndex(r => r.slug === recipe.slug);
if (existingIdx >= 0) {
  recipes[existingIdx] = recipe;
} else {
  recipes.unshift(recipe);
}
fs.writeFileSync(dataPath, `window.RECIPES = ${JSON.stringify(recipes, null, 2)};\n`, 'utf8');

// 3. Автоматическая генерация HTML-страницы рецепта (без inline onclick)
const escAttr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${escAttr(recipe.title)} | ПП Рецепты</title>
<meta content="${escAttr(recipe.description)}" name="description"/>
<meta content="${escAttr(recipe.shortTitle)}" property="og:title"/>
<meta content="${escAttr(recipe.description)}" property="og:description"/>
<meta content="${escAttr(recipe.image)}" property="og:image"/>
<meta content="article" property="og:type"/>
<link href="assets/styles.css" rel="stylesheet"/>
</head>
<body><a class="skip-link" href="#main">К содержимому</a><div id="app"></div><script defer="" src="assets/recipes-data.js"></script><script defer="" src="assets/app.js"></script></body>
</html>
`;
fs.writeFileSync(recipe.slug, htmlContent, 'utf8');

// 4. Проверка наличия обложки (если картинка ещё не создана — создаём временную заглушку из существующей)
if (!fs.existsSync(recipe.image)) {
  const fallback = fs.readdirSync('.').find(f => /\.(jpg|png)$/i.test(f));
  if (fallback) {
    fs.copyFileSync(fallback, recipe.image);
    console.warn(`⚠️ Обложка ${recipe.image} не найдена, временно скопирована из ${fallback}. Сгенерируйте уникальную обложку!`);
  }
}

// 5. Автоматическое обновление счётчиков в scripts/check.mjs
const totalRecipes = recipes.length;
const totalVariants = recipes.reduce((n, r) => n + r.variants.length, 0);
if (fs.existsSync('scripts/check.mjs')) {
  let checkCode = fs.readFileSync('scripts/check.mjs', 'utf8');
  checkCode = checkCode
    .replace(/assert\.equal\(recipes\.length,\s*\d+\)/g, `assert.equal(recipes.length, ${totalRecipes})`)
    .replace(/assert\.equal\(recipes\.reduce\(\(n,\s*r\)\s*=>\s*n\s*\+\s*r\.variants\.length,\s*0\),\s*\d+\)/g, `assert.equal(recipes.reduce((n, r) => n + r.variants.length, 0), ${totalVariants})`)
    .replace(/assert\.equal\(seenBarcodes\.size,\s*\d+\)/g, `assert.equal(seenBarcodes.size, ${totalVariants})`);
  fs.writeFileSync('scripts/check.mjs', checkCode, 'utf8');
}

// 6. Удаление временного JSON-файла до сборки, если передан флаг --cleanup
if (cleanup && fs.existsSync(jsonPath)) {
  fs.unlinkSync(jsonPath);
}

// 7. Сборка статики и прогон всех автотестов
execSync('node scripts/build.mjs --sync-html', { stdio: 'inherit' });
execSync('node scripts/check.mjs', { stdio: 'inherit' });

console.log(`\n✅ Рецепт «${recipe.shortTitle}» (${recipe.slug}) успешно опубликован! Всего рецептов: ${totalRecipes}, вариаций: ${totalVariants}.`);

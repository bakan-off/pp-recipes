import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const enhanced = process.argv.includes('--enhanced');
const syncRootHtml = process.argv.includes('--sync-html');
const SITE_BASE = 'https://bakan-off.github.io/pp-recipes/';

/* Load recipes data to enrich static HTML pages with Schema.org/Recipe JSON-LD & Open Graph */
const context = { window: {} };
if (fsSync.existsSync('assets/recipes-data.js')) {
  vm.runInNewContext(await fs.readFile('assets/recipes-data.js', 'utf8'), context);
}
const recipes = context.window.RECIPES || [];

function macroVal(block, label) {
  return block?.macros?.find(m => m.label === label)?.value || 0;
}

function buildRecipeSchemaTag(r) {
  const v = r.variants.find(x => x.id === r.defaultVariant) || r.variants[0];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.description,
    image: [SITE_BASE + r.image],
    recipeCategory: r.category,
    keywords: (r.tags || []).join(', '),
    recipeYield: `${v.baseServings} порций`,
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${v.per100?.kcal || 0} ккал на 100 г`,
      proteinContent: `${macroVal(v.per100, 'Белки')} г`,
      fatContent: `${macroVal(v.per100, 'Жиры')} г`,
      carbohydrateContent: `${macroVal(v.per100, 'Углеводы')} г`
    },
    recipeIngredient: v.ingredients.filter(x => !x.group).map(x => `${x.name} — ${x.amount}`),
    recipeInstructions: v.steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.title,
      text: s.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }))
  };
  return `<script type="application/ld+json" id="recipe-schema-ld">${JSON.stringify(schema)}</script>`;
}

function enrichHtml(html, fileName) {
  const recipe = recipes.find(r => r.slug === fileName);
  let out = html;
  if (recipe && !out.includes('application/ld+json')) {
    const schemaTag = buildRecipeSchemaTag(recipe);
    out = out.replace('</head>', `${schemaTag}</head>`);
  }
  return out;
}

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist');

for (const name of await fs.readdir('.')) {
  if (/\.(jpg|png)$/.test(name)) {
    await fs.copyFile(name, path.join('dist', name));
  } else if (name.endsWith('.html')) {
    const rawHtml = await fs.readFile(name, 'utf8');
    const enriched = enrichHtml(rawHtml, name);
    await fs.writeFile(path.join('dist', name), enriched);
    if (syncRootHtml && enriched !== rawHtml) {
      await fs.writeFile(name, enriched);
    }
  }
}

await fs.cp('assets', 'dist/assets', { recursive: true });

if (enhanced) {
  const { build } = await import('esbuild');
  await build({
    entryPoints: ['src/enhancements.jsx'],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: 'dist/assets/enhancements.js',
    target: ['es2020']
  });
  for (const name of await fs.readdir('dist')) {
    if (name.endsWith('.html')) {
      const p = path.join('dist', name);
      const html = await fs.readFile(p, 'utf8');
      await fs.writeFile(p, html.replace('</body>', '<script src="assets/enhancements.js" defer></script></body>'));
    }
  }
}

console.log(enhanced ? 'Enhanced build complete: dist/' : 'Offline static build complete: dist/ (CSS motion + Schema.org JSON-LD, no external libraries)');

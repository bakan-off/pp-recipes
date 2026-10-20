---
name: pp-recipe-publisher
description: Fast publishing of high-protein recipes to the pp-recipes static website from raw video transcripts, notes, or nutrition label photos. Use whenever the user says "добавь рецепт", "выстави рецепт", "опубликуй рецепт", or pastes raw recipe text/ingredients from a video or post.
---
# pp-recipe-publisher

Convert raw recipe text, video transcripts, or product label notes into a validated high-protein recipe entry with exact macros (total, per-serving, and per-100g cooked weight) and publish it to the `pp-recipes` static site in seconds using `scripts/add-recipe.mjs`.

## When to Use

- The user says "добавь рецепт", "выстави рецепт", "закинь рецепт на сайт", or pastes raw recipe notes/transcripts from a video, Telegram post, or food packaging.
- The user wants to add a single dish or a multi-component meal ("2 в 1", "3 в 1") with separate FatSecret barcode variants.

## Steps

1. **Do NOT read or modify core application files**:
   Never read or edit `assets/app.js`, `assets/styles.css`, or manually parse the entire `assets/recipes-data.js` file in chat. All insertion, HTML creation, counter updates, and builds are handled automatically by `scripts/add-recipe.mjs`.

2. **Extract and structure the recipe data**:
   From the user's raw text or video transcript, determine:

   - `slug`: English kebab-case filename ending in `.html` (for example, `chicken-teriyaki-bowl.html`).
   - `image`: Matching cover filename ending in `.jpg` (for example, `chicken-teriyaki-bowl.jpg`).
   - `title`: Full descriptive Russian title.
   - `shortTitle`: Concise card title (up to 38 characters).
   - `description`: Appetizing 1-2 sentence summary highlighting the cooking method and protein profile.
   - `time`: Total cooking time in Russian (for example, `20 минут`).
   - `difficulty`: `Простая` or `Средняя`.
   - `category`: Must be one of `Завтраки`, `Основные блюда`, `Десерты`, `Выпечка`, `Напитки`.
   - `tags`: Subset of `["Высокобелковое", "Без добавленного сахара", "Кето", "До 20 мин"]`.

3. **Calculate accurate macros (`total` and `per100`)**:
   Calculate calories (`kcal`), protein (`Белки`), fat (`Жиры`), carbs (`Углеводы`), and fiber (`Клетчатка`) for each variant:

   - Sum all raw ingredients to get `total` macros for the full batch.
   - Estimate realistic cooked weight (`dishWeightGrams`) accounting for moisture loss during baking/air-frying (typically -12% to -20% for meat/poultry, -8% to -12% for cottage cheese bakes) or water absorption during boiling (roughly x2.3 to x2.5 for dry pasta/noodles/grains).
   - Compute `per100` macros on 100g of the **finished cooked dish**: `per100 = round((total / dishWeightGrams) * 100, 1)`.
   - If the recipe is a multi-part meal (for example, main meat + side dish + sauce), create separate variants (`id: 1`, `id: 2`, `id: 3`...) so each component gets its own GS1 EAN-13 FatSecret barcode.

4. **Format steps for automatic timers**:
   Write each step `html` inside `<div class="step-content"><p>...</p></div>`. Include explicit time expressions in Russian (such as `15 минут`, `5 мин`, `30 секунд`) whenever a step involves timed cooking so `app.js` automatically generates clickable kitchen timer chips.

5. **Generate the cover image (`<slug>.jpg`)**:
   If the user did not provide a photo file, generate an editorial food photography image in the warm daylight aesthetic of the site (linen surface, ceramic tableware, natural garnish, no text or watermarks) and save it in the project root as `<slug>.jpg`.

6. **Write `new-recipe.json` and run the installer script**:
   Save the structured recipe object to `new-recipe.json` in the project root and run:

   ```powershell
   node scripts/add-recipe.mjs new-recipe.json --cleanup
   ```

   This single script automatically updates `assets/recipes-data.js`, creates `<slug>.html`, updates the recipe and variant counters in `scripts/check.mjs`, runs `node scripts/build.mjs --sync-html`, and verifies everything with `node scripts/check.mjs`.

7. **Deploy to GitHub Pages (when requested)**:
   In Windows PowerShell, chain commands with `;` (never `&&`):

   ```powershell
   git add .; git commit -m "feat: add <slug> recipe"; git push
   ```

## Gotchas

- **Never use `&&` in Windows PowerShell 5.1**: The user's terminal is Windows PowerShell 5.1, where `&&` causes a syntax error. Always chain commands with `;`.
- **Protect scaling numbers in ingredient amounts**: Put the primary numeric weight or count at the start of the `amount` string (for example, `400 г (2 пачки)` or `2 шт (~120 г)`), and keep fat percentages (`0.1%`, `5%`) or egg grades (`С0`) inside the ingredient `name` so the quantity scaler works cleanly.
- **Required macro labels**: Every variant's `total.macros` and `per100.macros` arrays must include objects with `label` set to `"Белки"`, `"Жиры"`, `"Углеводы"`, and `"Клетчатка"` and numeric `value`.

---
name: pp-recipe-publisher
description: Fast publishing of high-protein recipes to the pp-recipes static website from raw video transcripts, notes, or nutrition label photos. Use whenever the user says "добавь рецепт", "выстави рецепт", "опубликуй рецепт", or pastes raw recipe text/ingredients from a video or post.
---
# pp-recipe-publisher (OpenCode Desktop)

Convert raw recipe text, video transcripts, or product label notes into a validated high-protein recipe entry with exact macros (total, per-serving, and per-100g cooked weight) and publish it to the `pp-recipes` static site in seconds using `scripts/add-recipe.mjs`.

## Steps

1. **Do NOT read or modify core application files**:
   Never read or edit `assets/app.js`, `assets/styles.css`, or `assets/recipes-data.js`. All insertion, image generation, HTML creation, counter updates, and builds are handled automatically by `scripts/add-recipe.mjs`.

2. **Structure `new-recipe.json` (including `imagePrompt`)**:
   Include `slug` (`<name>.html`), `image` (`<name>.jpg`), `imagePrompt` (English food photography prompt for automatic cover generation if `<name>.jpg` is not yet present), `title`, `shortTitle`, `description`, `time`, `difficulty` (`Простая` or `Средняя`), `category` (`Завтраки`, `Основные блюда`, `Десерты`, `Выпечка`, `Напитки`), `tags`, `defaultVariant: 1`, and `variants`.

3. **Run the installer script**:
   In Windows PowerShell (use `;`, never `&&`):
   ```powershell
   node scripts/add-recipe.mjs new-recipe.json --cleanup
   ```

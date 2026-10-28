# Правила проекта ПП · рецепты (AGENTS.md для OpenCode Desktop)

Этот репозиторий — статический сайт высокобелковых рецептов (`https://bakan-off.github.io/pp-recipes/index.html`).

## Главное правило при добавлении рецептов (`добавь рецепт` / `/add-recipe`)

1. **При обычном добавлении рецепта** НЕ читай и НЕ редактируй `assets/app.js`, `assets/styles.css` и не читай целиком `assets/recipes-data.js`. (Редактировать `assets/app.js` и `assets/styles.css` разрешено ТОЛЬКО тогда, когда пользователь явно просит доработать функции или интерфейс сайта).
2. Для публикации любого рецепта создай в корне проекта файл `new-recipe.json` (включая поле `"imagePrompt"` на английском языке для автоматической генерации ИИ-фото блюда, если готового файла картинки ещё нет) и выполни одну команду:
   ```powershell
   node scripts/add-recipe.mjs new-recipe.json --cleanup
   ```
3. Скрипт `scripts/add-recipe.mjs` сам:
   - автоматически сгенерирует фото блюда `<slug>.jpg` по полю `imagePrompt` (если файла ещё нет в корне);
   - добавит рецепт в начало `assets/recipes-data.js`;
   - создаст `<slug>.html`;
   - обновит счётчики рецептов и штрихкодов в `scripts/check.mjs`;
   - запустит `node scripts/build.mjs --sync-html` и `node scripts/check.mjs`.
4. **Терминал пользователя — Windows PowerShell 5.1**: всегда объединяй команды через `;` (никогда не используй `&&`).

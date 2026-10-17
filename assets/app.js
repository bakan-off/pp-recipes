/* Shared static application. Source recipe data is never mutated. */
(() => {
'use strict';
const recipes = window.RECIPES || [];
const app = document.getElementById('app');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const fmt = n => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n);

const icon = (name) => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    leaf: '<path d="M20 4c0 12-7 17-13 13S4 4 20 4z"/><path d="M4 20 15 9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5 5-5m0 5V3h-5"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    heart: '<path d="M12 20.5s-7.5-4.35-9.5-8.6C1.1 8.8 3.2 5 6.8 5c2.1 0 3.7 1.1 5.2 2.8C13.5 6.1 15.1 5 17.2 5c3.6 0 5.7 3.8 4.3 6.9-2 4.25-9.5 8.6-9.5 8.6z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4m0-11-6.8 4"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    tg: '<path d="m21.5 4.5-18 7 6.5 2.5 2.5 6 3.5-4 5 3.5 2.5-15zM10 14l9-7.5"/>',
    max: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6z"/><path d="M8 11h8M8 8.5h5"/>',
    vk: '<path d="M3 7.5c.2 6.2 3.4 10 9.1 10h.4v-3.6c2 .2 3.5 1.7 4.1 3.6H20c-.9-2.6-2.8-4.1-4.1-4.7 1.2-.7 2.9-2.4 3.4-5.3h-3.1c-.7 2.4-2.1 4.1-3.7 4.3V7.5H9.4v7.5c-1.8-.4-3.3-2.6-3.5-7.5H3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    bolt: '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
};

/* Storage helpers */
const FAV_KEY = 'pp-favorites-v1';
const CART_KEY = 'pp-shopping-cart-v1';
const THEME_KEY = 'pp-theme-v1';
const CATALOG_STATE_KEY = 'pp-catalog-state-v1';

const getFavs = () => {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
  catch { return new Set(); }
};
const saveFavs = (set) => {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch {}
};

const getCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
};
const saveCart = (items) => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  updateCartBadge();
};

/* Theme management */
function getTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? icon('sun') : icon('moon');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    btn.setAttribute('title', theme === 'dark' ? 'Светлая тема' : 'Тёмная тема');
  }
}
applyTheme(getTheme());

/* Toast notification */
function showToast(msg) {
  let toast = document.getElementById('pp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pp-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* Macro & Protein Analytics */
const macro = (v, name) => v?.macros?.find(x => x.label === name)?.value || 0;

function calcMacroSplit(nutritionBlock) {
  const p = macro(nutritionBlock, 'Белки');
  const f = macro(nutritionBlock, 'Жиры');
  const c = macro(nutritionBlock, 'Углеводы');
  const pKcal = p * 4;
  const fKcal = f * 9;
  const cKcal = c * 4;
  const sumKcal = Math.max(1, pKcal + fKcal + cKcal);
  const pPct = Math.round((pKcal / sumKcal) * 100);
  const fPct = Math.round((fKcal / sumKcal) * 100);
  const cPct = Math.max(0, 100 - pPct - fPct);
  return { p, f, c, pPct, fPct, cPct };
}

function parseMinutes(timeStr) {
  const s = String(timeStr || '');
  const m = s.match(/(\d+)/);
  return m ? Number(m[1]) : 99;
}

/* Scale quantities only: units, product percentages and descriptive words remain untouched.
   Fractions, ranges, approximate grams and package equivalents are supported. */
const quantityPattern = /(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)(?:\s*[---]\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?))?/g;
function quantityNumber(s) {
  const parts = s.split('/').map(x => Number(x.trim().replace(',', '.')));
  return parts.length == 2 ? parts[0] / parts[1] : parts[0];
}
function scaleAmount(amount, ratio) {
  if (ratio === 1) return amount;
  return amount.replace(quantityPattern, (all, lo, range, hi, offset) =>
    /(?:^|[\s(])по\s*$/.test(amount.slice(0, offset))
      ? all
      : fmt(quantityNumber(lo) * ratio) + (range ? '-' + fmt(quantityNumber(hi) * ratio) : '')
  );
}
window.RecipeUtils = { scaleAmount };

/* Navigation & Global Drawers */
const nav = (detail = false) => {
  const cartCount = getCart().reduce((acc, g) => acc + g.items.length, 0);
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  return `<nav class="nav" aria-label="Основная навигация">
    <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">${icon('leaf')}</span>ПП · рецепты</a>
    <div class="nav-right">
      <a class="nav-link ${detail ? '' : 'active'}" href="index.html#catalog">Рецепты</a>
      <span class="nav-note">Еда. Баланс. Удовольствие.</span>
      <div class="nav-actions">
        <button type="button" class="nav-icon-btn" id="cart-toggle" aria-label="Список покупок" title="Список покупок">
          ${icon('bag')}
          <span class="cart-badge" id="cart-badge" ${cartCount ? '' : 'hidden'}>${cartCount}</span>
        </button>
        <button type="button" class="nav-icon-btn" id="theme-toggle" aria-label="Переключить тему" title="Тема оформления">
          ${theme === 'dark' ? icon('sun') : icon('moon')}
        </button>
      </div>
    </div>
  </nav>`;
};

const footer = () => `<footer class="footer">
  <span>Простая еда. Хорошая жизнь.</span>
  <span>Авторская коллекция · КБЖУ из исходных рецептов, ориентировочные значения</span>
</footer>`;

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCart().reduce((acc, g) => acc + g.items.length, 0);
  badge.textContent = count;
  badge.hidden = count === 0;
}

function buildCartText() {
  const cart = getCart();
  if (!cart.length) return '';
  const lines = ['🛒 Список покупок · ПП-рецепты\n'];
  for (const group of cart) {
    lines.push(`▪ ${group.title} (${group.variantName}, ${group.servings} порц.):`);
    for (const item of group.items) {
      lines.push(`  ${item.done ? '☑' : '☐'} ${item.name} — ${item.amount}`);
    }
    lines.push('');
  }
  lines.push(location.origin + location.pathname.replace(/[^/]*$/, 'index.html'));
  return lines.join('\n');
}

function ensureGlobalModals() {
  if (document.getElementById('shopping-dialog')) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <dialog class="shopping-dialog" id="shopping-dialog" aria-labelledby="shopping-title">
      <div class="dialog-inner">
        <div class="dialog-header">
          <div>
            <small>СОБРАНО ДЛЯ ПОКУПКИ</small>
            <h2 id="shopping-title">Список покупок</h2>
          </div>
          <button type="button" class="icon-button" id="close-shopping" aria-label="Закрыть список покупок">${icon('close')}</button>
        </div>
        <div id="shopping-body" class="shopping-body"></div>
        <div class="shopping-footer" id="shopping-footer">
          <div class="share-row">
            <button type="button" class="share-chip" id="cart-share-tg">${icon('tg')} В Telegram</button>
            <button type="button" class="share-chip" id="cart-share-max">${icon('max')} В MAX</button>
            <button type="button" class="share-chip" id="cart-copy">${icon('copy')} Скопировать</button>
          </div>
          <button type="button" class="text-button" id="cart-clear">Очистить список</button>
        </div>
      </div>
    </dialog>
    <div class="kitchen-timer-widget" id="kitchen-timer-widget" hidden>
      <div class="timer-widget-info">
        <small id="timer-widget-label">Таймер готовки</small>
        <strong id="timer-widget-display">00:00</strong>
      </div>
      <div class="timer-widget-controls">
        <button type="button" class="timer-ctrl-btn" id="timer-toggle-btn">Пауза</button>
        <button type="button" class="timer-ctrl-btn" id="timer-plus-btn">+1 мин</button>
        <button type="button" class="timer-ctrl-btn" id="timer-close-btn" aria-label="Закрыть таймер">${icon('close')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const dialog = document.getElementById('shopping-dialog');
  document.getElementById('close-shopping').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });

  document.getElementById('cart-clear').addEventListener('click', () => {
    saveCart([]);
    renderShoppingDialog();
    showToast('Список покупок очищен');
  });

  document.getElementById('cart-copy').addEventListener('click', async () => {
    const txt = buildCartText();
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Список покупок скопирован в буфер');
    } catch {
      showToast('Не удалось скопировать текст');
    }
  });

  document.getElementById('cart-share-tg').addEventListener('click', () => {
    const txt = buildCartText();
    if (!txt) return;
    const siteUrl = location.origin + location.pathname.replace(/[^/]*$/, 'index.html');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
  });

  document.getElementById('cart-share-max').addEventListener('click', () => {
    const txt = buildCartText();
    if (!txt) return;
    window.open(`https://max.ru/:share?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
  });
}

function renderShoppingDialog() {
  const body = document.getElementById('shopping-body');
  const footerEl = document.getElementById('shopping-footer');
  if (!body) return;
  const cart = getCart();
  if (!cart.length) {
    body.innerHTML = `<div class="empty-cart"><p>В списке покупок пока пусто.</p><small>Откройте любой рецепт, выберите нужную вариацию и число порций и нажмите «+ В список покупок».</small></div>`;
    footerEl.hidden = true;
    return;
  }
  footerEl.hidden = false;
  body.innerHTML = cart.map((g, gi) => `
    <div class="cart-group">
      <div class="cart-group-head">
        <div>
          <a href="${esc(g.url)}" class="cart-group-title">${esc(g.title)}</a>
          <small>${esc(g.variantName)} · ${g.servings} порц.</small>
        </div>
        <button type="button" class="text-button" data-remove-group="${gi}">Удалить</button>
      </div>
      <ul class="cart-items">
        ${g.items.map((it, ii) => `
          <li class="cart-item ${it.done ? 'done' : ''}">
            <label>
              <input type="checkbox" data-cart-check="${gi}:${ii}" ${it.done ? 'checked' : ''}>
              <span class="cart-item-name">${esc(it.name)}</span>
              <span class="cart-item-amount">${esc(it.amount)}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');

  body.querySelectorAll('[data-remove-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.removeGroup);
      const next = getCart();
      next.splice(idx, 1);
      saveCart(next);
      renderShoppingDialog();
    });
  });

  body.querySelectorAll('[data-cart-check]').forEach(input => {
    input.addEventListener('change', () => {
      const [gi, ii] = input.dataset.cartCheck.split(':').map(Number);
      const next = getCart();
      if (next[gi]?.items?.[ii]) {
        next[gi].items[ii].done = input.checked;
        saveCart(next);
        renderShoppingDialog();
      }
    });
  });
}

function bindNavActions() {
  ensureGlobalModals();
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? 'Включена вечерняя тёмная тема' : 'Включена светлая тема');
    });
  }
  const cartBtn = document.getElementById('cart-toggle');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      renderShoppingDialog();
      document.getElementById('shopping-dialog')?.showModal();
    });
  }
}

/* Kitchen Timer Engine (Web Audio API chime) */
let activeTimer = { interval: null, remaining: 0, running: false, label: '' };

function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [587.33, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.18 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.18);
      osc.stop(ctx.currentTime + idx * 0.18 + 0.7);
    });
  } catch {}
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerUI() {
  const widget = document.getElementById('kitchen-timer-widget');
  if (!widget) return;
  if (activeTimer.remaining <= 0 && !activeTimer.running) {
    widget.hidden = true;
    return;
  }
  widget.hidden = false;
  document.getElementById('timer-widget-label').textContent = activeTimer.label || 'Таймер готовки';
  document.getElementById('timer-widget-display').textContent = formatSeconds(activeTimer.remaining);
  document.getElementById('timer-toggle-btn').textContent = activeTimer.running ? 'Пауза' : 'Пуск';
}

function startKitchenTimer(seconds, label) {
  ensureGlobalModals();
  clearInterval(activeTimer.interval);
  activeTimer.remaining = Math.max(1, Math.round(seconds));
  activeTimer.running = true;
  activeTimer.label = label || 'Таймер шага';
  updateTimerUI();

  activeTimer.interval = setInterval(() => {
    if (!activeTimer.running) return;
    activeTimer.remaining -= 1;
    if (activeTimer.remaining <= 0) {
      activeTimer.remaining = 0;
      activeTimer.running = false;
      clearInterval(activeTimer.interval);
      playKitchenChime();
      showToast(`⏰ Таймер завершён: ${activeTimer.label}`);
    }
    updateTimerUI();
  }, 1000);

  const toggleBtn = document.getElementById('timer-toggle-btn');
  const plusBtn = document.getElementById('timer-plus-btn');
  const closeBtn = document.getElementById('timer-close-btn');
  if (toggleBtn && !toggleBtn._bound) {
    toggleBtn._bound = true;
    toggleBtn.addEventListener('click', () => {
      activeTimer.running = !activeTimer.running;
      updateTimerUI();
    });
    plusBtn.addEventListener('click', () => {
      activeTimer.remaining += 60;
      activeTimer.running = true;
      updateTimerUI();
    });
    closeBtn.addEventListener('click', () => {
      clearInterval(activeTimer.interval);
      activeTimer.remaining = 0;
      activeTimer.running = false;
      updateTimerUI();
    });
  }
}

function extractStepTimers(htmlStr, stepTitle) {
  const plain = htmlStr.replace(/<[^>]+>/g, ' ');
  const matches = [];
  const rx = /(\d+(?:[.,]\d+)?)(?:\s*[–—-]\s*(\d+(?:[.,]\d+)?))?\s*(минут[аы]?|мин\.?|секунд[аы]?|сек\.?|час[аов]?)/gi;
  let m;
  while ((m = rx.exec(plain)) !== null) {
    const val = Number(m[1].replace(',', '.'));
    const unit = m[3].toLowerCase();
    let sec = 0;
    if (unit.startsWith('час')) sec = Math.round(val * 3600);
    else if (unit.startsWith('сек')) sec = Math.round(val);
    else sec = Math.round(val * 60);
    if (sec >= 15 && sec <= 14400 && !matches.some(x => x.sec === sec)) {
      matches.push({ sec, text: m[0].trim(), title: stepTitle });
    }
  }
  return matches;
}

/* Catalog Card Renderer */
const card = (r, i) => {
  const v = r.variants.find(x => x.id === r.defaultVariant) || r.variants[0];
  const m = v.per100;
  const split = calcMacroSplit(m);
  const favs = getFavs();
  const isFav = favs.has(r.slug);
  return `<a class="recipe-card ${i === 0 ? 'featured' : ''}" reveal href="${esc(r.slug)}">
    <div class="card-photo">
      <img src="${esc(r.image)}" alt="${esc(r.shortTitle)}" loading="lazy" width="600" height="450">
      <span class="category-label">${esc(r.category)}</span>
      <button type="button" class="card-fav-btn ${isFav ? 'active' : ''}" data-fav="${esc(r.slug)}" aria-label="${isFav ? 'Убрать из избранного' : 'В избранное'}" title="В избранное">
        ${icon('heart')}
      </button>
      ${split.pPct >= 30 ? `<span class="protein-pill" title="Доля калорий из белка">${icon('bolt')} ${split.pPct}% белка</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-topline">${icon('clock')}<span>${esc(r.time)}</span><span>${esc(r.difficulty)}</span></div>
      <h3>${esc(r.shortTitle)}</h3>
      <p class="card-desc">${esc(r.description)}</p>
      <div class="macro-mini-bar" aria-hidden="true" title="Баланс калорий: Белки ${split.pPct}% · Жиры ${split.fPct}% · Углеводы ${split.cPct}%">
        <span class="bar-p" style="width:${split.pPct}%"></span>
        <span class="bar-f" style="width:${split.fPct}%"></span>
        <span class="bar-c" style="width:${split.cPct}%"></span>
      </div>
      <div class="card-nutrition">
        <span><strong>${fmt(m.kcal)}</strong> ккал</span>
        <span><strong>${fmt(macro(m, 'Белки'))}</strong> белки, г</span>
        <span><strong>${fmt(macro(m, 'Жиры'))}</strong> жиры, г</span>
        <span><strong>${fmt(macro(m, 'Углеводы'))}</strong> углев., г</span>
      </div>
      <span class="card-unit">На 100 г · ${r.variants.length > 1 ? r.variants.length + ' вариации · показана базовая' : 'оригинальный рецепт'}</span>
    </div>
  </a>`;
};

const FRIDGE_ITEMS = ['Творог', 'Курица', 'Яйца', 'Протеин', 'Греческий йогурт', 'Сыр', 'Овсянка', 'Банан', 'Яблоки', 'Рис'];

function initCatalog() {
  const totalVariants = recipes.reduce((n, r) => n + r.variants.length, 0);
  const favCount = getFavs().size;

  app.innerHTML = `<div class="shell">${nav()}<main id="main">
    <section class="editorial-hero">
      <div class="hero-copy reveal">
        <div class="eyebrow">Коллекция для осознанной кухни</div>
        <h1>Есть вкусно.<br>Чувствовать<br><em>себя хорошо.</em></h1>
        <p>Любимые блюда, продуманный состав и&nbsp;ничего лишнего. Рецепты, в&nbsp;которых удовольствие встречается с&nbsp;балансом.</p>
        <a class="primary" href="#catalog">Найти свой рецепт ${icon('arrow')}</a>
        <div class="hero-foot">
          <span><strong>${recipes.length}</strong> рецептов</span>
          <span><strong>${totalVariants}</strong> вариация</span>
          <span>КБЖУ для каждого блюда</span>
        </div>
      </div>
      <a class="hero-cover reveal" href="caramel-cheesecake.html">
        <img src="caramel-cheesecake-hero.jpg" alt="Карамельно-сливочный чизкейк" width="600" height="600">
        <span class="issue"><b>01</b>ВКУС БАЛАНСА</span>
        <div class="cover-label">
          <div><small>Рецепт на обложке</small><h2>Сливочный чизкейк</h2></div>
          <span class="round-arrow">${icon('arrow')}</span>
        </div>
      </a>
    </section>
    <div class="principles">
      <span>${icon('leaf')} Продуманный состав</span>
      <span>${icon('check')} Понятные ингредиенты</span>
      <span>${icon('clock')} В своём ритме</span>
      <span>${icon('focus')} Готовить с удовольствием</span>
    </div>
    <section class="catalog" id="catalog">
      <div class="section-head">
        <div>
          <h2>На вашей кухне<span class="section-number">${recipes.length}</span></h2>
          <p>От нежного завтрака до маленького десертного ритуала.</p>
        </div>
        <label class="search">${icon('search')}<input id="recipe-search" type="search" placeholder="Найти рецепт или ингредиент" aria-label="Поиск по рецептам и ингредиентам"></label>
      </div>
      <div class="filters" aria-label="Фильтры рецептов">
        ${['Все рецепты', 'Без сахара', 'Кето', 'Высокобелковое', 'До 20 мин'].map((t, i) => `<button class="filter" data-filter="${esc(t)}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('')}
        <button class="filter filter-fav" data-filter="Избранное" aria-pressed="false" id="fav-filter-btn">${icon('heart')} Избранное <span id="fav-count-pill">${favCount ? `(${favCount})` : ''}</span></button>
      </div>
      <div class="fridge-filter" aria-label="Подбор по продуктам">
        <span class="fridge-label">Что есть дома:</span>
        <div class="fridge-chips" id="fridge-chips">
          ${FRIDGE_ITEMS.map(item => `<button type="button" class="fridge-chip" data-fridge="${esc(item)}" aria-pressed="false">${esc(item)}</button>`).join('')}
        </div>
      </div>
      <p class="filter-note">«Без сахара» — без добавленного сахара; природные сахара возможны. «Кето» — подборка низкоуглеводных вариантов, не рекомендация рациона.</p>
      <div class="catalog-controls">
        <span class="results-count" aria-live="polite"></span>
        <div class="catalog-selects">
          <label>
            <span class="sr-only" hidden>Сортировка рецептов</span>
            <select id="sort-recipes" aria-label="Сортировка рецептов">
              <option value="default">Сортировка: По умолчанию</option>
              <option value="protein-desc">Больше белка (на 100 г)</option>
              <option value="protein-index">Высокий белковый индекс (%)</option>
              <option value="kcal-asc">Меньше калорий (на 100 г)</option>
              <option value="time-asc">Быстрее готовить</option>
            </select>
          </label>
          <label>
            <span class="sr-only" hidden>Категория рецептов</span>
            <select id="category" aria-label="Категория рецептов">
              <option value="">Все категории</option>
              ${['Завтраки', 'Основные блюда', 'Десерты', 'Выпечка', 'Напитки'].map(c => `<option>${c}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>
      <div class="recipe-grid" id="recipe-grid"></div>
      <div class="empty-state" id="empty" hidden>
        <h3>Пока ничего не нашлось</h3>
        <p>Попробуйте другой запрос или снимите фильтры.</p>
        <button class="primary" id="reset-filters">Сбросить фильтры</button>
      </div>
    </section>
  </main>${footer()}</div>`;

  bindNavActions();

  let filter = 'Все рецепты';
  let activeFridge = new Set();
  const search = document.getElementById('recipe-search');
  const category = document.getElementById('category');
  const sortSelect = document.getElementById('sort-recipes');

  /* Restore state from sessionStorage if available */
  try {
    const saved = JSON.parse(sessionStorage.getItem(CATALOG_STATE_KEY) || 'null');
    if (saved) {
      if (saved.filter) filter = saved.filter;
      if (saved.q) search.value = saved.q;
      if (saved.cat) category.value = saved.cat;
      if (saved.sort) sortSelect.value = saved.sort;
      if (Array.isArray(saved.fridge)) activeFridge = new Set(saved.fridge);
    }
  } catch {}

  function saveCatalogState() {
    try {
      sessionStorage.setItem(CATALOG_STATE_KEY, JSON.stringify({
        filter,
        q: search.value,
        cat: category.value,
        sort: sortSelect.value,
        fridge: [...activeFridge]
      }));
    } catch {}
  }

  function bindGridFavButtons() {
    document.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const slug = btn.dataset.fav;
        const favs = getFavs();
        if (favs.has(slug)) {
          favs.delete(slug);
          showToast('Убрано из избранного');
        } else {
          favs.add(slug);
          showToast('Добавлено в избранное ♥');
        }
        saveFavs(favs);
        const pill = document.getElementById('fav-count-pill');
        if (pill) pill.textContent = favs.size ? `(${favs.size})` : '';
        update();
      });
    });
  }

  function update() {
    saveCatalogState();
    const q = search.value.toLocaleLowerCase('ru').trim();
    const favs = getFavs();

    let chosen = recipes.filter(r => {
      const hay = (r.title + ' ' + r.variants.flatMap(x => x.ingredients.map(y => y.name || '')).join(' ')).toLocaleLowerCase('ru');
      const tag = filter === 'Без сахара' ? 'Без добавленного сахара' : filter;
      const matchesFilter =
        filter === 'Все рецепты' ? true :
        filter === 'Избранное' ? favs.has(r.slug) :
        r.tags.includes(tag);
      const matchesFridge = [...activeFridge].every(ing => {
        const needle = ing.toLocaleLowerCase('ru').slice(0, -1);
        return hay.includes(needle);
      });
      return (!q || hay.includes(q)) && (!category.value || r.category === category.value) && matchesFilter && matchesFridge;
    });

    const sortMode = sortSelect.value;
    if (sortMode !== 'default') {
      chosen = [...chosen].sort((a, b) => {
        const va = a.variants.find(x => x.id === a.defaultVariant) || a.variants[0];
        const vb = b.variants.find(x => x.id === b.defaultVariant) || b.variants[0];
        if (sortMode === 'protein-desc') return macro(vb.per100, 'Белки') - macro(va.per100, 'Белки');
        if (sortMode === 'protein-index') return calcMacroSplit(vb.per100).pPct - calcMacroSplit(va.per100).pPct;
        if (sortMode === 'kcal-asc') return (va.per100?.kcal || 0) - (vb.per100?.kcal || 0);
        if (sortMode === 'time-asc') return parseMinutes(a.time) - parseMinutes(b.time);
        return 0;
      });
    }

    document.getElementById('recipe-grid').innerHTML = chosen.map(card).join('');
    document.getElementById('empty').hidden = !!chosen.length;
    document.querySelector('.results-count').textContent = `Найдено: ${chosen.length} из ${recipes.length}`;
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === filter));
    document.querySelectorAll('[data-fridge]').forEach(b => b.setAttribute('aria-pressed', activeFridge.has(b.dataset.fridge)));
    bindGridFavButtons();
  }

  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    update();
  }));
  document.querySelectorAll('[data-fridge]').forEach(b => b.addEventListener('click', () => {
    const item = b.dataset.fridge;
    if (activeFridge.has(item)) activeFridge.delete(item);
    else activeFridge.add(item);
    update();
  }));
  search.addEventListener('input', update);
  category.addEventListener('change', update);
  sortSelect.addEventListener('change', update);
  document.getElementById('reset-filters').addEventListener('click', () => {
    filter = 'Все рецепты';
    activeFridge.clear();
    search.value = '';
    category.value = '';
    sortSelect.value = 'default';
    update();
    search.focus();
  });
  update();
}

/* Dynamic JSON-LD Schema.org Recipe Injection */
function updateRecipeSchema(r, variant, servings) {
  let script = document.getElementById('recipe-schema-ld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'recipe-schema-ld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  const ratio = servings / variant.baseServings;
  const baseUrl = location.origin + location.pathname.replace(/[^/]*$/, '');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: `${r.title} (${variant.name})`,
    description: r.description,
    image: [baseUrl + (variant.image || r.image)],
    recipeCategory: r.category,
    keywords: (r.tags || []).join(', '),
    recipeYield: `${servings} порций`,
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${fmt(variant.per100?.kcal || 0)} ккал на 100 г`,
      proteinContent: `${fmt(macro(variant.per100, 'Белки'))} г`,
      fatContent: `${fmt(macro(variant.per100, 'Жиры'))} г`,
      carbohydrateContent: `${fmt(macro(variant.per100, 'Углеводы'))} г`
    },
    recipeIngredient: variant.ingredients.filter(x => !x.group).map(x => `${x.name} — ${scaleAmount(x.amount, ratio)}`),
    recipeInstructions: variant.steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.title,
      text: s.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }))
  };
  script.textContent = JSON.stringify(schema);
}

function initRecipe(r) {
  const params = new URLSearchParams(location.search);
  const urlVarId = Number(params.get('v') || params.get('variant') || location.hash.replace('#var', ''));
  let variant = r.variants.find(v => v.id === urlVarId) || r.variants.find(v => v.id === r.defaultVariant) || r.variants[0];
  const urlServings = Number(params.get('s') || params.get('servings'));
  let servings = (urlServings >= 1 && urlServings <= 20) ? urlServings : variant.baseServings;
  let nutritionMode = 'batch'; // 'batch' | 'single' | 'per100'
  let focusIndex = 0;
  let wakeLock = null;
  let focusOrigin = null;

  const storageKey = () => `pp-checklist-v1:${r.slug}:${variant.id}`;
  const readChecks = () => {
    try { return JSON.parse(localStorage.getItem(storageKey()) || '[]'); }
    catch { return []; }
  };
  let checks = new Set(readChecks());
  const isFav = () => getFavs().has(r.slug);

  app.innerHTML = `<div class="shell">${nav(true)}<main id="main">
    <div class="detail-topbar">
      <a class="breadcrumb" href="index.html#catalog">${icon('back')}К коллекции рецептов</a>
      <button type="button" class="fav-pill-btn ${isFav() ? 'active' : ''}" id="detail-fav-btn">
        ${icon('heart')} <span id="detail-fav-label">${isFav() ? 'В избранном' : 'В избранное'}</span>
      </button>
    </div>
    <section class="detail-hero reveal">
      <div>
        <div class="eyebrow">${esc(r.category)} · ${esc(r.difficulty)}</div>
        <h1>${esc(r.title)}</h1>
        <p>${esc(r.description)}</p>
        <div class="hero-actions-row">
          <a class="primary" href="#ingredients">Приготовим вместе ${icon('arrow')}</a>
        </div>
        <div class="share-toolbar" aria-label="Поделиться рецептом и выбранной вариацией">
          <span class="share-toolbar-label">${icon('share')} Поделиться вариацией:</span>
          <div class="share-buttons">
            <button type="button" class="share-btn share-tg" id="share-tg" title="Отправить в Telegram">${icon('tg')} Telegram</button>
            <button type="button" class="share-btn share-max" id="share-max" title="Отправить в мессенджер MAX">${icon('max')} MAX</button>
            <button type="button" class="share-btn share-vk" id="share-vk" title="Поделиться ВКонтакте">${icon('vk')} ВК</button>
            <button type="button" class="share-btn" id="copy-recipe-text" title="Скопировать полный рецепт с КБЖУ и ингредиентами">${icon('copy')} Текст рецепта</button>
            <button type="button" class="share-btn" id="copy-share-link" title="Скопировать прямую ссылку на эту вариацию">Ссылка</button>
          </div>
        </div>
      </div>
      <div class="detail-image">
        <img id="detail-photo" src="${esc(r.image)}" alt="${esc(r.shortTitle)}" width="600" height="500">
        <span class="detail-caption">${r.variants.length > 1 ? r.variants.length + ' вариаций рецепта' : 'Авторский рецепт'} · Вкус баланса</span>
      </div>
    </section>
    <div class="meta-strip" id="meta"></div>
    ${r.variants.length > 1 ? `<section class="variant-section" aria-label="Вариации рецепта">
      <div class="variant-head">
        <h2>Найдите свой вариант</h2>
        <small class="variant-url-hint">Ссылка в браузере и кнопки «Поделиться» автоматически привязываются к выбранной вариации и порциям</small>
      </div>
      <div class="variant-tabs">${r.variants.map(v => `<button class="variant-btn" data-variant="${v.id}" aria-pressed="false"><small>Вариация ${v.id}</small>${esc(v.name)}</button>`).join('')}</div>
    </section>` : ''}
    <div class="kitchen-layout">
      <aside class="ingredient-panel" id="ingredients">
        <div class="eyebrow">Собираем всё необходимое</div>
        <h2>Ингредиенты</h2>
        <div id="serving-enhancement" data-servings="${servings}">
          <div class="serving-widget">
            <button id="decrease" aria-label="Уменьшить число порций">-</button>
            <output id="servings" aria-live="polite"></output>
            <button id="increase" aria-label="Увеличить число порций">+</button>
          </div>
        </div>
        <p class="ingredient-hint">Изменяйте объём и отмечайте продукты.<br>Количество пересчитывается пропорционально.</p>
        <ul class="ingredient-list" id="ingredient-list"></ul>
        <div class="ingredient-progress">
          <span id="check-progress" aria-live="polite"></span>
          <button class="text-button" id="clear-checks">Снять отметки</button>
        </div>
        <button type="button" class="cart-add-btn" id="add-to-cart">${icon('bag')} + В список покупок</button>
      </aside>
      <div>
        <section class="nutrition">
          <div class="nutrition-title">
            <div>
              <h2>Пищевая ценность</h2>
              <small id="nutrition-label"></small>
            </div>
            <div class="nutrition-mode-switch" role="tablist" aria-label="Режим расчёта КБЖУ">
              <button type="button" class="nutri-tab" data-nutri-mode="batch" aria-pressed="true">На объём</button>
              <button type="button" class="nutri-tab" data-nutri-mode="single" aria-pressed="false">На 1 порцию</button>
              <button type="button" class="nutri-tab" data-nutri-mode="per100" aria-pressed="false">На 100 г</button>
            </div>
          </div>
          <div class="nutrition-grid" id="nutrition-grid" aria-live="polite" aria-atomic="true"></div>
          <div class="macro-analytics" id="macro-analytics"></div>
          <p class="nutrition-foot" id="nutrition-foot"></p>
        </section>
        <section id="method">
          <div class="steps-header">
            <h2>Шаг за шагом</h2>
            <button id="cooking-mode">${icon('focus')}Режим готовки</button>
          </div>
          <p class="ingredient-hint">Граммовки в описании шагов относятся к исходному рецепту. Для выбранного объёма используйте пересчитанный список ингредиентов. Нажмите на кнопку таймера под шагом для запуска отсчёта.</p>
          <ol class="steps" id="steps"></ol>
        </section>
      </div>
    </div>
    <section class="extras" id="extras"></section>
  </main>${footer()}</div>
  <dialog class="cooking-dialog" id="cooking-dialog" aria-labelledby="focus-title">
    <div class="dialog-inner">
      <div class="dialog-header">
        <div>
          <small id="focus-count"></small>
          <span class="wakelock-pill" id="wakelock-pill" hidden>🔆 Экран не гаснет</span>
        </div>
        <button class="icon-button" id="close-focus" aria-label="Закрыть режим готовки">${icon('close')}</button>
      </div>
      <div class="focus-progress"><span id="focus-bar"></span></div>
      <h2 id="focus-title"></h2>
      <p class="focus-note">${esc(r.shortTitle)} · Вариация: <strong id="focus-variant-name"></strong> · Граммовки ниже указаны для исходного рецепта.</p>
      <div class="focus-body" id="focus-body"></div>
      <div class="focus-timers" id="focus-timers"></div>
      <div class="focus-footer">
        <button id="prev-step">${icon('back')} Назад</button>
        <button id="next-step">Следующий шаг ${icon('arrow')}</button>
      </div>
    </div>
  </dialog>`;

  bindNavActions();

  function syncUrlState() {
    const nextUrl = `${location.pathname}?v=${variant.id}&s=${servings}#var${variant.id}`;
    try { history.replaceState(null, '', nextUrl); } catch {}
    updateRecipeSchema(r, variant, servings);
  }

  function getShareUrl() {
    const base = location.origin + location.pathname;
    return `${base}?v=${variant.id}&s=${servings}#var${variant.id}`;
  }

  function buildShareSummary(includeIngredients = false) {
    const ratio = servings / variant.baseServings;
    const p100 = variant.per100;
    const split = calcMacroSplit(p100);
    const varTitle = r.variants.length > 1 ? ` (Вариация: ${variant.name})` : '';
    const lines = [
      `🍽 ${r.title}${varTitle}`,
      `⚡ На 100 г: ${fmt(p100.kcal)} ккал | Б: ${fmt(macro(p100, 'Белки'))} г | Ж: ${fmt(macro(p100, 'Жиры'))} г | У: ${fmt(macro(p100, 'Углеводы'))} г (${split.pPct}% ккал из белка)`,
      `🥣 Расчёт на ${servings} порц.: ${fmt(variant.total.kcal * ratio)} ккал (${fmt(macro(variant.total, 'Белки') * ratio)} г белка)`
    ];
    if (includeIngredients) {
      lines.push('\n📋 Ингредиенты:');
      for (const ing of variant.ingredients) {
        if (ing.group) lines.push(`\n${ing.group}:`);
        else lines.push(`• ${ing.name} — ${scaleAmount(ing.amount, ratio)}`);
      }
    }
    return lines.join('\n');
  }

  document.getElementById('detail-fav-btn').addEventListener('click', () => {
    const favs = getFavs();
    const btn = document.getElementById('detail-fav-btn');
    const lbl = document.getElementById('detail-fav-label');
    if (favs.has(r.slug)) {
      favs.delete(r.slug);
      btn.classList.remove('active');
      lbl.textContent = 'В избранное';
      showToast('Убрано из избранного');
    } else {
      favs.add(r.slug);
      btn.classList.add('active');
      lbl.textContent = 'В избранном';
      showToast('Рецепт сохранён в избранное ♥');
    }
    saveFavs(favs);
  });

  document.getElementById('share-tg').addEventListener('click', () => {
    const url = getShareUrl();
    const text = buildShareSummary(false);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  document.getElementById('share-max').addEventListener('click', () => {
    const url = getShareUrl();
    const fullText = `${buildShareSummary(false)}\n\n👉 Рецепт и пошаговая готовка: ${url}`;
    window.open(`https://max.ru/:share?text=${encodeURIComponent(fullText)}`, '_blank', 'noopener');
  });

  document.getElementById('share-vk').addEventListener('click', () => {
    const url = getShareUrl();
    const title = `${r.shortTitle} (${variant.name}) — ${fmt(variant.per100.kcal)} ккал, ${fmt(macro(variant.per100, 'Белки'))} г белка`;
    const imgUrl = location.origin + location.pathname.replace(/[^/]*$/, '') + (variant.image || r.image);
    window.open(`https://vk.ru/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(imgUrl)}`, '_blank', 'noopener');
  });

  document.getElementById('copy-recipe-text').addEventListener('click', async () => {
    const fullText = `${buildShareSummary(true)}\n\n🔗 Ссылка на эту вариацию: ${getShareUrl()}`;
    try {
      await navigator.clipboard.writeText(fullText);
      showToast('Рецепт с КБЖУ и ингредиентами скопирован!');
    } catch {
      showToast('Не удалось скопировать рецепт');
    }
  });

  document.getElementById('copy-share-link').addEventListener('click', async () => {
    const url = getShareUrl();
    if (navigator.share && window.matchMedia('(max-width: 760px)').matches) {
      try {
        await navigator.share({ title: `${r.shortTitle} · ${variant.name}`, text: buildShareSummary(false), url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Прямая ссылка на вариацию скопирована!');
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  });

  document.getElementById('add-to-cart').addEventListener('click', () => {
    const ratio = servings / variant.baseServings;
    const items = variant.ingredients.filter(x => !x.group).map(x => ({
      name: x.name,
      amount: scaleAmount(x.amount, ratio),
      done: false
    }));
    const cart = getCart();
    cart.push({
      slug: r.slug,
      title: r.shortTitle,
      variantName: variant.name,
      servings,
      url: getShareUrl(),
      items
    });
    saveCart(cart);
    showToast(`Ингредиенты (${servings} порц.) добавлены в список покупок`);
  });

  const changeNumber = (el, str) => {
    el.textContent = str;
    el.classList.remove('number-change');
    void el.offsetWidth;
    el.classList.add('number-change');
  };

  function updateNumbers() {
    const ratio = servings / variant.baseServings;
    const root = document.getElementById('serving-enhancement');
    root.dataset.servings = servings;
    if (document.getElementById('servings')) {
      document.getElementById('servings').textContent = `${servings} ${servings === 1 ? 'порция' : servings < 5 ? 'порции' : 'порций'}`;
      document.getElementById('decrease').disabled = servings <= 1;
      document.getElementById('increase').disabled = servings >= 20;
    }
    window.dispatchEvent(new CustomEvent('recipe:servings-update', { detail: servings }));
    document.querySelectorAll('[data-amount]').forEach(el =>
      changeNumber(el, scaleAmount(variant.ingredients[Number(el.dataset.amount)].amount, ratio))
    );
    document.querySelectorAll('[data-meta]').forEach(el => {
      const label = el.dataset.meta;
      if (/Порци|порци|Количество/.test(label) && !/Вес|вес/.test(label))
        el.textContent = `${servings} ${servings === 1 ? 'порция' : servings < 5 ? 'порции' : 'порций'}`;
      else if (/Вес|вес|Объем|Основа яйц|Калорийность|Чистый белок/.test(label) && !/Вес порции/.test(label))
        el.textContent = scaleAmount(el.dataset.metaOriginal, ratio);
    });

    const total = variant.total;
    const per100 = variant.per100;
    let factor = ratio;
    let modeLabel = `На ${servings} ${servings === 1 ? 'порцию' : servings < 5 ? 'порции' : 'порций'}`;
    let sourceBlock = total;

    if (nutritionMode === 'single') {
      factor = 1 / variant.baseServings;
      modeLabel = 'На 1 порцию блюда';
      sourceBlock = total;
    } else if (nutritionMode === 'per100') {
      factor = 1;
      modeLabel = 'На 100 г готового блюда (эталон)';
      sourceBlock = per100 || total;
    }

    const fiberVal = macro(sourceBlock, 'Клетчатка');
    const values = sourceBlock ? [
      { label: 'Энергия', value: sourceBlock.kcal * factor, unit: 'ккал' },
      ...['Белки', 'Жиры', 'Углеводы'].map(name => ({ label: name, value: (macro(sourceBlock, name) || 0) * factor, unit: 'г' })),
      ...(fiberVal ? [{ label: 'Клетчатка', value: fiberVal * factor, unit: 'г' }] : [])
    ] : [];

    document.getElementById('nutrition-label').textContent = modeLabel;
    const gridEl = document.getElementById('nutrition-grid');
    gridEl.style.gridTemplateColumns = `repeat(${values.length}, 1fr)`;
    gridEl.innerHTML = values.map(x => `<div class="nutrient"><small>${x.label}</small><strong class="number-change">${fmt(x.value)} <span>${x.unit}</span></strong></div>`).join('');

    const split = calcMacroSplit(per100 || total);
    const proteinPerServing = fmt((macro(total, 'Белки') || 0) / variant.baseServings);
    document.getElementById('macro-analytics').innerHTML = `
      <div class="macro-bar-head">
        <span><strong>Протеиновый индекс: ${split.pPct}%</strong> энергии из белка (${proteinPerServing} г белка в 1 порции)</span>
        <span class="macro-legend">
          <i class="dot-p"></i>Б ${split.pPct}%
          <i class="dot-f"></i>Ж ${split.fPct}%
          <i class="dot-c"></i>У ${split.cPct}%
        </span>
      </div>
      <div class="macro-bar-track">
        <span class="bar-p" style="width:${split.pPct}%"></span>
        <span class="bar-f" style="width:${split.fPct}%"></span>
        <span class="bar-c" style="width:${split.cPct}%"></span>
      </div>
    `;

    document.getElementById('nutrition-foot').textContent =
      (variant.per100 ? `На 100 г: ${fmt(variant.per100.kcal)} ккал · Б ${fmt(macro(variant.per100, 'Белки'))} · Ж ${fmt(macro(variant.per100, 'Жиры'))} · У ${fmt(macro(variant.per100, 'Углеводы'))} г. ` : '') +
      'На одну порцию: ' + fmt(total.kcal / variant.baseServings) + ' ккал. Данные из исходного рецепта, возможны округления. Время приготовления не масштабируется; при изменении объёма учитывайте размер формы и готовность блюда.';

    syncUrlState();
  }

  document.querySelectorAll('[data-nutri-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      nutritionMode = btn.dataset.nutriMode;
      document.querySelectorAll('[data-nutri-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.nutriMode === nutritionMode));
      updateNumbers();
    });
  });

  function updateProgress() {
    const total = variant.ingredients.filter(x => !x.group).length;
    document.getElementById('check-progress').textContent = `Готово ${checks.size} из ${total}`;
    try { localStorage.setItem(storageKey(), JSON.stringify([...checks])); } catch {}
  }

  function bindTimerButtons(container) {
    container.querySelectorAll('[data-timer-sec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = Number(btn.dataset.timerSec);
        const label = btn.dataset.timerLabel;
        startKitchenTimer(sec, label);
        showToast(`⏱ Запущен таймер: ${label}`);
      });
    });
  }

  function renderVariant() {
    document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.variant) === variant.id));
    const meta = variant.meta.map(m => `<div><small>${esc(m.label)}</small><strong data-meta="${esc(m.label)}" data-meta-original="${esc(m.value)}">${esc(m.value)}</strong></div>`).join('');
    document.getElementById('meta').innerHTML = meta;
    document.getElementById('ingredient-list').innerHTML = variant.ingredients.map((x, i) =>
      x.group
        ? `<li class="ing-group-title">${esc(x.group)}</li>`
        : `<li class="ingredient-item"><input type="checkbox" id="ing-${i}" data-check="${i}" ${checks.has(i) ? 'checked' : ''}><label for="ing-${i}"><span class="checkbox-ui" aria-hidden="true"></span><span class="ingredient-copy"><span class="ing-name">${esc(x.name)}</span><span class="ing-amount" data-amount="${i}"></span></span></label></li>`
    ).join('');
    document.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', () => {
      const id = Number(input.dataset.check);
      if (input.checked) checks.add(id); else checks.delete(id);
      updateProgress();
    }));

    document.getElementById('steps').innerHTML = variant.steps.map((s, i) => {
      const timers = extractStepTimers(s.html, s.title);
      const timerHtml = timers.length
        ? `<div class="step-timers">${timers.map(t => `<button type="button" class="step-timer-chip" data-timer-sec="${t.sec}" data-timer-label="${esc(s.title)} (${esc(t.text)})">${icon('timer')} Таймер: ${esc(t.text)}</button>`).join('')}</div>`
        : '';
      return `<li class="step"><span class="step-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div class="step-main"><h3>${esc(s.title)}</h3>${s.html}${timerHtml}</div></li>`;
    }).join('');
    bindTimerButtons(document.getElementById('steps'));

    document.getElementById('detail-photo').src = variant.image || (r.slug === 'egg-white-scramble.html' && variant.id == 2 ? 'egg-scramble-yolks.png' : r.image);
    updateNumbers();
    updateProgress();
  }

  function setServings(n) {
    servings = Math.max(1, Math.min(20, n));
    updateNumbers();
  }
  document.getElementById('decrease').addEventListener('click', () => setServings(servings - 1));
  document.getElementById('increase').addEventListener('click', () => setServings(servings + 1));
  window.addEventListener('recipe:servings-change', e => setServings(Number(e.detail)));

  document.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => {
    variant = r.variants.find(v => v.id === Number(b.dataset.variant));
    servings = variant.baseServings;
    checks = new Set(readChecks());
    renderVariant();
  }));
  window.addEventListener('hashchange', () => {
    const target = r.variants.find(v => v.id === Number(location.hash.replace('#var', '')));
    if (target && target !== variant) {
      variant = target;
      servings = variant.baseServings;
      checks = new Set(readChecks());
      renderVariant();
    }
  });
  document.getElementById('clear-checks').addEventListener('click', () => {
    checks.clear();
    document.querySelectorAll('[data-check]').forEach(input => input.checked = false);
    updateProgress();
  });

  const dialog = document.getElementById('cooking-dialog');
  function focusStep() {
    const step = variant.steps[focusIndex];
    document.getElementById('focus-count').textContent = `ШАГ ${focusIndex + 1} ИЗ ${variant.steps.length}`;
    document.getElementById('focus-title').textContent = step.title;
    document.getElementById('focus-variant-name').textContent = variant.name;
    document.getElementById('focus-body').innerHTML = step.html;
    const timers = extractStepTimers(step.html, step.title);
    const focusTimersEl = document.getElementById('focus-timers');
    focusTimersEl.innerHTML = timers.map(t => `<button type="button" class="step-timer-chip" data-timer-sec="${t.sec}" data-timer-label="${esc(step.title)} (${esc(t.text)})">${icon('timer')} Запустить таймер: ${esc(t.text)}</button>`).join('');
    bindTimerButtons(focusTimersEl);
    document.getElementById('focus-bar').style.width = `${(focusIndex + 1) / variant.steps.length * 100}%`;
    document.getElementById('prev-step').disabled = focusIndex === 0;
    document.getElementById('next-step').innerHTML = focusIndex === variant.steps.length - 1 ? 'Готово ' + icon('check') : 'Следующий шаг ' + icon('arrow');
    dialog.scrollTop = 0;
  }
  function closeFocus() { dialog.close(); }
  document.getElementById('cooking-mode').addEventListener('click', async () => {
    focusOrigin = document.activeElement;
    focusIndex = 0;
    focusStep();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    document.getElementById('close-focus').focus();
    try {
      if (navigator.wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        document.getElementById('wakelock-pill').hidden = false;
      }
    } catch {}
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    document.getElementById('wakelock-pill').hidden = true;
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
    focusOrigin?.focus();
  });
  document.getElementById('close-focus').addEventListener('click', closeFocus);
  document.getElementById('prev-step').addEventListener('click', () => { if (focusIndex > 0) { focusIndex--; focusStep(); } });
  document.getElementById('next-step').addEventListener('click', () => { if (focusIndex < variant.steps.length - 1) { focusIndex++; focusStep(); } else closeFocus(); });
  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeFocus();
    }
  });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && focusIndex < variant.steps.length - 1) { focusIndex++; focusStep(); }
    if (e.key === 'ArrowLeft' && focusIndex > 0) { focusIndex--; focusStep(); }
  });
  document.getElementById('extras').innerHTML = r.extraHtml || '';
  renderVariant();
}

const slug = decodeURIComponent(location.pathname.split('/').pop()) || 'index.html';
const recipe = recipes.find(r => r.slug === slug);
if (recipe) initRecipe(recipe);
else initCatalog();
})();

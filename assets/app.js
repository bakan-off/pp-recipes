/* Shared static application. Source recipe data is never mutated. */
(() => {
'use strict';
const recipes = window.RECIPES || [];
const app = typeof document !== 'undefined' ? document.getElementById('app') : null;

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
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    barcode: '<path d="M3 5v14M6 5v14M10 5v14M13 5v14M17 5v14M21 5v14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    scale: '<path d="M12 3v18M5 8l7-3 7 3M5 8l-2 6h4l-2-6zm14 0-2 6h4l-2-6zM8 21h8"/>',
    mic: '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4m-4 0h8"/>',
    compare: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM5 3v4M3 5h4M19 17v4M17 19h4"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
};

/* ==========================================================================
   1. PURE ALGORITHMS & UTILITIES (Exported to window.RecipeUtils for testing)
   ========================================================================== */

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

function calcGramsNutrition(per100Block, grams) {
  const g = Math.max(0, Number(grams) || 0);
  const factor = g / 100;
  return {
    grams: g,
    kcal: Math.round((per100Block?.kcal || 0) * factor * 10) / 10,
    protein: Math.round(macro(per100Block, 'Белки') * factor * 10) / 10,
    fat: Math.round(macro(per100Block, 'Жиры') * factor * 10) / 10,
    carbs: Math.round(macro(per100Block, 'Углеводы') * factor * 10) / 10,
    fiber: Math.round(macro(per100Block, 'Клетчатка') * factor * 10) / 10
  };
}

function calcPanRatio(baseDiameterCm, targetDiameterCm) {
  const b = Number(baseDiameterCm);
  const t = Number(targetDiameterCm);
  if (!b || !t || b <= 0 || t <= 0) return 1;
  return Math.round(((t * t) / (b * b)) * 10000) / 10000;
}

const quantityPattern = /(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)(?:\s*[–—-]\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?))?/g;
function quantityNumber(s) {
  const parts = String(s).split('/').map(x => Number(x.trim().replace(',', '.')));
  return parts.length === 2 ? parts[0] / parts[1] : parts[0];
}
function scaleAmount(amount, ratio) {
  if (ratio === 1 || !Number.isFinite(ratio) || ratio <= 0) return amount;
  return String(amount ?? '').replace(quantityPattern, (all, lo, hi, offset, fullStr) => {
    const before = fullStr.slice(0, offset);
    const after = fullStr.slice(offset + all.length);
    if (/(?:^|[\s(])по\s*$/.test(before) || /[A-Za-zА-Яа-яЁё-]$/.test(before) || /^[%°]/.test(after)) return all;
    return fmt(quantityNumber(lo) * ratio) + (hi ? '-' + fmt(quantityNumber(hi) * ratio) : '');
  });
}

function parseAmountParts(amountStr) {
  const s = String(amountStr || '').trim();
  const numRx = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)(?:\s*[–—-]\s*\d+(?:[.,]\d+)?)?\s*(г|грамм[аов]?|кг|мл|л|шт\.?|ст\.\s*л\.?|ч\.\s*л\.?|скуп[аов]?|стик[аов]?|зубчик[аов]?|пучок|пучка|пачк[аи]|банк[аи]|ломтик[аов]?)/i;
  const m = s.match(numRx);
  if (!m) return { unit: null, val: 0, grams: 0, raw: s };
  const val = quantityNumber(m[1]);
  const rawUnit = m[2].toLowerCase().replace(/\s+/g, ' ');
  let unit = rawUnit;
  if (/^грамм|^г$/.test(rawUnit)) unit = 'г';
  else if (/^шт/.test(rawUnit)) unit = 'шт';
  else if (/^ст\.\s*л/.test(rawUnit)) unit = 'ст. л.';
  else if (/^ч\.\s*л/.test(rawUnit)) unit = 'ч. л.';
  else if (/^скуп/.test(rawUnit)) unit = 'скуп';
  else if (/^стик/.test(rawUnit)) unit = 'стик';
  else if (/^зубчик/.test(rawUnit)) unit = 'зуб.';
  else if (/^пачк/.test(rawUnit)) unit = 'пач.';
  else if (/^банк/.test(rawUnit)) unit = 'бан.';

  let grams = unit === 'г' ? val : (unit === 'кг' ? val * 1000 : 0);
  if (!grams) {
    const gm = s.match(/\(\s*~?\s*(\d+(?:[.,]\d+)?)\s*(?:г|грамм)/i);
    if (gm) grams = Number(gm[1].replace(',', '.'));
  }
  return { unit, val, grams, raw: s };
}

function extractPrimaryAmount(amountStr) {
  const parsed = parseAmountParts(amountStr);
  if (!parsed.unit || !(parsed.val > 0)) return null;
  return {
    value: parsed.val,
    unit: parsed.unit,
    grams: parsed.grams > 0 ? parsed.grams : (parsed.unit === 'г' ? parsed.val : null)
  };
}

const BASELINE_NUTRITION_RULES = [
  { rx: /творог.*мягк.*0[.,]?1\s*%|мягк.*творог.*0[.,]?1\s*%|савушкин.*0[.,]?1\s*%|teos/i, kcal: 62, p: 11, f: 0.1, c: 4 },
  { rx: /творог.*мягк.*5\s*%|мягк.*творог.*5\s*%/i, kcal: 94, p: 10, f: 5, c: 3.8 },
  { rx: /творог.*зерн/i, kcal: 105, p: 13, f: 4.5, c: 2.5 },
  { rx: /творог.*(?:0\s*%|0[.,]5\s*%|0[–-]\s*0[.,]5\s*%|обезжир)/i, kcal: 85, p: 18, f: 0.3, c: 1.8 },
  { rx: /творог.*2\s*%/i, kcal: 103, p: 18, f: 2, c: 3.3 },
  { rx: /творог.*5\s*%/i, kcal: 121, p: 17.2, f: 5, c: 1.8 },
  { rx: /творог.*9\s*%/i, kcal: 159, p: 16.7, f: 9, c: 2 },
  { rx: /творожн\S*\s+сыр|сыр\s+творожн|сливочн\S*\s+сыр|альметт|филадельф|крем-чиз/i, kcal: 220, p: 7, f: 20, c: 3 },
  { rx: /рикотт.*light|рикотт.*лайт|рикотт.*15/i, kcal: 125, p: 11, f: 7, c: 3.8 },
  { rx: /рикотт/i, kcal: 145, p: 10.5, f: 9.5, c: 3.5 },
  { rx: /маскарпоне/i, kcal: 395, p: 4.8, f: 41, c: 2.5 },
  { rx: /творог/i, kcal: 88, p: 18, f: 1, c: 1.8 },
  { rx: /сыр.*15\s*%/i, kcal: 213, p: 33, f: 9, c: 0 },
  { rx: /сыр.*(?:17|18)\s*%|моцарелл.*light|моцарелл.*18/i, kcal: 206, p: 24, f: 12, c: 0.5 },
  { rx: /сыр.*(?:20|25)\s*%|сыр\s+л[её]гк/i, kcal: 232, p: 31, f: 12, c: 0 },
  { rx: /сыр.*35\s*%/i, kcal: 265, p: 28.2, f: 16.6, c: 0 },
  { rx: /сулугуни|моцарелл/i, kcal: 285, p: 21.5, f: 22, c: 0.5 },
  { rx: /пармезан/i, kcal: 392, p: 33, f: 28, c: 0 },
  { rx: /фета|брынз|сиртаки|адыгейск/i, kcal: 240, p: 18, f: 18, c: 1 },
  { rx: /сыр.*50\s*%|ламбер|чеддер/i, kcal: 364, p: 23.7, f: 30, c: 0 },
  { rx: /(?:^|[\s(])сыр/i, kcal: 260, p: 28, f: 16, c: 0 },
  { rx: /йогурт.*0\s*%/i, kcal: 53, p: 9, f: 0.1, c: 4 },
  { rx: /скир/i, kcal: 72, p: 11, f: 0.5, c: 4 },
  { rx: /йогурт/i, kcal: 66, p: 8, f: 2, c: 4.2 },
  { rx: /сметан.*10\s*%/i, kcal: 115, p: 3, f: 10, c: 2.9 },
  { rx: /сметан.*15\s*%/i, kcal: 158, p: 2.6, f: 15, c: 3 },
  { rx: /сметан.*(?:20|25)\s*%|сметан/i, kcal: 158, p: 2.6, f: 15, c: 3 },
  { rx: /кефир|ряженк|мацони/i, kcal: 50, p: 3, f: 2, c: 4 },
  { rx: /шницел.*троекуров/i, kcal: 192.2, p: 13.8, f: 6.6, c: 7 },
  { rx: /ветчин|карбонад|пастром/i, kcal: 95, p: 15, f: 3.5, c: 1 },
  { rx: /индейк/i, kcal: 104, p: 24, f: 1, c: 0 },
  { rx: /бедр/i, kcal: 138, p: 19.5, f: 6.5, c: 0 },
  { rx: /фарш.*говя/i, kcal: 165, p: 19, f: 10, c: 0 },
  { rx: /фарш/i, kcal: 125, p: 20, f: 4.5, c: 0 },
  { rx: /куриц|курин|грудк|филе/i, kcal: 113, p: 23.6, f: 1.9, c: 0 },
  { rx: /тунец|тунца/i, kcal: 101, p: 23, f: 0.8, c: 0 },
  { rx: /лосос|семг|форел/i, kcal: 202, p: 21, f: 13, c: 0 },
  { rx: /горбуш/i, kcal: 136, p: 20.5, f: 5.8, c: 0 },
  { rx: /кревет|кальмар/i, kcal: 95, p: 20, f: 1.5, c: 0 },
  { rx: /рыб|треск|минтай|судак|хек/i, kcal: 82, p: 18.5, f: 0.8, c: 0 },
  { rx: /белок\s+яич|белки\s+яич|яичн\S*\s+бел/i, kcal: 48, p: 11.1, f: 0, c: 0.7 },
  { rx: /яйц|яиц/i, kcal: 157, p: 12.7, f: 11.5, c: 0.7 },
  { rx: /изолят/i, kcal: 372, p: 88, f: 1, c: 2 },
  { rx: /казеин/i, kcal: 365, p: 76, f: 2.5, c: 7 },
  { rx: /протеин|ксб|whey|альбумин/i, kcal: 395, p: 78, f: 6.5, c: 6 },
  { rx: /сгущен.*(?:1\s*%|4\s*%|л[её]гк|станция)/i, kcal: 220, p: 8.5, f: 4, c: 40 },
  { rx: /сгущен/i, kcal: 328, p: 7.2, f: 8.5, c: 56 },
  { rx: /сливк/i, kcal: 119, p: 2.7, f: 10, c: 4.5 },
  { rx: /молок.*0[.,]5\s*%/i, kcal: 35, p: 3.1, f: 0.5, c: 4.9 },
  { rx: /молок.*(?:2[.,]5|3[.,]2)\s*%/i, kcal: 56, p: 2.9, f: 2.8, c: 4.8 },
  { rx: /молок/i, kcal: 45, p: 3, f: 1.5, c: 4.8 },
  { rx: /лапш|макарон|паста|спагетти/i, kcal: 298, p: 10.4, f: 2, c: 59.2 },
  { rx: /псиллиум/i, kcal: 180, p: 2, f: 0.5, c: 12 },
  { rx: /овсян|геркулес/i, kcal: 352, p: 12.5, f: 6.2, c: 61 },
  { rx: /миндальн\S*\s+мук/i, kcal: 575, p: 21, f: 50, c: 10 },
  { rx: /кокосов\S*\s+мук/i, kcal: 350, p: 19, f: 11, c: 26 },
  { rx: /отруб/i, kcal: 320, p: 17, f: 7, c: 45 },
  { rx: /крахмал/i, kcal: 343, p: 0.3, f: 0.1, c: 85 },
  { rx: /мук[аи]|круп|рис|гречк|манк|манн/i, kcal: 345, p: 9, f: 2, c: 72 },
  { rx: /какао/i, kcal: 310, p: 22, f: 11, c: 14 },
  { rx: /глазур.*без\s+сахар|глазур.*протеин/i, kcal: 430, p: 12, f: 32, c: 22 },
  { rx: /глазур/i, kcal: 510, p: 4.5, f: 32, c: 50 },
  { rx: /шоколад.*люкс|шоколад.*т[её]мн/i, kcal: 540, p: 6.5, f: 31, c: 54 },
  { rx: /шоколад.*без\s+сахар/i, kcal: 440, p: 8.5, f: 34, c: 24 },
  { rx: /шоколад/i, kcal: 515, p: 7.5, f: 34, c: 44 },
  { rx: /арахисов\S*\s+паст|урбеч/i, kcal: 588, p: 26, f: 50, c: 14 },
  { rx: /орех|грецк|миндал|фундук|кешью|арахис|фисташк/i, kcal: 630, p: 16, f: 56, c: 13 },
  { rx: /кунжут|семечк|чиа|лен|лён/i, kcal: 565, p: 19, f: 49, c: 12 },
  { rx: /масло.*(?:оливк|растит|кокос|гхи|подсолн)/i, kcal: 898, p: 0, f: 99.8, c: 0 },
  { rx: /масло/i, kcal: 662, p: 0.8, f: 72.5, c: 1.4 },
  { rx: /лаваш|тортиль|лепешк|пита/i, kcal: 236, p: 7.9, f: 1, c: 48.5 },
  { rx: /банан/i, kcal: 95, p: 1.5, f: 0.2, c: 21.8 },
  { rx: /голубик|черник/i, kcal: 51, p: 1, f: 0.5, c: 10.5 },
  { rx: /клубник.*консерв/i, kcal: 58, p: 0.7, f: 0.2, c: 13.5 },
  { rx: /клубник|земляник/i, kcal: 41, p: 0.8, f: 0.4, c: 7.5 },
  { rx: /малин|ежевик|смородин|брусник|клюкв/i, kcal: 46, p: 0.8, f: 0.4, c: 9.0 },
  { rx: /вишн|черешн/i, kcal: 52, p: 0.9, f: 0.4, c: 11.0 },
  { rx: /яблок|груш|ягод|персик|абрикос|слив|ананас|манго|киви|апельсин|мандарин/i, kcal: 47, p: 0.5, f: 0.3, c: 10.2 },
  { rx: /мед|мёд/i, kcal: 304, p: 0.8, f: 0, c: 80 },
  { rx: /сахар/i, kcal: 398, p: 0, f: 0, c: 99.8 },
  { rx: /сироп.*без\s+сахар|топинг.*без\s+сахар/i, kcal: 35, p: 0, f: 0, c: 8 },
  { rx: /сироп|джем|варень/i, kcal: 240, p: 0.3, f: 0.1, c: 60 },
  { rx: /соев\S*\s+соус/i, kcal: 55, p: 6, f: 0, c: 7.5 },
  { rx: /чеснок/i, kcal: 149, p: 6.5, f: 0.5, c: 30 },
  { rx: /ванилин|разрыхлител|соль|перец|кориц|специ|трав|подсластител|фитпарад|эритрит|стеви|вода/i, kcal: 0, p: 0, f: 0, c: 0 }
];

const INGREDIENT_SWAPS = [];

function getIngredientGrams(amountStr) {
  const primary = extractPrimaryAmount(amountStr);
  if (!primary) return 0;
  if (primary.grams > 0) return primary.grams;
  if (primary.unit === 'г' || primary.unit === 'мл') return primary.value;
  if (primary.unit === 'кг' || primary.unit === 'л') return primary.value * 1000;
  if (primary.unit === 'шт') return primary.value * 55;
  if (primary.unit === 'скуп') return primary.value * 30;
  if (primary.unit === 'ст. л.') return primary.value * 20;
  if (primary.unit === 'ч. л.') return primary.value * 5;
  return 0;
}

function inferBaselineNutrition(ingName) {
  const s = String(ingName || '').trim();
  const explicitMatch = s.match(/(\d+(?:[.,]\d+)?)\s*ккал\s*\|\s*Б\s*(\d+(?:[.,]\d+)?)\s*\|\s*Ж\s*(\d+(?:[.,]\d+)?)\s*\|\s*У\s*(\d+(?:[.,]\d+)?)/i);
  if (explicitMatch) {
    return {
      kcal: Number(explicitMatch[1].replace(',', '.')),
      p: Number(explicitMatch[2].replace(',', '.')),
      f: Number(explicitMatch[3].replace(',', '.')),
      c: Number(explicitMatch[4].replace(',', '.'))
    };
  }
  for (const rule of BASELINE_NUTRITION_RULES) {
    if (rule.rx.test(s)) {
      return { kcal: rule.kcal, p: rule.p, f: rule.f, c: rule.c };
    }
  }
  return { kcal: 100, p: 8, f: 3, c: 10 };
}

function getIngredientSwapConfig(ingName, ingAmount = '') {
  const s = String(ingName || '').trim();
  if (!s) return null;
  const baseGrams = getIngredientGrams(ingAmount);
  const base = baseGrams > 0 ? inferBaselineNutrition(s) : { kcal: 0, p: 0, f: 0, c: 0 };
  return {
    category: s,
    label: s,
    baseGrams,
    baseMacro: base
  };
}

function applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients = []) {
  const hasSwaps = activeSwaps && Object.keys(activeSwaps).length > 0;
  const hasAdded = Array.isArray(customAddedIngredients) && customAddedIngredients.length > 0;
  if (!hasSwaps && !hasAdded) return baseVariant;

  const clone = {
    ...baseVariant,
    total: {
      kcal: baseVariant.total.kcal,
      macros: baseVariant.total.macros.map(m => ({ ...m }))
    },
    per100: baseVariant.per100 ? {
      kcal: baseVariant.per100.kcal,
      macros: baseVariant.per100.macros.map(m => ({ ...m }))
    } : null,
    ingredients: baseVariant.ingredients.map(ing => ({ ...ing }))
  };

  const baseDishWeight = (baseVariant.per100?.kcal > 0)
    ? (baseVariant.total.kcal / baseVariant.per100.kcal) * 100
    : 500;

  let dKcal = 0, dP = 0, dF = 0, dC = 0, dWeight = 0;

  clone.ingredients.forEach((ing, idx) => {
    if (ing.group) return;
    const swap = activeSwaps ? (activeSwaps[idx] ?? activeSwaps[String(idx)] ?? activeSwaps[ing.name]) : null;
    if (!swap || swap.id === 'default') return;

    const primary = extractPrimaryAmount(ing.amount);
    const baseGrams = getIngredientGrams(ing.amount);
    const baseMacro = baseGrams > 0 ? inferBaselineNutrition(ing.name) : { kcal: 0, p: 0, f: 0, c: 0 };
    const origFactor = baseGrams / 100;

    if (swap.removed) {
      if (baseGrams > 0) {
        dKcal -= baseMacro.kcal * origFactor;
        dP -= baseMacro.p * origFactor;
        dF -= baseMacro.f * origFactor;
        dC -= baseMacro.c * origFactor;
        dWeight -= baseGrams;
      }
      ing.originalName = ing.name;
      ing.originalAmount = ing.amount;
      ing.amount = '0 г (убрано из рецепта)';
      ing.removed = true;
      ing.swapped = true;
      ing.customGrams = 0;
      return;
    }

    const newGrams = (swap.grams !== undefined && swap.grams !== null && Number.isFinite(Number(swap.grams)) && Number(swap.grams) >= 0)
      ? Number(swap.grams)
      : baseGrams;
    const newFactor = newGrams / 100;

    const sKcal = Number.isFinite(Number(swap.kcal)) ? Number(swap.kcal) : baseMacro.kcal;
    const sP = Number.isFinite(Number(swap.p)) ? Number(swap.p) : baseMacro.p;
    const sF = Number.isFinite(Number(swap.f)) ? Number(swap.f) : baseMacro.f;
    const sC = Number.isFinite(Number(swap.c)) ? Number(swap.c) : baseMacro.c;

    dKcal += (sKcal * newFactor) - (baseMacro.kcal * origFactor);
    dP += (sP * newFactor) - (baseMacro.p * origFactor);
    dF += (sF * newFactor) - (baseMacro.f * origFactor);
    dC += (sC * newFactor) - (baseMacro.c * origFactor);
    dWeight += (newGrams - baseGrams);

    ing.originalName = ing.name;
    ing.originalAmount = ing.amount;
    const cleanBaseTitle = ing.name.split('(')[0].trim();
    const cleanTargetName = (swap.shortName || swap.name || ing.name).trim();
    const isSameProduct = !swap.isCustomName && (
      cleanTargetName.toLocaleLowerCase('ru') === cleanBaseTitle.toLocaleLowerCase('ru') ||
      cleanTargetName.toLocaleLowerCase('ru') === ing.name.trim().toLocaleLowerCase('ru')
    );

    if (!isSameProduct) {
      ing.name = `${cleanTargetName} (вместо: ${cleanBaseTitle})`;
    }
    const unit = primary?.unit === 'мл' ? 'мл' : 'г';
    if (Math.abs(newGrams - baseGrams) > 0.05) {
      ing.amount = baseGrams > 0
        ? `${fmt(newGrams)} ${unit} (вместо ${fmt(baseGrams)} г)`
        : `${fmt(newGrams)} ${unit}`;
    }
    ing.swapped = true;
    ing.customGrams = newGrams;
  });

  if (hasAdded) {
    for (const item of customAddedIngredients) {
      const g = Math.max(0, Number(item.grams) || 0);
      const factor = g / 100;
      const kcal = Math.max(0, Number(item.kcal) || 0);
      const p = Math.max(0, Number(item.p) || 0);
      const f = Math.max(0, Number(item.f) || 0);
      const c = Math.max(0, Number(item.c) || 0);

      dKcal += kcal * factor;
      dP += p * factor;
      dF += f * factor;
      dC += c * factor;
      dWeight += g;

      clone.ingredients.push({
        name: `${item.name} (добавлено)`,
        originalName: item.name,
        amount: `${fmt(g)} ${item.unit || 'г'}`,
        addedByUser: true,
        addedId: item.id,
        swapped: true,
        customGrams: g,
        customMacro: { kcal, p, f, c }
      });
    }
  }

  const addMacro = (macrosArr, labelPrefix, delta) => {
    const item = macrosArr.find(m => m.label.startsWith(labelPrefix));
    if (item) item.value = Math.max(0, Math.round((item.value + delta) * 10) / 10);
  };
  const setMacro = (macrosArr, labelPrefix, val) => {
    const item = macrosArr.find(m => m.label.startsWith(labelPrefix));
    if (item) item.value = Math.max(0, Math.round(val * 10) / 10);
  };

  clone.total.kcal = Math.max(1, Math.round(clone.total.kcal + dKcal));
  addMacro(clone.total.macros, 'Белки', dP);
  addMacro(clone.total.macros, 'Жиры', dF);
  addMacro(clone.total.macros, 'Углеводы', dC);

  const newDishWeight = Math.max(50, baseDishWeight + dWeight);
  clone.dishWeightDelta = Math.round(dWeight);
  clone.estimatedDishWeight = Math.round(newDishWeight);

  if (clone.per100 && baseDishWeight > 0) {
    if (Math.abs(dWeight) < 0.1) {
      const per100Factor = 100 / baseDishWeight;
      clone.per100.kcal = Math.max(1, Math.round((clone.per100.kcal + dKcal * per100Factor) * 10) / 10);
      addMacro(clone.per100.macros, 'Белки', dP * per100Factor);
      addMacro(clone.per100.macros, 'Жиры', dF * per100Factor);
      addMacro(clone.per100.macros, 'Углеводы', dC * per100Factor);
    } else {
      const wRatio = 100 / newDishWeight;
      clone.per100.kcal = Math.max(1, Math.round(clone.total.kcal * wRatio * 10) / 10);
      setMacro(clone.per100.macros, 'Белки', macro(clone.total, 'Белки') * wRatio);
      setMacro(clone.per100.macros, 'Жиры', macro(clone.total, 'Жиры') * wRatio);
      setMacro(clone.per100.macros, 'Углеводы', macro(clone.total, 'Углеводы') * wRatio);
    }
  }

  return clone;
}

function canonicalIngredientKey(name) {
  const s = String(name || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
  const baseBeforeParen = s.replace(/\s*\([^)]*\)/g, '').trim();
  if (/^творог в брикете/.test(baseBeforeParen)) return 'творог в брикете';
  if (/^греческий йогурт/.test(baseBeforeParen)) return 'греческий йогурт';
  if (/^яйца куриные|^яйцо куриное/.test(baseBeforeParen)) return 'яйца куриные';
  if (/^заменитель сахара|^подсластитель/.test(baseBeforeParen)) return 'заменитель сахара';
  if (/^соль/.test(baseBeforeParen)) return 'соль';
  return baseBeforeParen || s;
}

function classifyDepartment(name) {
  const s = String(name || '').toLocaleLowerCase('ru').replace(/ё/g, 'е');
  if (/творог|йогурт|молок|сгущен|кефир|сметан|сыр|моцарелл|сулугуни|пармезан|сливк|ряженк|масло сливоч/.test(s))
    return '🥛 Молочный отдел и сыры';
  if (/куриц|курин|филе|грудк|индейк|говяд|фарш|яйц|белок яич|белки яич|тунец|рыб|лосос|кревет|ветчин/.test(s))
    return '🥩 Мясо, птица и яйца';
  if (/яблок|банан|вишн|ягод|лимон|лайм|апельсин|ананас|перц|перец|томат|помидор|огурц|лук|чеснок|картофел|зелен|укроп|петрушк|шпинат|капуст|морков|авокадо|гриб|шампиньон/.test(s))
    return '🍏 Овощи, фрукты и зелень';
  if (/протеин|ксб|изолят|овсян|геркулес|гречк|рис|мук|отруб|псиллиум|какао|шоколад|разрыхлител|желатин|агар|крахмал|лаваш|нори|чечевиц|кунжут|семечк|орех|макарон|паста/.test(s))
    return '🌾 Бакалея, крупы и протеин';
  return '🧂 Специи, соусы и подсластители';
}

function mergeCartIngredients(cart) {
  const map = new Map();
  for (let gi = 0; gi < (cart || []).length; gi++) {
    const group = cart[gi];
    for (let ii = 0; ii < (group.items || []).length; ii++) {
      const item = group.items[ii];
      const key = canonicalIngredientKey(item.name);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: item.name,
          dept: classifyDepartment(item.name),
          units: new Map(),
          extraGrams: 0,
          hasAllGrams: true,
          rawFallback: [],
          sources: [],
          refs: [],
          done: true
        });
      }
      const entry = map.get(key);
      if (!item.done) entry.done = false;
      entry.refs.push(`${gi}:${ii}`);
      const parsed = parseAmountParts(item.amount);
      if (parsed.unit && parsed.val > 0) {
        entry.units.set(parsed.unit, (entry.units.get(parsed.unit) || 0) + parsed.val);
        if (parsed.grams > 0 && parsed.unit !== 'г' && parsed.unit !== 'кг') {
          entry.extraGrams += parsed.grams;
        } else if (parsed.unit !== 'г' && parsed.unit !== 'кг') {
          entry.hasAllGrams = false;
        }
      } else if (parsed.raw && !entry.rawFallback.includes(parsed.raw)) {
        entry.rawFallback.push(parsed.raw);
      }
      entry.sources.push({ recipe: group.title, amount: item.amount });
    }
  }

  const merged = [];
  for (const entry of map.values()) {
    const unitParts = [];
    for (const [u, v] of entry.units.entries()) {
      unitParts.push(`${fmt(v)} ${u}`);
    }
    let totalAmount = unitParts.join(' + ');
    if (entry.extraGrams > 0 && entry.hasAllGrams && entry.units.size === 1 && !entry.units.has('г')) {
      totalAmount += ` (~${fmt(entry.extraGrams)} г)`;
    }
    if (entry.rawFallback.length) {
      totalAmount = totalAmount ? `${totalAmount} (${entry.rawFallback.join(', ')})` : entry.rawFallback.join(', ');
    }
    merged.push({
      key: entry.key,
      name: entry.name,
      dept: entry.dept,
      totalAmount: totalAmount || 'По вкусу',
      sources: entry.sources,
      refs: entry.refs,
      done: entry.done
    });
  }
  return merged;
}

/* GS1 EAN-13 Deterministic Barcode Generator (Prefix 277 for custom recipes) */
function calcEan13CheckDigit(base12) {
  const s = String(base12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

function verifyEan13Checksum(code13) {
  const s = String(code13 || '');
  if (!/^\d{13}$/.test(s)) return false;
  return calcEan13CheckDigit(s.slice(0, 12)) === Number(s[12]);
}

function generateRecipeEan13(slug, variantId = 1) {
  const s = `${slug}#${variantId}`;
  let h1 = 2166136261 >>> 0;
  let h2 = 16777619 >>> 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ (c * 31), 2166136261) >>> 0;
  }
  const partA = String((h1 % 900000) + 100000);
  const partB = String(((Number(variantId) * 97 + (h2 % 900)) % 1000)).padStart(3, '0');
  const base12 = '277' + partA + partB;
  return base12 + String(calcEan13CheckDigit(base12));
}

function encodeEan13Bits(code13) {
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  const p = PARITY[Number(code13[0])];
  let bits = '101';
  for (let i = 1; i <= 6; i++) {
    const d = Number(code13[i]);
    bits += p[i - 1] === 'L' ? L[d] : G[d];
  }
  bits += '01010';
  for (let i = 7; i <= 12; i++) {
    bits += R[Number(code13[i])];
  }
  bits += '101';
  return bits;
}

function renderEan13Svg(code13, width = 260, height = 96) {
  const bits = encodeEan13Bits(code13);
  const barW = 2;
  const startX = 24;
  let rects = '';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
      const h = isGuard ? height - 16 : height - 26;
      rects += `<rect x="${startX + i * barW}" y="8" width="${barW}" height="${h}" fill="#1C1917"/>`;
    }
  }
  const formatted = `${code13[0]}  ${code13.slice(1, 7)}  ${code13.slice(7)}`;
  return `<svg viewBox="0 0 ${startX * 2 + 95 * barW} ${height}" width="${width}" height="${height}" class="ean13-svg" role="img" aria-label="Штрихкод EAN-13 ${code13}">
    <rect width="100%" height="100%" rx="6" fill="#FFFFFF"/>
    ${rects}
    <text x="${(startX * 2 + 95 * barW) / 2}" y="${height - 6}" text-anchor="middle" fill="#1C1917" font-family="monospace" font-size="13" font-weight="600" letter-spacing="2">${formatted}</text>
  </svg>`;
}

/* ISO/IEC 18004 QR Code Matrix Generator (Versions 1..6, ECC Level L, Byte mode) */
function generateQrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text || '')));
  const VERSIONS = [
    [1, 26, 7, 17],
    [2, 44, 10, 32],
    [3, 70, 15, 53],
    [4, 100, 20, 78],
    [5, 134, 26, 106],
    [6, 172, 36, 134]
  ];
  const verInfo = VERSIONS.find(v => bytes.length <= v[3]) || VERSIONS[VERSIONS.length - 1];
  const [ver, totalCw, ecCw, maxLen] = verInfo;
  const data = bytes.slice(0, maxLen);
  const dataCwCount = totalCw - ecCw;

  const bits = [];
  const pushBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  pushBits(0b0100, 4);
  pushBits(data.length, 8);
  for (const b of data) pushBits(b, 8);
  const maxBits = dataCwCount * 8;
  pushBits(0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataCw.push(b);
  }

  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : exp[log[a] + log[b]];

  function rsEncode(msg, nsym) {
    let gen = [1];
    for (let i = 0; i < nsym; i++) {
      const next = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) {
        next[j] ^= gen[j];
        next[j + 1] ^= gfMul(gen[j], exp[i]);
      }
      gen = next;
    }
    const res = new Uint8Array(msg.length + nsym);
    res.set(msg);
    for (let i = 0; i < msg.length; i++) {
      const coef = res[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
      }
    }
    return Array.from(res.slice(msg.length));
  }

  let finalCw = [];
  if (ver < 6) {
    const ec = rsEncode(dataCw, ecCw);
    finalCw = dataCw.concat(ec);
  } else {
    const b1 = dataCw.slice(0, 68);
    const b2 = dataCw.slice(68, 136);
    const ec1 = rsEncode(b1, 18);
    const ec2 = rsEncode(b2, 18);
    for (let i = 0; i < 68; i++) finalCw.push(b1[i], b2[i]);
    for (let i = 0; i < 18; i++) finalCw.push(ec1[i], ec2[i]);
  }

  const size = 17 + ver * 4;
  const mat = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setFinder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
        const inInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        mat[rr][cc] = (inOuter || inInner) ? 1 : 0;
        reserved[rr][cc] = true;
      }
    }
  };
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  if (ver >= 2) {
    const alignPos = [6, size - 7];
    for (const ar of alignPos) {
      for (const ac of alignPos) {
        if (reserved[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            mat[ar + r][ac + c] = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0;
            reserved[ar + r][ac + c] = true;
          }
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) { mat[6][i] = (i % 2 === 0) ? 1 : 0; reserved[6][i] = true; }
    if (!reserved[i][6]) { mat[i][6] = (i % 2 === 0) ? 1 : 0; reserved[i][6] = true; }
  }

  for (let i = 0; i < 9; i++) {
    if (i < size) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  mat[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  const stream = [];
  for (const cw of finalCw) {
    for (let i = 7; i >= 0; i--) stream.push((cw >> i) & 1);
  }

  let bitIdx = 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < size; step++) {
      const row = up ? (size - 1 - step) : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (!reserved[row][c]) {
          let bit = bitIdx < stream.length ? stream[bitIdx++] : 0;
          if ((row + c) % 2 === 0) bit ^= 1;
          mat[row][c] = bit;
        }
      }
    }
    up = !up;
  }

  const fmtBits = [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0];
  const fmtCoords1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  for (let i = 0; i < 15; i++) mat[fmtCoords1[i][0]][fmtCoords1[i][1]] = fmtBits[i];
  for (let i = 0; i < 7; i++) mat[size - 1 - i][8] = fmtBits[i];
  for (let i = 7; i < 15; i++) mat[8][size - 15 + i] = fmtBits[i];

  return mat;
}

function renderQrSvg(text, pxSize = 132) {
  const mat = generateQrMatrix(text);
  const n = mat.length;
  const quiet = 3;
  const total = n + quiet * 2;
  let pathD = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (mat[r][c]) pathD += `M${c + quiet},${r + quiet}h1v1h-1z`;
    }
  }
  return `<svg viewBox="0 0 ${total} ${total}" width="${pxSize}" height="${pxSize}" class="qr-svg" role="img" aria-label="QR-код рецепта">
    <rect width="100%" height="100%" rx="2" fill="#FFFFFF"/>
    <path d="${pathD}" fill="#1C1917"/>
  </svg>`;
}

function extractStepTimers(htmlStr, stepTitle) {
  const plain = String(htmlStr || '').replace(/<[^>]+>/g, ' ');
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

function findRecipesForRemainingMacros(allRecipes, remKcal, remProtein, limit = 3) {
  const targetKcal = Math.max(80, Number(remKcal) || 400);
  const targetProt = Math.max(10, Number(remProtein) || 30);
  const candidates = [];
  for (const r of (allRecipes || [])) {
    const v = r.variants.find(x => x.id === r.defaultVariant) || r.variants[0];
    const servKcal = (v.total?.kcal || 0) / (v.baseServings || 1);
    const servProt = macro(v.total, 'Белки') / (v.baseServings || 1);
    const split = calcMacroSplit(v.per100 || v.total);
    const kcalDiff = Math.abs(servKcal - targetKcal);
    const protDiff = Math.abs(servProt - targetProt);
    const penalty = servKcal > targetKcal + 150 ? 500 : 0;
    const score = protDiff * 3 + kcalDiff * 0.4 + penalty - split.pPct * 0.5;
    candidates.push({
      slug: r.slug,
      shortTitle: r.shortTitle,
      category: r.category,
      variantId: v.id,
      variantName: v.name,
      servKcal: Math.round(servKcal),
      servProt: Math.round(servProt * 10) / 10,
      pPct: split.pPct,
      score
    });
  }
  return candidates.sort((a, b) => a.score - b.score).slice(0, limit);
}

function parseMinutes(timeStr) {
  const s = String(timeStr || '');
  const m = s.match(/(\d+)/);
  return m ? Number(m[1]) : 99;
}

window.RecipeUtils = {
  wrapCanvasLines,
  scaleAmount,
  extractPrimaryAmount,
  parseAmountParts,
  calcPanRatio,
  calcMacroSplit,
  calcGramsNutrition,
  generateRecipeEan13,
  verifyEan13Checksum,
  encodeEan13Bits,
  generateQrMatrix,
  mergeCartIngredients,
  extractStepTimers,
  findRecipesForRemainingMacros,
  INGREDIENT_SWAPS,
  getIngredientGrams,
  inferBaselineNutrition,
  getIngredientSwapConfig,
  applyIngredientSwapsToVariant
};

if (!app) return;

/* ==========================================================================
   2. BROWSER STATE, STORAGE & GLOBAL WIDGETS
   ========================================================================== */

const FAV_KEY = 'pp-favorites-v1';
const CART_KEY = 'pp-shopping-cart-v1';
const THEME_KEY = 'pp-theme-v1';
const CATALOG_STATE_KEY = 'pp-catalog-state-v1';
const PLANNER_KEY = 'pp-daily-planner-v1';

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
  updateNavBadges();
};

const DEFAULT_PLANNER = {
  goals: { kcal: 1850, protein: 145, fat: 55, carbs: 180 },
  items: []
};
const getPlanner = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLANNER_KEY) || 'null');
    if (parsed && parsed.goals && Array.isArray(parsed.items)) return parsed;
  } catch {}
  return { goals: { ...DEFAULT_PLANNER.goals }, items: [] };
};
const savePlanner = (state) => {
  try { localStorage.setItem(PLANNER_KEY, JSON.stringify(state)); } catch {}
  updateNavBadges();
};

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

/* Register Service Worker for offline PWA support */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

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
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2900);
}

function buildAuthorTelegramUrl(topic = '💡 Идея или предложение по сайту', customMessage = '') {
  const pageTitle = document.title ? document.title.replace(/\s*·.*$/, '').trim() : 'Каталог ПП-рецептов';
  const pageSlug = location.pathname.split('/').pop() || 'index.html';
  const lines = [
    '🏷 [ПП-рецепты · Обратная связь с сайта]',
    `📌 Тема: ${topic}`,
    `📄 Страница: ${pageTitle} (${pageSlug}${location.search || ''})`,
    customMessage ? `💬 Сообщение: ${customMessage.trim()}` : '💬 Привет, Андрей! Хочу предложить идею / написать по поводу сайта рецептов:'
  ];
  return `https://t.me/bakan_off?text=${encodeURIComponent(lines.join('\n'))}`;
}

const nav = (detail = false) => {
  const cartCount = getCart().reduce((acc, g) => acc + g.items.length, 0);
  const planCount = getPlanner().items.length;
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  return `<nav class="nav" aria-label="Основная навигация">
    <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">${icon('leaf')}</span>ПП · рецепты</a>
    <div class="nav-right">
      <a class="nav-link ${detail ? '' : 'active'}" href="index.html#catalog">Рецепты</a>
      <button type="button" class="nav-guide-pill" id="guide-toggle" title="Наглядная демонстрация всех возможностей сайта">
        ${icon('spark')} <span>Что умеет сайт (Демо)</span>
      </button>
      <div class="nav-actions">
        <button type="button" class="nav-icon-btn" id="planner-toggle" aria-label="Конструктор рациона на день" title="Рацион на день (КБЖУ)">
          ${icon('target')}
          <span class="cart-badge" id="planner-badge" ${planCount ? '' : 'hidden'}>${planCount}</span>
        </button>
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
  <div class="footer-brand-col">
    <span class="footer-motto">Простая еда. Хорошая жизнь.</span>
    <span class="footer-sub">Авторская коллекция высокобелковых блюд · КБЖУ, умная замена продуктов и штрихкоды FatSecret</span>
  </div>
  <div class="footer-author-box">
    <div class="footer-author-copy">
      <small>АВТОР ПРОЕКТА И ИДЕИ</small>
      <strong>Андрей Баканов · <a href="${esc(buildAuthorTelegramUrl())}" target="_blank" rel="noopener" class="author-tg-link">@bakan_off</a></strong>
      <span>Есть идея новой фишки, свой ПП-рецепт или нашли неточность?</span>
    </div>
    <div class="footer-author-actions">
      <button type="button" class="share-chip author-feedback-trigger" id="author-feedback-btn">${icon('tg')} Написать автору @bakan_off</button>
      <button type="button" class="share-chip" data-open-guide="1">${icon('spark')} Что умеет сайт (Демо)</button>
    </div>
  </div>
</footer>`;

function updateNavBadges() {
  const cartBadge = document.getElementById('cart-badge');
  if (cartBadge) {
    const count = getCart().reduce((acc, g) => acc + g.items.length, 0);
    cartBadge.textContent = count;
    cartBadge.hidden = count === 0;
  }
  const planBadge = document.getElementById('planner-badge');
  if (planBadge) {
    const pCount = getPlanner().items.length;
    planBadge.textContent = pCount;
    planBadge.hidden = pCount === 0;
  }
}

/* ==========================================================================
   3. SMART SHOPPING CART (BY RECIPE & MERGED BY SUPERMARKET DEPARTMENT)
   ========================================================================== */

let cartViewMode = 'merged'; // 'merged' | 'recipes'

function buildCartText() {
  const cart = getCart();
  if (!cart.length) return '';
  const lines = ['🛒 Список покупок · ПП-рецепты\n'];
  if (cartViewMode === 'merged') {
    const merged = mergeCartIngredients(cart);
    const byDept = new Map();
    for (const it of merged) {
      if (!byDept.has(it.dept)) byDept.set(it.dept, []);
      byDept.get(it.dept).push(it);
    }
    for (const [dept, items] of byDept.entries()) {
      lines.push(dept + ':');
      for (const item of items) {
        lines.push(`  ${item.done ? '☑' : '☐'} ${item.name} — ${item.totalAmount}`);
      }
      lines.push('');
    }
  } else {
    for (const group of cart) {
      lines.push(`▪ ${group.title} (${group.variantName}, ${group.servings} порц.):`);
      for (const item of group.items) {
        lines.push(`  ${item.done ? '☑' : '☐'} ${item.name} — ${item.amount}`);
      }
      lines.push('');
    }
  }
  lines.push(location.origin + location.pathname.replace(/[^/]*$/, 'index.html'));
  return lines.join('\n');
}

function renderShoppingDialog() {
  const body = document.getElementById('shopping-body');
  const footerEl = document.getElementById('shopping-footer');
  if (!body) return;
  const cart = getCart();
  document.querySelectorAll('[data-cart-view]').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.cartView === cartViewMode);
  });

  if (!cart.length) {
    body.innerHTML = `<div class="empty-cart"><p>В списке покупок пока пусто.</p><small>Откройте любой рецепт, выберите нужную вариацию и нажмите «+ В список покупок».</small></div>`;
    footerEl.hidden = true;
    return;
  }
  footerEl.hidden = false;

  if (cartViewMode === 'merged') {
    const merged = mergeCartIngredients(cart);
    const byDept = new Map();
    for (const it of merged) {
      if (!byDept.has(it.dept)) byDept.set(it.dept, []);
      byDept.get(it.dept).push(it);
    }
    body.innerHTML = `<p class="cart-merge-hint">Одинаковые продукты из ${cart.length} ${cart.length === 1 ? 'рецепта' : 'рецептов'} автоматически просуммированы и разложены по отделам:</p>` +
      [...byDept.entries()].map(([dept, items]) => `
        <div class="cart-group">
          <div class="cart-group-head">
            <strong class="cart-dept-title">${esc(dept)}</strong>
            <small>${items.length} поз.</small>
          </div>
          <ul class="cart-items">
            ${items.map(it => `
              <li class="cart-item ${it.done ? 'done' : ''}">
                <label>
                  <input type="checkbox" data-merged-refs="${esc(it.refs.join(','))}" ${it.done ? 'checked' : ''}>
                  <span class="cart-item-main">
                    <span class="cart-item-name">${esc(it.name)}</span>
                    ${it.sources.length > 1 ? `<small class="cart-item-sources">${it.sources.map(s => `${esc(s.recipe)}: ${esc(s.amount)}`).join(' + ')}</small>` : ''}
                  </span>
                  <span class="cart-item-amount">${esc(it.totalAmount)}</span>
                </label>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

    body.querySelectorAll('[data-merged-refs]').forEach(input => {
      input.addEventListener('change', () => {
        const refs = input.dataset.mergedRefs.split(',');
        const next = getCart();
        for (const ref of refs) {
          const [gi, ii] = ref.split(':').map(Number);
          if (next[gi]?.items?.[ii]) next[gi].items[ii].done = input.checked;
        }
        saveCart(next);
        renderShoppingDialog();
      });
    });
  } else {
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
}

/* ==========================================================================
   4. DAILY MACRO & MEAL PLANNER
   ========================================================================== */

function addRecipeToPlanner(r, variant, servingsCount = 1) {
  const state = getPlanner();
  const oneServKcal = (variant.total?.kcal || 0) / (variant.baseServings || 1);
  const oneServP = macro(variant.total, 'Белки') / (variant.baseServings || 1);
  const oneServF = macro(variant.total, 'Жиры') / (variant.baseServings || 1);
  const oneServC = macro(variant.total, 'Углеводы') / (variant.baseServings || 1);
  state.items.push({
    slug: r.slug,
    title: r.shortTitle,
    variantId: variant.id,
    variantName: variant.name,
    servings: servingsCount,
    oneServKcal,
    oneServP,
    oneServF,
    oneServC
  });
  savePlanner(state);
  showToast(`Блюдо «${r.shortTitle}» добавлено в рацион дня 🎯`);
}

function renderPlannerDialog() {
  const body = document.getElementById('planner-body');
  if (!body) return;
  const state = getPlanner();
  const totals = state.items.reduce((acc, it) => {
    acc.kcal += it.oneServKcal * it.servings;
    acc.protein += it.oneServP * it.servings;
    acc.fat += it.oneServF * it.servings;
    acc.carbs += it.oneServC * it.servings;
    return acc;
  }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });

  const remKcal = Math.round(state.goals.kcal - totals.kcal);
  const remProt = Math.round(state.goals.protein - totals.protein);
  const suggestions = findRecipesForRemainingMacros(recipes, Math.max(100, remKcal), Math.max(10, remProt), 3);

  const pct = (val, goal) => Math.min(100, Math.round((val / Math.max(1, goal)) * 100));

  body.innerHTML = `
    <div class="planner-presets">
      <span>Цель на день:</span>
      <button type="button" class="fridge-chip" data-plan-preset="1700,150,50,160">Сушка (1700 ккал · 150г Б)</button>
      <button type="button" class="fridge-chip" data-plan-preset="2000,145,65,200">Баланс (2000 ккал · 145г Б)</button>
      <button type="button" class="fridge-chip" data-plan-preset="2500,180,75,275">Набор (2500 ккал · 180г Б)</button>
    </div>
    <div class="planner-goals-grid">
      <label><small>Цель ккал</small><input type="number" id="goal-kcal" value="${state.goals.kcal}" min="800" max="6000" step="50"></label>
      <label><small>Белки, г</small><input type="number" id="goal-protein" value="${state.goals.protein}" min="40" max="400" step="5"></label>
      <label><small>Жиры, г</small><input type="number" id="goal-fat" value="${state.goals.fat}" min="20" max="250" step="5"></label>
      <label><small>Углеводы, г</small><input type="number" id="goal-carbs" value="${state.goals.carbs}" min="20" max="600" step="10"></label>
    </div>
    <div class="planner-bars">
      <div class="pbar-item">
        <div class="pbar-head"><span>Калории</span><strong>${fmt(Math.round(totals.kcal))} / ${state.goals.kcal} ккал</strong></div>
        <div class="pbar-track"><span style="width:${pct(totals.kcal, state.goals.kcal)}%"></span></div>
      </div>
      <div class="pbar-item">
        <div class="pbar-head"><span>Белки</span><strong>${fmt(Math.round(totals.protein))} / ${state.goals.protein} г</strong></div>
        <div class="pbar-track"><span class="bar-p" style="width:${pct(totals.protein, state.goals.protein)}%"></span></div>
      </div>
      <div class="pbar-item">
        <div class="pbar-head"><span>Жиры</span><strong>${fmt(Math.round(totals.fat))} / ${state.goals.fat} г</strong></div>
        <div class="pbar-track"><span class="bar-f" style="width:${pct(totals.fat, state.goals.fat)}%"></span></div>
      </div>
      <div class="pbar-item">
        <div class="pbar-head"><span>Углеводы</span><strong>${fmt(Math.round(totals.carbs))} / ${state.goals.carbs} г</strong></div>
        <div class="pbar-track"><span class="bar-c" style="width:${pct(totals.carbs, state.goals.carbs)}%"></span></div>
      </div>
    </div>
    <p class="planner-status">
      ${remProt > 0 ? `До дневной цели белка осталось <strong>${remProt} г белка</strong> (${remKcal > 0 ? `и ${remKcal} ккал` : 'лимит калорий закрыт'}).` : '🎉 Дневная норма белка полностью закрыта!'}
    </p>
    <div class="planner-items">
      <h3>Выбранные блюда на день (${state.items.length})</h3>
      ${state.items.length ? state.items.map((it, idx) => `
        <div class="planner-row">
          <div>
            <a href="${esc(it.slug)}?v=${it.variantId}" class="cart-group-title">${esc(it.title)}</a>
            <small>${esc(it.variantName)} · ${fmt(Math.round(it.oneServKcal * it.servings))} ккал · <strong>${fmt(Math.round(it.oneServP * it.servings * 10) / 10)} г белка</strong></small>
          </div>
          <div class="planner-row-ctrl">
            <button type="button" class="timer-ctrl-btn" data-plan-dec="${idx}">-</button>
            <span>${fmt(it.servings)} порц.</span>
            <button type="button" class="timer-ctrl-btn" data-plan-inc="${idx}">+</button>
            <button type="button" class="text-button" data-plan-del="${idx}">×</button>
          </div>
        </div>
      `).join('') : '<p class="ingredient-hint">Добавьте блюда кнопкой «+ В рацион дня» на странице рецепта или из подборки ниже.</p>'}
    </div>
    <div class="planner-suggest">
      <small>ИДЕАЛЬНО ПОДХОДЯТ НА ОСТАТОК МАКРОСОВ (1 ПОРЦИЯ):</small>
      <div class="planner-suggest-grid">
        ${suggestions.map(s => `
          <div class="planner-sug-card">
            <div>
              <strong>${esc(s.shortTitle)}</strong>
              <small>${s.servKcal} ккал · ${s.servProt} г белка (${s.pPct}%)</small>
            </div>
            <button type="button" class="share-chip" data-plan-add="${esc(s.slug)}:${s.variantId}">+ В рацион</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  body.querySelectorAll('[data-plan-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [kcal, protein, fat, carbs] = btn.dataset.planPreset.split(',').map(Number);
      const next = getPlanner();
      next.goals = { kcal, protein, fat, carbs };
      savePlanner(next);
      renderPlannerDialog();
    });
  });

  ['kcal', 'protein', 'fat', 'carbs'].forEach(key => {
    const inp = document.getElementById(`goal-${key}`);
    if (inp) {
      inp.addEventListener('change', () => {
        const next = getPlanner();
        next.goals[key] = Math.max(10, Number(inp.value) || DEFAULT_PLANNER.goals[key]);
        savePlanner(next);
        renderPlannerDialog();
      });
    }
  });

  body.querySelectorAll('[data-plan-dec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.planDec);
      const next = getPlanner();
      if (next.items[idx]) {
        next.items[idx].servings = Math.max(0.5, next.items[idx].servings - 0.5);
        savePlanner(next);
        renderPlannerDialog();
      }
    });
  });

  body.querySelectorAll('[data-plan-inc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.planInc);
      const next = getPlanner();
      if (next.items[idx]) {
        next.items[idx].servings = Math.min(10, next.items[idx].servings + 0.5);
        savePlanner(next);
        renderPlannerDialog();
      }
    });
  });

  body.querySelectorAll('[data-plan-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.planDel);
      const next = getPlanner();
      next.items.splice(idx, 1);
      savePlanner(next);
      renderPlannerDialog();
    });
  });

  body.querySelectorAll('[data-plan-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [slug, varId] = btn.dataset.planAdd.split(':');
      const r = recipes.find(x => x.slug === slug);
      if (!r) return;
      const v = r.variants.find(x => x.id === Number(varId)) || r.variants[0];
      addRecipeToPlanner(r, v, 1);
      renderPlannerDialog();
    });
  });
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
          <div class="dialog-header-right">
            <div class="nutrition-mode-switch" role="tablist" aria-label="Режим группировки покупок">
              <button type="button" class="nutri-tab" data-cart-view="merged" aria-pressed="true">По отделам</button>
              <button type="button" class="nutri-tab" data-cart-view="recipes" aria-pressed="false">По блюдам</button>
            </div>
            <button type="button" class="icon-button" id="close-shopping" aria-label="Закрыть список покупок">${icon('close')}</button>
          </div>
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

    <dialog class="shopping-dialog" id="planner-dialog" aria-labelledby="planner-title">
      <div class="dialog-inner">
        <div class="dialog-header">
          <div>
            <small>КОНСТРУКТОР ДНЕВНОГО МЕНЮ</small>
            <h2 id="planner-title">Мой рацион на день</h2>
          </div>
          <button type="button" class="icon-button" id="close-planner" aria-label="Закрыть конструктор рациона">${icon('close')}</button>
        </div>
        <div id="planner-body" class="shopping-body"></div>
        <div class="shopping-footer">
          <button type="button" class="share-chip" id="planner-to-cart">${icon('bag')} Перенести рацион в Список покупок</button>
          <button type="button" class="text-button" id="planner-clear">Очистить рацион</button>
        </div>
      </div>
    </dialog>

    <dialog class="shopping-dialog guide-dialog" id="guide-dialog" aria-labelledby="guide-title">
      <div class="dialog-inner">
        <div class="dialog-header">
          <div>
            <small>НАГЛЯДНАЯ ЭКСКУРСИЯ ПО САЙТУ · 7 УМНЫХ ИНСТРУМЕНТОВ</small>
            <h2 id="guide-title">Что умеет коллекция «ПП · рецепты»</h2>
          </div>
          <button type="button" class="icon-button" id="close-guide" aria-label="Закрыть демонстрацию">${icon('close')}</button>
        </div>

        <div class="guide-tabs" role="tablist" aria-label="Разделы демонстрации">
          <button type="button" class="guide-tab" data-guide-tab="all" aria-selected="true">✨ Все возможности</button>
          <button type="button" class="guide-tab" data-guide-tab="swap" aria-selected="false">🔄 1. Замена продуктов и пачки</button>
          <button type="button" class="guide-tab" data-guide-tab="fatsecret" aria-selected="false">📊 2. Штрихкод FatSecret</button>
          <button type="button" class="guide-tab" data-guide-tab="plate" aria-selected="false">⚖ 3. Тарелка и форма</button>
          <button type="button" class="guide-tab" data-guide-tab="planner" aria-selected="false">🎯 4. Рацион и Корзина</button>
          <button type="button" class="guide-tab" data-guide-tab="kitchen" aria-selected="false">🎙 5. Готовка с голосом</button>
        </div>

        <div class="shopping-body guide-body">
          <!-- Interactive Live Simulator Box -->
          <div class="guide-demo-banner" data-guide-section="swap">
            <div class="guide-demo-head">
              <span class="guide-step-pill">ЖИВОЙ СИМУЛЯТОР ПРЯМО В ОКНЕ</span>
              <strong>Посмотрите, как работает замена на свой продукт и пересчёт веса пачки (на примере ПП-хачапури):</strong>
              <small>Внутри любого рецепта нажмите кнопку <b>«⚖ Вес / Замена»</b> напротив нужного ингредиента — впишите свой продукт с упаковки или вес вашей пачки:</small>
            </div>
            <div class="guide-sim-controls">
              <div class="guide-sim-group">
                <small>1. Пример замены продукта (по КБЖУ с упаковки):</small>
                <div class="guide-demo-controls">
                  <button type="button" class="fridge-chip" data-demo-cheese="light25" aria-pressed="true">Сыр лёгкий 25% (по рецепту)</button>
                  <button type="button" class="fridge-chip" data-demo-cheese="brest45" aria-pressed="false">Брест-Литовск 45%</button>
                  <button type="button" class="fridge-chip" data-demo-cheese="suluguni" aria-pressed="false">Сулугуни 45%</button>
                  <button type="button" class="fridge-chip" data-demo-cheese="light15" aria-pressed="false">Ультра-лёгкий 15%</button>
                </div>
              </div>
              <div class="guide-sim-group">
                <small>2. Выберите вес вашей упаковки:</small>
                <div class="guide-demo-controls">
                  <button type="button" class="fridge-chip" data-demo-pack="180" aria-pressed="true">По рецепту (180 г)</button>
                  <button type="button" class="fridge-chip" data-demo-pack="130" aria-pressed="false">Нарезка 130 г (×0,72)</button>
                  <button type="button" class="fridge-chip" data-demo-pack="200" aria-pressed="false">Брусок 200 г (×1,11)</button>
                </div>
              </div>
            </div>
            <div class="guide-demo-result" id="guide-demo-result">
              <div class="guide-res-grid">
                <div><small>КБЖУ на 100 г блюда</small><strong>178 ккал · Б 20,4 г · Ж 5,8 г · У 10,5 г</strong></div>
                <div><small>Весь объём рецепта</small><strong>1 032 ккал · 118 г белка</strong></div>
                <div><small>Пропорции остальных продуктов</small><strong>Базовый рецепт (×1)</strong></div>
              </div>
            </div>
          </div>

          <div class="guide-cards-grid">
            <!-- Feature 1 -->
            <div class="guide-feature-card" data-guide-section="swap">
              <span class="guide-badge">1 · ПОЛНЫЙ КОНСТРУКТОР СОСТАВА ПОД ВАШИ ПРОДУКТЫ</span>
              <h3>🔄 Замена продукта и его веса, удаление и добавление своих ингредиентов</h3>
              <p>Подстраивайте любой рецепт под то, что реально есть дома (например, <code>100 г голубики</code> вместо <code>160 г клубники</code> или <code>50 г глазури</code> вместо <code>75 г шоколада</code>) без сбоя остальных пропорций рецепта!</p>
              <ol class="guide-steps-list">
                <li><strong>Свой вес и свой продукт (кнопка «✏️ Вес / Замена»):</strong> измените граммовку конкретного продукта, впишите новое название (например, <em>Голубика</em>) и при желании КБЖУ с упаковки, затем нажмите <strong>«✓ Применить к этому продукту»</strong> — изменится только эта строка и пересчитается КБЖУ блюда, а остальные ингредиенты останутся на месте!</li>
                <li><strong>Удаление лишнего (кнопка «✕» / «🗑 Убрать»):</strong> не хотите класть шоколад, кунжут или топпинг? Уберите его в 1 клик — калории и вес вычтутся автоматически.</li>
                <li><strong>Добавление своего продукта («➕ Добавить свой продукт в рецепт»):</strong> добавьте любой дополнительный ингредиент со своим весом и БЖУ прямо внизу списка.</li>
              </ol>
              <div class="guide-card-foot">
                <a href="cottage-cheese-lavash-roll.html?v=5#ingredients" class="share-chip">Попробовать в рулете с лавашом →</a>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="guide-feature-card" data-guide-section="fatsecret">
              <span class="guide-badge">2 · ИНТЕГРАЦИЯ С ДНЕВНИКОМ ПИТАНИЯ</span>
              <h3>📊 Штрихкод GS1 EAN-13 для FatSecret прямо на экране</h3>
              <p>Каждой вариации каждого блюда присвоен собственный постоянный 13-значный штрихкод. Больше не нужно скачивать картинки на ПК или каждый раз вбивать цифры в FatSecret вручную.</p>
              <ol class="guide-steps-list">
                <li>Нажмите кнопку <strong>«Карточка и штрихкод»</strong> под описанием рецепта (или <strong>«Штрихкод FatSecret»</strong> над таблицей БЖУ).</li>
                <li>На экране откроется карточка блюда с крупным штрихкодом <code>EAN-13</code> и кнопками копирования.</li>
                <li>Наведите камеру телефона со сканером FatSecret прямо на экран. При первом сканировании один раз вставьте скопированное КБЖУ на 100 г — приложение навсегда запомнит этот штрихкод!</li>
              </ol>
              <div class="guide-card-foot">
                <span class="guide-tip-pill">💡 Также в окне есть QR-код, чтобы за секунду перекинуть открытый рецепт с компьютера на телефон</span>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="guide-feature-card" data-guide-section="plate">
              <span class="guide-badge">3 · ТОЧНОСТЬ НА ВЕСАХ И В ДУХОВКЕ</span>
              <h3>⚖ Калькулятор вашей тарелки и диаметр формы</h3>
              <p>Два незаменимых калькулятора для тех, кто взвешивает готовую порцию и печёт в разных формах:</p>
              <ol class="guide-steps-list">
                <li><strong>Калькулятор вашей тарелки:</strong> взвесили свой готовый кусок запеканки, чизкейка или хачапури (например, <code>215 г</code>)? Впишите <code>215</code> в поле под таблицей БЖУ — и сразу увидите точные калории, белки, жиры и углеводы вашей порции.</li>
                <li><strong>Пересчёт под диаметр формы:</strong> в рецепте форма <code>18 см</code>, а у вас дома <code>20 см</code> или <code>22 см</code>? Выберите оба диаметра в блоке над ингредиентами — сайт пересчитает объём теста по отношению площадей круга ($S = \pi r^2$).</li>
                <li><strong>3 режима БЖУ и Протеиновый индекс:</strong> переключайтесь между <em>«На объём»</em>, <em>«На 1 порцию»</em> и <em>«На 100 г»</em> и следите за долей калорий из чистого белка.</li>
              </ol>
            </div>

            <!-- Feature 4 -->
            <div class="guide-feature-card" data-guide-section="planner">
              <span class="guide-badge">4 · КОНСТРУКТОР МЕНЮ И ПОКУПОК</span>
              <h3>🎯 Дневной рацион (подбор белка) и 🛒 Умная корзина</h3>
              <p>Собирайте меню на день под свои цели и ходите в магазин с автоматическим списком по отделам:</p>
              <ol class="guide-steps-list">
                <li><strong>Конструктор рациона (🎯 в шапке):</strong> задайте цель (Сушка / Баланс / Набор) и добавляйте блюда. Алгоритм посчитает оставшийся дефицит белка и сам порекомендует 3 рецепта, которые идеально закроют норму дня.</li>
                <li><strong>Умная корзина покупок (🛒 в шапке):</strong> добавьте несколько рецептов — сайт сам сложит одинаковые продукты (например, <code>400 г + 200 г = 600 г творога</code>), разложит их по отделам супермаркета и отправит список в Telegram или MAX.</li>
                <li><strong>Фильтр «Что есть дома»:</strong> на главной странице отмечайте продукты из холодильника и сортируйте рецепты по максимуму белка или времени готовки.</li>
              </ol>
              <div class="guide-card-foot">
                <button type="button" class="share-chip" id="guide-try-planner">${icon('target')} Открыть Рацион дня</button>
                <button type="button" class="share-chip" id="guide-try-cart">${icon('bag')} Открыть Список покупок</button>
              </div>
            </div>

            <!-- Feature 5 -->
            <div class="guide-feature-card guide-card-wide" data-guide-section="kitchen">
              <span class="guide-badge">5 · СВОБОДНЫЕ РУКИ НА КУХНЕ</span>
              <h3>🎙 Пошаговый кухонный режим с таймерами, защитой экрана и голосовыми командами</h3>
              <p>Когда руки в муке или тесте, сайт берёт управление на себя:</p>
              <div class="guide-wide-cols">
                <div>
                  <strong>⏱ Авто-таймеры в 1 клик</strong>
                  <p>Любое время в тексте шага (например, <em>«выпекайте 26–28 минут»</em>) автоматически превращается в кнопку таймера со звуковым сигналом. Таймер работает в углу экрана, даже если вы перешли к другому рецепту.</p>
                </div>
                <div>
                  <strong>🔆 Экран не гаснет (Wake Lock)</strong>
                  <p>Нажмите <strong>«Режим готовки»</strong> над шагами рецепта: откроется крупный полноэкранный режим, в котором экран смартфона или планшета не блокируется во время готовки.</p>
                </div>
                <div>
                  <strong>🎙 Управление голосом (RU)</strong>
                  <p>Включите микрофон внутри режима готовки и управляйте рецептом вслух без рук: скажите <strong>«Дальше»</strong>, <strong>«Назад»</strong>, <strong>«Таймер»</strong> или <strong>«Пауза»</strong>!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="shopping-footer">
          <span style="font-size:12px; color:var(--muted);">Нашли что-то крутое или хотите предложить идею? Напишите автору в Telegram!</span>
          <div class="share-row">
            <button type="button" class="share-chip" id="guide-open-feedback">${icon('tg')} Написать автору @bakan_off</button>
            <button type="button" class="primary" id="guide-done-btn" style="min-height:40px; padding:8px 18px;">Всё понятно, к рецептам!</button>
          </div>
        </div>
      </div>
    </dialog>

    <dialog class="shopping-dialog" id="feedback-dialog" aria-labelledby="feedback-title">
      <div class="dialog-inner" style="max-width:600px;">
        <div class="dialog-header">
          <div>
            <small>СВЯЗЬ С АВТОРОМ ПРОЕКТА · TELEGRAM @BAKAN_OFF</small>
            <h2 id="feedback-title">Предложить идею или отзыв</h2>
          </div>
          <button type="button" class="icon-button" id="close-feedback" aria-label="Закрыть окно обратной связи">${icon('close')}</button>
        </div>
        <div class="shopping-body" style="display:grid; gap:14px;">
          <p class="ingredient-hint" style="margin:0;">Выберите тему и (по желанию) напишите сообщение ниже. При нажатии кнопки откроется диалог с <strong>@bakan_off</strong> в Telegram с уже готовой пометкой <code>🏷 [ПП-рецепты · Обратная связь с сайта]</code>, чтобы автор сразу понял в уведомлении, что вы пишете с сайта:</p>
          <div>
            <small style="display:block; font-size:11px; color:var(--muted); margin-bottom:6px; font-weight:600;">ТЕМА ОБРАЩЕНИЯ:</small>
            <div class="fridge-chips" id="feedback-topics">
              <button type="button" class="fridge-chip" data-fb-topic="💡 Идея / функция для сайта" aria-pressed="true">💡 Идея для сайта</button>
              <button type="button" class="fridge-chip" data-fb-topic="🍽 Предложить свой ПП-рецепт" aria-pressed="false">🍽 Предложить рецепт</button>
              <button type="button" class="fridge-chip" data-fb-topic="🧀 Добавить продукт в базу замен" aria-pressed="false">🧀 Добавить продукт</button>
              <button type="button" class="fridge-chip" data-fb-topic="❤️ Благодарность и отзыв" aria-pressed="false">❤️ Отзыв автору</button>
              <button type="button" class="fridge-chip" data-fb-topic="🐞 Сообщить о неточности" aria-pressed="false">🐞 Ошибка / неточность</button>
            </div>
          </div>
          <label style="display:grid; gap:6px;">
            <small style="font-size:11px; color:var(--muted); font-weight:600;">ВАШЕ СООБЩЕНИЕ (ПО ЖЕЛАНИЮ — МОЖНО ДОПИСАТЬ ПРЯМО В TELEGRAM):</small>
            <textarea id="feedback-textarea" rows="3" placeholder="Например: Было бы круто добавить в базу сыров марку Х, или хочу поделиться рецептом белковых вафель..." style="width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:var(--white); color:var(--ink); font:inherit; resize:vertical;"></textarea>
          </label>
          <div class="feedback-preview-box">
            <small style="display:block; font-size:10px; color:var(--sage); letter-spacing:0.08em; margin-bottom:4px;">КАК ЭТО УВИДИТ АВТОР В УВЕДОМЛЕНИИ TELEGRAM:</small>
            <pre id="feedback-preview-text" style="margin:0; white-space:pre-wrap; font-family:var(--sans); font-size:12px; color:var(--ink);"></pre>
          </div>
        </div>
        <div class="shopping-footer">
          <button type="button" class="share-chip" id="feedback-copy-btn">${icon('copy')} Скопировать текст</button>
          <a href="https://t.me/bakan_off" target="_blank" rel="noopener" class="primary" id="feedback-send-tg" style="min-height:40px; padding:9px 18px; text-decoration:none;">${icon('tg')} Открыть Telegram @bakan_off</a>
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

  const shopDialog = document.getElementById('shopping-dialog');
  document.getElementById('close-shopping').addEventListener('click', () => shopDialog.close());
  shopDialog.addEventListener('click', e => { if (e.target === shopDialog) shopDialog.close(); });

  document.querySelectorAll('[data-cart-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      cartViewMode = btn.dataset.cartView;
      renderShoppingDialog();
    });
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

  const planDialog = document.getElementById('planner-dialog');
  document.getElementById('close-planner').addEventListener('click', () => planDialog.close());
  planDialog.addEventListener('click', e => { if (e.target === planDialog) planDialog.close(); });

  document.getElementById('planner-clear').addEventListener('click', () => {
    const next = getPlanner();
    next.items = [];
    savePlanner(next);
    renderPlannerDialog();
    showToast('Рацион на день очищен');
  });

  document.getElementById('planner-to-cart').addEventListener('click', () => {
    const state = getPlanner();
    if (!state.items.length) {
      showToast('Сначала добавьте блюда в рацион');
      return;
    }
    const cart = getCart();
    for (const it of state.items) {
      const r = recipes.find(x => x.slug === it.slug);
      if (!r) continue;
      const v = r.variants.find(x => x.id === it.variantId) || r.variants[0];
      const ratio = it.servings / (v.baseServings || 1);
      cart.push({
        slug: r.slug,
        title: r.shortTitle,
        variantName: v.name,
        servings: it.servings,
        url: `${r.slug}?v=${v.id}&s=${it.servings}`,
        items: v.ingredients.filter(x => !x.group).map(x => ({
          name: x.name,
          amount: scaleAmount(x.amount, ratio),
          done: false
        }))
      });
    }
    saveCart(cart);
    planDialog.close();
    renderShoppingDialog();
    shopDialog.showModal();
    showToast('Все продукты из рациона перенесены в Список покупок 🛒');
  });

  /* Interactive Site Demo / Guide Modal Logic */
  const guideDialog = document.getElementById('guide-dialog');
  document.getElementById('close-guide')?.addEventListener('click', () => guideDialog.close());
  document.getElementById('guide-done-btn')?.addEventListener('click', () => guideDialog.close());
  guideDialog?.addEventListener('click', e => { if (e.target === guideDialog) guideDialog.close(); });

  document.querySelectorAll('[data-guide-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const targetTab = tabBtn.dataset.guideTab;
      document.querySelectorAll('[data-guide-tab]').forEach(b => b.setAttribute('aria-selected', String(b === tabBtn)));
      document.querySelectorAll('[data-guide-section]').forEach(sec => {
        sec.hidden = targetTab !== 'all' && sec.dataset.guideSection !== targetTab;
      });
    });
  });

  let demoCheeseKey = 'light25';
  let demoPackGrams = 180;
  const demoCheeseProfiles = {
    light25: { title: 'Сыр лёгкий 25%', kcal100: 178, p100: 20.4, f100: 5.8, c100: 10.5, totalKcal: 1032, totalProt: 118 },
    brest45: { title: 'Сыр «Брест-Литовск» 45%', kcal100: 203, p100: 19.3, f100: 9.1, c100: 10.5, totalKcal: 1226, totalProt: 110 },
    suluguni: { title: 'Сулугуни классический 45%', kcal100: 190, p100: 18.2, f100: 8.1, c100: 10.5, totalKcal: 1127, totalProt: 101 },
    light15: { title: 'Сыр ультра-лёгкий 15%', kcal100: 173, p100: 20.9, f100: 5.1, c100: 10.5, totalKcal: 998, totalProt: 122 }
  };

  function updateGuideSimulator() {
    const prof = demoCheeseProfiles[demoCheeseKey] || demoCheeseProfiles.light25;
    const ratio = demoPackGrams / 180;
    const scaledKcal = Math.round(prof.totalKcal * ratio);
    const scaledProt = Math.round(prof.totalProt * ratio);
    const scaleLabel = demoPackGrams === 180
      ? 'Базовый рецепт (×1 · 180 г сыра)'
      : `Все ингредиенты масштабированы ×${fmt(Math.round(ratio * 100) / 100)} (под пачку ${demoPackGrams} г)`;
    const resEl = document.getElementById('guide-demo-result');
    if (resEl) {
      resEl.innerHTML = `<div class="guide-res-grid">
        <div><small>КБЖУ на 100 г (${esc(prof.title)})</small><strong>${fmt(prof.kcal100)} ккал · Б ${fmt(prof.p100)} г · Ж ${fmt(prof.f100)} г · У ${fmt(prof.c100)} г</strong></div>
        <div><small>Весь объём блюда</small><strong>${fmt(scaledKcal)} ккал · ${fmt(scaledProt)} г белка</strong></div>
        <div><small>Пересчёт рецепта</small><strong>${esc(scaleLabel)}</strong></div>
      </div>`;
    }
  }

  document.querySelectorAll('[data-demo-cheese]').forEach(btn => {
    btn.addEventListener('click', () => {
      demoCheeseKey = btn.dataset.demoCheese;
      document.querySelectorAll('[data-demo-cheese]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      updateGuideSimulator();
    });
  });

  document.querySelectorAll('[data-demo-pack]').forEach(btn => {
    btn.addEventListener('click', () => {
      demoPackGrams = Number(btn.dataset.demoPack);
      document.querySelectorAll('[data-demo-pack]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      updateGuideSimulator();
    });
  });

  document.getElementById('guide-try-planner')?.addEventListener('click', () => {
    guideDialog.close();
    renderPlannerDialog();
    document.getElementById('planner-dialog')?.showModal();
  });
  document.getElementById('guide-try-cart')?.addEventListener('click', () => {
    guideDialog.close();
    renderShoppingDialog();
    document.getElementById('shopping-dialog')?.showModal();
  });
  document.getElementById('guide-open-feedback')?.addEventListener('click', () => {
    guideDialog.close();
    if (typeof window.openFeedbackModal === 'function') window.openFeedbackModal();
  });

  /* Author Telegram Feedback Modal Logic (@bakan_off) */
  const fbDialog = document.getElementById('feedback-dialog');
  let activeFbTopic = '💡 Идея / функция для сайта';
  const fbTextarea = document.getElementById('feedback-textarea');
  const fbPreview = document.getElementById('feedback-preview-text');
  const fbSendLink = document.getElementById('feedback-send-tg');

  function syncFeedbackPreview() {
    const pageTitle = document.title ? document.title.replace(/\s*·.*$/, '').trim() : 'Каталог ПП-рецептов';
    const pageSlug = location.pathname.split('/').pop() || 'index.html';
    const msg = fbTextarea?.value?.trim() || '';
    const lines = [
      '🏷 [ПП-рецепты · Обратная связь с сайта]',
      `📌 Тема: ${activeFbTopic}`,
      `📄 Страница: ${pageTitle} (${pageSlug}${location.search || ''})`,
      msg ? `💬 Сообщение: ${msg}` : '💬 Привет, Андрей! Пишу с сайта ПП-рецепты:'
    ];
    const fullText = lines.join('\n');
    if (fbPreview) fbPreview.textContent = fullText;
    if (fbSendLink) fbSendLink.href = `https://t.me/bakan_off?text=${encodeURIComponent(fullText)}`;
    return fullText;
  }

  window.openFeedbackModal = function openFeedbackModal() {
    syncFeedbackPreview();
    fbDialog?.showModal();
  };

  document.getElementById('close-feedback')?.addEventListener('click', () => fbDialog.close());
  fbDialog?.addEventListener('click', e => { if (e.target === fbDialog) fbDialog.close(); });
  document.querySelectorAll('[data-fb-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFbTopic = btn.dataset.fbTopic;
      document.querySelectorAll('[data-fb-topic]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      syncFeedbackPreview();
    });
  });
  fbTextarea?.addEventListener('input', syncFeedbackPreview);
  document.getElementById('feedback-copy-btn')?.addEventListener('click', async () => {
    const txt = syncFeedbackPreview();
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Текст обращения скопирован в буфер обмена!');
    } catch {
      showToast('Не удалось скопировать текст');
    }
  });
  fbSendLink?.addEventListener('click', async () => {
    const txt = syncFeedbackPreview();
    try { await navigator.clipboard.writeText(txt); } catch {}
    showToast('Открываем Telegram @bakan_off (текст также скопирован в буфер)');
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
  const planBtn = document.getElementById('planner-toggle');
  if (planBtn) {
    planBtn.addEventListener('click', () => {
      renderPlannerDialog();
      document.getElementById('planner-dialog')?.showModal();
    });
  }
  const guideBtn = document.getElementById('guide-toggle');
  if (guideBtn) {
    guideBtn.addEventListener('click', () => {
      document.getElementById('guide-dialog')?.showModal();
    });
  }
  document.querySelectorAll('[data-open-guide]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('guide-dialog')?.showModal();
    });
  });
  const fbBtn = document.getElementById('author-feedback-btn');
  if (fbBtn) {
    fbBtn.addEventListener('click', () => {
      if (typeof window.openFeedbackModal === 'function') window.openFeedbackModal();
    });
  }
}

/* ==========================================================================
   5. KITCHEN TIMER ENGINE & POSTER CANVAS GENERATOR
   ========================================================================== */

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

function wrapCanvasLines(ctx, text, maxWidth) {
  const measure = (str) => ctx && typeof ctx.measureText === 'function' ? ctx.measureText(str).width : str.length * 11;
  const words = String(text || '').trim().split(/ +/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (measure(test) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoundedBox(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function openCardPreviewModal(canvas, r, variant) {
  const dataUrl = canvas.toDataURL('image/png');
  const fileName = `pp-recipe-${r.slug.replace('.html', '')}-v${variant.id}.png`;
  const ean13 = generateRecipeEan13(r.slug, variant.id);
  const p100 = variant.per100 || variant.total;
  const productName = `${r.shortTitle} (${variant.name})`;
  const fsCopySummary = [
    `Марка: ПП · рецепты`,
    `Название продукта: ${productName}`,
    `Штрихкод EAN-13: ${ean13}`,
    `Порция: 100 г`,
    `Калории: ${fmt(p100.kcal)} ккал`,
    `Белки: ${fmt(macro(p100, 'Белки'))} г`,
    `Жиры: ${fmt(macro(p100, 'Жиры'))} г`,
    `Углеводы: ${fmt(macro(p100, 'Углеводы'))} г`
  ].join('\n');

  let dlg = document.getElementById('card-preview-dialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'card-preview-dialog';
    dlg.className = 'shopping-dialog';
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    document.body.appendChild(dlg);
  }

  dlg.innerHTML = `
    <div class="dialog-inner" style="max-width:720px;">
      <div class="dialog-header">
        <div>
          <small>БЕЗ СКАЧИВАНИЯ НА ПК · СКАНИРУЙТЕ С ЭКРАНА</small>
          <h2>Карточка рецепта и штрихкод</h2>
        </div>
        <button type="button" class="icon-button" id="close-card-preview" aria-label="Закрыть окно">${icon('close')}</button>
      </div>
      <div class="shopping-body" style="display:grid; gap:16px;">
        <div class="fs-code-box" style="text-align:center; padding:16px; background:#FFFFFF; border:1px solid var(--line, #CFC7BD); border-radius:12px;">
          <small style="display:block; margin-bottom:8px; color:#59674F; font-weight:600;">НАВЕДИТЕ СКАНЕР FATSECRET НА ЭКРАН (EAN-13):</small>
          <div style="display:flex; justify-content:center;">${renderEan13Svg(ean13, 310, 112)}</div>
          <div style="margin-top:10px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="share-chip" id="preview-copy-fs">${icon('copy')} Скопировать БЖУ на 100 г</button>
            <button type="button" class="share-chip" id="preview-copy-img">${icon('copy')} Скопировать картинку (Ctrl+V)</button>
            <button type="button" class="share-chip" id="preview-download-png">${icon('download')} Скачать PNG на ПК</button>
          </div>
        </div>
        <div style="background:#FAF8F5; border:1px solid var(--line, #CFC7BD); border-radius:12px; padding:10px; max-height:58vh; overflow:auto;">
          <img src="${dataUrl}" alt="Карточка рецепта ${esc(r.shortTitle)}" style="width:100%; height:auto; display:block; border-radius:8px;">
        </div>
      </div>
    </div>
  `;

  dlg.querySelector('#close-card-preview').addEventListener('click', () => dlg.close());
  dlg.querySelector('#preview-download-png').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    showToast('Файл PNG сохранён на устройство');
  });
  dlg.querySelector('#preview-copy-fs').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(fsCopySummary);
      showToast('Данные КБЖУ на 100 г скопированы!');
    } catch {
      showToast('Не удалось скопировать текст');
    }
  });
  dlg.querySelector('#preview-copy-img').addEventListener('click', () => {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      showToast('Браузер не поддерживает копирование картинок');
      return;
    }
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Картинка скопирована в буфер (вставьте через Ctrl+V)!');
      } catch {
        showToast('Не удалось скопировать картинку');
      }
    }, 'image/png');
  });

  dlg.showModal();
}

async function downloadRecipeCardPng(r, variant, ratio, servingsLabel, shareUrl) {
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');

  mctx.font = '46px Georgia, serif';
  const titleLines = wrapCanvasLines(mctx, r.shortTitle, 952);

  mctx.font = '24px Arial, sans-serif';
  const nbspServings = String(servingsLabel || '').replace(/\s+/g, '\u00A0');
  const nbspTime = String(r.time || '').replace(/\s+/g, '\u00A0');
  const subText = `Вариация: ${variant.name}  ·  ${nbspServings}  ·  ${nbspTime}`;
  const subLines = wrapCanvasLines(mctx, subText, 952);

  const ings = variant.ingredients.filter(x => !x.group && !x.removed);
  mctx.font = '22px Arial, sans-serif';
  const ingRows = ings.map(ing => {
    const scaled = scaleAmount(ing.amount, ratio);
    const nameLines = wrapCanvasLines(mctx, `• ${ing.name}`, 500);
    const amtLines = wrapCanvasLines(mctx, scaled, 410);
    const linesCount = Math.max(nameLines.length, amtLines.length);
    return { nameLines, amtLines, linesCount, height: linesCount * 30 + 22 };
  });

  const headerH = 92 + titleLines.length * 54 + subLines.length * 34 + 24;
  const nutriH = 148;
  const ingHeaderH = 82;
  const totalIngH = ingRows.reduce((acc, row) => acc + row.height, 0);
  const footY = headerH + nutriH + ingHeaderH + totalIngH + 28;
  const totalH = footY + 244 + 56;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, 1080, totalH);

  ctx.fillStyle = '#59674F';
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillText('ПП · РЕЦЕПТЫ   |   КОЛЛЕКЦИЯ ВЫСОКОБЕЛКОВЫХ БЛЮД', 64, 62);
  ctx.fillStyle = 'rgba(207,199,189,0.7)';
  ctx.fillRect(64, 80, 952, 1);

  let y = 136;
  ctx.fillStyle = '#1C1917';
  ctx.font = '46px Georgia, serif';
  for (const tl of titleLines) {
    ctx.fillText(tl, 64, y);
    y += 54;
  }

  y -= 10;
  ctx.fillStyle = '#59674F';
  ctx.font = '24px Arial, sans-serif';
  for (const sl of subLines) {
    ctx.fillText(sl, 64, y);
    y += 34;
  }

  y += 12;
  const p100 = variant.per100 || variant.total;
  const split = calcMacroSplit(p100);
  const cards = [
    { lbl: 'КАЛОРИИ', val: fmt(p100.kcal), unit: 'ккал / 100 г', accent: false },
    { lbl: 'БЕЛКИ', val: fmt(macro(p100, 'Белки')), unit: 'г / 100 г', accent: true },
    { lbl: 'ЖИРЫ', val: fmt(macro(p100, 'Жиры')), unit: 'г / 100 г', accent: false },
    { lbl: 'УГЛЕВОДЫ', val: fmt(macro(p100, 'Углеводы')), unit: 'г / 100 г', accent: false },
    { lbl: 'БЕЛКОВЫЙ ИНДЕКС', val: `${split.pPct}%`, unit: 'ккал из белка', accent: true }
  ];
  const cardGap = 14;
  const cardW = (952 - cardGap * 4) / 5;
  const cardH = 136;
  cards.forEach((c, idx) => {
    const cx = 64 + idx * (cardW + cardGap);
    drawRoundedBox(ctx, cx, y, cardW, cardH, 10, c.accent ? '#EDF0E8' : '#EFECE6', c.accent ? '#8CA37B' : '#DDD6CC');
    ctx.fillStyle = '#68635D';
    ctx.font = '600 12px Arial, sans-serif';
    ctx.fillText(c.lbl, cx + 16, y + 32);
    ctx.fillStyle = c.accent ? '#59674F' : '#1C1917';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(c.val, cx + 16, y + 80);
    ctx.fillStyle = '#68635D';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(c.unit, cx + 16, y + 112);
  });

  y += cardH + 52;
  ctx.fillStyle = '#1C1917';
  ctx.font = '32px Georgia, serif';
  ctx.fillText('Ингредиенты на выбранный объём:', 64, y);
  y += 38;

  ctx.font = '22px Arial, sans-serif';
  for (const row of ingRows) {
    for (let li = 0; li < row.linesCount; li++) {
      const lineY = y + li * 30;
      if (row.nameLines[li]) {
        ctx.fillStyle = '#1C1917';
        ctx.fillText(row.nameLines[li], 64, lineY);
      }
      if (row.amtLines[li]) {
        ctx.fillStyle = '#59674F';
        ctx.fillText(row.amtLines[li], 596, lineY);
      }
    }
    const bottomLineY = y + (row.linesCount - 1) * 30 + 14;
    ctx.fillStyle = 'rgba(207,199,189,0.55)';
    ctx.fillRect(64, bottomLineY, 952, 1);
    y += row.height;
  }

  drawRoundedBox(ctx, 64, footY, 952, 244, 12, '#FFFFFF', '#CFC7BD');

  const ean13 = generateRecipeEan13(r.slug, variant.id);
  const eanBits = encodeEan13Bits(ean13);
  ctx.fillStyle = '#59674F';
  ctx.font = '600 15px Arial, sans-serif';
  ctx.fillText('ШТРИХКОД ДЛЯ СКАНЕРА FATSECRET (EAN-13):', 92, footY + 38);
  const bx0 = 92;
  const by0 = footY + 54;
  for (let i = 0; i < eanBits.length; i++) {
    if (eanBits[i] === '1') {
      const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
      ctx.fillStyle = '#1C1917';
      ctx.fillRect(bx0 + i * 3, by0, 3, isGuard ? 106 : 90);
    }
  }
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 21px monospace';
  ctx.fillText(`${ean13[0]}  ${ean13.slice(1, 7)}  ${ean13.slice(7)}`, bx0 + 30, by0 + 130);
  ctx.fillStyle = '#68635D';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('Отсканируйте в FatSecret для быстрого ввода порции', 92, footY + 218);

  ctx.fillStyle = 'rgba(207,199,189,0.75)';
  ctx.fillRect(492, footY + 24, 1, 196);

  ctx.fillStyle = '#59674F';
  ctx.font = '600 15px Arial, sans-serif';
  ctx.fillText('ОТКРЫТЬ РЕЦЕПТ И ТАЙМЕРЫ:', 518, footY + 46);

  ctx.fillStyle = '#1C1917';
  ctx.font = '19px Arial, sans-serif';
  const qrNoteLines = wrapCanvasLines(
    ctx,
    'Наведите камеру телефона на QR-код, чтобы открыть эту вариацию, пересчёт порций и таймеры готовки.',
    262
  );
  qrNoteLines.forEach((ql, qi) => {
    ctx.fillText(ql, 518, footY + 82 + qi * 28);
  });

  const qrMat = generateQrMatrix(shareUrl);
  const qn = qrMat.length;
  const cell = Math.max(3, Math.floor(172 / qn));
  const qrSize = qn * cell;
  const qx0 = 990 - qrSize;
  const qy0 = footY + Math.round((244 - qrSize) / 2);

  for (let qr = 0; qr < qn; qr++) {
    for (let qc = 0; qc < qn; qc++) {
      if (qrMat[qr][qc]) {
        ctx.fillStyle = '#1C1917';
        ctx.fillRect(qx0 + qc * cell, qy0 + qr * cell, cell, cell);
      }
    }
  }

  openCardPreviewModal(canvas, r, variant);
}

/* ==========================================================================
   6. CATALOG VIEW
   ========================================================================== */

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
        <div class="hero-cta-group"><a class="primary" href="#catalog">Найти свой рецепт ${icon('arrow')}</a><button type="button" class="secondary-hero-btn" data-open-guide="1">${icon('spark')} Что умеет сайт (Демо)</button></div>
        <div class="hero-foot">
          <span><strong>${recipes.length}</strong> рецептов</span>
          <span><strong>${totalVariants}</strong> вариация</span>
          <span>КБЖУ для каждого блюда</span>
        </div>
      </div>
      (function() { const hIdx = recipes.length ? Math.floor(Math.random() * recipes.length) : 0; const hRec = recipes[hIdx] || { slug: "caramel-cheesecake.html", image: "caramel-cheesecake-hero.jpg", shortTitle: "Сливочный чизкейк", category: "Десерты" }; const hVar = hRec.variants?.find(x => x.id === hRec.defaultVariant) || hRec.variants?.[0]; const hP100 = hVar?.per100 || hVar?.total; const hBadge = hP100 ? fmt(hP100.kcal) + " ККАЛ · Б " + fmt(macro(hP100, "Белки")) + " Г" : "ВКУС БАЛАНСА"; return "<a class=\"hero-cover reveal\" href=\"\" + esc(hRec.slug) + "\"><img src=\"\" + esc(hRec.image) + "\" alt=\"\" + esc(hRec.shortTitle) + "\" width=\"600\" height=\"600\"><span class=\"issue\"><b>" + String(hIdx + 1).padStart(2, "0") + "</b>" + hBadge + "</span><div class=\"cover-label\"><div><small>Рецепт на обложке · " + esc(hRec.category || "Вкус баланса") + "</small><h2>" + esc(hRec.shortTitle) + "</h2></div><span class=\"round-arrow\">" + icon("arrow") + "</span></div></a>"; })()
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

/* ==========================================================================
   7. RECIPE DETAIL VIEW (WITH REVERSE SCALING, FATSECRET BARCODE & VOICE)
   ========================================================================== */

function updateRecipeSchema(r, variant, ratio, servings) {
  let script = document.getElementById('recipe-schema-ld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'recipe-schema-ld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
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
    recipeIngredient: variant.ingredients.filter(x => !x.group && !x.removed).map(x => `${x.name} — ${scaleAmount(x.amount, ratio)}`),
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
  let baseVariant = r.variants.find(v => v.id === urlVarId) || r.variants.find(v => v.id === r.defaultVariant) || r.variants[0];
  let activeSwaps = {}; // { [ingIndex]: { id, name, shortName, isCustomName, grams, kcal, p, f, c, removed } }
  let customAddedIngredients = []; // [{ id, name, grams, unit, kcal, p, f, c }]
  let variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
  const urlServings = Number(params.get('s') || params.get('servings'));
  let servings = (urlServings >= 1 && urlServings <= 20) ? urlServings : baseVariant.baseServings;
  const urlRatio = Number(params.get('r'));
  let customRatio = (urlRatio > 0 && urlRatio <= 10) ? urlRatio : null;
  let customScaleNote = customRatio ? `Масштаб ×${fmt(customRatio)} от базового рецепта` : '';
  let nutritionMode = 'batch';
  let focusIndex = 0;
  let wakeLock = null;
  let focusOrigin = null;
  let activeScaleIngIdx = null;
  let speechRec = null;
  let voiceActive = false;

  const storageKey = () => `pp-checklist-v1:${r.slug}:${variant.id}`;
  const readChecks = () => {
    try { return JSON.parse(localStorage.getItem(storageKey()) || '[]'); }
    catch { return []; }
  };
  let checks = new Set(readChecks());
  const isFav = () => getFavs().has(r.slug);
  const currentRatio = () => customRatio !== null ? customRatio : (servings / variant.baseServings);

  const related = recipes
    .filter(x => x.slug !== r.slug)
    .sort((a, b) => {
      const sameCatA = a.category === r.category ? 1 : 0;
      const sameCatB = b.category === r.category ? 1 : 0;
      if (sameCatA !== sameCatB) return sameCatB - sameCatA;
      const va = a.variants.find(v => v.id === a.defaultVariant) || a.variants[0];
      const vb = b.variants.find(v => v.id === b.defaultVariant) || b.variants[0];
      return calcMacroSplit(vb.per100).pPct - calcMacroSplit(va.per100).pPct;
    })
    .slice(0, 3);

  app.innerHTML = `<div class="shell">${nav(true)}<main id="main">
    <div class="detail-topbar">
      <a class="breadcrumb" href="index.html#catalog">${icon('back')}К коллекции рецептов</a>
      <div class="detail-top-actions">
        <button type="button" class="fav-pill-btn" data-open-guide="1">${icon('spark')} Демо функций</button><button type="button" class="fav-pill-btn" id="detail-plan-btn">${icon('target')} + В рацион дня</button>
        <button type="button" class="fav-pill-btn ${isFav() ? 'active' : ''}" id="detail-fav-btn">
          ${icon('heart')} <span id="detail-fav-label">${isFav() ? 'В избранном' : 'В избранное'}</span>
        </button>
      </div>
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
          <span class="share-toolbar-label">${icon('share')} Поделиться и сохранить:</span>
          <div class="share-buttons">
            <button type="button" class="share-btn share-tg" id="share-tg" title="Отправить в Telegram">${icon('tg')} Telegram</button>
            <button type="button" class="share-btn share-max" id="share-max" title="Отправить в мессенджер MAX">${icon('max')} MAX</button>
            <button type="button" class="share-btn share-vk" id="share-vk" title="Поделиться ВКонтакте">${icon('vk')} ВК</button>
            <button type="button" class="share-btn" id="copy-recipe-text" title="Скопировать полный рецепт с КБЖУ и ингредиентами">${icon('copy')} Текст рецепта</button>
            <button type="button" class="share-btn" id="download-card-png" title="Открыть карточку рецепта с QR и штрихкодом для FatSecret">${icon('download')} Карточка и штрихкод</button>
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
        <div>
          <h2>Найдите свой вариант</h2>
          <small class="variant-url-hint">Ссылка в браузере, КБЖУ и штрихкод FatSecret автоматически привязываются к выбранной вариации</small>
        </div>
        <button type="button" class="share-btn" id="toggle-compare-variants" aria-expanded="false">${icon('compare')} Сравнить все варианты (${r.variants.length})</button>
      </div>
      <div class="variant-tabs">${r.variants.map(v => `<button class="variant-btn" data-variant="${v.id}" aria-pressed="false"><small>Вариация ${v.id}</small>${esc(v.name)}</button>`).join('')}</div>
      <div class="variant-compare-wrap" id="variant-compare-wrap" hidden></div>
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
        <div class="pan-converter">
          <button type="button" class="pan-toggle-btn" id="pan-toggle-btn" aria-expanded="false">${icon('scale')} Пересчёт под диаметр формы</button>
          <div class="pan-controls" id="pan-controls" hidden>
            <div class="pan-row">
              <label><small>Форма в рецепте</small>
                <select id="pan-base">${[14,16,18,20,22,24,26].map(d => `<option value="${d}" ${d === 18 ? 'selected' : ''}>${d} см</option>`).join('')}</select>
              </label>
              <label><small>Моя форма</small>
                <select id="pan-target">${[14,16,18,20,22,24,26].map(d => `<option value="${d}" ${d === 18 ? 'selected' : ''}>${d} см</option>`).join('')}</select>
              </label>
            </div>
          </div>
        </div>
        <div class="custom-scale-banner" id="custom-scale-banner" hidden>
          <span id="custom-scale-text"></span>
          <button type="button" class="text-button" id="reset-custom-scale">Сбросить</button>
        </div>
        <p class="ingredient-hint">Нажмите <strong>«✏️ Вес / Замена»</strong> напротив любого продукта, чтобы изменить его граммовку, заменить на свой продукт (без сбоя остальных ингредиентов!) или убрать из рецепта. Внизу списка можно <strong>добавить свой продукт</strong>.</p>
        <ul class="ingredient-list" id="ingredient-list"></ul>
        <div class="add-custom-ing-wrap">
          <button type="button" class="add-custom-ing-btn" id="open-add-ing-btn">➕ Добавить свой продукт в рецепт</button>
          <div class="ing-scale-popover ing-add-popover" id="add-ing-popover" hidden>
            <div class="ing-swap-section">
              <div class="ing-custom-head">
                <strong class="ing-box-title">Добавить дополнительный продукт в рецепт</strong>
                <small class="ing-base-macro-hint" id="add-ing-macro-hint">Впишите название и вес — КБЖУ подставится автоматически или с вашей этикетки:</small>
              </div>
              <div class="ing-add-top-row">
                <input type="text" class="ing-custom-name-input" id="add-ing-name" placeholder="Название (напр.: Голубика, Глазурь, Орехи)">
                <div class="ing-weight-input-wrap">
                  <input type="number" class="ing-scale-input" id="add-ing-grams" value="50" min="1" step="any" aria-label="Вес добавляемого продукта в граммах">
                  <span class="ing-scale-unit">г</span>
                </div>
              </div>
              <div class="ing-custom-grid">
                <label><small>Ккал / 100 г</small><input type="number" id="add-ing-kcal" placeholder="100" min="0" step="any"></label>
                <label><small>Белки, г</small><input type="number" id="add-ing-p" placeholder="8" min="0" step="any"></label>
                <label><small>Жиры, г</small><input type="number" id="add-ing-f" placeholder="3" min="0" step="any"></label>
                <label><small>Углеводы, г</small><input type="number" id="add-ing-c" placeholder="10" min="0" step="any"></label>
              </div>
              <div class="ing-swap-actions ing-add-actions-row">
                <button type="button" class="share-chip ing-btn-scale" id="confirm-add-ing-btn">✓ Добавить в рецепт (пересчитать КБЖУ)</button>
                <button type="button" class="share-chip ing-btn-swap-only" id="cancel-add-ing-btn">Отмена</button>
              </div>
            </div>
          </div>
        </div>
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
            <div class="nutrition-controls-right">
              <div class="nutrition-mode-switch" role="tablist" aria-label="Режим расчёта КБЖУ">
                <button type="button" class="nutri-tab" data-nutri-mode="batch" aria-pressed="true">На объём</button>
                <button type="button" class="nutri-tab" data-nutri-mode="single" aria-pressed="false">На 1 порцию</button>
                <button type="button" class="nutri-tab" data-nutri-mode="per100" aria-pressed="false">На 100 г</button>
              </div>
              <button type="button" class="share-btn fatsecret-open-btn" id="open-fatsecret-btn">${icon('barcode')} Штрихкод FatSecret</button>
            </div>
          </div>
          <div class="nutrition-grid" id="nutrition-grid" aria-live="polite" aria-atomic="true"></div>
          <div class="macro-analytics" id="macro-analytics"></div>
          <div class="plate-calc-bar">
            <label for="plate-grams-input" class="plate-calc-label">⚖ Калькулятор вашей тарелки (для дневника / FatSecret):</label>
            <div class="plate-calc-inputs">
              <input type="number" id="plate-grams-input" value="180" min="10" max="2000" step="5" aria-label="Вес вашей порции в граммах">
              <span>г готового блюда =</span>
              <strong id="plate-calc-output"></strong>
            </div>
          </div>
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
    <section class="related-section" aria-label="Похожие рецепты">
      <div class="section-head">
        <div>
          <div class="eyebrow">Продолжить коллекцию</div>
          <h2>Похожие высокобелковые блюда</h2>
        </div>
      </div>
      <div class="recipe-grid">${related.map((item, idx) => card(item, idx + 1)).join('')}</div>
    </section>
  </main>${footer()}</div>

  <dialog class="cooking-dialog" id="cooking-dialog" aria-labelledby="focus-title">
    <div class="dialog-inner">
      <div class="dialog-header">
        <div class="focus-status-pills">
          <small id="focus-count"></small>
          <span class="wakelock-pill" id="wakelock-pill" hidden>🔆 Экран не гаснет</span>
          <button type="button" class="voice-pill" id="voice-control-btn" hidden>${icon('mic')} <span id="voice-control-label">Голос: Выкл</span></button>
        </div>
        <button class="icon-button" id="close-focus" aria-label="Закрыть режим готовки">${icon('close')}</button>
      </div>
      <div class="focus-progress"><span id="focus-bar"></span></div>
      <h2 id="focus-title"></h2>
      <p class="focus-note">${esc(r.shortTitle)} · Вариация: <strong id="focus-variant-name"></strong> · Голосовые команды: «дальше», «назад», «таймер».</p>
      <div class="focus-body" id="focus-body"></div>
      <div class="focus-timers" id="focus-timers"></div>
      <div class="focus-footer">
        <button id="prev-step">${icon('back')} Назад</button>
        <button id="next-step">Следующий шаг ${icon('arrow')}</button>
      </div>
    </div>
  </dialog>

  <dialog class="shopping-dialog" id="fatsecret-dialog" aria-labelledby="fatsecret-title">
    <div class="dialog-inner">
      <div class="dialog-header">
        <div>
          <small>БЫСТРЫЙ УЧЁТ КАЛОРИЙ И БЖУ</small>
          <h2 id="fatsecret-title">Штрихкод для FatSecret и QR рецепта</h2>
        </div>
        <button type="button" class="icon-button" id="close-fatsecret" aria-label="Закрыть окно FatSecret">${icon('close')}</button>
      </div>
      <div id="fatsecret-body" class="fatsecret-body"></div>
    </div>
  </dialog>`;

  bindNavActions();

  function syncUrlState() {
    const rParam = customRatio !== null ? `&r=${Math.round(customRatio * 1000) / 1000}` : '';
    const nextUrl = `${location.pathname}?v=${variant.id}&s=${servings}${rParam}#var${variant.id}`;
    try { history.replaceState(null, '', nextUrl); } catch {}
    updateRecipeSchema(r, variant, currentRatio(), servings);
  }

  function getShareUrl() {
    const base = location.origin + location.pathname;
    const rParam = customRatio !== null ? `&r=${Math.round(customRatio * 1000) / 1000}` : '';
    return `${base}?v=${variant.id}&s=${servings}${rParam}#var${variant.id}`;
  }

  function getServingsLabel() {
    if (customRatio !== null) return `Масштаб ×${fmt(customRatio)}`;
    return `${servings} ${servings === 1 ? 'порция' : servings < 5 ? 'порции' : 'порций'}`;
  }

  function buildShareSummary(includeIngredients = false) {
    const ratio = currentRatio();
    const p100 = variant.per100;
    const split = calcMacroSplit(p100);
    const varTitle = r.variants.length > 1 ? ` (Вариация: ${variant.name})` : '';
    const lines = [
      `🍽 ${r.title}${varTitle}`,
      `⚡ На 100 г: ${fmt(p100.kcal)} ккал | Б: ${fmt(macro(p100, 'Белки'))} г | Ж: ${fmt(macro(p100, 'Жиры'))} г | У: ${fmt(macro(p100, 'Углеводы'))} г (${split.pPct}% ккал из белка)`,
      `🥣 Расчёт (${getServingsLabel()}): ${fmt(variant.total.kcal * ratio)} ккал (${fmt(macro(variant.total, 'Белки') * ratio)} г белка)`
    ];
    if (includeIngredients) {
      lines.push('\n📋 Ингредиенты:');
      for (const ing of variant.ingredients) {
        if (ing.removed) continue;
        if (ing.group) lines.push(`\n${ing.group}:`);
        else lines.push(`• ${ing.name} — ${scaleAmount(ing.amount, ratio)}`);
      }
    }
    return lines.join('\n');
  }

  document.getElementById('detail-plan-btn').addEventListener('click', () => {
    addRecipeToPlanner(r, variant, 1);
  });

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

  document.getElementById('download-card-png').addEventListener('click', async () => {
    await downloadRecipeCardPng(r, variant, currentRatio(), getServingsLabel(), getShareUrl());
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
    const ratio = currentRatio();
    const items = variant.ingredients.filter(x => !x.group && !x.removed).map(x => ({
      name: x.name,
      amount: scaleAmount(x.amount, ratio),
      done: false
    }));
    const cart = getCart();
    cart.push({
      slug: r.slug,
      title: r.shortTitle,
      variantName: variant.name,
      servings: customRatio !== null ? `×${fmt(customRatio)}` : servings,
      url: getShareUrl(),
      items
    });
    saveCart(cart);
    showToast('Ингредиенты добавлены в список покупок 🛒');
  });

  /* Pan Diameter Converter */
  const panToggleBtn = document.getElementById('pan-toggle-btn');
  const panControls = document.getElementById('pan-controls');
  const panBase = document.getElementById('pan-base');
  const panTarget = document.getElementById('pan-target');

  panToggleBtn.addEventListener('click', () => {
    const open = !panControls.hidden;
    panControls.hidden = open;
    panToggleBtn.setAttribute('aria-expanded', String(!open));
  });

  function applyPanScale() {
    const b = Number(panBase.value);
    const t = Number(panTarget.value);
    if (b === t) {
      customRatio = null;
      customScaleNote = '';
    } else {
      customRatio = calcPanRatio(b, t);
      customScaleNote = `⭕ Пересчитано под форму ${t} см вместо ${b} см (×${fmt(customRatio)})`;
    }
    updateNumbers();
  }
  panBase.addEventListener('change', applyPanScale);
  panTarget.addEventListener('change', applyPanScale);

  document.getElementById('reset-custom-scale').addEventListener('click', () => {
    customRatio = null;
    customScaleNote = '';
    panBase.value = '18';
    panTarget.value = '18';
    activeScaleIngIdx = null;
    activeSwaps = {};
    customAddedIngredients = [];
    variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
    renderVariant();
    showToast('Сброшены замены и масштабирование рецепта');
  });

  /* Variant Comparison Table */
  const compareBtn = document.getElementById('toggle-compare-variants');
  const compareWrap = document.getElementById('variant-compare-wrap');
  if (compareBtn && compareWrap) {
    compareBtn.addEventListener('click', () => {
      const open = !compareWrap.hidden;
      compareWrap.hidden = open;
      compareBtn.setAttribute('aria-expanded', String(!open));
      if (!open) renderVariantComparison();
    });
  }

  function renderVariantComparison() {
    if (!compareWrap) return;
    const maxProt = Math.max(...r.variants.map(v => macro(v.per100, 'Белки')));
    const minKcal = Math.min(...r.variants.map(v => v.per100?.kcal || 9999));
    compareWrap.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr>
            <th>Вариация</th>
            <th>Ккал / 100 г</th>
            <th>Белки / 100 г</th>
            <th>Жиры / Углеводы</th>
            <th>Протеиновый индекс</th>
            <th>Весь объём</th>
          </tr>
        </thead>
        <tbody>
          ${r.variants.map(v => {
            const p100 = v.per100 || v.total;
            const prot = macro(p100, 'Белки');
            const split = calcMacroSplit(p100);
            const isCurrent = v.id === variant.id;
            return `<tr class="${isCurrent ? 'active-row' : ''}" data-pick-variant="${v.id}">
              <td><strong>${v.id}. ${esc(v.name)}</strong> ${isCurrent ? '<span class="table-badge">Выбрана</span>' : ''}</td>
              <td>${fmt(p100.kcal)} ккал ${p100.kcal === minKcal ? '<span class="table-badge">Мин. ккал</span>' : ''}</td>
              <td><strong>${fmt(prot)} г</strong> ${prot === maxProt ? '<span class="table-badge">Макс. белок</span>' : ''}</td>
              <td>Ж ${fmt(macro(p100, 'Жиры'))} г · У ${fmt(macro(p100, 'Углеводы'))} г</td>
              <td><strong>${split.pPct}%</strong> ккал из белка</td>
              <td>${fmt(v.total.kcal)} ккал (${fmt(macro(v.total, 'Белки'))} г Б)</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
    compareWrap.querySelectorAll('[data-pick-variant]').forEach(row => {
      row.addEventListener('click', () => {
        const id = Number(row.dataset.pickVariant);
        baseVariant = r.variants.find(v => v.id === id) || baseVariant;
        activeSwaps = {};
        customAddedIngredients = [];
        variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
        servings = baseVariant.baseServings;
        customRatio = null;
        customScaleNote = '';
        checks = new Set(readChecks());
        renderVariant();
        renderVariantComparison();
      });
    });
  }

  /* FatSecret Barcode & Quick Entry Modal */
  const fsDialog = document.getElementById('fatsecret-dialog');
  document.getElementById('close-fatsecret').addEventListener('click', () => fsDialog.close());
  fsDialog.addEventListener('click', e => { if (e.target === fsDialog) fsDialog.close(); });

  function renderFatSecretModal() {
    const body = document.getElementById('fatsecret-body');
    const ean13 = generateRecipeEan13(r.slug, variant.id);
    const p100 = variant.per100 || variant.total;
    const shareUrl = getShareUrl();
    const productName = `${r.shortTitle} (${variant.name})`;
    const fsCopySummary = [
      `Марка: ПП · рецепты`,
      `Название продукта: ${productName}`,
      `Штрихкод EAN-13: ${ean13}`,
      `Порция: 100 г`,
      `Калории: ${fmt(p100.kcal)} ккал`,
      `Белки: ${fmt(macro(p100, 'Белки'))} г`,
      `Жиры: ${fmt(macro(p100, 'Жиры'))} г`,
      `Углеводы: ${fmt(macro(p100, 'Углеводы'))} г`,
      ...(macro(p100, 'Клетчатка') ? [`Клетчатка: ${fmt(macro(p100, 'Клетчатка'))} г`] : [])
    ].join('\n');

    body.innerHTML = `
      <div class="fs-codes-grid">
        <div class="fs-code-box">
          <small>ШТРИХКОД БЛЮДА ДЛЯ FATSECRET (GS1 EAN-13)</small>
          <div class="fs-svg-wrap">${renderEan13Svg(ean13, 280, 104)}</div>
          <p class="ingredient-hint">Уникальный постоянный код вариации <strong>#${variant.id}</strong>. Наведите сканер штрихкодов в FatSecret прямо на экран.</p>
        </div>
        <div class="fs-code-box">
          <small>QR-КОД ПРЯМОЙ ССЫЛКИ НА ВАРИАЦИЮ</small>
          <div class="fs-svg-wrap">${renderQrSvg(shareUrl, 124)}</div>
          <p class="ingredient-hint">Отсканируйте камерой телефона, чтобы открыть эту вариацию и выбранные порции.</p>
        </div>
      </div>
      <div class="fs-card-data">
        <div class="fs-card-head">
          <strong>Данные на 100 г для привязки в FatSecret</strong>
          <button type="button" class="share-chip" id="copy-fs-data">${icon('copy')} Скопировать карточку БЖУ</button>
        </div>
        <div class="fs-fields">
          <div><small>Марка / Бренд</small><strong>ПП · рецепты</strong></div>
          <div><small>Название блюда</small><strong>${esc(productName)}</strong></div>
          <div><small>На 100 г готового</small><strong>${fmt(p100.kcal)} ккал · Б ${fmt(macro(p100, 'Белки'))} г · Ж ${fmt(macro(p100, 'Жиры'))} г · У ${fmt(macro(p100, 'Углеводы'))} г</strong></div>
        </div>
        <p class="ingredient-hint">💡 <strong>Как это работает:</strong> при первом сканировании штрихкода <code>${ean13}</code> в приложении FatSecret нажмите «Добавить новый продукт» и вставьте эти значения на 100 г. FatSecret навсегда привяжет штрихкод к блюду — в следующий раз достаточно навести камеру и ввести вес вашей порции в граммах!</p>
      </div>
    `;

    document.getElementById('copy-fs-data').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(fsCopySummary);
        showToast('Данные КБЖУ для FatSecret скопированы!');
      } catch {
        showToast('Не удалось скопировать данные');
      }
    });
  }

  document.getElementById('open-fatsecret-btn').addEventListener('click', () => {
    renderFatSecretModal();
    fsDialog.showModal();
  });

  /* Plate Gram Calculator */
  const plateInput = document.getElementById('plate-grams-input');
  const plateOutput = document.getElementById('plate-calc-output');
  function updatePlateCalc() {
    if (!plateInput || !plateOutput) return;
    const res = calcGramsNutrition(variant.per100 || variant.total, plateInput.value);
    plateOutput.textContent = `${fmt(res.kcal)} ккал · Б ${fmt(res.protein)} г · Ж ${fmt(res.fat)} г · У ${fmt(res.carbs)} г`;
  }
  plateInput.addEventListener('input', updatePlateCalc);

  const changeNumber = (el, str) => {
    el.textContent = str;
    el.classList.remove('number-change');
    void el.offsetWidth;
    el.classList.add('number-change');
  };

  function updateNumbers() {
    const ratio = currentRatio();
    const root = document.getElementById('serving-enhancement');
    root.dataset.servings = servings;
    if (document.getElementById('servings')) {
      document.getElementById('servings').textContent = customRatio !== null
        ? `Масштаб ×${fmt(customRatio)}`
        : `${servings} ${servings === 1 ? 'порция' : servings < 5 ? 'порции' : 'порций'}`;
      document.getElementById('decrease').disabled = customRatio === null && servings <= 1;
      document.getElementById('increase').disabled = customRatio === null && servings >= 20;
    }

    const hasSwaps = Object.keys(activeSwaps).length > 0 || customAddedIngredients.length > 0;
    const banner = document.getElementById('custom-scale-banner');
    if (banner) {
      banner.hidden = customRatio === null && !hasSwaps;
      if (hasSwaps) {
        const parts = [];
        for (const [k, s] of Object.entries(activeSwaps)) {
          const bIng = baseVariant.ingredients[Number(k)];
          const bTitle = bIng?.name?.split('(')[0]?.trim() || 'Продукт';
          if (s.removed) parts.append ? parts.push(`убрано: ${bTitle}`) : parts.push(`убрано: ${bTitle}`);
          else parts.push(`${s.shortName || s.name || bTitle}${s.grams !== undefined ? ` (${fmt(s.grams)} г)` : ''}`);
        }
        for (const addIt of customAddedIngredients) {
          parts.push(`+${addIt.name} (${fmt(addIt.grams)} г)`);
        }
        const scalePart = customRatio !== null ? ` · ${customScaleNote || `Масштаб ×${fmt(customRatio)}`}` : '';
        document.getElementById('custom-scale-text').textContent = `🔄 Свой состав: ${parts.join(', ')} (КБЖУ пересчитано)${scalePart}`;
      } else {
        document.getElementById('custom-scale-text').textContent = customScaleNote || `Активен точный коэффициент ×${fmt(customRatio || 1)}`;
      }
    }

    window.dispatchEvent(new CustomEvent('recipe:servings-update', { detail: servings }));
    document.querySelectorAll('[data-amount]').forEach(el => {
      const idx = Number(el.dataset.amount);
      changeNumber(el, scaleAmount(variant.ingredients[idx].amount, ratio));
    });
    document.querySelectorAll('[data-meta]').forEach(el => {
      const label = el.dataset.meta;
      if (/Порци|порци|Количество/.test(label) && !/Вес|вес/.test(label))
        el.textContent = getServingsLabel();
      else if (/Вес|вес|Объем|Основа яйц|Калорийность|Чистый белок/.test(label) && !/Вес порции/.test(label)) {
        if (/Вес|вес/.test(label) && variant.dishWeightDelta) {
          el.textContent = `~${fmt(Math.max(50, Math.round(variant.estimatedDishWeight * ratio)))} г`;
        } else {
          el.textContent = scaleAmount(el.dataset.metaOriginal, ratio);
        }
      }
    });

    const total = variant.total;
    const per100 = variant.per100;
    let factor = ratio;
    let modeLabel = customRatio !== null ? `На пересчитанный объём (×${fmt(customRatio)})` : `На ${servings} ${servings === 1 ? 'порцию' : servings < 5 ? 'порции' : 'порций'}`;
    let sourceBlock = total;

    if (nutritionMode === 'single') {
      factor = 1 / variant.baseServings;
      modeLabel = 'На 1 базовую порцию блюда';
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
    gridEl.setAttribute('data-cols', String(values.length));
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

    updatePlateCalc();
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

  function readItemChangeFromInputs(idx, baseIng, baseMacro, baseGrams) {
    const rawName = document.getElementById(`ing-custom-name-${idx}`)?.value?.trim() || '';
    const rawWeight = document.getElementById(`ing-input-${idx}`)?.value?.trim() ?? '';
    const rawKcal = document.getElementById(`ing-custom-kcal-${idx}`)?.value?.trim() ?? '';
    const rawP = document.getElementById(`ing-custom-p-${idx}`)?.value?.trim() ?? '';
    const rawF = document.getElementById(`ing-custom-f-${idx}`)?.value?.trim() ?? '';
    const rawC = document.getElementById(`ing-custom-c-${idx}`)?.value?.trim() ?? '';

    const cleanBaseName = baseIng.name.split('(')[0].trim();
    const isCustomName = Boolean(rawName && rawName.toLocaleLowerCase('ru') !== cleanBaseName.toLocaleLowerCase('ru') && rawName.toLocaleLowerCase('ru') !== baseIng.name.trim().toLocaleLowerCase('ru'));
    const effectiveMacroBase = isCustomName ? inferBaselineNutrition(rawName) : baseMacro;

    const parseMacroInput = (val, fallback) => {
      if (val === '') return fallback;
      const n = Number(String(val).replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    };

    const ratio = currentRatio();
    let userGrams = baseGrams;
    if (rawWeight !== '') {
      const parsedW = Number(String(rawWeight).replace(',', '.'));
      if (Number.isFinite(parsedW) && parsedW >= 0) {
        userGrams = ratio > 0 ? Math.round((parsedW / ratio) * 100) / 100 : parsedW;
      }
    }

    const p = parseMacroInput(rawP, effectiveMacroBase.p);
    const f = parseMacroInput(rawF, effectiveMacroBase.f);
    const c = parseMacroInput(rawC, effectiveMacroBase.c);
    const defaultKcal = (rawP !== '' || rawF !== '' || rawC !== '')
      ? Math.round((p * 4 + f * 9 + c * 4) * 10) / 10
      : effectiveMacroBase.kcal;
    const kcal = parseMacroInput(rawKcal, defaultKcal);
    const finalName = rawName || cleanBaseName;

    return {
      id: 'custom',
      name: finalName,
      shortName: finalName,
      isCustomName,
      grams: userGrams,
      kcal,
      p,
      f,
      c
    };
  }

  /* Bind "+ Добавить свой продукт в рецепт" form */
  const openAddIngBtn = document.getElementById('open-add-ing-btn');
  const addIngPop = document.getElementById('add-ing-popover');
  const addIngName = document.getElementById('add-ing-name');
  const addIngGrams = document.getElementById('add-ing-grams');
  const addIngKcal = document.getElementById('add-ing-kcal');
  const addIngP = document.getElementById('add-ing-p');
  const addIngF = document.getElementById('add-ing-f');
  const addIngC = document.getElementById('add-ing-c');
  const addIngHint = document.getElementById('add-ing-macro-hint');

  function syncAddIngPlaceholders() {
    const typed = addIngName?.value?.trim() || '';
    const inferred = typed ? inferBaselineNutrition(typed) : { kcal: 100, p: 8, f: 3, c: 10 };
    if (addIngKcal) addIngKcal.placeholder = String(inferred.kcal);
    if (addIngP) addIngP.placeholder = String(inferred.p);
    if (addIngF) addIngF.placeholder = String(inferred.f);
    if (addIngC) addIngC.placeholder = String(inferred.c);
    if (addIngHint) {
      addIngHint.textContent = typed
        ? `Авто-оценка на 100 г для «${typed}»: ~${fmt(inferred.kcal)} ккал · Б ${fmt(inferred.p)} · Ж ${fmt(inferred.f)} · У ${fmt(inferred.c)} (или впишите с этикетки)`
        : 'Впишите название и вес — КБЖУ подставится автоматически или с вашей этикетки:';
    }
  }

  addIngName?.addEventListener('input', syncAddIngPlaceholders);

  openAddIngBtn?.addEventListener('click', () => {
    const isHidden = addIngPop.hidden;
    addIngPop.hidden = !isHidden;
    if (isHidden) {
      syncAddIngPlaceholders();
      if (!window.matchMedia?.('(max-width: 760px)').matches) {
        addIngName?.focus();
      }
    }
  });

  document.getElementById('cancel-add-ing-btn')?.addEventListener('click', () => {
    addIngPop.hidden = true;
  });

  document.getElementById('confirm-add-ing-btn')?.addEventListener('click', () => {
    const name = addIngName?.value?.trim() || '';
    if (!name) {
      showToast('Введите название продукта (например: Голубика или Глазурь)');
      addIngName?.focus();
      return;
    }
    const rawW = Number(String(addIngGrams?.value || '0').replace(',', '.'));
    if (!(rawW > 0)) {
      showToast('Введите вес продукта в граммах (больше 0)');
      addIngGrams?.focus();
      return;
    }
    const ratio = currentRatio();
    const baseG = ratio > 0 ? Math.round((rawW / ratio) * 100) / 100 : rawW;
    const inferred = inferBaselineNutrition(name);
    const parseOr = (inp, fb) => {
      const v = inp?.value?.trim() ?? '';
      if (v === '') return fb;
      const n = Number(v.replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? n : fb;
    };
    const p = parseOr(addIngP, inferred.p);
    const f = parseOr(addIngF, inferred.f);
    const c = parseOr(addIngC, inferred.c);
    const hasCustomMacros = (addIngP?.value?.trim() !== '' || addIngF?.value?.trim() !== '' || addIngC?.value?.trim() !== '');
    const defKcal = hasCustomMacros ? Math.round((p * 4 + f * 9 + c * 4) * 10) / 10 : inferred.kcal;
    const kcal = parseOr(addIngKcal, defKcal);

    customAddedIngredients.push({
      id: 'add_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name,
      grams: baseG,
      unit: 'г',
      kcal,
      p,
      f,
      c
    });

    if (addIngName) addIngName.value = '';
    if (addIngGrams) addIngGrams.value = '50';
    if (addIngKcal) addIngKcal.value = '';
    if (addIngP) addIngP.value = '';
    if (addIngF) addIngF.value = '';
    if (addIngC) addIngC.value = '';
    addIngPop.hidden = true;

    variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
    renderVariant();
    showToast(`Добавлено в рецепт: «${name}» (${fmt(rawW)} г)`);
  });

  function renderVariant() {
    document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.variant) === variant.id));
    const meta = variant.meta.map(m => `<div><small>${esc(m.label)}</small><strong data-meta="${esc(m.label)}" data-meta-original="${esc(m.value)}">${esc(m.value)}</strong></div>`).join('');
    document.getElementById('meta').innerHTML = meta;

    document.getElementById('ingredient-list').innerHTML = variant.ingredients.map((x, i) => {
      if (x.group) return `<li class="ing-group-title">${esc(x.group)}</li>`;

      /* User-added custom ingredient row */
      if (x.addedByUser) {
        const cm = x.customMacro || { kcal: 0, p: 0, f: 0, c: 0 };
        return `<li class="ingredient-item ing-item-added" id="ing-row-${i}">
          <div class="ing-row-main">
            <input type="checkbox" id="ing-${i}" data-check="${i}" ${checks.has(i) ? 'checked' : ''}>
            <label for="ing-${i}">
              <span class="checkbox-ui" aria-hidden="true"></span>
              <span class="ingredient-copy">
                <span class="ing-name">${esc(x.name)} <small class="ing-macro-pill">(${fmt(cm.kcal)} ккал · Б ${fmt(cm.p)} · Ж ${fmt(cm.f)} · У ${fmt(cm.c)} на 100 г)</small></span>
                <span class="ing-amount" data-amount="${i}"></span>
              </span>
            </label>
            <div class="ing-row-btns">
              <button type="button" class="ing-remove-quick-btn" data-delete-added="${esc(x.addedId)}" title="Удалить добавленный продукт">🗑 Убрать</button>
            </div>
          </div>
        </li>`;
      }

      const baseIng = baseVariant.ingredients[i] || x;
      const swapCfg = getIngredientSwapConfig(baseIng.name, baseIng.amount);
      const activeSwap = activeSwaps[i] || null;
      const isRemoved = !!(activeSwap && activeSwap.removed);
      const isSwapped = !!(activeSwap && !activeSwap.removed && activeSwap.id !== 'default');
      const primary = extractPrimaryAmount(baseIng.amount || x.amount);
      const baseGrams = getIngredientGrams(baseIng.amount || x.amount);
      const effectiveBaseGrams = (activeSwap && activeSwap.grams !== undefined) ? activeSwap.grams : baseGrams;
      const curVal = effectiveBaseGrams > 0
        ? Math.round(effectiveBaseGrams * currentRatio() * 100) / 100
        : (primary ? Math.round(primary.value * currentRatio() * 100) / 100 : 50);
      const baseMacro = swapCfg ? swapCfg.baseMacro : inferBaselineNutrition(baseIng.name);
      const shortBaseTitle = baseIng.name.split('(')[0].trim();
      const unitLabel = primary?.unit === 'мл' ? 'мл' : 'г';

      if (isRemoved) {
        return `<li class="ingredient-item ing-item-removed" id="ing-row-${i}">
          <div class="ing-row-main">
            <span class="ingredient-copy ing-removed-copy">
              <span class="ing-name">${esc(baseIng.name)}</span>
              <span class="ing-amount" data-amount="${i}">0 г (убрано из рецепта)</span>
            </span>
            <button type="button" class="ing-scale-trigger swapped" data-reset-swap="${i}" title="Вернуть продукт обратно в рецепт">↩ Вернуть</button>
          </div>
        </li>`;
      }

      const btnLabel = isSwapped ? '🔄 Изменено' : '✏️ Вес / Замена';

      const popoverContent = `
        <div class="ing-swap-section">
          ${isSwapped ? `
            <div class="ing-swap-active-bar">
              <span>Сейчас: <strong>${esc(activeSwap.shortName || activeSwap.name)}</strong> — <strong>${fmt(curVal)} ${unitLabel}</strong> (${fmt(activeSwap.kcal)} ккал · Б ${fmt(activeSwap.p)} · Ж ${fmt(activeSwap.f)} · У ${fmt(activeSwap.c)} на 100 г)</span>
              <button type="button" class="text-button ing-reset-single" data-reset-swap="${i}">↩ Вернуть исходный</button>
            </div>
          ` : ''}

          <div class="ing-custom-macros" id="ing-custom-macros-${i}">
            <div class="ing-custom-head">
              <strong class="ing-box-title">Изменить вес или заменить «${esc(shortBaseTitle)}» (остальной рецепт не меняется):</strong>
              <small class="ing-base-macro-hint" id="ing-macro-hint-${i}">По рецепту: ${baseGrams > 0 ? `${fmt(baseGrams)} ${unitLabel} · ` : ''}на 100 г ~${fmt(baseMacro.kcal)} ккал · Б ${fmt(baseMacro.p)} · Ж ${fmt(baseMacro.f)} · У ${fmt(baseMacro.c)}</small>
            </div>

            <div class="ing-edit-top-grid">
              <label class="ing-edit-field">
                <small>Мой вес в рецепте (${unitLabel}):</small>
                <div class="ing-weight-input-wrap">
                  <input type="number" class="ing-scale-input" id="ing-input-${i}" value="${curVal}" min="0" step="any" aria-label="Количество продукта ${esc(baseIng.name)} (${unitLabel})">
                  <span class="ing-scale-unit">${unitLabel}</span>
                </div>
              </label>
              <label class="ing-edit-field">
                <small>Название (если заменяете продукт):</small>
                <input type="text" class="ing-custom-name-input" id="ing-custom-name-${i}" data-ing-name-idx="${i}" placeholder="${esc(shortBaseTitle)} (или впишите свой, напр. Голубика)" value="${esc(activeSwap?.isCustomName ? activeSwap.shortName : '')}">
              </label>
            </div>

            <div class="ing-custom-grid">
              <label><small>Ккал / 100 г</small><input type="number" id="ing-custom-kcal-${i}" placeholder="${baseMacro.kcal}" value="${activeSwap ? activeSwap.kcal : ''}" min="0" step="any"></label>
              <label><small>Белки, г</small><input type="number" id="ing-custom-p-${i}" placeholder="${baseMacro.p}" value="${activeSwap ? activeSwap.p : ''}" min="0" step="any"></label>
              <label><small>Жиры, г</small><input type="number" id="ing-custom-f-${i}" placeholder="${baseMacro.f}" value="${activeSwap ? activeSwap.f : ''}" min="0" step="any"></label>
              <label><small>Углеводы, г</small><input type="number" id="ing-custom-c-${i}" placeholder="${baseMacro.c}" value="${activeSwap ? activeSwap.c : ''}" min="0" step="any"></label>
            </div>

            <div class="ing-swap-actions">
              <button type="button" class="share-chip ing-btn-scale" data-apply-item-change="${i}">✓ Применить к этому продукту (остальной рецепт не менять)</button>
              <div class="ing-secondary-actions">
                <button type="button" class="share-chip ing-btn-remove" data-remove-ing="${i}">🗑 Убрать продукт из рецепта</button>
                ${baseGrams > 0 ? `<button type="button" class="share-chip ing-btn-swap-only" data-apply-scale-all="${i}" title="Масштабировать все остальные продукты рецепта пропорционально введённому весу">⚖ Масштабировать весь рецепт под этот вес</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      return `<li class="ingredient-item" id="ing-row-${i}">
        <div class="ing-row-main">
          <input type="checkbox" id="ing-${i}" data-check="${i}" ${checks.has(i) ? 'checked' : ''}>
          <label for="ing-${i}">
            <span class="checkbox-ui" aria-hidden="true"></span>
            <span class="ingredient-copy">
              <span class="ing-name">${esc(x.name)}</span>
              <span class="ing-amount" data-amount="${i}"></span>
            </span>
          </label>
          <div class="ing-row-btns">
            <button type="button" class="ing-scale-trigger ${isSwapped ? 'swapped' : ''}" data-scale-ing="${i}" title="Изменить вес этого продукта или заменить на свой">${btnLabel}</button>
            <button type="button" class="ing-remove-quick-btn" data-remove-ing="${i}" title="Убрать этот продукт из рецепта">✕</button>
          </div>
        </div>
        <div class="ing-scale-popover ing-swap-popover" id="ing-pop-${i}" ${activeScaleIngIdx === i ? '' : 'hidden'}>
          ${popoverContent}
        </div>
      </li>`;
    }).join('');

    document.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', () => {
      const id = Number(input.dataset.check);
      if (input.checked) checks.add(id); else checks.delete(id);
      updateProgress();
    }));

    /* Live placeholder update when typing a new product name inside ingredient popover */
    document.querySelectorAll('[data-ing-name-idx]').forEach(nameInp => {
      nameInp.addEventListener('input', () => {
        const idx = Number(nameInp.dataset.ingNameIdx);
        const baseIng = baseVariant.ingredients[idx];
        if (!baseIng) return;
        const typed = nameInp.value.trim();
        const inferred = typed ? inferBaselineNutrition(typed) : inferBaselineNutrition(baseIng.name);
        const kcalEl = document.getElementById(`ing-custom-kcal-${idx}`);
        const pEl = document.getElementById(`ing-custom-p-${idx}`);
        const fEl = document.getElementById(`ing-custom-f-${idx}`);
        const cEl = document.getElementById(`ing-custom-c-${idx}`);
        const hintEl = document.getElementById(`ing-macro-hint-${idx}`);
        if (kcalEl) kcalEl.placeholder = String(inferred.kcal);
        if (pEl) pEl.placeholder = String(inferred.p);
        if (fEl) fEl.placeholder = String(inferred.f);
        if (cEl) cEl.placeholder = String(inferred.c);
        if (hintEl && typed) {
          hintEl.textContent = `Авто-оценка на 100 г для «${typed}»: ~${fmt(inferred.kcal)} ккал · Б ${fmt(inferred.p)} · Ж ${fmt(inferred.f)} · У ${fmt(inferred.c)} (или впишите свои цифры с пачки)`;
        }
      });
    });

    document.querySelectorAll('[data-scale-ing]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const idx = Number(btn.dataset.scaleIng);
        activeScaleIngIdx = activeScaleIngIdx === idx ? null : idx;
        document.querySelectorAll('.ing-scale-popover:not(#add-ing-popover)').forEach(pop => {
          pop.hidden = pop.id !== `ing-pop-${activeScaleIngIdx}`;
        });
        if (activeScaleIngIdx !== null) {
          const inp = document.getElementById(`ing-input-${activeScaleIngIdx}`);
          if (inp && !window.matchMedia?.('(max-width: 760px)').matches) {
            inp.focus();
            inp.select();
          }
        }
      });
    });

    document.querySelectorAll('[data-reset-swap]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.resetSwap);
        delete activeSwaps[idx];
        variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
        activeScaleIngIdx = null;
        renderVariant();
        showToast('Возвращён исходный продукт рецепта');
      });
    });

    document.querySelectorAll('[data-remove-ing]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.removeIng);
        const baseIng = baseVariant.ingredients[idx];
        if (!baseIng) return;
        activeSwaps[idx] = { id: 'removed', removed: true, name: baseIng.name, shortName: baseIng.name, grams: 0, kcal: 0, p: 0, f: 0, c: 0 };
        variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
        activeScaleIngIdx = null;
        renderVariant();
        showToast(`Убрано из рецепта: «${baseIng.name.split('(')[0].trim()}» (КБЖУ пересчитано)`);
      });
    });

    document.querySelectorAll('[data-delete-added]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteAdded;
        customAddedIngredients = customAddedIngredients.filter(it => it.id !== id);
        variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
        renderVariant();
        showToast('Добавленный продукт удалён из рецепта');
      });
    });

    /* Primary action: Change ONLY this ingredient's weight and/or product without scaling other ingredients */
    function applySingleItemChange(idx) {
      const baseIng = baseVariant.ingredients[idx];
      if (!baseIng) return;
      const baseGrams = getIngredientGrams(baseIng.amount);
      const baseMacro = baseGrams > 0 ? inferBaselineNutrition(baseIng.name) : { kcal: 0, p: 0, f: 0, c: 0 };
      const rawWeight = document.getElementById(`ing-input-${idx}`)?.value?.trim() ?? '';
      const parsedW = rawWeight !== '' ? Number(rawWeight.replace(',', '.')) : baseGrams;
      if (parsedW === 0) {
        activeSwaps[idx] = { id: 'removed', removed: true, name: baseIng.name, shortName: baseIng.name, grams: 0, kcal: 0, p: 0, f: 0, c: 0 };
        variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
        activeScaleIngIdx = null;
        renderVariant();
        showToast(`Убрано из рецепта: «${baseIng.name.split('(')[0].trim()}»`);
        return;
      }
      const newSwap = readItemChangeFromInputs(idx, baseIng, baseMacro, baseGrams);
      activeSwaps[idx] = newSwap;
      variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
      activeScaleIngIdx = null;
      renderVariant();
      showToast(`Обновлено: «${newSwap.shortName}» (${fmt(parsedW)} г) — остальные продукты не изменены!`);
    }

    document.querySelectorAll('[data-apply-item-change]').forEach(btn => {
      btn.addEventListener('click', () => applySingleItemChange(Number(btn.dataset.applyItemChange)));
    });

    /* Secondary action: Scale the ENTIRE recipe proportionally to this ingredient's weight */
    function applyScaleEntireRecipe(idx) {
      const inp = document.getElementById(`ing-input-${idx}`);
      const baseIng = baseVariant.ingredients[idx];
      const primary = extractPrimaryAmount(baseIng?.amount);
      const baseGrams = getIngredientGrams(baseIng?.amount);
      if (!inp || !(baseGrams > 0 || primary?.value > 0)) return;
      const userVal = Number(String(inp.value).replace(',', '.'));
      if (!(userVal > 0)) {
        showToast('Введите положительное число');
        return;
      }
      const baseRef = baseGrams > 0 ? baseGrams : primary.value;
      customRatio = userVal / baseRef;
      const displayName = activeSwaps[idx]?.shortName || baseIng?.name || '';
      customScaleNote = `⚖ Пропорции всего рецепта от «${displayName.split('(')[0].trim()}»: ${fmt(userVal)} г (×${fmt(customRatio)})`;
      activeScaleIngIdx = null;
      renderVariant();
      showToast(`Весь рецепт масштабирован ×${fmt(customRatio)}`);
    }

    document.querySelectorAll('[data-apply-scale-all]').forEach(btn => {
      btn.addEventListener('click', () => applyScaleEntireRecipe(Number(btn.dataset.applyScaleAll)));
    });

    document.querySelectorAll('.ing-scale-input:not(#add-ing-grams)').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const idx = Number(inp.id.replace('ing-input-', ''));
          applySingleItemChange(idx);
        }
      });
    });

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
    customRatio = null;
    customScaleNote = '';
    servings = Math.max(1, Math.min(20, n));
    updateNumbers();
  }
  document.getElementById('decrease').addEventListener('click', () => setServings(servings - 1));
  document.getElementById('increase').addEventListener('click', () => setServings(servings + 1));
  window.addEventListener('recipe:servings-change', e => setServings(Number(e.detail)));

  document.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => {
    baseVariant = r.variants.find(v => v.id === Number(b.dataset.variant)) || baseVariant;
    activeSwaps = {};
    customAddedIngredients = [];
    variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
    servings = baseVariant.baseServings;
    customRatio = null;
    customScaleNote = '';
    checks = new Set(readChecks());
    renderVariant();
    if (compareWrap && !compareWrap.hidden) renderVariantComparison();
  }));
  window.addEventListener('hashchange', () => {
    const target = r.variants.find(v => v.id === Number(location.hash.replace('#var', '')));
    if (target && target !== baseVariant) {
      baseVariant = target;
      activeSwaps = {};
      customAddedIngredients = [];
      variant = applyIngredientSwapsToVariant(baseVariant, activeSwaps, customAddedIngredients);
      servings = baseVariant.baseServings;
      customRatio = null;
      customScaleNote = '';
      checks = new Set(readChecks());
      renderVariant();
    }
  });
  document.getElementById('clear-checks').addEventListener('click', () => {
    checks.clear();
    document.querySelectorAll('[data-check]').forEach(input => input.checked = false);
    updateProgress();
  });

  /* Cooking Mode & Voice Control */
  const dialog = document.getElementById('cooking-dialog');
  const voiceBtn = document.getElementById('voice-control-btn');
  const voiceLabel = document.getElementById('voice-control-label');
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec && voiceBtn) {
    voiceBtn.hidden = false;
    voiceBtn.addEventListener('click', () => {
      if (voiceActive) {
        voiceActive = false;
        try { speechRec?.stop(); } catch {}
        voiceBtn.classList.remove('active');
        voiceLabel.textContent = 'Голос: Выкл';
        showToast('Голосовое управление выключено');
      } else {
        try {
          speechRec = new SpeechRec();
          speechRec.lang = 'ru-RU';
          speechRec.continuous = true;
          speechRec.interimResults = false;
          speechRec.onresult = (ev) => {
            const transcript = ev.results[ev.results.length - 1][0].transcript.toLocaleLowerCase('ru');
            if (/дальше|следующ|вперед/.test(transcript)) {
              if (focusIndex < variant.steps.length - 1) { focusIndex++; focusStep(); showToast('🎙 Шаг вперёд'); }
            } else if (/назад|предыдущ/.test(transcript)) {
              if (focusIndex > 0) { focusIndex--; focusStep(); showToast('🎙 Шаг назад'); }
            } else if (/таймер|время|запусти/.test(transcript)) {
              const firstTimer = document.querySelector('#focus-timers [data-timer-sec]');
              if (firstTimer) firstTimer.click();
            } else if (/пауза|стоп/.test(transcript)) {
              activeTimer.running = false;
              updateTimerUI();
              showToast('🎙 Таймер на паузе');
            }
          };
          speechRec.onend = () => {
            if (voiceActive && dialog.open) {
              try { speechRec.start(); } catch {}
            }
          };
          speechRec.start();
          voiceActive = true;
          voiceBtn.classList.add('active');
          voiceLabel.textContent = 'Голос: Слушаю…';
          showToast('🎙 Скажите «Дальше», «Назад» или «Таймер»');
        } catch {
          showToast('Не удалось запустить распознавание речи');
        }
      }
    });
  }

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
    if (voiceActive) {
      voiceActive = false;
      try { speechRec?.stop(); } catch {}
      if (voiceBtn) voiceBtn.classList.remove('active');
      if (voiceLabel) voiceLabel.textContent = 'Голос: Выкл';
    }
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
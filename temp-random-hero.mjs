const fs = require('fs');
let code = fs.readFileSync('assets/app.js', 'utf8');
const rx = /<a class="hero-cover reveal" href="caramel-cheesecake\.html">[\s\S]*?<\/a>/;
const rep = `${(() => {
  const hIdx = recipes.length ? Math.floor(Math.random() * recipes.length) : 0;
  const hRec = recipes[hIdx] || { slug: "caramel-cheesecake.html", image: "caramel-cheesecake-hero.jpg", shortTitle: "Сливочный чизкейк", category: "Десерты" };
  const hVar = hRec.variants?.find(x => x.id === hRec.defaultVariant) || hRec.variants?.[0];
  const hP100 = hVar?.per100 || hVar?.total;
  const hBadge = hP100 ? `${fmt(hP100.kcal)} ККАЛ · Б ${fmt(macro(hP100, "Белки"))} Г` : "ВКУС БАЛАНСА";
  return `<a class="hero-cover reveal" href="${esc(hRec.slug)}"><img src="${esc(hRec.image)}" alt="${esc(hRec.shortTitle)}" width="600" height="600"><span class="issue"><b>${String(hIdx + 1).padStart(2, "0")}</b>${hBadge}</span><div class="cover-label"><div><small>Рецепт на обложке · ${esc(hRec.category || "Вкус баланса")}</small><h2>${esc(hRec.shortTitle)}</h2></div><span class="round-arrow">${icon("arrow")}</span></div></a>`;
})()}`;
if (rx.test(code)) {
  fs.writeFileSync('assets/app.js', code.replace(rx, rep), 'utf8');
  console.log('RANDOM HERO OK');
} else {
  console.log('RANDOM HERO NOT FOUND');
}

/* shop.js — product cards, shop page (search / filter / sort / load more), quick view, product detail page. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const ic = AMI.icon, D = AMI.data, cfg = AMI.cfg, cat = k => D.productCategories[k].label;

  /** Reusable product card (home, shop, related products). */
  AMI.productCard = p => `
    <article class="prod reveal" data-id="${p.id}">
      <div class="prod-media"><a href="product.html?id=${p.id}" tabindex="-1" aria-hidden="true"><img src="${p.image}" alt="" width="800" height="600" loading="lazy"></a>
        <div class="pcard-badges">${p.demo ? '<span class="tag demo">Demo</span>' : ""}${p.sale ? '<span class="tag sale">Sale</span>' : ""}${p.isNew ? '<span class="tag">New</span>' : ""}</div>
        <button class="quick-btn" type="button" data-quick="${p.id}" aria-label="Quick view ${AMI.esc(p.name)}">${ic("eye")} Quick View</button></div>
      <div class="prod-body"><span class="cat">${AMI.esc(cat(p.category))}</span><h3><a href="product.html?id=${p.id}">${AMI.esc(p.name)}</a></h3><p>${AMI.esc(p.short)}</p>
        <div class="meta-line"><span>${ic("file")} ${AMI.esc(p.format)}</span><span>${ic("download")} Instant download after payment</span></div>
        <div class="price-row"><span class="price">${AMI.money(p.price)}${p.original ? `<s>${AMI.money(p.original)}</s>` : ""}</span></div>
        <div class="prod-actions"><button class="btn btn-primary btn-sm" type="button" data-add="${p.id}">${ic("cart")} Add to Cart</button><a class="btn btn-ghost btn-sm" href="product.html?id=${p.id}">Details</a></div></div>
    </article>`;

  /** Global click handling for Add to Cart / Quick view (works for any card on any page). */
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); const p = D.products.find(x => x.id === add.dataset.add); AMI.cart.add(p.id);
      // The drawer is the confirmation on normal pages; on the cart/checkout pages (no drawer) use a toast instead.
      if (AMI.$("#cart-layout, #co-layout")) AMI.toast(`${p.name} added to cart`, "success"); else setTimeout(() => AMI.openCart && AMI.openCart(), 250);
      return; }
    const buy = e.target.closest("[data-buy]");
    if (buy) { AMI.cart.add(buy.dataset.buy); location.href = "checkout.html"; return; }
    const q = e.target.closest("[data-quick]"); if (q) { e.preventDefault(); quickView(q.dataset.quick); }
  });

  /* ---------- quick view ---------- */
  let qv;
  function quickView(id) {
    const p = D.products.find(x => x.id === id); if (!p) return;
    if (!qv) { qv = document.createElement("div"); qv.className = "modal"; qv.setAttribute("role", "dialog"); qv.setAttribute("aria-modal", "true"); qv.setAttribute("aria-label", "Product quick view"); document.body.appendChild(qv); }
    qv.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal-dialog"><button class="icon-btn modal-close" type="button" data-close aria-label="Close">${ic("x")}</button>
      <div class="modal-grid"><div class="modal-media"><img src="${p.image}" alt="${AMI.esc(p.name)} preview"></div>
      <div class="modal-body"><span class="tag${p.demo ? " demo" : ""}">${p.demo ? "Demo product" : AMI.esc(cat(p.category))}</span><h2 style="margin-top:14px">${AMI.esc(p.name)}</h2>
        <div class="detail-price" style="font-size:1.7rem;margin:8px 0">${AMI.money(p.price)}${p.original ? `<s>${AMI.money(p.original)}</s>` : ""}</div><p>${AMI.esc(p.short)}</p>
        <table class="spec"><tr><th>Format</th><td>${AMI.esc(p.format)}</td></tr><tr><th>Works with</th><td>${AMI.esc(p.compat)}</td></tr><tr><th>Delivery</th><td>Download after verified payment</td></tr></table>
        ${p.available ? "" : '<div class="notice" style="margin-bottom:16px"><p><strong>Sample listing.</strong> Not available to buy yet.</p></div>'}
        <div class="flex"><button class="btn btn-primary" type="button" data-add="${p.id}" data-close>${ic("cart")} Add to Cart</button><a class="btn btn-ghost" href="product.html?id=${p.id}">Full details</a></div></div></div></div>`;
    AMI.openLayer(qv);
  }

  /* ---------- shop page ---------- */
  function shopPage() {
    const grid = AMI.$("#product-grid"); if (!grid) return;
    const chips = AMI.$("#cat-chips"), flt = AMI.$("#flt-chips"), search = AMI.$("#shop-search"), sort = AMI.$("#shop-sort"), count = AMI.$("#result-count"), more = AMI.$("#load-more");
    const hasSales = Object.keys(cfg.salesData).length > 0;
    chips.innerHTML = `<button class="chip" data-value="all" type="button">All Products</button>` + Object.entries(D.productCategories).map(([k, v]) => `<button class="chip" data-value="${k}" type="button">${AMI.esc(v.label)}</button>`).join("");
    flt.innerHTML = [["all", "Everything"], ["featured", "Featured"], ["new", "Newest"], ["sale", "On sale"], ...(hasSales ? [["best", "Best selling"]] : [])].map(([v, l]) => `<button class="chip" data-value="${v}" type="button">${l}</button>`).join("");
    const st = { cat: AMI.param("cat") || "all", flt: AMI.param("filter") || "all", q: AMI.param("q") || "" };
    search.value = st.q;
    const pager = AMI.pager(9, (list, reset) => { grid.innerHTML = list.map(AMI.productCard).join(""); AMI.observeReveal(grid); }, more);
    const apply = () => {
      let l = D.products.filter(p => (st.cat === "all" || p.category === st.cat) && (!st.q || AMI.matches(st.q, p.name, p.short, cat(p.category), p.format, p.compat))
        && (st.flt === "all" || (st.flt === "featured" && p.featured) || (st.flt === "new" && p.isNew) || (st.flt === "sale" && p.sale) || (st.flt === "best" && cfg.salesData[p.id] > 0)));
      const s = sort.value;
      l.sort((a, b) => s === "low" ? a.price - b.price : s === "high" ? b.price - a.price : s === "new" ? b.created.localeCompare(a.created) : s === "name" ? a.name.localeCompare(b.name) : (b.featured - a.featured) || b.created.localeCompare(a.created));
      count.textContent = `${l.length} product${l.length === 1 ? "" : "s"}`;
      AMI.$("#shop-empty").hidden = l.length > 0; pager.set(l);
    };
    AMI.chipGroup(chips, v => { st.cat = v; apply(); }, st.cat); AMI.chipGroup(flt, v => { st.flt = v; apply(); }, st.flt);
    search.addEventListener("input", AMI.debounce(() => { st.q = search.value.trim(); apply(); }, 150)); sort.addEventListener("change", apply);
    AMI.$("#reset-filters").addEventListener("click", () => { st.cat = st.flt = "all"; st.q = ""; search.value = ""; AMI.$("[data-value=all]", chips).click(); AMI.$("[data-value=all]", flt).click(); });
  }

  /* ---------- product detail page ---------- */
  function productPage() {
    const root = AMI.$("#product-root"); if (!root) return;
    const p = D.products.find(x => x.id === AMI.param("id"));
    if (!p) { root.innerHTML = `<div class="empty-state">${ic("package")}<h2>Product not found</h2><p>That product doesn't exist or was removed.</p><a class="btn btn-primary" href="shop.html">Back to the shop</a></div>`; document.title = "Product not found | AI MANGA INDIA"; return; }
    const gallery = [p.image, `assets/products/${p.id}-2.svg`, `assets/products/${p.id}-3.svg`];
    document.title = `${p.name} | AI MANGA INDIA Digital Shop`;
    const setMeta = (sel, v) => { const m = AMI.$(sel); m && m.setAttribute("content", v); };
    setMeta('meta[name="description"]', `${p.short} ${p.format} · ${AMI.money(p.price)} · Digital download from AI MANGA INDIA.`);
    setMeta('meta[property="og:title"]', document.title); setMeta('meta[property="og:image"]', new URL(p.image, location.href).href);
    const canon = AMI.$('link[rel="canonical"]'); canon && (canon.href = `${cfg.siteUrl}/product.html?id=${p.id}`);
    AMI.$("#crumb-cat").textContent = cat(p.category); AMI.$("#crumb-cat").href = `shop.html?cat=${p.category}`; AMI.$("#crumb-name").textContent = p.name;
    const specs = [["Format", p.format], ["Files included", p.files ? `${p.files}${p.demo ? " (sample)" : ""}` : "—"], ["File size", p.size], ["Resolution / dimensions", p.resolution || "Not applicable"], ["Software compatibility", p.compat], ["Usage licence", p.license]];
    root.innerHTML = `
      <div class="detail"><div><div class="gallery-main"><img id="g-main" src="${gallery[0]}" alt="${AMI.esc(p.name)} — preview 1" width="800" height="600"></div>
        <div class="thumbs" role="group" aria-label="Preview gallery">${gallery.map((g, i) => `<button type="button" class="${i ? "" : "active"}" data-g="${g}" data-i="${i + 1}" aria-label="Show preview ${i + 1}"><img src="${g}" alt="" loading="lazy"></button>`).join("")}</div>
        ${p.demo ? '<p style="font-size:.82rem;margin-top:10px;color:var(--text-3)">Previews are generated sample artwork for demonstration.</p>' : ""}</div>
      <div class="detail-info"><div class="flex" style="margin-bottom:14px"><a class="tag" href="shop.html?cat=${p.category}">${AMI.esc(cat(p.category))}</a>${p.demo ? '<span class="tag demo">Demo product</span>' : ""}${p.sale ? '<span class="tag sale">Sale</span>' : ""}${p.isNew ? '<span class="tag">New</span>' : ""}</div>
        <h1>${AMI.esc(p.name)}</h1><p>${AMI.esc(p.short)}</p>
        <div class="detail-price">${AMI.money(p.price)}${p.original ? `<s>${AMI.money(p.original)}</s>` : ""}</div>
        ${p.available ? "" : '<div class="notice" style="margin-bottom:20px"><p><strong>Sample listing.</strong> This product demonstrates the store design and isn\'t available to buy yet. Contents and specs shown are placeholders.</p></div>'}
        <div class="flex"><button class="btn btn-primary" type="button" data-add="${p.id}">${ic("cart")} Add to Cart</button><button class="btn btn-ghost" type="button" data-buy="${p.id}">Buy Now</button></div>
        <ul class="include-list" style="margin-top:26px"><li>${ic("lock")} Secure checkout · download unlocked after verified payment</li><li>${ic("download")} Personal, expiring download links</li><li>${ic("shield")} <a href="license.html" style="text-decoration:underline">Licence information</a> · <a href="refund.html" style="text-decoration:underline">Refund policy</a></li></ul></div></div>
      <div class="grid grid-2 mt-3" style="gap:48px;margin-top:72px;align-items:start">
        <div><h2>Description</h2><p>${AMI.esc(p.long)}</p><h3 style="margin-top:28px">What's included</h3><ul class="include-list">${p.includes.map(i => `<li>${ic("check")} ${AMI.esc(i)}</li>`).join("")}</ul></div>
        <div><h2>Specifications</h2><table class="spec">${specs.map(([k, v]) => `<tr><th>${k}</th><td>${AMI.esc(v)}</td></tr>`).join("")}</table></div></div>
      <div style="margin-top:56px;max-width:820px"><h2>Customer FAQs</h2>${p.faq.map(f => `<details class="acc"><summary>${AMI.esc(f.q)}${ic("plus")}</summary><div class="acc-body"><p>${AMI.esc(f.a)}</p></div></details>`).join("")}</div>`;
    root.addEventListener("click", e => { const t = e.target.closest("[data-g]"); if (!t) return; const m = AMI.$("#g-main"); m.src = t.dataset.g; m.alt = `${p.name} — preview ${t.dataset.i}`; AMI.$$(".thumbs button", root).forEach(b => b.classList.toggle("active", b === t)); });
    const rel = D.products.filter(x => x.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 4);
    AMI.$("#related").innerHTML = rel.map(AMI.productCard).join(""); AMI.observeReveal(); AMI.lazy();
    // structured data: breadcrumb always; Product/Offer ONLY for real, purchasable products
    const ld = [{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [["Home", "index.html"], ["Digital Shop", "shop.html"], [p.name, `product.html?id=${p.id}`]].map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: `${cfg.siteUrl}/${u}` })) }];
    if (p.available && !p.demo) ld.push({ "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.short, image: new URL(p.image, location.href).href, brand: { "@type": "Brand", name: cfg.siteName }, offers: { "@type": "Offer", price: p.price, priceCurrency: cfg.currency, availability: "https://schema.org/InStock", url: `${cfg.siteUrl}/product.html?id=${p.id}` } });
    const s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
  }

  AMI.onReady(() => {
    shopPage(); productPage();
    const feat = AMI.$("#home-products"); if (feat) { feat.innerHTML = D.products.filter(p => p.featured).slice(0, 4).map(AMI.productCard).join(""); AMI.observeReveal(feat); }
  });
})();

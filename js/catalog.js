/* catalog.js — renders the multi-page Services system from data/catalog.json:
     /services                  all services (filterable cards)
     /services/<slug>           one service: its products (offerings), packages, portfolio, FAQ
     /product/<slug>            one offering: gallery, description, deliverables, specs, licence, related
   The static HTML pages (built by tools/build_pages.py) already contain the title, meta tags and a plain-text fallback;
   this script replaces that fallback with the full interactive page. Edit data/catalog.json — not this file — to change content. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const { $, $$, esc, icon: ic } = AMI;
  const D = AMI.data;
  /* shared service card (All Services page + homepage) */
  AMI.svcTile = s => `<a class="svc-tile reveal" href="/services/${s.slug}" data-g="${s.group}" aria-label="${esc(s.title)} — explore service">
      <span class="svc-tile-img"><img src="${s.image}" alt="${esc(s.imageAlt)}" width="640" height="400" loading="lazy"><span class="icon-wrap">${ic(s.icon)}</span></span>
      <span class="svc-tile-body"><span class="svc-num">SERVICE ${s.num}</span><h3>${esc(s.title)}</h3><p>${esc(s.short)}</p>
      <ul>${s.highlights.slice(0, 4).map(i => `<li>${ic("check")}<span>${esc(i)}</span></li>`).join("")}</ul>
      <span class="meta">${s.offerings.length} offerings</span><span class="svc-go">Explore Service ${ic("arrow-right")}</span></span></a>`;

  /* homepage: the "Services" section is filled from the same catalog, so it always matches the /services page */
  AMI.onReady(() => {
    const home = $("#home-services"); if (!home) return;
    AMI.loadCatalog().then(cat => { home.innerHTML = cat.services.map(AMI.svcTile).join(""); AMI.hydrateIcons(home); AMI.lazy(home); AMI.observeReveal(home); })
      .catch(() => { home.innerHTML = `<p class="state-box" style="grid-column:1/-1">Our services list couldn't load. <a href="/services" style="text-decoration:underline">Open the Services page</a> or <a href="contact.html" style="text-decoration:underline">contact us</a>.</p>`; });
  });
  const main = $("#main"), root = $("#view");
  if (!main || !root) return;
  const view = main.dataset.view, slug = main.dataset.slug;
  const OLD = { video: "ai-video-production", ads: "ai-video-advertising", graphic: "graphic-design", art: "digital-art", manga: "manga-character-design", custom: "custom-creative-services", packages: "custom-creative-services" };
  const POS = ["50% 50%", "25% 40%", "75% 60%", "50% 20%", "20% 70%", "80% 30%"];

  const contactHref = (s, topic) => `contact.html?service=${encodeURIComponent(s.value)}${topic ? "&topic=" + encodeURIComponent(topic) : ""}`;
  const crumbs = items => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([n, u], i) => (i < items.length - 1 ? `<a href="${u}">${esc(n)}</a><span aria-hidden="true">/</span>` : `<span>${esc(n)}</span>`)).join("")}</nav>`;
  const priceText = o => (typeof o.price === "number" ? `From ${AMI.money(o.price)}` : "Quote on request");
  const kindLabel = o => ({ service: "Custom service", "custom-package": "Custom package", quote: "Project request" }[o.kind] || "Custom service");
  const art = s => { // illustrative images only: the service cover plus related portfolio samples (clearly labelled)
    const keys = s.portfolio && s.portfolio.length ? s.portfolio : null;
    const proj = D.projects.filter(p => !keys || keys.includes(p.category)).map(p => p.image);
    return [s.image, ...proj].filter((v, i, a) => a.indexOf(v) === i);
  };

  /* ---------- states ---------- */
  const show = html => { root.innerHTML = html; AMI.hydrateIcons(root); AMI.lazy(root); AMI.observeReveal(root); };
  const skeleton = () => `<div class="skeleton sk-hero" role="status" aria-label="Loading"></div><div class="sk-row"><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div></div>`;
  const shell = inner => `<section class="svc-hero"><div class="container">${inner}</div></section>`;
  const errorView = () => show(shell(`${crumbs([["Home", "index.html"], ["Services", "/services"]])}<div class="state-box"><h1 style="font-size:1.6rem;text-transform:none">We couldn't load this page.</h1>
    <p>Something went wrong while loading the service list. Check your connection and try again, or contact us directly.</p>
    <div class="flex" style="justify-content:center"><button class="btn btn-primary" type="button" id="retry">Try again</button><a class="btn btn-ghost" href="contact.html">Contact us</a></div></div>`));
  const notFound = what => { document.title = "Page not found | AI MANGA INDIA"; show(shell(`${crumbs([["Home", "index.html"], ["Services", "/services"]])}<div class="state-box"><h1 style="font-size:1.6rem;text-transform:none">${esc(what)} not found.</h1>
    <p>That page doesn't exist or has been moved. You can browse every service from the Services page.</p><a class="btn btn-primary" href="/services">Browse all services</a></div>`)); };

  /* ---------- shared blocks ---------- */
  const faqBlock = (faqs, title = "Frequently asked questions") => `<div class="block-title"><h2>${title}</h2></div>${faqs.map(([q, a]) => `<details class="acc"><summary>${esc(q)}${ic("plus")}</summary><div class="acc-body"><p>${esc(a)}</p></div></details>`).join("")}`;
  const ctaBand = (s, heading, text) => `<div class="svc-cta reveal"><div><h2>${esc(heading)}</h2><p>${esc(text)}</p></div>
    <div class="flex"><a class="btn btn-primary" href="${s ? contactHref(s) : "contact.html"}">Start a project ${ic("arrow-right")}</a><a class="btn btn-ghost" href="shop.html">Digital Shop</a></div></div>`;
  const relatedServices = (cat, s) => {
    const others = cat.services.filter(x => x.slug !== s.slug).sort((a, b) => (b.group === s.group) - (a.group === s.group)).slice(0, 3);
    return `<div class="block-title"><h2>Related services</h2></div><div class="related-grid">${others.map(x => `<a class="related-tile" href="/services/${x.slug}"><span class="icon-wrap">${ic(x.icon)}</span><div><h3>${esc(x.title)}</h3><p>${x.offerings.length} offerings</p></div></a>`).join("")}</div>`;
  };

  /* ---------- /services ---------- */
  function allServices(cat) {
    const h = location.hash.slice(1); if (OLD[h]) { location.replace("/services/" + OLD[h]); return; } // old #video-style links
show(`<section class="svc-hero"><div class="container">${crumbs([["Home", "index.html"], ["Services", "/services"]])}
      <span class="eyebrow">Explore our services</span><h1>Explore Our Creative Services</h1>
      <p class="lead">Discover creative solutions designed to bring your ideas to life. From cinematic AI videos to professional graphic design, explore our services and find the perfect solution for your vision.</p>
      <div class="flex" style="margin-top:26px"><a class="btn btn-primary" href="#all-services">Browse services ${ic("arrow-right")}</a><a class="btn btn-ghost" href="contact.html">Start a Project</a></div></div></section>
      <section class="section" id="all-services" style="padding-top:56px"><div class="container">
        <div class="svc-filter"><div class="chips" role="group" aria-label="Filter services">${cat.groups.map((g, i) => `<button class="chip" type="button" data-g="${g.id}" aria-pressed="${i === 0}">${esc(g.label)}</button>`).join("")}</div><span class="svc-count" id="svc-count" aria-live="polite"></span></div>
        <div class="svc-grid" id="svc-grid">${cat.services.map(AMI.svcTile).join("")}</div>
        <p class="state-box" id="svc-empty" hidden>No services match this filter.</p>
      </div></section>
      <section class="section alt" style="padding:56px 0"><div class="container">${ctaBand(null, "Don't see exactly what you need?", "Describe your idea and we'll tell you honestly whether we can deliver it, what it involves, and quote it in writing before any work starts.")}</div></section>`);
    const count = () => { const n = $$("#svc-grid .svc-tile:not([hidden])").length; $("#svc-count").textContent = `${n} service${n === 1 ? "" : "s"}`; $("#svc-empty").hidden = n > 0; };
    $$(".svc-filter .chip").forEach(b => b.addEventListener("click", () => { $$(".svc-filter .chip").forEach(x => x.setAttribute("aria-pressed", x === b));
      $$("#svc-grid .svc-tile").forEach(t => { t.hidden = !(b.dataset.g === "all" || t.dataset.g === b.dataset.g); }); count(); }));
    count();
  }

  /* ---------- /services/<slug> ---------- */
  function servicePage(cat) {
    const s = cat.services.find(x => x.slug === slug); if (!s) return notFound("Service");
    const pool = art(s);
    const offer = (o, i) => `<article class="offer-card reveal"><a class="offer-img" href="/product/${o.slug}" tabindex="-1" aria-hidden="true"><img src="${pool[i % pool.length]}" alt="" width="640" height="400" loading="lazy" style="object-position:${POS[i % POS.length]}"><span class="tag">${kindLabel(o)}</span></a>
      <div class="offer-body"><h3><a href="/product/${o.slug}">${esc(o.title)}</a></h3><p>${esc(o.short)}</p><div class="price-line">${priceText(o)} <small>${typeof o.price === "number" ? "" : "· priced per project"}</small></div>
      <div class="offer-actions"><a class="btn btn-ghost btn-sm" href="/product/${o.slug}">View Details</a><a class="btn btn-primary btn-sm" href="${contactHref(s, o.title)}">Request Service</a></div></div></article>`;
    const pkgs = s.packages.length ? `<div class="pkg-grid">${s.packages.map(p => `<article class="pkg-card"><span class="tag">${esc(p.tier || "Package")}</span><h3>${esc(p.title)}</h3>
        <div class="price-line">${typeof p.price === "number" ? AMI.money(p.price) : "Quote on request"}${p.delivery ? ` <small>· ${esc(p.delivery)}</small>` : ""}</div>
        <ul>${(p.features || []).map(f => `<li>${ic("check")}<span>${esc(f)}</span></li>`).join("")}</ul><a class="btn btn-primary btn-sm" href="${contactHref(s, p.title)}">Request this package</a></article>`).join("")}</div>`
      : `<div class="state-box"><h3>No fixed packages published yet</h3><p>Packages for ${esc(s.title)} are put together individually. Tell us what you need and your budget, and we'll propose a package in writing.</p><a class="btn btn-primary" href="${contactHref(s, "Custom package")}">Ask for a custom package</a></div>`;
    const projects = (s.portfolio.length ? D.projects.filter(p => s.portfolio.includes(p.category)) : Object.keys(D.portfolioCategories).map(k => D.projects.find(p => p.category === k))).filter(Boolean).slice(0, 3);
    show(`<section class="svc-hero"><div class="container svc-hero-grid"><div>${crumbs([["Home", "index.html"], ["Services", "/services"], [s.title, "/services/" + s.slug]])}
        <span class="eyebrow">Service ${s.num}</span><h1>${esc(s.title)}</h1><p class="lead">${esc(s.lead)}</p>
        <ul class="benefit-list">${s.highlights.map(h => `<li>${ic("check")}${esc(h)}</li>`).join("")}</ul>
        <div class="flex"><a class="btn btn-primary" href="#products">Explore Products &amp; Packages ${ic("arrow-right")}</a><a class="btn btn-ghost" href="${contactHref(s)}">Request a Custom Project</a></div>
        <a class="back-link" href="/services">${ic("arrow-right")} Back to all services</a></div>
      <div class="svc-hero-media"><img src="${s.image}" alt="${esc(s.imageAlt)}" width="800" height="600"><span class="art-note">Illustrative artwork</span></div></div></section>
      <section class="section" style="padding-bottom:40px"><div class="container"><div class="info-grid">
        <div class="info-card reveal"><h3>What this service offers</h3><p>${esc(s.intro.offers)}</p></div><div class="info-card reveal"><h3>Who it's for</h3><p>${esc(s.intro.who)}</p></div>
        <div class="info-card reveal"><h3>Types of solutions</h3><p>${esc(s.intro.types)}</p></div><div class="info-card reveal"><h3>What to expect</h3><p>${esc(s.intro.expect)}</p></div></div></div></section>
      <section class="section" id="products" style="padding-top:40px"><div class="container">
        <div class="block-title"><h2>Individual products</h2><span>${s.offerings.length} offerings · made to order</span></div>
        ${s.offerings.length ? `<div class="offer-grid">${s.offerings.map(offer).join("")}</div>` : `<div class="state-box"><h3>Nothing listed here yet</h3><p>We're still adding offerings for this service. You can still describe what you need.</p><a class="btn btn-primary" href="${contactHref(s)}">Request a custom project</a></div>`}
        <div class="block-title" style="margin-top:64px"><h2>Service packages</h2><span>Packages are only shown once they are created</span></div>${pkgs}</div></section>
      ${projects.length ? `<section class="section alt" style="padding:64px 0"><div class="container"><div class="block-title"><h2>Portfolio examples</h2><a class="btn btn-ghost btn-sm" href="portfolio.html">View portfolio</a></div>
        <div class="mini-grid">${projects.map(p => `<a class="mini-p reveal" href="portfolio.html?project=${p.id}"><img src="${p.image}" alt="${esc(p.title)}" width="640" height="480" loading="lazy"><div><span class="tag ${p.demo ? "demo" : p.type}">${p.demo ? "Demo" : p.type === "client" ? "Client project" : "Personal concept"}</span><h3>${esc(p.title)}</h3></div></a>`).join("")}</div>
        <p style="font-size:.85rem;color:var(--text-3);margin-top:18px">Portfolio entries are clearly labelled. Demo items are placeholders until real work is added.</p></div></section>` : ""}
      <section class="section" style="padding:64px 0"><div class="container two-col"><div><div class="block-title"><h2>What we need from you</h2></div><ul class="req-list">${s.requirements.map(r => `<li>${ic("check")}<span>${esc(r)}</span></li>`).join("")}</ul></div>
        <div>${faqBlock(s.faqs)}</div></div></section>
      <section class="section alt" style="padding:56px 0"><div class="container">${ctaBand(s, "Have a custom project in mind?", `Tell us about your ${s.title.toLowerCase()} idea. We'll reply with questions or a written proposal.`)}</div></section>
      <section class="section" style="padding:56px 0 72px"><div class="container">${relatedServices(cat, s)}
        <p style="margin-top:28px">Questions? Email <a style="text-decoration:underline" href="mailto:${esc(AMI.cfg.contactEmail)}">${esc(AMI.cfg.contactEmail)}</a> or use the <a style="text-decoration:underline" href="contact.html">contact form</a>.</p></div></section>`);
  }

  /* ---------- /product/<slug> ---------- */
  function productPage(cat) {
    let s, o; for (const x of cat.services) { const f = x.offerings.find(p => p.slug === slug); if (f) { s = x; o = f; break; } }
    if (!o) return notFound("Product");
    const pool = art(s).slice(0, 4), idx = s.offerings.indexOf(o), related = s.offerings.filter(p => p !== o).slice(0, 3);
    const specs = [["Service", `<a href="/services/${s.slug}" style="text-decoration:underline">${esc(s.title)}</a>`], ["Type", kindLabel(o)], ["Price", priceText(o) + (typeof o.price === "number" ? "" : " — agreed per project")],
      ["Delivery time", "Agreed per project"], ["File formats", esc(s.formats)], ["Revisions", "Defined in your written quote"], ["Licence", "Stated in your written quote"]];
    show(`<section class="svc-hero" style="padding-bottom:48px"><div class="container">${crumbs([["Home", "index.html"], ["Services", "/services"], [s.title, "/services/" + s.slug], [o.title, "/product/" + o.slug]])}
      <div class="pd"><div><div class="pd-main"><img id="pd-img" src="${pool[idx % pool.length]}" alt="Illustrative artwork for ${esc(o.title)}" width="800" height="600" style="object-position:${POS[idx % POS.length]}"><span class="art-note">Illustrative artwork — not a sample of this exact service</span></div>
        <div class="pd-thumbs" role="group" aria-label="Preview images">${pool.map((p, i) => `<button type="button" aria-pressed="${i === idx % pool.length}" aria-label="Show preview ${i + 1}" data-src="${p}"><img src="${p}" alt="" loading="lazy"></button>`).join("")}</div></div>
        <div class="pd-info"><span class="tag">${kindLabel(o)}</span><h1>${esc(o.title)}</h1><p class="lead">${esc(o.short)}</p>
          <div class="pd-price"><strong>${priceText(o)}</strong><span>${typeof o.price === "number" ? "Final price depends on scope — confirmed in writing before work starts." : "Price depends on scope, length and intended use. You'll get a written quote before any work starts."}</span></div>
          <div class="pd-actions"><a class="btn btn-primary" href="${contactHref(s, o.title)}">Request This Service ${ic("arrow-right")}</a><a class="btn btn-ghost" href="${contactHref(s, "Quote: " + o.title)}">Get a Custom Quote</a><a class="btn btn-ghost" href="mailto:${esc(AMI.cfg.contactEmail)}?subject=${encodeURIComponent("Inquiry: " + o.title)}">Contact Us</a></div>
          <p style="font-size:.85rem;color:var(--text-3);margin-top:14px">This is a made-to-order service, so it's requested by inquiry rather than bought in a cart.</p>
          <a class="back-link" href="/services/${s.slug}">${ic("arrow-right")} Back to ${esc(s.title)}</a></div></div></div></section>
      <section class="section" style="padding:56px 0"><div class="container two-col">
        <div><div class="block-title"><h2>About this service</h2></div><p>${esc(o.short)} ${esc(s.intro.expect)}</p>
          <div class="block-title" style="margin-top:36px"><h2>What you can request</h2></div><ul class="check-list">${o.includes.map(i => `<li>${ic("check")}<span>${esc(i)}</span></li>`).join("")}<li>${ic("check")}<span>Exact deliverables, formats and revision rounds are listed in your written quote.</span></li></ul></div>
        <div><div class="block-title"><h2>Specifications</h2></div><table class="svc-spec"><tbody>${specs.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>
          <div class="license-box" style="margin-top:28px"><h3>${ic("info")} Licence &amp; usage</h3><p style="margin:0">Usage rights (personal or commercial) for custom work are stated in writing in your quote. Please tell us how you plan to use the result. See the general <a href="license.html" style="text-decoration:underline">License Policy</a>.</p></div></div></div></section>
      <section class="section alt" style="padding:56px 0"><div class="container two-col"><div><div class="block-title"><h2>How it works</h2></div><ol class="steps-mini">
        <li><span><strong>Discover</strong> — you send your idea and requirements.</span></li><li><span><strong>Concept</strong> — we propose a direction and a written quote.</span></li><li><span><strong>Create</strong> — we produce the work once the quote is agreed.</span></li>
        <li><span><strong>Refine</strong> — you review and we make the agreed changes.</span></li><li><span><strong>Deliver</strong> — approved files are delivered in the agreed formats.</span></li></ol></div>
        <div>${faqBlock([...s.faqs, ["Can I buy this directly online?", "This service is made to order, so you request it through an inquiry. Ready-made downloadable products are available in the Digital Shop."]])}</div></div></section>
      <section class="section" style="padding:56px 0 72px"><div class="container"><div class="block-title"><h2>Related products</h2><a class="btn btn-ghost btn-sm" href="/services/${s.slug}">See all in ${esc(s.title)}</a></div>
        <div class="offer-grid">${related.map((p, i) => `<article class="offer-card"><a class="offer-img" href="/product/${p.slug}" tabindex="-1" aria-hidden="true"><img src="${pool[(i + 1) % pool.length]}" alt="" width="640" height="400" loading="lazy" style="object-position:${POS[(i + 2) % POS.length]}"><span class="tag">${kindLabel(p)}</span></a>
          <div class="offer-body"><h3><a href="/product/${p.slug}">${esc(p.title)}</a></h3><p>${esc(p.short)}</p><div class="price-line">${priceText(p)}</div><div class="offer-actions"><a class="btn btn-ghost btn-sm" href="/product/${p.slug}">View Details</a><a class="btn btn-primary btn-sm" href="${contactHref(s, p.title)}">Request Service</a></div></div></article>`).join("")}</div></div></section>`);
    $$(".pd-thumbs button").forEach(b => b.addEventListener("click", () => { $("#pd-img").src = b.dataset.src; $$(".pd-thumbs button").forEach(x => x.setAttribute("aria-pressed", x === b)); }));
  }

  /* ---------- boot ---------- */
  async function start() {
    const timer = setTimeout(() => { root.innerHTML = skeleton(); }, 350); // only show the skeleton if loading is slow
    try {
      const cat = await AMI.loadCatalog(); clearTimeout(timer);
      ({ services: allServices, service: servicePage, product: productPage }[view] || (() => notFound("Page")))(cat);
    } catch (e) { clearTimeout(timer); errorView(); const r = $("#retry"); r && r.addEventListener("click", () => { root.innerHTML = skeleton(); start(); }); }
  }
  AMI.onReady(start);
})();

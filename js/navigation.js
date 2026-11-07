/* navigation.js — builds the shared header, mobile menu, search dialog, newsletter band and footer
   so every page stays consistent (edit links here once). Pages only contain
   <div id="site-header"></div> and <div id="site-footer"></div>. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const cfg = AMI.cfg, ic = AMI.icon;
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const LINKS = [
    ["Home", "index.html", ["index.html", ""]], ["Portfolio", "portfolio.html", ["portfolio.html"]], ["Services", "services.html", ["services.html"]],
    ["Digital Shop", "shop.html", ["shop.html", "product.html", "cart.html", "checkout.html"]], ["About", "about.html", ["about.html"]], ["Contact", "contact.html", ["contact.html"]]
  ];
  const current = ([, , m]) => (m.includes(page) ? ' aria-current="page"' : "");

  const socialLinks = () => ["youtube", "instagram", "linkedin", "pinterest"].filter(k => cfg.social[k])
    .map(k => `<a href="${AMI.esc(cfg.social[k])}" target="_blank" rel="noopener noreferrer" aria-label="${k[0].toUpperCase() + k.slice(1)}">${ic(k)}</a>`).join("");

  const headerHTML = () => `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header"><div class="container nav">
      <a class="brand" href="index.html" aria-label="AI MANGA INDIA — home"><img src="assets/logos/logo-mark.svg" alt="" width="38" height="38"><span class="brand-text">AI MANGA<small>INDIA</small></span></a>
      <nav aria-label="Primary"><ul class="nav-links">${LINKS.map(l => `<li><a href="${l[1]}"${current(l)}>${l[0]}</a></li>`).join("")}</ul></nav>
      <div class="nav-actions">
        <button class="icon-btn" id="open-search" type="button" aria-label="Search">${ic("search")}</button>
        <button class="icon-btn" id="open-cart" type="button" aria-label="Open cart">${ic("cart")}<span class="badge-count" data-n="0" aria-live="polite">0</span></button>
        <a class="btn btn-primary btn-sm btn-start" href="contact.html">Start a Project</a>
        <button class="icon-btn menu-toggle" id="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button>
      </div></div></header>
    <div class="mobile-nav" id="mobile-nav" aria-hidden="true">
      ${LINKS.map(l => `<a class="m-link" href="${l[1]}"${current(l)}>${l[0]}</a>`).join("")}
      <a class="m-link" href="faq.html">FAQ</a><a class="m-link" href="account.html">My Account</a>
      <a class="btn btn-primary" href="contact.html">Start a Project</a>
      <div class="socials" style="margin-top:24px">${socialLinks()}</div>
    </div>
    <div class="modal search-modal" id="search-modal" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true">
      <div class="modal-backdrop" data-close></div>
      <div class="modal-dialog"><label class="sr-only" for="site-search">Search the site</label>
        <div class="search-box">${ic("search")}<input id="site-search" class="control" type="search" placeholder="Search products, projects, services…" autocomplete="off" style="width:100%"></div>
        <div class="search-results" id="search-results" aria-live="polite"></div></div>
    </div>`;

  const footerHTML = () => `
    <section class="newsletter" aria-labelledby="nl-h"><div class="container newsletter-inner">
      <div><h2 id="nl-h">Stay ahead of the <span class="grad-text">creative future.</span></h2>
        <p>Get updates on exclusive digital products, creative resources, new releases, and AI-powered inspiration.</p></div>
      <div><form class="nl-form" data-newsletter novalidate>
        <label class="sr-only" for="nl-email">Email address</label>
        <input class="control" id="nl-email" name="email" type="email" placeholder="Your email address" autocomplete="email" required>
        <input class="hp" type="text" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn btn-primary" type="submit">Subscribe</button></form>
        <p class="form-status" role="status" data-nl-status></p>
        <p style="font-size:.8rem;margin:10px 0 0;color:var(--text-3)">No spam. Unsubscribe any time. See our <a href="privacy.html" style="text-decoration:underline">Privacy Policy</a>.</p></div>
    </div></section>
    <footer class="site-footer"><div class="container">
      <div class="footer-grid">
        <div><a class="brand" href="index.html"><img src="assets/logos/logo-mark.svg" alt="" width="38" height="38"><span class="brand-text">AI MANGA<small>INDIA</small></span></a>
          <p style="margin-top:18px;max-width:280px">Imagine Beyond Limits. Create Beyond Reality.</p><div class="socials">${socialLinks()}</div></div>
        <nav aria-label="Explore"><h4>Explore</h4><ul><li><a href="index.html">Home</a></li><li><a href="portfolio.html">Portfolio</a></li><li><a href="services.html">Services</a></li><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li></ul></nav>
        <nav aria-label="Digital store"><h4>Digital Store</h4><ul>
          ${Object.entries(AMI.data.productCategories).map(([k, v]) => `<li><a href="shop.html?cat=${k}">${AMI.esc(v.label)}</a></li>`).join("")}</ul></nav>
        <nav aria-label="Customer support"><h4>Customer Support</h4><ul><li><a href="contact.html">Contact</a></li><li><a href="faq.html">FAQs</a></li><li><a href="license.html">License Information</a></li><li><a href="refund.html">Refund Policy</a></li><li><a href="terms.html">Terms &amp; Conditions</a></li><li><a href="privacy.html">Privacy Policy</a></li></ul></nav>
        <nav aria-label="Account"><h4>My Account</h4><ul><li><a href="account.html">Orders &amp; Downloads</a></li><li><a href="cart.html">Cart</a></li><li><a href="checkout.html">Checkout</a></li></ul></nav>
      </div>
      <div class="footer-bottom"><p>© 2026 AI MANGA INDIA. All Rights Reserved.</p><p>Imagine Beyond Limits. Create Beyond Reality.</p></div>
    </div></footer>`;

  function search() {
    const modal = AMI.$("#search-modal"), input = AMI.$("#site-search"), out = AMI.$("#search-results");
    AMI.$("#open-search").addEventListener("click", () => { AMI.openLayer(modal); input.value = ""; out.innerHTML = ""; });
    const run = () => {
      const q = input.value.trim(); if (q.length < 2) { out.innerHTML = q ? '<p style="padding:10px">Keep typing…</p>' : ""; return; }
      const d = AMI.data, hits = [
        ...d.products.filter(p => AMI.matches(q, p.name, p.short, d.productCategories[p.category].label)).map(p => ({ t: p.name, s: "Product · " + AMI.money(p.price), img: p.image, href: `product.html?id=${p.id}` })),
        ...d.projects.filter(p => AMI.matches(q, p.title, p.description, d.portfolioCategories[p.category])).map(p => ({ t: p.title, s: "Portfolio · " + d.portfolioCategories[p.category], img: p.image, href: `portfolio.html?project=${p.id}` })),
        ...d.services.filter(s => AMI.matches(q, s.title, s.desc, s.includes.join(" "))).map(s => ({ t: s.title, s: "Service", img: "assets/logos/logo-mark.svg", href: `services.html#${s.id}` }))
      ].slice(0, 8);
      out.innerHTML = hits.length ? hits.map(h => `<a href="${h.href}"><img src="${h.img}" alt="" loading="lazy"><span>${AMI.esc(h.t)}<small>${AMI.esc(h.s)}</small></span>${ic("chevron-right")}</a>`).join("")
        : `<p style="padding:10px">No results for “${AMI.esc(q)}”. Try the <a href="shop.html" style="text-decoration:underline">shop</a> or <a href="contact.html" style="text-decoration:underline">ask us</a>.</p>`;
    };
    input.addEventListener("input", AMI.debounce(run, 150));
    input.addEventListener("keydown", e => { if (e.key === "Enter") { const a = AMI.$("a", out); location.href = a ? a.href : `shop.html?q=${encodeURIComponent(input.value.trim())}`; } });
    addEventListener("keydown", e => { if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); AMI.$("#open-search").click(); } });
  }

  function mobileMenu() {
    const btn = AMI.$("#menu-toggle"), nav = AMI.$("#mobile-nav");
    const set = open => { btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); nav.classList.toggle("open", open); nav.setAttribute("aria-hidden", !open); document.body.style.overflow = open ? "hidden" : ""; };
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { set(false); btn.focus(); } });
    addEventListener("resize", () => innerWidth > 960 && set(false));
  }

  AMI.onReady(() => {
    const h = AMI.$("#site-header"), f = AMI.$("#site-footer");
    if (h) { h.outerHTML = headerHTML(); mobileMenu(); search(); }
    if (f) f.outerHTML = footerHTML();
    const main = AMI.$("main"); if (main && !main.id) main.id = "main";
    AMI.lazy();
  });
})();

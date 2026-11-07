/* services.js — renders service cards (home + services page), the FAQ accordion, account tabs and testimonials,
   all from js/data.js so content lives in one place. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const ic = AMI.icon, D = AMI.data;
  const quoteHref = s => s.href || `contact.html?service=${encodeURIComponent(s.value)}`;

  const card = s => `
    <article class="card service-card reveal" id="${s.id}"><div class="service-num">SERVICE ${s.num}</div><div class="icon-wrap">${ic(s.icon)}</div>
      <h3>${AMI.esc(s.title)}</h3><p>${AMI.esc(s.desc)}</p>
      <ul>${s.includes.map(i => `<li>${ic("check")}<span>${AMI.esc(i)}</span></li>`).join("")}</ul>
      <a class="btn btn-primary btn-sm" href="${quoteHref(s)}">${AMI.esc(s.cta)} ${ic("arrow-right")}</a></article>`;

  function services() {
    const home = AMI.$("#home-services"); if (home) { home.innerHTML = D.services.map(card).join(""); AMI.observeReveal(home); }
    const grid = AMI.$("#services-grid"); if (!grid) return;
    grid.innerHTML = D.services.map(card).join("");
    AMI.$("#services-details").innerHTML = D.services.map(s => `<details class="acc" id="d-${s.id}"><summary>${AMI.esc(s.title)} — details &amp; customisation${ic("plus")}</summary>
      <div class="acc-body"><p>${AMI.esc(s.custom)}</p><p style="font-size:.9rem">Sample visuals: see <a href="portfolio.html${s.id === "custom" ? "" : "#" + (s.id === "video" ? "video" : s.id)}" style="text-decoration:underline">related portfolio work</a>. We don't promise unlimited revisions, fixed turnaround times or specific resolutions unless they're written into your quote.</p>
      <a class="btn btn-ghost btn-sm" href="${quoteHref(s)}">Request a Quote</a></div></details>`).join("");
    if (location.hash) { const t = AMI.$(`#d-${location.hash.slice(1)}`); t && (t.open = true); }
    AMI.observeReveal(grid);
  }

  function faq() {
    const list = AMI.$("#faq-list"); if (!list) return;
    const render = items => { list.innerHTML = items.map(f => `<details class="acc reveal in"><summary>${AMI.esc(f.q)}${ic("plus")}</summary><div class="acc-body"><p>${AMI.esc(f.a)}</p></div></details>`).join(""); AMI.$("#faq-empty").hidden = items.length > 0; };
    render(D.faqs); const s = AMI.$("#faq-search"); s && s.addEventListener("input", AMI.debounce(() => render(D.faqs.filter(f => AMI.matches(s.value, f.q, f.a))), 120));
    const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: D.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
    const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
  }

  function testimonials() {
    const box = AMI.$("#testimonials"); if (!box) return;
    if (!D.testimonials.length) { // honest empty state: sample layout is clearly labelled, no invented people or ratings
      box.innerHTML = `<div class="testimonial-ph reveal"><span class="tag demo">Layout preview — not a real review</span><div class="avatar-ph" style="margin-top:18px"></div>
        <div class="stars" aria-hidden="true">☆ ☆ ☆ ☆ ☆</div><p style="margin:12px 0 0">Client feedback coming soon. Verified reviews from real customers will appear here.</p></div>
        <div class="testimonial-ph reveal"><h3>Worked with us?</h3><p>We only publish genuine feedback shared with permission.</p><a class="btn btn-ghost btn-sm" href="contact.html">Share your feedback</a></div>`;
    } else box.innerHTML = D.testimonials.map(t => `<figure class="card reveal"><div class="stars" role="img" aria-label="${t.rating} out of 5">${"★".repeat(t.rating)}${"☆".repeat(5 - t.rating)}</div><blockquote style="margin:14px 0;color:var(--text-2)">“${AMI.esc(t.text)}”</blockquote><figcaption><strong>${AMI.esc(t.name)}</strong><br><small style="color:var(--text-3)">${AMI.esc(t.role || "")}${t.product ? " · " + AMI.esc(t.product) : ""}</small></figcaption></figure>`).join("");
    AMI.observeReveal(box);
  }

  function marquee() {
    const t = AMI.$("#capabilities"); if (!t) return; const one = D.capabilities.map(c => `<span>${c}</span>`).join("");
    t.innerHTML = one + one + one + one; // repeated so the loop is seamless; second half is decorative
    AMI.$$("span", t).slice(D.capabilities.length).forEach(s => s.setAttribute("aria-hidden", "true"));
  }

  function accountTabs() {
    const tabs = AMI.$$('[role="tab"]'); if (!tabs.length) return;
    const select = t => tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); AMI.$("#" + x.getAttribute("aria-controls")).hidden = !on; });
    tabs.forEach(t => { t.addEventListener("click", () => { select(t); history.replaceState(null, "", "#" + t.id.replace("tab-", "")); });
      t.addEventListener("keydown", e => { const i = tabs.indexOf(t), n = e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length] : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length] : null; if (n) { n.focus(); select(n); } }); });
    const h = tabs.find(t => "#" + t.id.replace("tab-", "") === location.hash); select(h || tabs[0]);
  }

  AMI.onReady(() => { services(); faq(); testimonials(); marquee(); accountTabs(); });
})();

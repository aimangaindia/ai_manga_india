/* portfolio.js — portfolio grid, category filter, search, project modal (image/video, gallery, full-screen).
   Deep links: portfolio.html?project=<id>  and  portfolio.html#<category> */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const ic = AMI.icon, D = AMI.data;
  const TYPE = { personal: ["Personal concept", "personal"], experimental: ["Experimental AI artwork", "personal"], client: ["Client project", "client"] };

  AMI.projectCard = p => `
    <button class="pcard reveal" type="button" data-project="${p.id}" data-cat="${p.category}" aria-label="Open project: ${AMI.esc(p.title)}">
      <span class="pcard-media"><img src="${p.image}" alt="${AMI.esc(p.title)} — ${AMI.esc(p.projectType)}" width="800" height="600" loading="lazy">
        <span class="pcard-badges"><span class="tag ${TYPE[p.type][1]}">${TYPE[p.type][0]}</span>${p.demo ? '<span class="tag demo">Demo</span>' : ""}</span>
        <span class="play-chip" aria-hidden="true">${ic(p.video ? "play" : "eye")}</span></span>
      <span class="pcard-body"><span class="cat">${AMI.esc(D.portfolioCategories[p.category])}</span><h3>${AMI.esc(p.title)}</h3><p>${AMI.esc(p.projectType)}</p>
        <span class="link-arrow">View Project ${ic("arrow-right")}</span></span></button>`;

  let modal, fs, current, gi = 0;
  function build() {
    modal = document.createElement("div"); modal.className = "modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", "Project details"); document.body.appendChild(modal);
    fs = document.createElement("div"); fs.className = "fs-view"; fs.setAttribute("role", "dialog"); fs.setAttribute("aria-label", "Full-screen view");
    fs.innerHTML = `<button class="icon-btn modal-close" type="button" data-close aria-label="Close full screen">${ic("x")}</button><img alt="">`; document.body.appendChild(fs);
  }
  function show(id, push = true) {
    const p = D.projects.find(x => x.id === id); if (!p) return; if (!modal) build(); current = p; gi = 0;
    const media = p.video ? `<video src="${p.video}" poster="${p.image}" controls playsinline preload="none"></video>` : `<img id="pm-img" src="${p.gallery[0]}" alt="${AMI.esc(p.title)}">`;
    modal.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal-dialog"><button class="icon-btn modal-close" type="button" data-close aria-label="Close project">${ic("x")}</button>
      <div class="modal-grid"><div class="modal-media">${media}
        ${!p.video ? `<button class="icon-btn" type="button" id="pm-full" aria-label="View full screen" style="position:absolute;left:14px;bottom:14px;z-index:3;background:rgba(8,10,18,.75);border-color:var(--border-2)">${ic("expand")}</button>` : ""}
        ${p.gallery.length > 1 ? `<button class="icon-btn" id="pm-prev" aria-label="Previous image" style="position:absolute;left:10px;top:50%;z-index:3;background:rgba(8,10,18,.75)">${ic("chevron-left")}</button><button class="icon-btn" id="pm-next" aria-label="Next image" style="position:absolute;right:10px;top:50%;z-index:3;background:rgba(8,10,18,.75)">${ic("chevron-right")}</button>` : ""}</div>
      <div class="modal-body"><div class="flex" style="margin-bottom:14px"><span class="tag ${TYPE[p.type][1]}">${TYPE[p.type][0]}</span>${p.demo ? '<span class="tag demo">Demo project</span>' : ""}</div>
        <span class="eyebrow">${AMI.esc(D.portfolioCategories[p.category])}</span><h2>${AMI.esc(p.title)}</h2><p>${AMI.esc(p.description)}</p>
        <table class="spec"><tr><th>Project type</th><td>${AMI.esc(p.projectType)}</td></tr><tr><th>Status</th><td>${TYPE[p.type][0]}${p.demo ? " (demonstration entry)" : ""}</td></tr><tr><th>Tools &amp; workflow</th><td>${AMI.esc(p.workflow)}</td></tr></table>
        <div class="flex"><a class="btn btn-primary" href="contact.html?service=${encodeURIComponent(serviceFor(p.category))}&ref=${p.id}">Request a Similar Project</a><button class="btn btn-ghost" type="button" data-close>Close</button></div></div></div></div>`;
    AMI.openLayer(modal); if (push) history.replaceState(null, "", `?project=${id}`);
    const set = i => { gi = (i + p.gallery.length) % p.gallery.length; AMI.$("#pm-img").src = p.gallery[gi]; };
    AMI.$("#pm-prev") && AMI.$("#pm-prev").addEventListener("click", () => set(gi - 1)); AMI.$("#pm-next") && AMI.$("#pm-next").addEventListener("click", () => set(gi + 1));
    AMI.$("#pm-full") && AMI.$("#pm-full").addEventListener("click", () => { AMI.$("img", fs).src = p.gallery[gi]; AMI.$("img", fs).alt = p.title; AMI.openLayer(fs); });
    new MutationObserver((_, ob) => { if (!modal.classList.contains("open")) { if (AMI.param("project")) history.replaceState(null, "", location.pathname + location.hash); ob.disconnect(); } }).observe(modal, { attributes: true, attributeFilter: ["class"] });
  }
  const serviceFor = c => ({ video: "AI Video Production", ads: "AI Video Advertisement", art: "AI Digital Art", graphic: "AI Graphic Design", manga: "AI Manga & Animation" }[c]);

  document.addEventListener("click", e => { const c = e.target.closest("[data-project]"); if (c) show(c.dataset.project); });

  function portfolioPage() {
    const grid = AMI.$("#portfolio-grid"); if (!grid) return;
    const chips = AMI.$("#pf-chips"), search = AMI.$("#pf-search"), count = AMI.$("#pf-count");
    chips.innerHTML = `<button class="chip" type="button" data-value="all">All Work</button>` + Object.entries(D.portfolioCategories).map(([k, v]) => `<button class="chip" type="button" data-value="${k}">${AMI.esc(v)}</button>`).join("");
    const st = { cat: (location.hash || "").slice(1) in D.portfolioCategories ? location.hash.slice(1) : "all", q: "" };
    const apply = () => {
      const l = D.projects.filter(p => (st.cat === "all" || p.category === st.cat) && (!st.q || AMI.matches(st.q, p.title, p.description, p.projectType, D.portfolioCategories[p.category])));
      grid.innerHTML = l.map(AMI.projectCard).join(""); AMI.observeReveal(grid); count.textContent = `${l.length} project${l.length === 1 ? "" : "s"}`; AMI.$("#pf-empty").hidden = l.length > 0;
    };
    AMI.chipGroup(chips, v => { st.cat = v; apply(); }, st.cat);
    search.addEventListener("input", AMI.debounce(() => { st.q = search.value.trim(); apply(); }, 150));
    const open = AMI.param("project"); if (open) show(open, false);
  }

  AMI.onReady(() => {
    portfolioPage();
    const home = AMI.$("#home-portfolio"); if (home) { home.innerHTML = ["neon-city-sequence", "orbit-product-ad", "portal-tale", "spirit-gate", "cyber-poster", "manga-burst-panel"].map(id => AMI.projectCard(D.projects.find(p => p.id === id))).join(""); AMI.observeReveal(home); }
    // video preview controls: pause any playing video when its modal closes
    document.addEventListener("click", e => { if (e.target.closest("[data-close]")) AMI.$$("video", modal || document.body).forEach(v => v.pause()); });
  });
})();

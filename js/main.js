/* main.js — shared utilities + site-wide behaviours (loader, reveal, particles, parallax, back-to-top, transitions).
   Every other script registers on the global AMI object and calls AMI.onReady(init). */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  AMI.reduced = reduced;
  AMI.cfg = window.AMI_CONFIG; AMI.data = window.AMI_DATA;

  AMI.$ = (s, r = document) => r.querySelector(s);
  AMI.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  AMI.onReady = fn => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());
  AMI.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  AMI.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = new Intl.NumberFormat(AMI.cfg.locale, { style: "currency", currency: AMI.cfg.currency, maximumFractionDigits: 2 });
  AMI.money = n => money.format(n).replace(/\.00$/, "");
  AMI.store = { // localStorage that never throws (private mode etc.)
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  AMI.param = k => new URLSearchParams(location.search).get(k);

  /* ---------- toasts ---------- */
  AMI.toast = (msg, type = "info", ms = 3600) => {
    const wrap = AMI.$(".toast-wrap") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "toast-wrap", role: "status", ariaLive: "polite" }));
    const t = document.createElement("div");
    t.className = `toast ${type}`; t.innerHTML = `${AMI.icon(type === "error" ? "info" : "check")}<span>${AMI.esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s, transform .3s"; t.style.opacity = 0; t.style.transform = "translateX(20px)"; setTimeout(() => t.remove(), 320); }, ms);
  };

  /* ---------- modal / drawer helper: focus trap, Esc, backdrop click, scroll lock ---------- */
  let lastFocus = null;
  AMI.openLayer = el => {
    lastFocus = document.activeElement; el.classList.add("open"); el.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    const f = el.querySelector("[autofocus], input, button, a[href]"); setTimeout(() => f && f.focus(), 60);
  };
  AMI.closeLayer = el => {
    if (!el || !el.classList.contains("open")) return; el.classList.remove("open"); el.setAttribute("aria-hidden", "true");
    if (!AMI.$$(".modal.open, .drawer.open, .fs-view.open").length) document.body.style.overflow = "";
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  document.addEventListener("keydown", e => {
    const top = AMI.$$(".modal.open, .drawer.open, .fs-view.open").pop();
    if (!top) return;
    if (e.key === "Escape") { AMI.closeLayer(top); return; }
    if (e.key === "Tab") { // keep focus inside the open layer
      const f = AMI.$$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', top).filter(x => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener("click", e => {
    const close = e.target.closest("[data-close]"); if (close) AMI.closeLayer(close.closest(".modal, .drawer, .fs-view"));
  });

  /* ---------- scroll reveal ---------- */
  let io;
  AMI.observeReveal = (root = document) => {
    const els = AMI.$$(".reveal:not(.in)", root);
    if (reduced || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    io = io || new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((e, i) => { if (!e.style.getPropertyValue("--d")) e.style.setProperty("--d", `${(i % 4) * 0.08}s`); io.observe(e); });
  };

  /* ---------- hero particles (lightweight, paused off-screen / hidden tab) ---------- */
  function particles(canvas) {
    const ctx = canvas.getContext("2d"); let w, h, dots = [], run = true, raf;
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; dots = Array.from({ length: Math.min(46, Math.floor(w / 28)) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, vy: -(Math.random() * .25 + .05), vx: (Math.random() - .5) * .15, a: Math.random() * .6 + .2, c: Math.random() > .5 ? "0,217,255" : "179,140,255" })); };
    const tick = () => { if (!run) return; ctx.clearRect(0, 0, w, h); for (const d of dots) { d.x += d.vx; d.y += d.vy; if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; } ctx.fillStyle = `rgba(${d.c},${d.a})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill(); } raf = requestAnimationFrame(tick); };
    resize(); addEventListener("resize", AMI.debounce(resize, 250));
    new IntersectionObserver(([e]) => { run = e.isIntersecting && !document.hidden; cancelAnimationFrame(raf); if (run) tick(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => { run = !document.hidden; cancelAnimationFrame(raf); if (run) tick(); });
  }

  /* ---------- hero parallax tilt (fine pointers only) ---------- */
  function parallax(hero) {
    const layers = AMI.$$(".hv", hero); if (!layers.length || !matchMedia("(pointer: fine)").matches) return; let raf;
    hero.addEventListener("mousemove", e => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
      layers.forEach((l, i) => { const k = (i + 1) * 7; l.style.transform = `translate3d(${x * k}px, ${y * k}px, 0)`; }); }); });
  }

  /* ---------- hero video (optional) ---------- */
  function heroVideo() {
    const src = AMI.cfg.heroVideo, bg = AMI.$(".hero-bg"); if (!src || !bg || reduced) return;
    const v = document.createElement("video"); v.className = "hero-video"; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none"; v.setAttribute("aria-hidden", "true");
    v.src = src; v.addEventListener("error", () => v.remove()); v.addEventListener("canplay", () => v.play().catch(() => v.remove()), { once: true });
    bg.after(v); v.load();
  }

  /* ---------- page loader + transitions ---------- */
  function loader() {
    if (reduced || AMI.store.get("ami_seen", false)) return; AMI.store.set("ami_seen", true);
    const l = document.createElement("div"); l.className = "page-loader"; l.innerHTML = '<img src="assets/logos/logo-mark.svg" alt="" width="64" height="64">'; document.body.appendChild(l);
    const done = () => { l.classList.add("done"); setTimeout(() => l.remove(), 600); };
    if (document.readyState === "complete") setTimeout(done, 250); else { addEventListener("load", () => setTimeout(done, 250)); setTimeout(done, 2500); }
  }
  function transitions() {
    if (reduced) return;
    document.body.classList.add("page-fade");
    addEventListener("pageshow", e => { if (e.persisted) document.body.style.opacity = ""; });
    document.addEventListener("click", e => {
      const a = e.target.closest("a[href]"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname === location.pathname || !/\.html?$|\/$/.test(u.pathname)) return;
      e.preventDefault(); document.body.style.transition = "opacity .22s"; document.body.style.opacity = 0; setTimeout(() => (location.href = a.href), 200);
    });
  }

  function backToTop() {
    const b = document.createElement("button"); b.id = "totop"; b.type = "button"; b.setAttribute("aria-label", "Back to top"); b.innerHTML = AMI.icon("arrow-up");
    document.body.appendChild(b); b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
    const f = () => b.classList.toggle("show", scrollY > 700); addEventListener("scroll", f, { passive: true }); f();
  }

  /* lazy-load any images/iframes added without the attribute */
  AMI.lazy = (root = document) => AMI.$$("img:not([loading])", root).forEach(i => { i.loading = "lazy"; i.decoding = "async"; });

  AMI.onReady(() => {
    AMI.hydrateIcons(); loader(); transitions(); backToTop(); AMI.observeReveal(); AMI.lazy();
    const c = AMI.$("#particles"); if (c && !reduced) particles(c);
    const hero = AMI.$(".hero"); if (hero) { parallax(hero); heroVideo(); }
    // keep header state in sync with scroll
    const hd = () => AMI.$(".site-header") && AMI.$(".site-header").classList.toggle("scrolled", scrollY > 24);
    addEventListener("scroll", hd, { passive: true }); setTimeout(hd, 50);
  });
})();

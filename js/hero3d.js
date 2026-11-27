/* hero3d.js — the homepage 3D "creative universe".
   No libraries: a small canvas-2D 3D engine (perspective projection) draws the energy core, holographic planet,
   orbit rings, particles and portal; the five floating service objects are real links (DOM + CSS 3D) so they stay
   crawlable, keyboard-accessible and fast. Behaviour:
   - intro: particles gather -> energy sphere forms -> expands into the planet -> rings/portal/panels appear -> idle loop
   - mouse (fine pointers) / touch drag tilt the scene; panels move with depth-based parallax
   - scroll: the core moves back and the panels spread out (CSS variable --sp); CTA band has a portal that "approaches" (--q)
   - prefers-reduced-motion: a single static frame, no loop. Pauses when off-screen or the tab is hidden.
   - on desktop/laptop, a cinematic 3D video (assets/video/hero-3d.mp4) plays as the main visual when allowed (not reduced-motion / data-saver / failed autoplay);
     otherwise the canvas scene above is used. If canvas is unavailable the static CSS glow + the linked service panels remain. */
(() => {
  "use strict";
  const root = document.getElementById("hero3d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = matchMedia("(max-width: 760px)");
  /* the 3D scene (video + canvas + floating panels) is for desktop / laptop screens only; phones and tablets get the plain static layout */
  const desk = matchMedia("(min-width: 1025px) and (hover: hover) and (pointer: fine)");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // deterministic scene
  const rnd = (a, b) => a + rand() * (b - a);
  const COL = { cyan: [40, 217, 255], blue: [57, 123, 255], purple: [168, 85, 247], green: [60, 255, 160] };
  const pick = () => { const r = rand(); return r < .07 ? COL.green : r < .36 ? COL.purple : r < .68 ? COL.cyan : COL.blue; };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* =============================== HERO SCENE =============================== */
  function hero() {
    const canvas = root.querySelector(".h3-canvas"), ctx = canvas && canvas.getContext("2d"); if (!ctx) return;
    root.classList.add("is-live");
    const items = [...root.querySelectorAll(".h3-item")];
    let W = 0, H = 0, dpr = 1, U = 100, cx = 0, cy = 0, pts = [], dust = [], D = 4.4;
    let mx = 0, my = 0, tx = 0, ty = 0, sp = 0, ay = 0, ax = 0, t = 0, run = false, raf = 0, last = 0, shown = 0, vidOn = false;
    const vid = root.querySelector(".h3-video");
    let speed = 1; try { if (sessionStorage.getItem("ami_h3")) speed = 2.4; sessionStorage.setItem("ami_h3", "1"); } catch (e) {}

    function build() {
      const n = small.matches ? 150 : 300, ga = Math.PI * (3 - Math.sqrt(5)); pts = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i, a = rand() * 6.283, b = Math.acos(2 * rand() - 1), R = rnd(2.6, 5.4);
        pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, sx: R * Math.sin(b) * Math.cos(a), sy: R * Math.cos(b) * .7, sz: R * Math.sin(b) * Math.sin(a), c: pick(), s: .8 + rand() * 1.1, ph: rand() * 6.283 });
      }
      dust = Array.from({ length: small.matches ? 16 : 34 }, () => ({ x: rnd(-3, 3), y: rnd(-2.3, 2.3), z: rnd(-2, 2), v: rnd(.05, .16), s: rnd(.5, 1.2), c: pick() }));
    }
    function resize() {
      W = root.clientWidth; H = root.clientHeight; if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, small.matches ? 1.5 : 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      cx = W / 2; cy = H / 2; U = Math.min(W, H) * .25; build(); if (!run) draw(reduced ? 99 : t);
    }
    // rotate around Y (+extra spin) then X, then perspective
    function proj(x, y, z, spin = 0) {
      const a = ay + spin, cY = Math.cos(a), sY = Math.sin(a), cX = Math.cos(ax), sX = Math.sin(ax);
      const x1 = x * cY + z * sY, z1 = -x * sY + z * cY, y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX, k = D / (D + z2);
      return [cx + x1 * k * U, cy + y1 * k * U, z2, k];
    }
    function ringPath(R, tilt, spin) {
      const cT = Math.cos(tilt), sT = Math.sin(tilt), out = [];
      for (let i = 0; i <= 90; i++) { const th = i / 90 * 6.2832, x = R * Math.cos(th), z0 = R * Math.sin(th); out.push(proj(x, -z0 * sT, z0 * cT, spin)); }
      return out;
    }
    function ringPoint(R, tilt, th, spin) { const cT = Math.cos(tilt), sT = Math.sin(tilt), z0 = R * Math.sin(th); return proj(R * Math.cos(th), -z0 * sT, z0 * cT, spin); }

    function draw(tt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ay = mx * .5; ax = .14 + my * .3; D = 4.4 + sp * 1.5;
      const P = ease(clamp((tt - .25) / 1.5)), core = clamp((tt - .9) / .9), bloom = ease(clamp((tt - 1.7) / .9)),
        wire = ease(clamp((tt - 2.0) / .9)), rings = ease(clamp((tt - 2.3) / .9)), portal = ease(clamp((tt - 2.0) / 1.2));
      const spin = tt * .28, pulse = 1 + .05 * Math.sin(tt * 1.8);
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";

      /* portal (behind everything) */
      if (portal > .01) {
        const pr = U * 1.95 * (.75 + .25 * portal), sx = Math.max(.55, 1 - Math.abs(mx) * .22), px = cx - mx * U * .25, py = cy - my * U * .15 - sp * 10;
        ctx.save(); ctx.translate(px, py); ctx.scale(sx, 1);
        const g = ctx.createRadialGradient(0, 0, pr * .1, 0, 0, pr); g.addColorStop(0, rgba(COL.purple, .22 * portal)); g.addColorStop(.7, rgba(COL.blue, .1 * portal)); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, pr, 0, 6.2832); ctx.fill();
        [[1, 3, [pr * .9, pr * .5], 26, 0], [.89, 1.6, [pr * .5, pr * .4], -18, 1], [.77, 1, [pr * .25, pr * .3], 34, 2]].forEach(([f, lw, dash, v, k]) => {
          ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.lineDashOffset = -tt * v; ctx.strokeStyle = rgba([COL.blue, COL.purple, COL.cyan][k], .55 * portal); ctx.beginPath(); ctx.arc(0, 0, pr * f, 0, 6.2832); ctx.stroke();
        });
        ctx.setLineDash([]);
        for (let i = 0; i < (small.matches ? 10 : 18); i++) { // matter spiralling into the portal
          const f = (tt * .12 + i / 18) % 1, a = i * 2.4 + tt * 1.1 * (1 - f * .4), r = pr * (1 - f) * .95;
          ctx.fillStyle = rgba(i % 3 ? COL.cyan : COL.purple, .6 * portal * Math.sin(f * 3.14)); ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.4, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }

      /* halo + energy core */
      const halo = U * (1.25 + .7 * bloom) * pulse, hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, halo);
      hg.addColorStop(0, rgba(COL.blue, .34 * Math.max(core * .6, bloom))); hg.addColorStop(.55, rgba(COL.purple, .14 * Math.max(core * .5, bloom))); hg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
      if (core > 0) {
        const cr = U * (.05 + .3 * core) * (1 + .5 * Math.sin(tt * 2) * .06) * (1 - .35 * bloom + .15 * bloom * pulse), cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.4);
        cg.addColorStop(0, `rgba(255,255,255,${.95 * core})`); cg.addColorStop(.25, rgba([150, 200, 255], .8 * core)); cg.addColorStop(.6, rgba(COL.purple, .3 * core)); cg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, cr * 2.4, 0, 6.2832); ctx.fill();
      }
      if (tt > 1.7 && tt < 2.8) { // expanding shock ring: the sphere becomes a universe
        const f = (tt - 1.7) / 1.1; ctx.lineWidth = 2; ctx.strokeStyle = rgba(COL.cyan, .55 * (1 - f)); ctx.beginPath(); ctx.arc(cx, cy, U * (.4 + f * 2.2), 0, 6.2832); ctx.stroke();
      }

      /* holographic planet: wireframe */
      if (wire > .01) {
        const front = [], back = [];
        const addLine = fn => { let prev = null; for (let i = 0; i <= 40; i++) { const p = fn(i / 40 * 6.2832); if (prev) ((prev[2] + p[2]) < 0 ? front : back).push(prev, p); prev = p; } };
        for (let m = 0; m < 6; m++) { const ph = m * Math.PI / 6; addLine(th => proj(Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph), spin)); }
        for (const y of [-.7, -.35, 0, .35, .7]) { const r = Math.sqrt(1 - y * y); addLine(th => proj(r * Math.cos(th), y, r * Math.sin(th), spin)); }
        const stroke = (arr, a) => { ctx.beginPath(); for (let i = 0; i < arr.length; i += 2) { ctx.moveTo(arr[i][0], arr[i][1]); ctx.lineTo(arr[i + 1][0], arr[i + 1][1]); } ctx.strokeStyle = rgba(COL.cyan, a * wire); ctx.lineWidth = 1; ctx.stroke(); };
        stroke(back, .07); stroke(front, .2);
      }
      /* particles -> planet surface */
      const rs = .25 + .75 * bloom;
      for (const p of pts) {
        const x = p.sx * (1 - P) + p.x * rs * P, y = p.sy * (1 - P) + p.y * rs * P, z = p.sz * (1 - P) + p.z * rs * P;
        const q = proj(x, y, z, spin * (.2 + .8 * P)), depth = clamp((q[2] + 1.2) / 2.4), a = (.25 + .75 * (1 - depth)) * clamp(tt * 2.2) * (.8 + .2 * Math.sin(tt * 2 + p.ph));
        ctx.fillStyle = rgba(p.c, a); ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(.5, p.s * q[3] * (.9 + .5 * (1 - depth))), 0, 6.2832); ctx.fill();
      }
      /* orbit rings + energy trails */
      if (rings > .01) {
        [[1.45, 1.15, COL.cyan, .6], [1.78, -.6, COL.purple, -.45]].forEach(([R, tilt, c, v]) => {
          const path = ringPath(R, tilt, 0); ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = rgba(c, .26 * rings); ctx.lineWidth = 1; ctx.stroke();
          for (let d = 0; d < 3; d++) {
            const th0 = tt * v + d * 2.0944;
            for (let s = 0; s < 10; s++) { const a = ringPoint(R, tilt, th0 - s * .07 * Math.sign(v), 0), b = ringPoint(R, tilt, th0 - (s + 1) * .07 * Math.sign(v), 0);
              ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = rgba(c, (.85 - s * .085) * rings); ctx.lineWidth = 2.2 - s * .15; ctx.stroke(); }
          }
        });
      }
      /* drifting dust */
      for (const d of dust) { d.y -= d.v * .004 * (reduced ? 0 : 1); if (d.y < -2.5) d.y = 2.5; const q = proj(d.x, d.y, d.z, 0); ctx.fillStyle = rgba(d.c, .35 * clamp(tt - 1)); ctx.beginPath(); ctx.arc(q[0], q[1], d.s * q[3], 0, 6.2832); ctx.fill(); }
      ctx.globalCompositeOperation = "source-over";

      // reveal the floating service objects in sequence
      if (tt >= 2.3 && shown < items.length) { const i = Math.min(items.length, Math.floor((tt - 2.3) / .22) + 1); while (shown < i) items[shown++].classList.add("in"); }
    }

    function frame(now) {
      if (!run) return; const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; t += dt * speed;
      mx += (tx - mx) * Math.min(1, dt * 4); my += (ty - my) * Math.min(1, dt * 4);
      root.style.setProperty("--mx", mx.toFixed(3)); root.style.setProperty("--my", my.toFixed(3));
      draw(t); raf = requestAnimationFrame(frame);
    }
    function start() { if (run || reduced || vidOn) return; run = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { run = false; cancelAnimationFrame(raf); }
    let vis = true; const ctl = () => { if (vidOn) { stop(); (vis && !document.hidden ? vid.play().catch(() => {}) : vid.pause()); } else (vis && !document.hidden ? start() : stop()); };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; ctl(); }).observe(root);
    document.addEventListener("visibilitychange", ctl);

    /* pointer: mouse on the whole hero, touch drag on the scene */
    if (!reduced) {
      const hero = root.closest(".hero") || root, move = e => { const r = root.getBoundingClientRect(); tx = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1); ty = clamp(((e.clientY - r.top) / r.height - .5) * 2, -1, 1); };
      hero.addEventListener("pointermove", e => { if (e.pointerType === "mouse" || e.pointerType === "pen") move(e); else if (e.pointerType === "touch" && root.contains(e.target)) move(e); }, { passive: true });
      hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; });
      root.addEventListener("pointerup", () => { tx = 0; ty = 0; }); root.addEventListener("pointercancel", () => { tx = 0; ty = 0; });
    }
    /* scroll stage 1: core moves back, panels spread */
    let sraf = 0; const onScroll = () => { if (sraf) return; sraf = requestAnimationFrame(() => { sraf = 0; sp = clamp(scrollY / (innerHeight * .9)); root.style.setProperty("--sp", sp.toFixed(3)); if (!run) draw(reduced ? 99 : t); }); };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    /* link the home service tiles to their floating objects */
    const hl = (e, on) => { const a = e.target.closest && e.target.closest("a.svc-tile[href]"); if (!a) return; const slug = a.getAttribute("href").split("/").pop(); const c = root.querySelector(`.h3-card[data-svc="${slug}"]`); if (c) c.classList.toggle("hl", on); };
    document.addEventListener("mouseover", e => hl(e, true)); document.addEventListener("mouseout", e => hl(e, false));

    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(root); else addEventListener("resize", resize);
    /* 3D video as the main visual; the canvas scene stays as the fallback */
    function useVideo() {
      if (!vid || reduced) return; const c = navigator.connection || {}; if (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")) return;
      const drop = () => vid.remove();
      vid.addEventListener("error", drop, { once: true });
      vid.addEventListener("playing", () => {
        vidOn = true; root.classList.add("is-video"); stop();
        const wait = shown ? 0 : 2200; for (let i = shown; i < items.length; i++) setTimeout(() => items[i].classList.add("in"), wait + (i - shown) * 220); shown = items.length;
      }, { once: true });
      vid.muted = true; vid.src = vid.dataset.src; vid.preload = small.matches ? "metadata" : "auto";
      const p = vid.play(); if (p && p.catch) p.catch(drop);
    }
    resize(); build();
    if (reduced) { items.forEach(i => i.classList.add("in")); draw(99); } else { draw(0); ctl(); useVideo(); }
  }

  /* =============================== CTA PORTAL =============================== */
  function portal() {
    const cv = document.getElementById("portal3d"); if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const band = cv.parentElement; let W = 0, H = 0, dpr = 1, run = false, raf = 0, q = 0, t = 0, last = 0, v = true;
    const size = () => { W = band.clientWidth; H = band.clientHeight; dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = W * dpr; cv.height = H * dpr; if (!run) draw(reduced ? 3 : t); };
    function draw(tt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter";
      const wide = W > 720, cx = wide ? W * .84 : W * .5, cy = H * .5, base = Math.min(W, H) * (wide ? .62 : .5), pr = base * (.55 + .5 * q), a = (wide ? 1 : .45) * (.35 + .65 * q);
      const g = ctx.createRadialGradient(cx, cy, pr * .05, cx, cy, pr * 1.1); g.addColorStop(0, rgba(COL.purple, .38 * a)); g.addColorStop(.6, rgba(COL.blue, .16 * a)); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, pr * 1.1, 0, 6.2832); ctx.fill();
      [[1, 3, 26, [pr * .9, pr * .55], COL.blue], [.86, 1.8, -20, [pr * .5, pr * .4], COL.purple], [.72, 1, 34, [pr * .3, pr * .3], COL.cyan], [.55, 1, -40, [pr * .2, pr * .25], COL.blue]].forEach(([f, lw, vv, dash, c]) => {
        ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.lineDashOffset = -tt * vv; ctx.strokeStyle = rgba(c, .6 * a); ctx.beginPath(); ctx.ellipse(cx, cy, pr * f * .86, pr * f, 0, 0, 6.2832); ctx.stroke();
      });
      ctx.setLineDash([]);
      for (let i = 0; i < 22; i++) { const f = (tt * .1 + i / 22) % 1, an = i * 2.4 + tt * (1 - f * .4), r = pr * (1 - f); ctx.fillStyle = rgba(i % 3 ? COL.cyan : COL.purple, .7 * a * Math.sin(f * 3.14)); ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r * .86, cy + Math.sin(an) * r, 1.5, 0, 6.2832); ctx.fill(); }
      ctx.globalCompositeOperation = "source-over";
    }
    const upd = () => { const r = band.getBoundingClientRect(); q = clamp(1 - (r.top + r.height / 2 - innerHeight * .45) / (innerHeight * .6)); band.style.setProperty("--q", q.toFixed(3)); };
    const frame = now => { if (!run) return; const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; t += dt; upd(); draw(t); raf = requestAnimationFrame(frame); };
    const ctl = () => { const go = v && !document.hidden && !reduced; if (go && !run) { run = true; last = performance.now(); raf = requestAnimationFrame(frame); } else if (!go) { run = false; cancelAnimationFrame(raf); } };
    new IntersectionObserver(([e]) => { v = e.isIntersecting; ctl(); if (v) { upd(); if (!run) draw(reduced ? 3 : t); } }).observe(band); document.addEventListener("visibilitychange", ctl);
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(band); size(); upd(); draw(reduced ? 3 : 0);
  }

  /* phones / tablets / portrait layouts: the portrait 3D video (poster first; plays when allowed, only while on screen) */
  let pStarted = false;
  function portraitVideo() {
    const v = root && root.querySelector(".h3-video-p"); if (!v || pStarted) return; pStarted = true;
    if (reduced) return; const c = navigator.connection || {}; if (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")) return;
    const drop = () => { v.removeAttribute("src"); v.load(); }; v.addEventListener("error", drop, { once: true });
    v.muted = true; v.src = v.dataset.src; v.preload = "auto";
    const go = () => { const p = v.play(); if (p && p.catch) p.catch(drop); };
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { if (e.isIntersecting && !document.hidden) go(); else v.pause(); }).observe(v); else go();
    document.addEventListener("visibilitychange", () => { if (document.hidden) v.pause(); });
  }
  let started = false;
  const start = () => { if (!root) return; if (desk.matches) { if (!started) { started = true; hero(); } } else portraitVideo(); };
  const init = () => { start(); portal(); if (desk.addEventListener) desk.addEventListener("change", start); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* editor.js — Template Studio: a small Canva-style editor that runs entirely in the browser (Canvas 2D, no libraries).
   Features: templates, drag/resize/rotate, text styling, shapes, photo upload, layers, undo/redo, autosave (this browser),
   save/open .ami file, download PNG/JPG. Nothing is uploaded to any server. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FONTS = ["Space Grotesk", "Inter", "Poppins", "Anton", "Bebas Neue", "Bangers", "Lilita One", "Playfair Display", "Permanent Marker"];
  const KEY = "ami-studio-v1", MAXIMG = 2200;
  const HEX = /^#[0-9a-f]{6}$/i, DATA = /^data:image\/(png|jpeg|webp|gif);base64,/i;
  const num = (v, d, lo, hi) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const col = (v, d) => (typeof v === "string" && HEX.test(v) ? v : d);

  let doc, assets = {}, sel = null, zoom = 0, fit = true, uid = 1, aid = 1, tplId = "";
  const imgs = {}, undo = [], redo = [];
  const cv = $("#cv"), ctx = cv.getContext("2d"), scratch = document.createElement("canvas").getContext("2d");
  let guides = { v: false, h: false }, drag = null, uiOn = true;

  /* ---------- sanitising (templates, autosave and opened files are all untrusted data) ---------- */
  function cleanObj(o, assetMap) {
    if (!o || typeof o !== "object") return null;
    const b = { id: "o" + uid++, type: o.type, x: num(o.x, 0, -5000, 9000), y: num(o.y, 0, -5000, 9000), w: num(o.w, 200, 10, 9000), h: num(o.h, 200, 4, 9000),
      rot: num(o.rot, 0, -360, 360), op: num(o.op, 1, 0, 1), hidden: !!o.hidden, locked: !!o.locked };
    if (o.type === "text") return Object.assign(b, { text: String(o.text ?? "").slice(0, 600), font: FONTS.includes(o.font) ? o.font : "Inter", size: num(o.size, 48, 6, 900), weight: o.weight === 400 ? 400 : 700,
      italic: !!o.italic, color: col(o.color, "#FFFFFF"), align: ["left", "center", "right"].includes(o.align) ? o.align : "left", ls: num(o.ls, 0, -10, 80), lh: num(o.lh, 1.1, .6, 3), upper: !!o.upper,
      stroke: o.stroke && o.stroke.w > 0 ? { c: col(o.stroke.c, "#000000"), w: num(o.stroke.w, 0, 0, 60) } : null,
      shadow: o.shadow && (o.shadow.b > 0 || o.shadow.x || o.shadow.y) ? { c: col(o.shadow.c, "#000000"), b: num(o.shadow.b, 0, 0, 120), x: num(o.shadow.x, 0, -80, 80), y: num(o.shadow.y, 0, -80, 80) } : null });
    if (o.type === "rect" || o.type === "ellipse") return Object.assign(b, { fill: col(o.fill, "#7865FF"), fill2: o.fill2 ? col(o.fill2, "#00D9FF") : null, stroke: o.stroke ? col(o.stroke, "#FFFFFF") : null, sw: num(o.sw, 0, 0, 80), r: num(o.r, 0, 0, 4000) });
    if (o.type === "image" && typeof o.src === "string" && assetMap[o.src]) return Object.assign(b, { src: o.src, fit: o.fit === "contain" ? "contain" : "cover", r: num(o.r, 0, 0, 4000) });
    return null;
  }
  function cleanDoc(raw, assetMap = {}) {
    if (!raw || typeof raw !== "object") return null;
    const clean = {}; for (const k in assetMap) if (/^a\d+$/.test(k) && typeof assetMap[k] === "string" && DATA.test(assetMap[k])) clean[k] = assetMap[k];
    const d = { w: num(raw.w, 1080, 200, 4000), h: num(raw.h, 1080, 200, 4000), bg: { c1: col(raw.bg && raw.bg.c1, "#08090D"), c2: raw.bg && raw.bg.c2 ? col(raw.bg.c2, "#181B27") : null, img: raw.bg && clean[raw.bg.img] ? raw.bg.img : null }, objs: [] };
    (Array.isArray(raw.objs) ? raw.objs : []).slice(0, 80).forEach(o => { const c = cleanObj(o, clean); if (c) d.objs.push(c); });
    return { doc: d, assets: clean };
  }

  /* ---------- fonts & images ---------- */
  const fontStr = o => `${o.italic ? "italic " : ""}${o.weight} ${o.size}px "${o.font}", system-ui, sans-serif`;
  async function ensureFonts(d) {
    if (!document.fonts || !document.fonts.load) return;
    const used = new Set(d.objs.filter(o => o.type === "text").map(o => `${o.weight} 40px "${o.font}"`));
    try { await Promise.all([...used].map(f => document.fonts.load(f, "Aa"))); } catch (e) { /* fallback fonts are used */ }
  }
  function getImg(key, cb) {
    if (imgs[key]) return imgs[key].complete ? imgs[key] : null;
    const im = (imgs[key] = new Image()); im.onload = () => { cb && cb(); }; im.src = assets[key]; return null;
  }

  /* ---------- drawing ---------- */
  function layout(o) {
    scratch.font = fontStr(o); try { scratch.letterSpacing = o.ls + "px"; } catch (e) { /* older browsers */ }
    const txt = o.upper ? o.text.toUpperCase() : o.text, lines = [];
    txt.split("\n").forEach(p => { let line = ""; p.split(" ").forEach(w => { const t = line ? line + " " + w : w; if (line && scratch.measureText(t).width > o.w) { lines.push(line); line = w; } else line = t; }); lines.push(line); });
    o.h = Math.max(o.size * o.lh, lines.length * o.size * o.lh); return lines;
  }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function paintBg(c, d, redraw) {
    if (d.bg.c2) { const g = c.createLinearGradient(0, 0, d.w, d.h); g.addColorStop(0, d.bg.c1); g.addColorStop(1, d.bg.c2); c.fillStyle = g; } else c.fillStyle = d.bg.c1;
    c.fillRect(0, 0, d.w, d.h);
    if (d.bg.img) { const im = getImg(d.bg.img, redraw); if (im) { const s = Math.max(d.w / im.width, d.h / im.height); c.drawImage(im, (d.w - im.width * s) / 2, (d.h - im.height * s) / 2, im.width * s, im.height * s); } }
  }
  function paintObj(c, o, redraw) {
    if (o.hidden) return;
    if (o.type === "text") layout(o);
    c.save(); c.translate(o.x + o.w / 2, o.y + o.h / 2); c.rotate(o.rot * Math.PI / 180); c.globalAlpha = o.op;
    const x = -o.w / 2, y = -o.h / 2;
    if (o.type === "text") {
      const lines = layout(o); c.font = fontStr(o); c.textBaseline = "middle"; c.textAlign = o.align; try { c.letterSpacing = o.ls + "px"; } catch (e) { /* */ }
      const lx = o.align === "left" ? x : o.align === "center" ? 0 : x + o.w;
      lines.forEach((ln, i) => {
        const ly = y + i * o.size * o.lh + o.size * o.lh / 2;
        const hasSh = o.shadow && (o.shadow.b > 0 || o.shadow.x || o.shadow.y), hasSt = o.stroke && o.stroke.w > 0;
        const shadow = () => { if (hasSh) { c.shadowColor = o.shadow.c; c.shadowBlur = o.shadow.b; c.shadowOffsetX = o.shadow.x; c.shadowOffsetY = o.shadow.y; } };
        if (hasSt) { c.save(); shadow(); c.lineJoin = "round"; c.miterLimit = 2; c.lineWidth = o.stroke.w * 2; c.strokeStyle = o.stroke.c; c.strokeText(ln, lx, ly); c.restore(); }
        c.save(); if (!hasSt) shadow(); c.fillStyle = o.color; c.fillText(ln, lx, ly); c.restore();
      });
    } else if (o.type === "rect" || o.type === "ellipse") {
      if (o.fill2) { const g = c.createLinearGradient(x, y, x + o.w, y + o.h); g.addColorStop(0, o.fill); g.addColorStop(1, o.fill2); c.fillStyle = g; } else c.fillStyle = o.fill;
      if (o.type === "rect") rr(c, x, y, o.w, o.h, o.r); else { c.beginPath(); c.ellipse(0, 0, o.w / 2, o.h / 2, 0, 0, Math.PI * 2); }
      c.fill(); if (o.stroke && o.sw > 0) { c.lineWidth = o.sw; c.strokeStyle = o.stroke; c.stroke(); }
    } else if (o.type === "image") {
      const im = getImg(o.src, redraw);
      if (im) { c.save(); rr(c, x, y, o.w, o.h, o.r); c.clip(); const s = (o.fit === "contain" ? Math.min : Math.max)(o.w / im.width, o.h / im.height); c.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); c.restore(); }
      else { c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(x, y, o.w, o.h); }
    }
    c.restore();
  }
  const HANDLES = [["nw", -1, -1], ["n", 0, -1], ["ne", 1, -1], ["e", 1, 0], ["se", 1, 1], ["s", 0, 1], ["sw", -1, 1], ["w", -1, 0]];
  const hList = o => (o.type === "text" ? HANDLES.filter(h => h[0].length === 2 || h[0] === "e" || h[0] === "w") : HANDLES);
  const uiScale = () => doc.w / (cv.getBoundingClientRect().width || doc.w);
  function paintUI(c) {
    const o = byId(sel); const s = uiScale();
    if (guides.v || guides.h) { c.save(); c.strokeStyle = "#28D9FF"; c.lineWidth = 1.5 * s; c.setLineDash([8 * s, 6 * s]); c.beginPath(); if (guides.v) { c.moveTo(doc.w / 2, 0); c.lineTo(doc.w / 2, doc.h); } if (guides.h) { c.moveTo(0, doc.h / 2); c.lineTo(doc.w, doc.h / 2); } c.stroke(); c.restore(); }
    if (!o || o.hidden) return;
    c.save(); c.translate(o.x + o.w / 2, o.y + o.h / 2); c.rotate(o.rot * Math.PI / 180);
    c.strokeStyle = "#28D9FF"; c.lineWidth = 2 * s; c.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h);
    if (!o.locked) {
      c.beginPath(); c.moveTo(0, -o.h / 2); c.lineTo(0, -o.h / 2 - 34 * s); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -o.h / 2 - 34 * s, 8 * s, 0, 7); c.fill(); c.stroke();
      hList(o).forEach(([, hx, hy]) => { c.fillStyle = "#fff"; const z = 11 * s; c.fillRect(hx * o.w / 2 - z / 2, hy * o.h / 2 - z / 2, z, z); c.strokeRect(hx * o.w / 2 - z / 2, hy * o.h / 2 - z / 2, z, z); });
    }
    c.restore();
  }
  function render() {
    if (!doc) return; if (cv.width !== doc.w || cv.height !== doc.h) { cv.width = doc.w; cv.height = doc.h; applyZoom(); }
    ctx.clearRect(0, 0, doc.w, doc.h); paintBg(ctx, doc, render); doc.objs.forEach(o => paintObj(ctx, o, render)); if (uiOn) paintUI(ctx);
  }
  function renderTo(canvas, d, scale) { const c = canvas.getContext("2d"); canvas.width = Math.round(d.w * scale); canvas.height = Math.round(d.h * scale); c.scale(scale, scale); paintBg(c, d, null); d.objs.forEach(o => paintObj(c, o, null)); }

  /* ---------- geometry ---------- */
  const byId = id => (doc ? doc.objs.find(o => o.id === id) : null);
  const rot = (x, y, a) => { const r = a * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r); return [x * cs - y * sn, x * sn + y * cs]; };
  const centre = o => [o.x + o.w / 2, o.y + o.h / 2];
  function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * doc.w / r.width, (e.clientY - r.top) * doc.h / r.height]; }
  function hitHandle(o, p) {
    const s = uiScale(), [cx, cy] = centre(o), tol = 15 * s;
    const [rx, ry] = rot(0, -o.h / 2 - 34 * s, o.rot); if (Math.hypot(p[0] - cx - rx, p[1] - cy - ry) < tol) return "rot";
    for (const [n, hx, hy] of hList(o)) { const [ax, ay] = rot(hx * o.w / 2, hy * o.h / 2, o.rot); if (Math.hypot(p[0] - cx - ax, p[1] - cy - ay) < tol) return n; }
    return null;
  }
  function hitObj(p) {
    for (let i = doc.objs.length - 1; i >= 0; i--) { const o = doc.objs[i]; if (o.hidden || o.locked) continue; const [cx, cy] = centre(o), [lx, ly] = rot(p[0] - cx, p[1] - cy, -o.rot);
      if (Math.abs(lx) <= o.w / 2 && Math.abs(ly) <= o.h / 2) return o; }
    return null;
  }

  /* ---------- history, autosave ---------- */
  const snap = () => JSON.stringify(doc);
  let timer = null, lastSnap = "";
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ doc, assets, tpl: tplId })); } catch (e) { try { localStorage.setItem(KEY, JSON.stringify({ doc: Object.assign({}, doc, { objs: doc.objs.filter(o => o.type !== "image") }), assets: {}, tpl: tplId })); } catch (e2) { /* storage unavailable */ } } }
  function commit() { const s = snap(); if (s === lastSnap) return; undo.push(lastSnap); if (undo.length > 80) undo.shift(); redo.length = 0; lastSnap = s; sync(); clearTimeout(timer); timer = setTimeout(save, 600); }
  const touch = AMI.debounce ? AMI.debounce(commit, 350) : commit;
  function restore(s) { doc = JSON.parse(s); if (sel && !byId(sel)) sel = null; lastSnap = s; render(); sync(true); clearTimeout(timer); timer = setTimeout(save, 600); }
  function doUndo() { if (!undo.length) return; redo.push(lastSnap); restore(undo.pop()); }
  function doRedo() { if (!redo.length) return; undo.push(lastSnap); restore(redo.pop()); }

  /* ---------- zoom ---------- */
  function applyZoom() {
    const wrap = $("#stage-wrap"); if (fit) { const maxW = wrap.clientWidth - 32, maxH = Math.max(320, Math.min(innerHeight * .8, 880)); zoom = Math.min(maxW / doc.w, maxH / doc.h, 1); }
    cv.style.width = Math.round(doc.w * zoom) + "px"; cv.style.height = Math.round(doc.h * zoom) + "px"; $("#st-zlabel").textContent = fit ? "Fit" : Math.round(zoom * 100) + "%"; render();
  }
  function setZoom(z) { fit = false; zoom = Math.min(2, Math.max(.1, z)); applyZoom(); }

  /* ---------- panels ---------- */
  const name = o => (o.type === "text" ? (o.text.replace(/\s+/g, " ").trim().slice(0, 22) || "Text") : { rect: "Box", ellipse: "Circle", image: "Image" }[o.type]);
  function layers() {
    const ul = $("#st-layers"); ul.innerHTML = "";
    [...doc.objs].reverse().forEach(o => {
      const li = document.createElement("li"); li.className = o.id === sel ? "on" : ""; li.dataset.id = o.id;
      li.innerHTML = `<button type="button" class="ln" data-a="pick">${AMI.esc(name(o))}</button><button type="button" data-a="vis" aria-label="${o.hidden ? "Show" : "Hide"} layer" title="Show/hide">${o.hidden ? "◌" : "●"}</button><button type="button" data-a="lock" aria-label="${o.locked ? "Unlock" : "Lock"} layer" title="Lock">${o.locked ? "🔒" : "🔓"}</button><button type="button" data-a="up" aria-label="Move up" title="Forward">↑</button><button type="button" data-a="down" aria-label="Move down" title="Back">↓</button>`;
      ul.appendChild(li);
    });
    if (!doc.objs.length) ul.innerHTML = '<li class="empty">No elements yet. Use “Add”.</li>';
  }
  const fld = (label, inner) => `<div class="field-row"><label>${label}</label>${inner}</div>`;
  const inp = (k, t, v, extra = "") => `<input data-k="${k}" data-t="${t}" ${t === "color" ? `type="color" value="${v}"` : t === "bool" ? `type="checkbox" ${v ? "checked" : ""}` : `type="number" value="${Math.round(v * 100) / 100}"`} ${extra}>`;
  function props(full) {
    const p = $("#st-props"), o = byId(sel);
    if (!o) {
      p.innerHTML = `<h2 class="panel-h">Design</h2><p class="muted">Click any element on the canvas to edit it. Drag to move, use the corner squares to resize and the round handle to rotate.</p>
      <p class="muted">Shortcuts: arrows nudge · Shift+arrows nudge more · Delete removes · Ctrl+Z / Ctrl+Y undo / redo · Ctrl+D duplicates.</p>`; return;
    }
    if (!full && p.dataset.for === o.id) { return; }
    p.dataset.for = o.id;
    let h = `<h2 class="panel-h">${{ text: "Text", rect: "Box", ellipse: "Circle", image: "Image" }[o.type]}</h2>`;
    if (o.type === "text") {
      const st = o.stroke || { c: "#000000", w: 0 }, sh = o.shadow || { c: "#000000", b: 0, x: 0, y: 0 };
      h += `<label class="sr-only" for="p-text">Text</label><textarea id="p-text" data-k="text" data-t="str" rows="3" maxlength="600"></textarea>
      <div class="field-row"><label for="p-font">Font</label><select class="control sm" id="p-font" data-k="font" data-t="str">${FONTS.map(f => `<option${f === o.font ? " selected" : ""} style="font-family:'${f}'">${f}</option>`).join("")}</select></div>
      ${fld("Size", inp("size", "num", o.size, 'min="6" max="900"'))}
      <div class="seg" role="group" aria-label="Text style"><button type="button" data-act="bold" aria-pressed="${o.weight === 700}"><b>B</b></button><button type="button" data-act="italic" aria-pressed="${o.italic}"><i>I</i></button><button type="button" data-act="upper" aria-pressed="${o.upper}">AA</button>
      <button type="button" data-act="al-left" aria-pressed="${o.align === "left"}" aria-label="Align left">⟸</button><button type="button" data-act="al-center" aria-pressed="${o.align === "center"}" aria-label="Align centre">⇔</button><button type="button" data-act="al-right" aria-pressed="${o.align === "right"}" aria-label="Align right">⟹</button></div>
      ${fld("Colour", inp("color", "color", o.color))}${fld("Letter spacing", inp("ls", "num", o.ls, 'step="1" min="-10" max="80"'))}${fld("Line height", inp("lh", "num", o.lh, 'step="0.05" min="0.6" max="3"'))}
      <h3 class="sub">Outline</h3>${fld("Colour", inp("stroke.c", "color", st.c))}${fld("Width", inp("stroke.w", "num", st.w, 'min="0" max="60"'))}
      <h3 class="sub">Shadow / glow</h3>${fld("Colour", inp("shadow.c", "color", sh.c))}${fld("Blur", inp("shadow.b", "num", sh.b, 'min="0" max="120"'))}${fld("Offset X", inp("shadow.x", "num", sh.x, 'min="-80" max="80"'))}${fld("Offset Y", inp("shadow.y", "num", sh.y, 'min="-80" max="80"'))}`;
    } else if (o.type === "image") {
      h += `<div class="field-row"><button type="button" class="btn btn-ghost btn-sm" data-act="replace">Replace photo</button></div><div class="seg"><button type="button" data-act="fit-cover" aria-pressed="${o.fit === "cover"}">Fill</button><button type="button" data-act="fit-contain" aria-pressed="${o.fit === "contain"}">Fit</button></div>${fld("Corner radius", inp("r", "num", o.r, 'min="0"'))}`;
    } else {
      h += `${fld("Fill", inp("fill", "color", o.fill))}${fld("Gradient", inp("g", "bool", !!o.fill2))}${fld("Gradient to", inp("fill2", "color", o.fill2 || "#00D9FF"))}${fld("Border", inp("stroke", "color", o.stroke || "#FFFFFF"))}${fld("Border width", inp("sw", "num", o.sw, 'min="0" max="80"'))}${o.type === "rect" ? fld("Corner radius", inp("r", "num", o.r, 'min="0"')) : ""}`;
    }
    h += `<h3 class="sub">Arrange</h3>${fld("Opacity", `<input type="range" data-k="op" data-t="num" min="0" max="1" step="0.01" value="${o.op}" aria-label="Opacity">`)}${fld("Rotation °", inp("rot", "num", o.rot, 'min="-360" max="360"'))}
      ${o.type !== "text" ? fld("Width", inp("w", "num", o.w, 'min="10"')) + fld("Height", inp("h", "num", o.h, 'min="4"')) : fld("Box width", inp("w", "num", o.w, 'min="40"'))}
      <div class="btn-row"><button type="button" class="mini" data-act="cx">Centre ↔</button><button type="button" class="mini" data-act="cy">Centre ↕</button><button type="button" class="mini" data-act="dup">Duplicate</button><button type="button" class="mini danger" data-act="del">Delete</button></div>`;
    p.innerHTML = h; const ta = $("#p-text", p); if (ta) ta.value = o.text;
  }
  function refreshInputs() { /* keep numeric fields in step with canvas drags without rebuilding the panel */
    const o = byId(sel); if (!o) return; $$("#st-props [data-k]").forEach(i => { if (document.activeElement === i) return; const v = getPath(o, i.dataset.k); if (v == null) return; if (i.dataset.t === "num") i.value = Math.round(v * 100) / 100; });
  }
  const getPath = (o, k) => k.split(".").reduce((a, p) => (a == null ? a : a[p]), o);
  function setPath(o, k, v) {
    const ps = k.split("."); if (ps.length === 1) { o[k] = v; return; }
    if (!o[ps[0]]) o[ps[0]] = ps[0] === "stroke" ? { c: "#000000", w: 0 } : { c: "#000000", b: 0, x: 0, y: 0 }; o[ps[0]][ps[1]] = v;
  }
  function sync(full) { if (doc) { $("#bg-c1").value = doc.bg.c1; $("#bg-c2").value = doc.bg.c2 || "#181B27"; } layers(); props(full); $("#st-undo").disabled = !undo.length; $("#st-redo").disabled = !redo.length; }
  function select(id) { sel = id; layers(); props(true); render(); }

  /* ---------- actions ---------- */
  const uidNew = () => "o" + uid++;
  function add(o) { o.id = uidNew(); doc.objs.push(o); select(o.id); commit(); }
  function addKind(k) {
    const W = doc.w, H = doc.h, base = { rot: 0, op: 1, hidden: false, locked: false };
    if (k === "heading" || k === "text") { const big = k === "heading"; add(Object.assign({ type: "text", x: W * .1, y: H * .4, w: W * .8, text: big ? "Your heading" : "Your text goes here", font: big ? "Space Grotesk" : "Inter", size: big ? 120 : 52, weight: big ? 700 : 400, italic: false, color: "#FFFFFF", align: "left", ls: 0, lh: 1.15, upper: false, stroke: null, shadow: null, h: 100 }, base)); }
    else if (k === "rect" || k === "ellipse") add(Object.assign({ type: k, x: W / 2 - 160, y: H / 2 - 160, w: 320, h: 320, fill: "#7865FF", fill2: null, stroke: null, sw: 0, r: k === "rect" ? 24 : 0 }, base));
    else if (k === "line") add(Object.assign({ type: "rect", x: W * .2, y: H / 2, w: W * .6, h: 8, fill: "#FFFFFF", fill2: null, stroke: null, sw: 0, r: 4 }, base));
  }
  function readImage(file, cb) {
    if (!file || !/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) { AMI.toast("Please choose a PNG, JPG, WEBP or GIF image.", "error"); return; }
    if (file.size > 25 * 1024 * 1024) { AMI.toast("That image is over 25 MB. Please use a smaller one.", "error"); return; }
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const s = Math.min(1, MAXIMG / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      const png = file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp"; const key = "a" + aid++; assets[key] = c.toDataURL(png ? "image/png" : "image/jpeg", .92); delete imgs[key]; cb(key, c.width, c.height); };
    im.onerror = () => { URL.revokeObjectURL(url); AMI.toast("Could not read that image.", "error"); }; im.src = url;
  }
  let imgMode = "add";
  function pickImage(mode) { imgMode = mode; const f = $("#st-imgfile"); f.value = ""; f.click(); }
  function onImage(file) {
    readImage(file, (key, iw, ih) => {
      if (imgMode === "bg") { doc.bg.img = key; render(); commit(); AMI.toast("Background photo added."); return; }
      if (imgMode === "replace" && byId(sel) && byId(sel).type === "image") { byId(sel).src = key; render(); commit(); return; }
      const s = Math.min(doc.w * .7 / iw, doc.h * .6 / ih), w = iw * s, h = ih * s; add({ type: "image", x: (doc.w - w) / 2, y: (doc.h - h) / 2, w, h, rot: 0, op: 1, hidden: false, locked: false, src: key, fit: "cover", r: 0 });
    });
  }
  function reorder(id, dir) { const i = doc.objs.findIndex(o => o.id === id), j = i + dir; if (i < 0 || j < 0 || j >= doc.objs.length) return; [doc.objs[i], doc.objs[j]] = [doc.objs[j], doc.objs[i]]; render(); commit(); }
  function del() { const i = doc.objs.findIndex(o => o.id === sel); if (i < 0) return; doc.objs.splice(i, 1); sel = null; render(); commit(); sync(true); }
  function dup() { const o = byId(sel); if (!o) return; const c = JSON.parse(JSON.stringify(o)); c.id = uidNew(); c.x += 30; c.y += 30; doc.objs.push(c); select(c.id); commit(); }

  /* ---------- loading designs ---------- */
  async function load(d, a, id) {
    const c = cleanDoc(d, a); if (!c) { AMI.toast("That design could not be opened.", "error"); return; }
    doc = c.doc; assets = c.assets; Object.keys(imgs).forEach(k => delete imgs[k]); aid = 1 + Math.max(0, ...Object.keys(assets).map(k => +k.slice(1)));
    sel = null; undo.length = 0; redo.length = 0; tplId = id || ""; fit = true; $("#st-size").value = ""; const m = AMI.studioSizes.find(s => s.w === doc.w && s.h === doc.h); if (m) $("#st-size").value = m.id;
    await ensureFonts(doc); lastSnap = snap(); applyZoom(); sync(true); clearTimeout(timer); timer = setTimeout(save, 600);
  }
  const loadTpl = t => { const d = t.make(); d.w = t.w; d.h = t.h; return load(d, {}, t.id); };

  function download() {
    const c = document.createElement("canvas"), jpg = $("#st-fmt").value === "jpg"; renderTo(c, doc, 1);
    c.toBlob(b => { if (!b) { AMI.toast("Could not create the image. Try a smaller canvas.", "error"); return; } const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `ai-manga-india-${tplId || "design"}.${jpg ? "jpg" : "png"}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); AMI.toast("Downloaded " + a.download); }, jpg ? "image/jpeg" : "image/png", .95);
  }
  function saveFile() {
    const b = new Blob([JSON.stringify({ app: "ami-studio", v: 1, doc, assets })], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = `ai-manga-india-${tplId || "design"}.ami`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); AMI.toast("Design file saved. Use “Open file” to continue editing later.");
  }
  function openFile(f) {
    if (!f) return; if (f.size > 60 * 1024 * 1024) { AMI.toast("That file is too large.", "error"); return; }
    const r = new FileReader(); r.onload = () => { try { const j = JSON.parse(r.result); if (j.app !== "ami-studio") throw 0; load(j.doc, j.assets || {}, "").then(() => { commit(); AMI.toast("Design opened."); }); } catch (e) { AMI.toast("That is not a valid design file.", "error"); } }; r.readAsText(f);
  }

  /* ---------- pointer interaction ---------- */
  const CUR = { nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", rot: "grab" };
  cv.addEventListener("pointerdown", e => {
    if (e.button > 0) return; cv.focus({ preventScroll: true }); const p = pt(e), cur = byId(sel); let mode = null, o = null;
    if (cur && !cur.locked && !cur.hidden) { const h = hitHandle(cur, p); if (h) { mode = h; o = cur; } }
    if (!mode) { o = hitObj(p); if (o) { mode = "move"; if (o.id !== sel) select(o.id); } else { if (sel) select(null); return; } }
    cv.setPointerCapture(e.pointerId); drag = { mode, p0: p, o0: JSON.parse(JSON.stringify(o)), id: o.id }; if (mode === "rot") cv.style.cursor = "grabbing";
  });
  cv.addEventListener("pointermove", e => {
    const p = pt(e);
    if (!drag) { const cur = byId(sel), h = cur && !cur.locked && !cur.hidden ? hitHandle(cur, p) : null; cv.style.cursor = h ? CUR[h] : hitObj(p) ? "move" : "default"; return; }
    const o = byId(drag.id), o0 = drag.o0, dx = p[0] - drag.p0[0], dy = p[1] - drag.p0[1]; if (!o) return; guides = { v: false, h: false };
    if (drag.mode === "move") {
      let x = o0.x + dx, y = o0.y + dy; const snapD = 9 * uiScale();
      if (Math.abs(x + o.w / 2 - doc.w / 2) < snapD) { x = doc.w / 2 - o.w / 2; guides.v = true; } if (Math.abs(y + o.h / 2 - doc.h / 2) < snapD) { y = doc.h / 2 - o.h / 2; guides.h = true; }
      o.x = x; o.y = y;
    } else if (drag.mode === "rot") {
      const [cx, cy] = centre(o0); let a = Math.atan2(p[1] - cy, p[0] - cx) * 180 / Math.PI + 90; a = ((a + 540) % 360) - 180;
      const nearest = Math.round(a / 15) * 15; if (e.shiftKey || Math.abs(a - nearest) < 4) a = nearest; o.rot = Math.round(a * 10) / 10;
    } else {
      const H = HANDLES.find(h => h[0] === drag.mode), hx = H[1], hy = H[2], [c0x, c0y] = centre(o0);
      const [ax, ay] = rot(-hx * o0.w / 2, -hy * o0.h / 2, o0.rot), A = [c0x + ax, c0y + ay];
      const [lx, ly] = rot(p[0] - A[0], p[1] - A[1], -o0.rot); let w = o0.w, h = o0.h;
      if (o.type === "text") {
        if (hx && hy) { const k = Math.max(.1, (lx * hx) / o0.w); o.size = Math.min(900, Math.max(6, o0.size * k)); o.w = Math.max(20, o0.w * k); }
        else o.w = Math.max(40, lx * hx);
        layout(o);
        /* anchor stays put; for side handles keep the top edge fixed while the height re-flows */
        const [ox, oy] = rot(hx * o.w / 2, hy ? hy * o.h / 2 : (o.h - o0.h) / 2, o0.rot);
        o.x = A[0] + ox - o.w / 2; o.y = A[1] + oy - o.h / 2;
      } else {
        if (hx && hy && (o.type === "image" || e.shiftKey)) { const s = Math.max(Math.abs(lx) / o0.w, Math.abs(ly) / o0.h); w = Math.max(10, o0.w * s); h = Math.max(10, o0.h * s); }
        else { if (hx) w = Math.max(10, lx * hx); if (hy) h = Math.max(4, ly * hy); }
        const [ox, oy] = rot(hx * w / 2, hy * h / 2, o0.rot); o.w = w; o.h = h; o.x = A[0] + ox - w / 2; o.y = A[1] + oy - h / 2;
      }
    }
    render(); refreshInputs();
  });
  const endDrag = () => { if (!drag) return; drag = null; guides = { v: false, h: false }; cv.style.cursor = "default"; render(); commit(); };
  cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  cv.addEventListener("dblclick", e => { const o = hitObj(pt(e)); if (o && o.type === "text") { select(o.id); const t = $("#p-text"); if (t) { t.focus(); t.select(); } } else if (o && o.type === "image") pickImage("replace"); });

  document.addEventListener("keydown", e => {
    const t = e.target, typing = /input|textarea|select/i.test(t.tagName) && !(t.type === "color" || t.type === "range" || t.type === "checkbox");
    const mod = e.ctrlKey || e.metaKey; if (typing) return;
    if (!doc || $(".modal.open")) return;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); return; }
    if (mod && e.key.toLowerCase() === "d" && sel) { e.preventDefault(); dup(); return; }
    const o = byId(sel); if (!o) return;
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); del(); return; }
    if (e.key === "Escape") { select(null); return; }
    const st = e.shiftKey ? 10 : 1, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv && !o.locked) { e.preventDefault(); o.x += mv[0]; o.y += mv[1]; render(); refreshInputs(); touch(); }
  });

  /* ---------- wiring ---------- */
  function wire() {
    const P = $("#st-props");
    const apply = i => { const o = byId(sel); if (!o || !i.dataset.k) return; let v = i.value; const t = i.dataset.t;
      if (t === "num") { v = parseFloat(v); if (!isFinite(v)) return; } else if (t === "bool") v = i.checked; 
      if (i.dataset.k === "g") { o.fill2 = v ? ($("[data-k=fill2]", P).value || "#00D9FF") : null; }
      else if (i.dataset.k === "fill2" && !o.fill2 && !$("[data-k=g]", P).checked) return;
      else if (i.dataset.k === "stroke" && o.type !== "text") { o.stroke = v; if (!o.sw) { o.sw = 6; const s = $("[data-k=sw]", P); if (s) s.value = 6; } }
      else if (i.dataset.k === "text") o.text = String(v).slice(0, 600);
      else setPath(o, i.dataset.k, v);
      if (i.dataset.k === "font") ensureFonts(doc).then(render);
      render(); touch(); if (i.dataset.k === "text") layers(); };
    P.addEventListener("input", e => apply(e.target)); P.addEventListener("change", e => { apply(e.target); commit(); if (e.target.dataset.k === "font") props(true); });
    P.addEventListener("click", e => { const b = e.target.closest("[data-act]"); const o = byId(sel); if (!b || !o) return; const a = b.dataset.act;
      if (a === "bold") o.weight = o.weight === 700 ? 400 : 700; else if (a === "italic") o.italic = !o.italic; else if (a === "upper") o.upper = !o.upper;
      else if (a.startsWith("al-")) o.align = a.slice(3); else if (a.startsWith("fit-")) o.fit = a.slice(4);
      else if (a === "cx") { o.x = (doc.w - o.w) / 2; } else if (a === "cy") { o.y = (doc.h - o.h) / 2; } else if (a === "dup") return dup(); else if (a === "del") return del(); else if (a === "replace") return pickImage("replace");
      ensureFonts(doc).then(render); render(); commit(); props(true); });
    $("#st-layers").addEventListener("click", e => { const b = e.target.closest("button"), li = e.target.closest("li"); if (!b || !li || !li.dataset.id) return; const id = li.dataset.id, o = byId(id), a = b.dataset.a;
      if (a === "pick") select(id); else if (a === "vis") { o.hidden = !o.hidden; render(); commit(); } else if (a === "lock") { o.locked = !o.locked; commit(); } else if (a === "up") reorder(id, 1); else if (a === "down") reorder(id, -1); });
    $$("[data-add]").forEach(b => b.addEventListener("click", () => (b.dataset.add === "image" ? pickImage("add") : addKind(b.dataset.add))));
    $("#st-imgfile").addEventListener("change", e => onImage(e.target.files[0]));
    $("#bg-img").addEventListener("click", () => pickImage("bg")); $("#bg-noimg").addEventListener("click", () => { doc.bg.img = null; render(); commit(); });
    const bg1 = $("#bg-c1"), bg2 = $("#bg-c2");
    bg1.addEventListener("input", () => { doc.bg.c1 = bg1.value; render(); touch(); }); bg2.addEventListener("input", () => { doc.bg.c2 = bg2.value; render(); touch(); }); $("#bg-solid").addEventListener("click", () => { doc.bg.c2 = null; render(); commit(); });
    const sz = $("#st-size"); sz.innerHTML = '<option value="" disabled>Custom size</option>' + AMI.studioSizes.map(s => `<option value="${s.id}">${AMI.esc(s.label)}</option>`).join("");
    sz.addEventListener("change", () => { const s = AMI.studioSizes.find(x => x.id === sz.value); if (!s) return; doc.w = s.w; doc.h = s.h; fit = true; applyZoom(); commit(); AMI.toast("Size changed. Elements keep their positions — drag them into place."); });
    $("#st-undo").addEventListener("click", doUndo); $("#st-redo").addEventListener("click", doRedo);
    $("#st-zin").addEventListener("click", () => setZoom(zoom * 1.2)); $("#st-zout").addEventListener("click", () => setZoom(zoom / 1.2)); $("#st-zfit").addEventListener("click", () => { fit = true; applyZoom(); });
    $("#st-download").addEventListener("click", download); $("#st-save").addEventListener("click", saveFile); $("#st-open").addEventListener("click", () => $("#st-openfile").click()); $("#st-openfile").addEventListener("change", e => { openFile(e.target.files[0]); e.target.value = ""; });
    const modal = $("#tpl-modal"), grid = $("#tpl-grid");
    $("#st-templates").addEventListener("click", () => AMI.openLayer(modal));
    AMI.studioTemplates.forEach(t => { const d = t.make(); d.w = t.w; d.h = t.h; const c = cleanDoc(d, {}).doc; const b = document.createElement("button"); b.type = "button"; b.className = "tpl";
      const cvs = document.createElement("canvas"); cvs.setAttribute("aria-hidden", "true"); b.append(cvs, Object.assign(document.createElement("span"), { textContent: t.name })); b.insertAdjacentHTML("beforeend", `<small>${t.w} × ${t.h}</small>`); grid.appendChild(b);
      const paint = () => renderTo(cvs, c, 260 / Math.max(c.w, c.h)); ensureFonts(c).then(paint); paint();
      b.addEventListener("click", () => { AMI.closeLayer(modal); loadTpl(t); }); });
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => fit && doc && applyZoom(), 120); });
    addEventListener("beforeunload", () => { try { save(); } catch (e) { /* */ } });
    $("#st-hint").addEventListener("animationend", e => e.target.remove());
  }

  AMI.onReady(async () => {
    if (!cv) return; wire();
    const q = new URLSearchParams(location.search).get("t"); let restored = false;
    if (!q) { try { const raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw && raw.doc) { await load(raw.doc, raw.assets || {}, raw.tpl || ""); restored = true; AMI.toast("Restored your last design from this browser."); } } catch (e) { /* ignore */ } }
    if (!restored) await loadTpl(AMI.studioTemplates.find(t => t.id === q) || AMI.studioTemplates[0]);
  });
})();

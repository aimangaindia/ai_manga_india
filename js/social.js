/* Social section: link cards + QR codes, driven entirely by AMI_CONFIG.socialProfiles.
   QR codes are generated in the browser (no network, no library). If you'd rather use your own
   branded QR image for a platform, set its `qrImage` path in config.js. */
(() => {
  "use strict";
  const AMI = window.AMI, cfg = window.AMI_CONFIG;

  /* ---------- Minimal QR Code encoder: byte mode, error-correction level M, versions 1-20 ---------- */
  const ECC_PER_BLOCK = [0,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26];
  const NUM_BLOCKS    = [0,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16];
  const rawModules = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const a = Math.floor(v / 7) + 2; r -= (25 * a - 10) * a - 55; if (v >= 7) r -= 36; } return r; };
  const dataCapacity = v => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v];
  const gfMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
  const rsDivisor = d => { const r = new Array(d).fill(0); r[d - 1] = 1; let root = 1;
    for (let i = 0; i < d; i++) { for (let j = 0; j < d; j++) { r[j] = gfMul(r[j], root); if (j + 1 < d) r[j] ^= r[j + 1]; } root = gfMul(root, 2); } return r; };
  const rsRemainder = (data, div) => { const r = new Array(div.length).fill(0);
    for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); } return r; };
  const MASKS = [(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,
    (x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];

  function qrMatrix(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 1;
    while (ver <= 20) { const cc = ver < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCapacity(ver) * 8) break; ver++; }
    if (ver > 20) return null; // text too long
    const size = ver * 4 + 17;
    // --- bit stream
    const bits = []; const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const capBits = dataCapacity(ver) * 8;
    put(0, Math.min(4, capBits - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < capBits; pad ^= 0xEC ^ 0x11) put(pad, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    // --- error correction + interleave
    const nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const len = shortLen - eccLen + (i < nShort ? 0 : 1); const d = data.slice(k, k + len); k += len;
      const e = rsRemainder(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e)); }
    const all = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) all.push(b[i]); });
    // --- function patterns
    const mod = Array.from({ length: size }, () => new Array(size).fill(false)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, v) => { mod[y][x] = v; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    if (ver > 1) { const n = Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2; const pos = [6];
      for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
      pos.forEach((cx, i) => pos.forEach((cy, j) => { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); })); }
    const drawFormat = mask => { const d = mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i)); set(8, size - 8, true); };
    drawFormat(0);
    if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) { const v = ((b >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, v); set(c, a, v); } }
    // --- place data (zig-zag)
    let k = 0; for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && k < all.length * 8) { mod[y][x] = ((all[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0; k++; } } }
    // --- choose the mask with the lowest penalty
    const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; };
    const penalty = () => { let p = 0, dark = 0;
      const line = get => { for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
        for (let b = 0; b + 10 < size; b++) { const s = []; for (let t = 0; t < 11; t++) s.push(get(a, b + t) ? 1 : 0); const j = s.join("");
          if (j === "10111010000" || j === "00001011101") p += 40; } } };
      line((a, b) => mod[a][b]); line((a, b) => mod[b][a]);
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      mod.forEach(r => r.forEach(c => { if (c) dark++; })); p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10; return p; };
    let best = 0, bestP = Infinity; for (let m = 0; m < 8; m++) { apply(m); drawFormat(m); const p = penalty(); if (p < bestP) { best = m; bestP = p; } apply(m); }
    apply(best); drawFormat(best); return mod;
  }

  /** Branded QR card as an SVG string: round dots in the platform colour, rounded finder squares,
      the platform icon in the middle and the handle underneath. Stays scannable (error-correction M,
      logo covers only ~5% of the code). o = { fg, bg, icon, caption } */
  AMI.qrSvg = (text, label, o = {}) => {
    const m = qrMatrix(text); if (!m) return "";
    const n = m.length, q = 4, fg = o.fg || "#0b0d16", bg = o.bg || "#ffffff", cap = (o.caption || "").toUpperCase();
    const W = n + q * 2, H = W + (cap ? 4.5 : 0);
    let clear = Math.round(n * 0.17); if (clear % 2 === 0) clear++; clear = Math.max(clear, 5);
    const c0 = Math.floor((n - clear) / 2), inFinder = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    let dots = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!m[y][x] || inFinder(x, y)) continue;
      if (o.icon && Math.hypot(x + .5 - n / 2, y + .5 - n / 2) < clear / 2 + .6) continue;
      dots += `<circle cx="${x + q + .5}" cy="${y + q + .5}" r=".47"/>`;
    }
    const finder = (x, y) => `<rect x="${x + q + .5}" y="${y + q + .5}" width="6" height="6" rx="0.5" fill="none" stroke="${fg}" stroke-width="1"/><rect x="${x + q + 2}" y="${y + q + 2}" width="3" height="3" rx="0.3" fill="${fg}"/>`;
    const mid = W / 2, r = (clear + 1) / 2 + .2, k = (clear - .6) / 24;
    const logo = o.icon ? `<circle cx="${mid}" cy="${mid}" r="${r}" fill="${bg}"/><g transform="translate(${mid - 12 * k} ${mid - 12 * k}) scale(${k})" fill="none" stroke="${fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${AMI.iconInner(o.icon)}</g>` : "";
    const fs = Math.min(2.7, (W - 4) / (cap.length * .66 || 1));
    const caption = cap ? `<text x="${mid}" y="${W + 1.6}" text-anchor="middle" dominant-baseline="middle" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-weight="700" font-size="${fs.toFixed(2)}" letter-spacing=".08" fill="${fg}">${AMI.esc(cap)}</text>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${AMI.esc(label || "QR code")}"><rect width="${W}" height="${H}" rx="3" fill="${bg}"/><g fill="${fg}">${dots}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}${logo}${caption}</svg>`;
  };

  // Brand look of each platform's QR card: deep brand shades, so contrast on the light card stays high and the code scans reliably.
  const BRAND = { youtube: { fg: "#b30b05" }, instagram: { fg: "#8f5300" }, snapchat: { fg: "#111111", bg: "#fffc00" }, linkedin: { fg: "#07458a" },
    facebook: { fg: "#0f4bb8" }, xsocial: { fg: "#111111" }, telegram: { fg: "#0b6288" }, pinterest: { fg: "#9e0017" } };
  const qrFor = p => AMI.qrSvg(p.href, `QR code for ${p.name}`, { ...(BRAND[p.id] || {}), icon: p.icon || p.id, caption: p.handle });

  /* ---------- Section rendering ---------- */
  const cleanUrl = u => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
  const profiles = () => (cfg.socialProfiles || []).map(p => ({ ...p, href: cleanUrl(p.url) })).filter(p => p.href);

  function download(p, svg) {
    const img = new Image(), blob = new Blob([svg], { type: "image/svg+xml" }), url = URL.createObjectURL(blob);
    img.onload = () => { const c = document.createElement("canvas"); const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); c.width = 1024; c.height = Math.round(1024 * vb[2] / vb[1]); const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      const a = document.createElement("a"); a.download = `ai-manga-india-${p.id}-qr.png`; a.href = c.toDataURL("image/png"); a.click(); };
    img.src = url;
  }

  function render(root) {
    const list = profiles();
    const head = `<div class="section-head reveal center"><span class="eyebrow">Follow the studio</span><h2 id="soc-h">Find us on social media.</h2>
      <p>Follow AI MANGA INDIA for new work and updates — tap a card, or scan its QR code with your phone camera.</p></div>`;
    if (!list.length) {
      root.innerHTML = `<div class="container">${head}<div class="notice" style="max-width:560px;margin-inline:auto;text-align:center"><p><strong>Social channels coming soon.</strong> Links will appear here once they are added.</p></div></div>`;
      return;
    }
    root.innerHTML = `<div class="container">${head}<div class="social-grid">${list.map(p => {
      const qr = p.qrImage ? `<img src="${AMI.esc(p.qrImage)}" alt="QR code for ${AMI.esc(p.name)}" loading="lazy" decoding="async">` : qrFor(p);
      return `<article class="card social-card reveal" data-id="${AMI.esc(p.id)}">
        <div class="social-top"><span class="icon-wrap">${AMI.icon(p.icon || p.id)}</span><div><h3>${AMI.esc(p.name)}</h3><p class="handle">${AMI.esc(p.handle || p.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</p></div></div>
        <div class="qr-box${p.qrImage ? " is-img" : ""}">${qr}</div>
        <div class="social-actions"><a class="btn btn-primary" href="${AMI.esc(p.href)}" target="_blank" rel="noopener noreferrer">Open ${AMI.esc(p.name)}</a>
        ${p.qrImage ? `<a class="btn btn-ghost" href="${AMI.esc(p.qrImage)}" download="ai-manga-india-${AMI.esc(p.id)}-qr${AMI.esc((p.qrImage.match(/\.\w+$/) || [".png"])[0])}">Download QR</a>` : `<button class="btn btn-ghost" type="button" data-dl="${AMI.esc(p.id)}">Download QR</button>`}</div></article>`; }).join("")}</div></div>`;
    root.addEventListener("click", e => { const b = e.target.closest("[data-dl]"); if (!b) return; const p = list.find(x => x.id === b.dataset.dl);
      download(p, qrFor(p)); AMI.toast(`${p.name} QR code saved`, "success"); });
    AMI.observeReveal(root);
  }

  /* Icon row (contact page): one round icon per profile that has a link; updates itself when links are added to config.js */
  function renderIcons(box) {
    const list = profiles(); const wrap = box.closest("[data-social-wrap]");
    box.innerHTML = list.map(p => `<a href="${AMI.esc(p.href)}" target="_blank" rel="noopener noreferrer" aria-label="${AMI.esc(p.name)}" title="${AMI.esc(p.name)}">${AMI.icon(p.icon || p.id)}</a>`).join("");
    if (wrap) wrap.hidden = !list.length;
  }

  AMI.onReady(() => { const root = AMI.$("#social-section"); if (root) render(root); AMI.$$("[data-social-icons]").forEach(renderIcons); });
})();

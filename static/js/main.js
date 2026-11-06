/* AI MANGA INDIA — site behaviour. No inline scripts (strict CSP). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const csrf = () => ($('meta[name=csrf]') || {}).content || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = p => '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 });

  async function api(url, body, method) {
    const opt = { method: method || (body ? 'POST' : 'GET'), headers: { 'X-CSRFToken': csrf() }, credentials: 'same-origin' };
    if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    let r, data = {};
    try { r = await fetch(url, opt); data = await r.json().catch(() => ({})); }
    catch (e) { return { ok: false, error: 'Network problem. Check your connection and try again.', status: 0 }; }
    data.status = r.status; if (data.ok === undefined) data.ok = r.ok;
    return data;
  }

  /* ---- toasts ---- */
  function toast(msg, kind = 'ok') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg;
    $('#toasts').append(t); setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 3600);
  }

  /* ---- page loading bar + header ---- */
  const bar = $('#loadbar');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (a && a.origin === location.origin && !a.target && !e.metaKey && !e.ctrlKey && a.pathname !== location.pathname && !a.hasAttribute('data-lightbox')) { bar.style.width = '70%'; }
  });
  addEventListener('pageshow', () => { bar.style.width = '0'; });
  const hdr = $('#hdr');
  const totop = $('#totop');
  const onScroll = () => { hdr.classList.toggle('scrolled', scrollY > 8); totop.classList.toggle('on', scrollY > 700); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  totop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---- mobile menu ---- */
  const burger = $('#burger'), mnav = $('#mnav');
  burger.addEventListener('click', () => {
    const on = mnav.classList.toggle('on'); burger.setAttribute('aria-expanded', on);
    burger.querySelector('use').setAttribute('href', on ? '#i-x' : '#i-menu'); document.body.style.overflow = on ? 'hidden' : '';
  });

  /* ---- overlay helpers (drawer / modal / search / lightbox) ---- */
  const scrim = $('#scrim');
  let openEl = null, lastFocus = null;
  function openOv(el, cls = 'on') {
    lastFocus = document.activeElement; openEl = el; el.classList.add(cls); el.setAttribute('aria-hidden', 'false');
    if (el.id !== 'search' && el.id !== 'lb') scrim.classList.add('on');
    document.body.style.overflow = 'hidden';
    const f = el.querySelector('input,button,a,[tabindex]'); if (f) setTimeout(() => f.focus(), 50);
  }
  function closeOv() {
    if (!openEl) return; openEl.classList.remove('on'); openEl.setAttribute('aria-hidden', 'true'); scrim.classList.remove('on');
    if (openEl.id === 'lb') $('#lb-body').innerHTML = '';
    document.body.style.overflow = ''; openEl = null; if (lastFocus) lastFocus.focus();
  }
  scrim.addEventListener('click', closeOv);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOv();
    if (e.key === 'Tab' && openEl) {   // keep focus inside the open overlay
      const f = $$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', openEl).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (openEl && openEl.id === 'lb') { if (e.key === 'ArrowRight') lbStep(1); if (e.key === 'ArrowLeft') lbStep(-1); }
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeOv(); });

  /* ---- cart store (localStorage with in-memory fallback) ---- */
  const KEY = 'ami_cart_v1'; let mem = [];
  const Cart = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || '[]').filter(Number.isInteger); } catch { return mem; } },
    set(a) { mem = a; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { } syncBadge(); document.dispatchEvent(new Event('cart:change')); },
    add(id) { const a = this.get(); if (a.includes(id)) return false; a.push(id); this.set(a); return true; },
    remove(id) { this.set(this.get().filter(x => x !== id)); },
    clear() { this.set([]); }
  };
  function syncBadge() { const n = Cart.get().length; const b = $('#cart-count'); b.textContent = n || ''; b.dataset.n = n; }
  syncBadge();

  async function fetchItems() {
    const ids = Cart.get(); if (!ids.length) return [];
    const r = await api('/api/cart?ids=' + ids.join(',')); const items = r.items || [];
    const live = items.map(i => i.id); if (live.length !== ids.length) Cart.set(ids.filter(i => live.includes(i)));   // drop products that no longer exist
    return items;
  }
  const emptyHtml = `<div class="empty"><svg class="icon"><use href="#i-cart"/></svg><p>Your cart is empty.</p><a class="btn btn-primary" href="/shop">Browse the shop</a></div>`;
  const lineHtml = (i, removable = true) => `<div class="line"><a href="${esc(i.url)}"><img src="${esc(i.thumb)}" alt="" loading="lazy"></a>
    <div><h4><a href="${esc(i.url)}">${esc(i.name)}</a></h4><div class="m">${esc(i.category)} · ${esc(i.format)}</div>${removable ? `<button class="rm" data-remove="${i.id}">Remove</button>` : ''}</div>
    <div class="price">${esc(i.price_label)}${i.original_label ? `<s>${esc(i.original_label)}</s>` : ''}</div></div>`;

  async function renderDrawer() {
    const box = $('#drawer-items'), foot = $('#drawer-foot');
    box.innerHTML = '<div class="skel" style="margin:16px 0;height:80px"></div>';
    const items = await fetchItems();
    if (!items.length) { box.innerHTML = emptyHtml; foot.innerHTML = ''; return; }
    box.innerHTML = items.map(i => lineHtml(i)).join('');
    const sub = items.reduce((s, i) => s + i.price, 0);
    foot.innerHTML = `<div class="sum total" style="border:0;margin:0;padding:0 0 14px"><span>Subtotal</span><span>${inr(sub)}</span></div>
      <a class="btn btn-primary btn-block" href="/checkout">Checkout</a><a class="btn btn-ghost btn-block" style="margin-top:8px" href="/cart">View cart</a>`;
  }
  async function openCart() { openOv($('#drawer')); renderDrawer(); }
  $('#open-cart').addEventListener('click', openCart);
  document.addEventListener('cart:change', () => { if (openEl && openEl.id === 'drawer') renderDrawer(); if (page === 'cart') renderCartPage(); });

  document.addEventListener('click', e => {
    const rm = e.target.closest('[data-remove]'); if (rm) { Cart.remove(+rm.dataset.remove); toast('Removed from cart'); }
    const add = e.target.closest('[data-add]');
    if (add) { const id = +add.dataset.add; if (Cart.add(id)) { toast(`Added “${add.dataset.name}” to cart`); if (innerWidth > 860) { closeOv(); openCart(); } } else toast('Already in your cart'); }
    const buy = e.target.closest('[data-buy]'); if (buy) { Cart.add(+buy.dataset.buy); location.href = '/checkout'; }
  });

  /* ---- quick view ---- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-quick]'); if (!b) return;
    const p = await api('/api/product/' + b.dataset.quick); if (!p.id) return toast('Could not load product', 'error');
    $('#qv').innerHTML = `<button class="ibtn x" data-close aria-label="Close"><svg class="icon"><use href="#i-x"/></svg></button><div class="qv-grid"><img src="${esc(p.thumb)}" alt="${esc(p.name)} preview"><div class="in">
      <span class="tag blue">${esc(p.category)}</span><h2 style="font-size:1.5rem;margin-top:10px">${esc(p.name)}</h2><p>${esc(p.short)}</p>
      <div class="price" style="font-size:1.6rem">${esc(p.price_label)}${p.original_label ? `<s>${esc(p.original_label)}</s>` : ''}</div>
      <ul class="checks" style="margin:12px 0">${p.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <p class="small muted">${esc(p.format)} · ${esc(p.compat)}</p>${p.demo ? '<div class="notice">Demonstration listing.</div>' : ''}
      <div style="display:grid;gap:8px"><button class="btn btn-primary" data-buy="${p.id}">Buy Now</button><button class="btn btn-ghost" data-add="${p.id}" data-name="${esc(p.name)}">Add to Cart</button><a class="btn btn-text" href="${esc(p.url)}">View product details</a></div></div></div>`;
    openOv($('#qv'));
  });

  /* ---- search ---- */
  const sov = $('#search'), sin = $('#search-input'), sres = $('#search-res'); let st;
  $('#open-search').addEventListener('click', () => openOv(sov));
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openOv(sov); } });
  sin.addEventListener('input', () => {
    clearTimeout(st); const v = sin.value.trim();
    if (v.length < 2) { sres.innerHTML = '<p class="muted">Type at least two letters.</p>'; return; }
    st = setTimeout(async () => {
      const r = await api('/api/search?q=' + encodeURIComponent(v)); const sec = (t, a) => a.length ? `<h4>${t}</h4>` + a.map(x => `<a href="${esc(x.url)}">${x.thumb ? `<img src="${esc(x.thumb)}" alt="">` : ''}<span>${esc(x.title)}${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</span></a>`).join('') : '';
      const html = sec('Products', r.products || []) + sec('Portfolio', r.work || []) + sec('Services', r.services || []);
      sres.innerHTML = html || `<p class="muted">No results for “${esc(v)}”.</p>`;
    }, 200);
  });

  /* ---- reveal on scroll (only where marked) ---- */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .12 });
    $$('.steps .step,.why').forEach(el => { el.classList.add('rv'); io.observe(el); });
  }

  /* ---- generic forms ---- */
  $$('[data-autosubmit]').forEach(s => s.addEventListener('change', () => s.form.submit()));
  $$('form[data-newsletter]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault(); const msg = $('[data-news-msg]'); const email = f.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Enter a valid email address.'; msg.style.color = 'var(--bad)'; return; }
    const btn = $('button', f); btn.disabled = true;
    const r = await api('/api/newsletter', { email, website: f.website.value });
    btn.disabled = false; msg.textContent = r.ok ? r.message : r.error; msg.style.color = r.ok ? 'var(--ok)' : 'var(--bad)'; if (r.ok) f.reset();
  }));

  const inq = $('#inquiry-form');
  if (inq) inq.addEventListener('submit', async e => {
    e.preventDefault(); const m = $('#inq-msg'); $$('.field', inq).forEach(f => { f.classList.remove('bad'); $('.err', f).textContent = ''; });
    const d = Object.fromEntries(new FormData(inq)); const bad = {};
    if (d.name.trim().length < 2) bad.name = 'Enter your full name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) bad.email = 'Enter a valid email address.';
    if (!d.service) bad.service = 'Choose a service.';
    if (d.description.trim().length < 20) bad.description = 'Describe your project in at least 20 characters.';
    const show = errs => { Object.entries(errs).forEach(([k, v]) => { const el = inq.elements[k]; if (el) { const f = el.closest('.field'); f.classList.add('bad'); $('.err', f).textContent = v; } }); const first = $('.field.bad input,.field.bad select,.field.bad textarea', inq); if (first) first.focus(); };
    if (Object.keys(bad).length) { show(bad); m.className = 'form-msg err show'; m.textContent = 'Please fix the highlighted fields.'; return; }
    const btn = $('button[type=submit]', inq); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Sending';
    const r = await api('/api/inquiry', d); btn.disabled = false; btn.textContent = 'Submit Project Inquiry';
    if (r.ok) { m.className = 'form-msg ok show'; m.textContent = r.message; inq.reset(); scrollTo({ top: inq.offsetTop - 120, behavior: reduce ? 'auto' : 'smooth' }); }
    else { if (r.errors) show(r.errors); m.className = 'form-msg err show'; m.textContent = r.error || 'Something went wrong. Please try again.'; }
  });

  /* ---- portfolio filter + search ---- */
  const pf = $('#pf-grid');
  if (pf) {
    let cat = 'all', term = ''; const cards = $$('.work', pf);
    const apply = () => { let n = 0; cards.forEach(c => { const ok = (cat === 'all' || c.dataset.cat === cat) && (!term || c.dataset.title.includes(term)); c.classList.toggle('hide', !ok); if (ok) n++; }); $('#pf-empty').hidden = n > 0; };
    $$('[data-filter]').forEach(b => b.addEventListener('click', () => { cat = b.dataset.filter; $$('[data-filter]').forEach(x => x.setAttribute('aria-pressed', x === b)); apply(); }));
    $('#pf-search').addEventListener('input', e => { term = e.target.value.trim().toLowerCase(); apply(); });
  }

  /* ---- lightbox ---- */
  let lbItems = [], lbI = 0;
  function lbShow() { $('#lb-body').innerHTML = `<img src="${esc(lbItems[lbI])}" alt="">`; $$('#lb .nv').forEach(b => b.style.display = lbItems.length > 1 ? '' : 'none'); }
  function lbStep(d) { lbI = (lbI + d + lbItems.length) % lbItems.length; lbShow(); }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-lightbox]'); if (!a) return; e.preventDefault();
    lbItems = $$('[data-lightbox]').map(x => x.getAttribute('href')); lbI = lbItems.indexOf(a.getAttribute('href')); lbShow(); openOv($('#lb'));
  });
  $('#lb .prev').addEventListener('click', () => lbStep(-1)); $('#lb .next').addEventListener('click', () => lbStep(1));

  /* ---- hero: video fallback + sparse particles ---- */
  const hv = $('#hero-video'); if (hv) { hv.addEventListener('error', () => hv.remove()); hv.play && hv.play().catch(() => { }); }
  const cv = $('#hero-canvas');
  if (cv && !reduce) {
    const c = cv.getContext('2d'); let w, h, ps = [], run = true;
    const fit = () => { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight; ps = Array.from({ length: Math.min(46, w / 28 | 0) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + .4, v: Math.random() * .25 + .06, a: Math.random() * .6 + .2 })); };
    fit(); addEventListener('resize', fit);
    document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) tick(); });
    new IntersectionObserver(es => { run = es[0].isIntersecting; if (run) tick(); }).observe(cv);
    function tick() { if (!run) return; c.clearRect(0, 0, w, h); ps.forEach(p => { p.y -= p.v; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; } c.fillStyle = `rgba(190,225,255,${p.a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.3); c.fill(); }); requestAnimationFrame(tick); }
    tick();
  }

  /* ---- cart page ---- */
  async function renderCartPage() {
    const box = $('#cart-lines'), side = $('#cart-summary'); const items = await fetchItems();
    if (!items.length) { box.innerHTML = emptyHtml; side.hidden = true; return; }
    box.innerHTML = items.map(i => lineHtml(i)).join(''); const sub = items.reduce((s, i) => s + i.price, 0);
    $('#c-sub').textContent = $('#c-total').textContent = inr(sub); side.hidden = false;
  }
  if (page === 'cart') renderCartPage();

  /* ---- checkout ---- */
  const co = $('#checkout');
  if (co) {
    let items = [], code = '', total = 0;
    const msg = $('#co-msg'), payBtn = $('#pay');
    const say = (t, k = 'err') => { msg.className = 'form-msg show ' + k; msg.textContent = t; };
    async function load() {
      items = await fetchItems();
      if (!items.length) { $('#co-lines').innerHTML = emptyHtml; $('#co-box').hidden = true; return; }
      $('#co-lines').innerHTML = items.map(i => lineHtml(i)).join(''); const sub = items.reduce((s, i) => s + i.price, 0); total = sub;
      $('#co-sub').textContent = inr(sub); $('#co-total').textContent = inr(sub); if (code) applyCoupon(true);
    }
    async function applyCoupon(quiet) {
      const v = $('#coupon').value.trim(); const err = $('#coupon-err'); err.parentElement.classList.remove('bad'); err.textContent = '';
      if (!v) { code = ''; $('#co-disc-row').hidden = true; await load(); return; }
      const r = await api('/api/coupon', { ids: Cart.get(), code: v });
      if (!r.ok) { code = ''; err.parentElement.classList.add('bad'); err.textContent = r.error; $('#co-disc-row').hidden = true; $('#co-total').textContent = $('#co-sub').textContent; return; }
      code = r.code; $('#co-disc-row').hidden = false; $('#co-disc').textContent = '−' + r.discount_label; $('#co-total').textContent = r.total_label; total = r.total; if (!quiet) toast('Coupon applied');
    }
    $('#apply-coupon').addEventListener('click', () => applyCoupon());
    load();
    if (payBtn) payBtn.addEventListener('click', async () => {
      msg.className = 'form-msg'; payBtn.disabled = true; const label = payBtn.textContent; payBtn.innerHTML = '<span class="spin"></span> Please wait';
      const reset = () => { payBtn.disabled = false; payBtn.textContent = label; };
      const r = await api('/api/checkout/create', { ids: Cart.get(), code });
      if (r.status === 401 && r.login_url) { location.href = r.login_url; return; }
      if (!r.ok) { say(r.error || 'Could not start checkout.'); return reset(); }
      const done = url => { Cart.clear(); location.href = url; };
      if (r.free) return done(r.redirect);
      if (r.provider === 'demo') { const d = await api('/api/checkout/demo-pay', { order_no: r.order_no }); if (d.ok) return done(d.redirect); say(d.error || 'Test payment failed.'); return reset(); }
      // Razorpay Checkout
      try {
        await new Promise((res, rej) => { if (window.Razorpay) return res(); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = res; s.onerror = rej; document.head.append(s); });
      } catch { say('The payment window could not load. Check your connection and try again.'); return reset(); }
      const rz = new Razorpay({
        key: r.key, amount: r.amount, currency: 'INR', name: 'AI MANGA INDIA', order_id: r.razorpay_order_id, prefill: { name: r.name, email: r.email }, theme: { color: '#397BFF' },
        handler: async resp => {
          payBtn.innerHTML = '<span class="spin"></span> Verifying payment';
          const v = await api('/api/checkout/verify', { order_no: r.order_no, ...resp });
          if (v.ok) done(v.redirect); else { say(v.error); reset(); }
        },
        modal: { ondismiss: () => { say('Payment was not completed. You have not been charged unless your bank says otherwise.', 'err'); reset(); } }
      });
      rz.on('payment.failed', ev => say((ev.error && ev.error.description) || 'Payment failed. Try another method.'));
      rz.open();
    });
  }

  /* ---- downloads ---- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-download]'); if (!b) return; b.disabled = true;
    const r = await api('/api/download-link', { item_id: +b.dataset.download }); b.disabled = false;
    if (r.ok) { toast('Starting download'); location.href = r.url; } else toast(r.error || 'Download unavailable', 'error');
  });

  /* ---- confirm destructive admin forms ---- */
  document.addEventListener('submit', e => { const m = e.target.dataset && e.target.dataset.confirm; if (m && !confirm(m)) e.preventDefault(); });

  /* ---- hash scroll offset for sticky header ---- */
  if (location.hash) setTimeout(() => { const t = $(location.hash); if (t) t.scrollIntoView(); }, 50);
})();

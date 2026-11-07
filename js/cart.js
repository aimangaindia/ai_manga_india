/* cart.js — cart state (localStorage), cart drawer, cart page, checkout page, payment hand-off.
   SECURITY: the browser never decides that a payment succeeded. startPayment() only redirects after
   YOUR server confirms the payment signature. Prices are re-calculated on the server in production. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const cfg = AMI.cfg, ic = AMI.icon, KEY = "ami_cart_v1", MAX_QTY = 10;
  const byId = id => AMI.data.products.find(p => p.id === id);

  let state = AMI.store.get(KEY, { items: [], coupon: "" });
  if (!Array.isArray(state.items)) state = { items: [], coupon: "" };
  state.items = state.items.filter(i => byId(i.id)); // drop products that no longer exist
  const save = () => { AMI.store.set(KEY, state); document.dispatchEvent(new CustomEvent("ami:cart")); };

  const cart = (AMI.cart = {
    lines: () => state.items.map(i => ({ ...i, product: byId(i.id) })),
    count: () => state.items.reduce((n, i) => n + i.qty, 0),
    add(id, qty = 1) { const p = byId(id); if (!p) return; const l = state.items.find(i => i.id === id); if (l) l.qty = Math.min(MAX_QTY, l.qty + qty); else state.items.push({ id, qty }); save(); },
    setQty(id, qty) { const l = state.items.find(i => i.id === id); if (!l) return; l.qty = Math.max(1, Math.min(MAX_QTY, qty)); save(); },
    remove(id) { state.items = state.items.filter(i => i.id !== id); if (!state.items.length) state.coupon = ""; save(); },
    clear() { state = { items: [], coupon: "" }; save(); },
    coupon: () => state.coupon,
    applyCoupon(code) {
      const c = (code || "").trim().toUpperCase(), def = cfg.coupons[c];
      if (!c) return { ok: false, msg: "Enter a discount code." };
      if (!def) return { ok: false, msg: "That code isn't valid." };
      state.coupon = c; save(); return { ok: true, msg: `Code applied: ${def.label}` };
    },
    removeCoupon() { state.coupon = ""; save(); },
    totals() {
      const subtotal = cart.lines().reduce((s, l) => s + l.product.price * l.qty, 0), def = cfg.coupons[state.coupon];
      let discount = 0; if (def) discount = def.type === "percent" ? Math.round(subtotal * def.value) / 100 : Math.min(def.value, subtotal);
      return { subtotal, discount, total: Math.max(0, subtotal - discount) };
    },
    hasSamples: () => cart.lines().some(l => !l.product.available)
  });

  /* ---------- shared pieces ---------- */
  const summaryHTML = () => {
    const t = cart.totals();
    return `<div class="row"><span>Subtotal</span><span>${AMI.money(t.subtotal)}</span></div>
      ${t.discount ? `<div class="row"><span>Discount (${AMI.esc(cart.coupon())})</span><span>− ${AMI.money(t.discount)}</span></div>` : ""}
      <div class="row"><span>Taxes</span><span style="font-size:.85rem">Calculated at payment, if applicable</span></div>
      <div class="row total"><span>Total</span><span>${AMI.money(t.total)}</span></div>`;
  };
  const emptyHTML = () => `<div class="empty-state">${ic("cart")}<h3>Your cart is empty</h3><p>Explore premium digital assets for your next project.</p><a class="btn btn-primary" href="shop.html">Browse the Digital Shop</a></div>`;
  const qtyHTML = l => `<div class="qty" role="group" aria-label="Quantity for ${AMI.esc(l.product.name)}"><button type="button" data-qty="${l.id}" data-d="-1" aria-label="Decrease">−</button><output aria-live="polite">${l.qty}</output><button type="button" data-qty="${l.id}" data-d="1" aria-label="Increase">+</button></div>`;
  const sampleNote = () => cart.hasSamples() ? `<div class="notice" style="margin-top:16px"><p><strong>Sample products in cart.</strong> They demonstrate the store design and can't be purchased yet.</p></div>` : "";

  /* ---------- drawer ---------- */
  function drawer() {
    const d = document.createElement("div"); d.className = "drawer"; d.id = "cart-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Shopping cart"); d.setAttribute("aria-hidden", "true");
    d.innerHTML = `<div class="modal-backdrop" data-close></div><aside class="drawer-panel"><div class="drawer-head"><h2>Your Cart</h2><button class="icon-btn" type="button" data-close aria-label="Close cart">${ic("x")}</button></div><div class="drawer-body" id="drawer-body"></div><div class="drawer-foot" id="drawer-foot"></div></aside>`;
    document.body.appendChild(d);
    const body = AMI.$("#drawer-body", d), foot = AMI.$("#drawer-foot", d);
    const draw = () => {
      const lines = cart.lines();
      body.innerHTML = lines.length ? lines.map(l => `<div class="cart-line"><a href="product.html?id=${l.id}"><img src="${l.product.image}" alt="${AMI.esc(l.product.name)}"></a>
        <div><h4><a href="product.html?id=${l.id}">${AMI.esc(l.product.name)}</a></h4><div style="font-size:.85rem;color:var(--text-3)">${AMI.money(l.product.price)}${l.product.demo ? " · Demo" : ""}</div>${qtyHTML(l)}</div>
        <div style="text-align:right"><strong>${AMI.money(l.product.price * l.qty)}</strong><br><button class="remove" type="button" data-remove="${l.id}">Remove</button></div></div>`).join("") : emptyHTML();
      foot.innerHTML = lines.length ? `${summaryHTML()}${sampleNote()}<a class="btn btn-primary btn-block mt-2" href="checkout.html">Checkout</a><a class="btn btn-ghost btn-block" style="margin-top:10px" href="cart.html">View full cart</a>` : "";
    };
    d.addEventListener("click", e => cartActions(e));
    document.addEventListener("ami:cart", draw); draw();
    AMI.$("#open-cart").addEventListener("click", () => AMI.openLayer(d));
    AMI.openCart = () => AMI.openLayer(d);
  }

  /** one click handler for +/−/remove used by drawer and cart page */
  function cartActions(e) {
    const q = e.target.closest("[data-qty]"), r = e.target.closest("[data-remove]");
    if (q) { const l = state.items.find(i => i.id === q.dataset.qty); l && cart.setQty(q.dataset.qty, l.qty + Number(q.dataset.d)); }
    if (r) { cart.remove(r.dataset.remove); AMI.toast("Removed from cart"); }
  }

  /* ---------- coupon box (cart + checkout pages) ---------- */
  function couponBox(root) {
    const form = AMI.$("[data-coupon]", root); if (!form) return;
    const msg = AMI.$("[data-coupon-msg]", root), input = AMI.$("input", form);
    const showApplied = () => { msg.innerHTML = cart.coupon() ? `<span style="color:var(--ok)">Applied: ${AMI.esc(cart.coupon())}</span> <button type="button" class="remove" style="background:none;border:0;color:var(--text-3);text-decoration:underline" data-rm-coupon>remove</button>` : ""; };
    form.addEventListener("submit", e => { e.preventDefault(); const r = cart.applyCoupon(input.value); msg.innerHTML = `<span style="color:${r.ok ? "var(--ok)" : "var(--err)"}">${AMI.esc(r.msg)}</span>`; if (r.ok) { input.value = ""; AMI.toast(r.msg, "success"); } });
    msg.addEventListener("click", e => { if (e.target.closest("[data-rm-coupon]")) cart.removeCoupon(); });
    document.addEventListener("ami:cart", () => { if (cart.coupon()) showApplied(); }); if (cart.coupon()) showApplied();
  }

  /* ---------- cart page ---------- */
  function cartPage() {
    const list = AMI.$("#cart-list"), sum = AMI.$("#cart-summary"); if (!list) return;
    const draw = () => {
      const lines = cart.lines(); AMI.$("#cart-layout").hidden = !lines.length; AMI.$("#cart-empty").hidden = !!lines.length;
      list.innerHTML = lines.map(l => `<div class="cart-row"><a href="product.html?id=${l.id}"><img src="${l.product.image}" alt="${AMI.esc(l.product.name)}"></a>
        <div><span class="tag${l.product.demo ? " demo" : ""}">${l.product.demo ? "Demo" : AMI.esc(AMI.data.productCategories[l.product.category].label)}</span><h3 style="font-size:1.05rem;margin:8px 0 4px"><a href="product.html?id=${l.id}">${AMI.esc(l.product.name)}</a></h3>
        <div style="font-size:.85rem;color:var(--text-3)">${AMI.esc(l.product.format)} · ${AMI.money(l.product.price)} per licence</div></div>
        <div class="cart-row-end" style="text-align:right">${qtyHTML(l)}<div style="margin-top:8px"><strong>${AMI.money(l.product.price * l.qty)}</strong> · <button class="remove" type="button" style="background:none;border:0;color:var(--text-3);text-decoration:underline" data-remove="${l.id}">Remove</button></div></div></div>`).join("");
      AMI.$("#cart-totals").innerHTML = summaryHTML() + sampleNote();
    };
    AMI.$("#cart-layout").addEventListener("click", cartActions); document.addEventListener("ami:cart", draw); draw(); couponBox(AMI.$("#cart-layout"));
    AMI.$("#clear-cart").addEventListener("click", () => { cart.clear(); AMI.toast("Cart cleared"); });
  }

  /* ---------- checkout page ---------- */
  function checkoutPage() {
    const form = AMI.$("#checkout-form"); if (!form) return;
    const items = AMI.$("#co-items"), totals = AMI.$("#co-totals"), status = AMI.$("#co-status"), pay = AMI.$("#pay-btn");
    const live = cfg.shopLive && !!cfg.createOrderEndpoint;
    const draw = () => {
      const lines = cart.lines(); AMI.$("#co-layout").hidden = !lines.length; AMI.$("#co-empty").hidden = !!lines.length;
      items.innerHTML = lines.map(l => `<div class="cart-line" style="grid-template-columns:64px 1fr auto"><img src="${l.product.image}" alt="" style="width:64px;height:48px"><div><h4>${AMI.esc(l.product.name)}</h4><small style="color:var(--text-3)">Qty ${l.qty}</small></div><strong>${AMI.money(l.product.price * l.qty)}</strong></div>`).join("");
      totals.innerHTML = summaryHTML();
      const blocked = !live || cart.hasSamples();
      pay.disabled = blocked; pay.setAttribute("aria-disabled", blocked);
      status.className = "notice"; status.hidden = false;
      if (!live) status.innerHTML = "<p><strong>Payments aren't connected yet.</strong> This checkout is ready to connect to a payment provider and server. Until then no order can be placed and nothing is charged.</p>";
      else if (cart.hasSamples()) status.innerHTML = "<p><strong>Sample products in your cart.</strong> Remove them — they aren't available to buy yet.</p>";
      else { status.hidden = true; }
    };
    document.addEventListener("ami:cart", draw); draw(); couponBox(AMI.$("#co-layout"));
    form.addEventListener("submit", async e => {
      e.preventDefault(); if (!AMI.validateForm(form)) return; if (pay.disabled) return;
      pay.disabled = true; pay.textContent = "Starting secure payment…";
      try { await startPayment(Object.fromEntries(new FormData(form))); } catch (err) { AMI.toast(err.message || "Could not start payment.", "error"); }
      pay.disabled = false; pay.textContent = "Pay securely";
    });
  }

  /** Server contract (see README → Backend roadmap):
   *  POST createOrderEndpoint {items:[{id,qty}], coupon, customer} → {provider, orderId, amount, currency, receipt}
   *  POST verifyPaymentEndpoint {orderId, paymentId, signature} → {verified:true, orderRef}
   *  The server recalculates prices from ITS OWN catalogue, verifies the signature with the secret key, then unlocks downloads. */
  async function startPayment(customer) {
    const res = await fetch(cfg.createOrderEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ items: state.items.map(({ id, qty }) => ({ id, qty })), coupon: state.coupon, customer }) });
    if (!res.ok) throw new Error("The server couldn't create your order.");
    const order = await res.json();
    if (order.provider !== "razorpay" || !cfg.razorpayKeyId) throw new Error("Payment provider isn't configured.");
    await new Promise((ok, bad) => { const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = ok; s.onerror = () => bad(new Error("Couldn't load the payment window.")); document.head.appendChild(s); });
    new window.Razorpay({ key: cfg.razorpayKeyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: cfg.siteName,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      handler: async r => {
        const v = await fetch(cfg.verifyPaymentEndpoint || "", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }) }).then(x => x.json()).catch(() => ({}));
        if (v.verified) { cart.clear(); location.href = `account.html?order=${encodeURIComponent(v.orderRef)}`; }
        else AMI.toast("We couldn't verify your payment. If you were charged, contact support with your payment ID.", "error", 9000);
      } }).open();
  }

  AMI.onReady(() => {
    drawer(); cartPage(); checkoutPage();
    const badge = AMI.$(".badge-count"), paint = () => { if (!badge) return; const n = cart.count(); badge.textContent = n; badge.dataset.n = n; };
    document.addEventListener("ami:cart", () => { paint(); badge && badge.classList.remove("cart-bump"); void (badge && badge.offsetWidth); badge && badge.classList.add("cart-bump"); }); paint();
    addEventListener("storage", e => { if (e.key === KEY) { state = AMI.store.get(KEY, { items: [], coupon: "" }); document.dispatchEvent(new CustomEvent("ami:cart")); } });
  });
})();

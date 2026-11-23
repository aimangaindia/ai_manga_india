/* order.js — "Contact to order" popup. The site takes no payments: every Buy / Order / Request button opens a small window
   with the studio's social-app icons (from AMI_CONFIG.socialProfiles) plus email, so the visitor picks how to reach us.
   Markup: <button data-order data-item="Name" data-price="₹499" data-kind="buy|custom|service"> (an <a href> also works as a no-JS fallback). */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  let modal;

  const clean = u => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
  const profiles = () => ((AMI.cfg && AMI.cfg.socialProfiles) || []).map(p => ({ ...p, href: clean(p.url) })).filter(p => p.href);

  const message = o => {
    const verb = { buy: "I'd like to buy", custom: "I'd like a customised version of", service: "I'd like to request" }[o.kind] || "I'd like to order";
    return `Hi AI MANGA INDIA! ${verb}: ${o.item}${o.price ? ` (${o.price})` : ""}.\nPage: ${o.url}\nPlease share the next steps.`;
  };

  async function copy(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

  AMI.orderModal = o => {
    o = { kind: "buy", item: "your project", price: "", url: location.href.split("#")[0], ...o };
    const list = profiles(), msg = message(o), cfg = AMI.cfg;
    if (!modal) {
      modal = document.createElement("div"); modal.className = "modal order-modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "order-h");
      document.body.appendChild(modal);
    }
    const mail = `mailto:${cfg.contactEmail}?subject=${encodeURIComponent("Order: " + o.item)}&body=${encodeURIComponent(msg)}`;
    modal.innerHTML = `<div class="modal-backdrop" data-close></div>
      <div class="modal-dialog order-dialog"><button class="icon-btn modal-close" type="button" data-close aria-label="Close">${AMI.icon("x")}</button>
        <div class="order-body"><span class="eyebrow">Order &amp; customise</span><h2 id="order-h">Choose how to contact us</h2>
          <p class="order-item"><strong>${AMI.esc(o.item)}</strong>${o.price ? ` · ${AMI.esc(o.price)}` : ""}</p>
          <p class="order-note">No payment is taken on this website. Pick an app below. We copy a ready message for you — paste it in the chat, and we'll confirm price, customisation and delivery with you directly.</p>
          <div class="order-apps">${list.map(p => `<a class="order-app" href="${AMI.esc(p.href)}" target="_blank" rel="noopener noreferrer" data-app="${AMI.esc(p.name)}"><span class="order-ico">${AMI.icon(p.icon || p.id)}</span><span>${AMI.esc(p.name)}</span></a>`).join("")}
            <a class="order-app" href="${AMI.esc(mail)}" data-app="Email"><span class="order-ico">${AMI.icon("mail")}</span><span>Email</span></a></div>
          <label class="order-msg-label" for="order-msg">Your message</label>
          <textarea id="order-msg" class="order-msg" readonly rows="4">${AMI.esc(msg)}</textarea>
          <div class="flex"><button class="btn btn-ghost btn-sm" type="button" data-copy-order>Copy message</button><a class="btn btn-ghost btn-sm" href="contact.html?topic=${encodeURIComponent(o.item)}">Use the inquiry form</a></div>
        </div></div>`;
    modal.onclick = async e => {
      const app = e.target.closest("[data-app]");
      if (app) { const ok = await copy(msg); AMI.toast(ok ? `Message copied — paste it in ${app.dataset.app}` : `Opening ${app.dataset.app}`, "success"); return; }
      if (e.target.closest("[data-copy-order]")) { const ok = await copy(msg); if (!ok) AMI.$("#order-msg", modal).select(); AMI.toast(ok ? "Message copied" : "Press Ctrl/Cmd + C to copy", ok ? "success" : "info"); }
    };
    AMI.openLayer(modal);
  };

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-order]"); if (!b) return;
    e.preventDefault();
    AMI.orderModal({ item: b.dataset.item, price: b.dataset.price, kind: b.dataset.kind });
  });
})();

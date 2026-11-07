/* contact.js — form validation, spam protection, honest submission states, newsletter signup.
   RULE: the page only says "sent/subscribed" when a configured endpoint returned a success response.
   With no endpoint configured it says so plainly and offers an email/WhatsApp fallback instead. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const cfg = AMI.cfg, ic = AMI.icon;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const loaded = Date.now(); // time-trap: bots submit instantly

  /** Validates every [required] / data-rule field in a form, writing messages into .error-msg. Returns true if valid. */
  AMI.validateForm = form => {
    let first = null;
    AMI.$$("input, select, textarea", form).forEach(el => {
      if (el.type === "hidden" || el.classList.contains("hp")) return;
      const field = el.closest(".field"), err = field && AMI.$(".error-msg", field); let msg = "";
      const v = el.type === "checkbox" ? el.checked : el.value.trim();
      if (el.required && !v) msg = el.type === "checkbox" ? "Please accept to continue." : "This field is required.";
      else if (v && el.type === "email" && !EMAIL.test(v)) msg = "Enter a valid email address.";
      else if (v && el.dataset.min && v.length < +el.dataset.min) msg = `Please write at least ${el.dataset.min} characters.`;
      else if (v && el.dataset.links && v.split(/[\s,]+/).some(u => u && !/^https?:\/\/\S+\.\S+/.test(u))) msg = "Links must start with http:// or https://";
      else if (v && el.type === "tel" && !/^[+\d][\d\s()-]{6,}$/.test(v)) msg = "Enter a valid phone number.";
      if (field) field.classList.toggle("invalid", !!msg); if (err) err.textContent = msg; el.setAttribute("aria-invalid", !!msg);
      if (msg && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  };
  const liveClear = form => form.addEventListener("input", e => { const f = e.target.closest(".field"); if (f && f.classList.contains("invalid")) { f.classList.remove("invalid"); AMI.$(".error-msg", f).textContent = ""; } });

  const suspicious = form => { const hp = AMI.$(".hp", form); return (hp && hp.value) || Date.now() - loaded < 2500; };
  const throttled = key => { const last = AMI.store.get(key, 0); if (Date.now() - last < 30000) return true; AMI.store.set(key, Date.now()); return false; };
  const show = (el, cls, html) => { el.className = `form-status show ${cls}`; el.innerHTML = html; el.focus && el.setAttribute("tabindex", "-1"); };

  async function post(endpoint, payload) {
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error(`Server replied ${r.status}`);
    return r;
  }

  /* ---------- project inquiry ---------- */
  function inquiry() {
    const form = AMI.$("#inquiry-form"); if (!form) return;
    liveClear(form);
    const svc = AMI.param("service"), sel = AMI.$("#f-service"), ref = AMI.param("ref"), prod = AMI.param("product");
    if (svc) [...sel.options].forEach(o => { if (o.value === svc) sel.value = svc; });
    if (ref || prod) AMI.$("#f-message").value = ref ? `I'd like something similar to the portfolio project "${ref}".\n\n` : `I have a question about the product "${prod}".\n\n`;
    const status = AMI.$("#form-status"), btn = AMI.$("button[type=submit]", form);
    form.addEventListener("submit", async e => {
      e.preventDefault(); status.className = "form-status";
      if (!AMI.validateForm(form)) { show(status, "err", "Please fix the highlighted fields."); return; }
      if (suspicious(form)) { show(status, "err", "That was submitted very quickly. Please check your details and try again."); return; }
      const data = Object.fromEntries(new FormData(form)); delete data.company_website;
      if (!cfg.contactFormEndpoint) {
        const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\nBrand: ${data.brand || "-"}\nService: ${data.service}\nBudget: ${data.budget || "-"}\nDeadline: ${data.deadline || "-"}\nLinks: ${data.links || "-"}\n\n${data.message}`);
        show(status, "warn", `<strong>Not sent yet.</strong> The inquiry form isn't connected to a form service, so nothing has been delivered. Your details are valid — send them by email or WhatsApp instead:
          <div class="flex" style="margin-top:12px"><a class="btn btn-primary btn-sm" href="mailto:${AMI.esc(cfg.contactEmail)}?subject=${encodeURIComponent("Project inquiry: " + data.service)}&body=${body}">${ic("mail")} Email this inquiry</a>
          <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/${cfg.whatsappNumber}?text=${body}">${ic("whatsapp")} WhatsApp</a></div>`);
        return;
      }
      if (throttled("ami_last_inquiry")) { show(status, "err", "Please wait a moment before sending another inquiry."); return; }
      btn.disabled = true; btn.textContent = "Sending…";
      try { await post(cfg.contactFormEndpoint, data); form.reset(); show(status, "ok", `<strong>Thank you — your inquiry was received.</strong> We'll reply to ${AMI.esc(data.email)} soon.`); AMI.toast("Inquiry sent", "success"); }
      catch { show(status, "err", `We couldn't send your inquiry. Please try again, or email <a href="mailto:${AMI.esc(cfg.contactEmail)}" style="text-decoration:underline">${AMI.esc(cfg.contactEmail)}</a>.`); }
      btn.disabled = false; btn.textContent = "Submit Project Inquiry";
    });
  }

  /* ---------- newsletter (footer + any [data-newsletter] form) ---------- */
  function newsletter() {
    AMI.$$("form[data-newsletter]").forEach(form => {
      const status = form.parentElement.querySelector("[data-nl-status]"), input = AMI.$("input[type=email]", form), btn = AMI.$("button", form);
      form.addEventListener("submit", async e => {
        e.preventDefault(); status.className = "form-status";
        const v = input.value.trim();
        if (!EMAIL.test(v)) { show(status, "err", "Please enter a valid email address."); input.setAttribute("aria-invalid", "true"); input.focus(); return; }
        input.removeAttribute("aria-invalid");
        if (suspicious(form)) { show(status, "err", "Please wait a moment and try again."); return; }
        if (!cfg.newsletterEndpoint) { show(status, "warn", "<strong>Not subscribed yet.</strong> The newsletter service isn't connected, so your address wasn't saved."); return; }
        if (throttled("ami_last_nl")) { show(status, "err", "Please wait a moment before trying again."); return; }
        btn.disabled = true;
        try { await post(cfg.newsletterEndpoint, { email: v }); input.value = ""; show(status, "ok", "You're subscribed. Thanks for joining!"); AMI.toast("Subscribed", "success"); }
        catch { show(status, "err", "Subscription failed. Please try again later."); }
        btn.disabled = false;
      });
    });
  }

  AMI.onReady(() => {
    inquiry(); newsletter();
    AMI.$$("[data-wa]").forEach(a => { a.href = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent("Hi AI MANGA INDIA, I'd like to discuss a project.")}`; a.target = "_blank"; a.rel = "noopener"; });
    AMI.$$("[data-email]").forEach(a => { a.href = `mailto:${cfg.contactEmail}`; a.textContent = cfg.contactEmail; });
    AMI.$$("[data-social]").forEach(a => { const u = cfg.social[a.dataset.social]; if (u) a.href = u; else a.hidden = true; });
  });
})();

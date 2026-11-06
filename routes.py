"""Public pages, accounts, cart/checkout API, protected downloads, SEO endpoints."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
import urllib.error
import urllib.request

from flask import (Response, abort, flash, g, jsonify, redirect, render_template, request, send_file,
                   session, url_for)
from itsdangerous import BadSignature, SignatureExpired
from werkzeug.security import check_password_hash, generate_password_hash

import core
from art import STYLES, art_svg
from content import (BUDGETS, CAPABILITIES, FAQ, INQUIRY_SERVICES, PORTFOLIO_CATS, PORTFOLIO_KINDS, PROCESS,
                     PRODUCT_CATS, SERVICES, WHY)
from core import (DEMO_PAYMENTS, PROTECTED, RZP_CONFIGURED, RZP_KEY_ID, RZP_KEY_SECRET, RZP_WEBHOOK_SECRET, app,
                  client_ip, csrf_token, current_user, db, login_required, login_user, now, q, q1, rate_limit, run,
                  safe_next, send_mail, settings, signer, valid_email)

CAT_NAME = {c[0]: c[1] for c in PRODUCT_CATS}
PCAT_NAME = {c[0]: c[1] for c in PORTFOLIO_CATS}


# ---- template context ---------------------------------------------------------
@app.context_processor
def ctx():
    S = settings()
    return dict(S=S, csrf_token=csrf_token, user=current_user(), PRODUCT_CATS=PRODUCT_CATS, PORTFOLIO_CATS=PORTFOLIO_CATS,
                CAT_NAME=CAT_NAME, PCAT_NAME=PCAT_NAME, KINDS=PORTFOLIO_KINDS, DEMO_PAYMENTS=DEMO_PAYMENTS,
                RZP_CONFIGURED=RZP_CONFIGURED, site_url=(os.environ.get("SITE_URL") or request.host_url).rstrip("/"),
                form_ts=lambda: signer.dumps(int(time.time())))


app.jinja_env.globals.update(CAT_NAME=CAT_NAME, PCAT_NAME=PCAT_NAME, KINDS=PORTFOLIO_KINDS)


@app.template_global()
def product_thumb(p):
    if p["thumb_path"]:
        return url_for("static", filename="uploads/" + p["thumb_path"])
    return url_for("art", style=p["thumb_style"], seed=p["thumb_seed"], t=p["name"])


@app.template_global()
def work_thumb(w):
    if w["image_path"]:
        return url_for("static", filename="uploads/" + w["image_path"])
    return url_for("art", style=w["thumb_style"], seed=w["thumb_seed"])


@app.route("/art/<style>-<int:seed>.svg")
def art(style, seed):
    if style not in STYLES:
        abort(404)
    r = Response(art_svg(style, seed, title=request.args.get("t", "")[:40] or None), mimetype="image/svg+xml")
    r.headers["Cache-Control"] = "public, max-age=86400"
    return r


def hero_art():
    return art_svg("portal", 7, 1600, 900)


# ---- pages --------------------------------------------------------------------
@app.route("/")
def home():
    featured = q("SELECT * FROM products WHERE active=1 AND featured=1 ORDER BY id DESC LIMIT 3")
    newest = q("SELECT * FROM products WHERE active=1 ORDER BY id DESC LIMIT 4")
    work = q("SELECT * FROM portfolio WHERE active=1 ORDER BY featured DESC, sort, id LIMIT 6")
    tests = q("SELECT * FROM testimonials WHERE approved=1 ORDER BY id DESC LIMIT 6")
    return render_template("home.html", featured=featured, newest=newest, work=work, tests=tests, services=SERVICES,
                           why=WHY, process=PROCESS, hero_svg=hero_art(),
                           has_demo=bool(q1("SELECT 1 FROM products WHERE is_demo=1 AND active=1")))


@app.route("/portfolio")
def portfolio():
    items = q("SELECT * FROM portfolio WHERE active=1 ORDER BY featured DESC, sort, id")
    return render_template("portfolio.html", items=items)


@app.route("/portfolio/<slug>")
def portfolio_item(slug):
    w = q1("SELECT * FROM portfolio WHERE slug=? AND active=1", (slug,)) or abort(404)
    more = q("SELECT * FROM portfolio WHERE active=1 AND category=? AND id!=? ORDER BY sort LIMIT 3", (w["category"], w["id"]))
    gallery = [url_for("static", filename="uploads/" + p) for p in core.fromjson(w["gallery"])]
    return render_template("portfolio_item.html", w=w, more=more, gallery=gallery)


@app.route("/services")
def services():
    return render_template("services.html", services=SERVICES, process=PROCESS)


@app.route("/shop")
def shop():
    cat = request.args.get("cat", "")
    qs = request.args.get("q", "").strip()
    flt = request.args.get("filter", "")
    sort = request.args.get("sort", "new")
    sql, args = "SELECT * FROM products WHERE active=1", []
    if cat in CAT_NAME:
        sql += " AND category=?"
        args.append(cat)
    if qs:
        sql += " AND (name LIKE ? OR short_desc LIKE ? OR compat LIKE ?)"
        args += [f"%{qs}%"] * 3
    if flt == "featured":
        sql += " AND featured=1"
    elif flt == "new":
        sql += " AND is_new=1"
    elif flt == "bundles":
        sql += " AND is_bundle=1"
    elif flt == "sale":
        sql += " AND original_price IS NOT NULL AND original_price>price"
    sql += {"low": " ORDER BY price ASC", "high": " ORDER BY price DESC", "new": " ORDER BY id DESC"}.get(sort, " ORDER BY id DESC")
    products = q(sql, args)
    counts = {r["category"]: r["n"] for r in q("SELECT category, COUNT(*) n FROM products WHERE active=1 GROUP BY category")}
    return render_template("shop.html", products=products, cat=cat, qs=qs, flt=flt, sort=sort, counts=counts,
                           has_sale=bool(q1("SELECT 1 FROM products WHERE active=1 AND original_price>price")))


def _product_json(p):
    return dict(id=p["id"], slug=p["slug"], name=p["name"], short=p["short_desc"], price=p["price"], original=p["original_price"],
                price_label=core.inr(p["price"]), original_label=core.inr(p["original_price"]) if p["original_price"] else "",
                category=CAT_NAME.get(p["category"], ""), format=p["format"], compat=p["compat"], thumb=product_thumb(p),
                url=url_for("product", slug=p["slug"]), demo=bool(p["is_demo"]))


@app.route("/shop/<slug>")
def product(slug):
    p = q1("SELECT * FROM products WHERE slug=? AND active=1", (slug,)) or abort(404)
    related = q("SELECT * FROM products WHERE active=1 AND id!=? ORDER BY (category=?) DESC, id DESC LIMIT 4", (p["id"], p["category"]))
    owned = False
    u = current_user()
    if u:
        owned = bool(q1("SELECT 1 FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.user_id=? AND o.status='paid' AND i.product_id=?", (u["id"], p["id"])))
    return render_template("product.html", p=p, related=related, owned=owned, faqs=core.fromjson(p["faqs"]),
                           includes=core.lines(p["includes"]))


@app.route("/about")
def about():
    return render_template("about.html", capabilities=CAPABILITIES, process=PROCESS)


@app.route("/faq")
def faq():
    ld = {"@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": [{"@type": "Question", "name": a, "acceptedAnswer": {"@type": "Answer", "text": b}} for a, b in FAQ]}
    return render_template("faq.html", faq=FAQ, faq_ld=ld)


@app.route("/contact")
def contact():
    return render_template("contact.html", services=INQUIRY_SERVICES, budgets=BUDGETS,
                           pre_service=request.args.get("service", ""), pre_product=request.args.get("about", ""))


@app.route("/cart")
def cart():
    return render_template("cart.html")


for _slug, _tpl in (("privacy", "privacy"), ("terms", "terms"), ("refund-policy", "refund"), ("license", "license")):
    app.add_url_rule(f"/{_slug}", _slug, (lambda t: (lambda: render_template(f"policies/{t}.html")))(_tpl))


@app.errorhandler(404)
def not_found(_):
    return render_template("404.html"), 404


@app.errorhandler(403)
def forbidden(_):
    return render_template("404.html", forbidden=True), 403


@app.errorhandler(429)
def toomany(_):
    return render_template("404.html", message="Too many requests. Please wait a moment and try again."), 429


# ---- accounts -----------------------------------------------------------------
def _auth_throttle(email):
    return rate_limit(f"auth:{client_ip()}:{email}", 8, 600) and rate_limit(f"authip:{client_ip()}", 30, 600)


@app.route("/login", methods=["GET", "POST"])
def login():
    nxt = safe_next(request.values.get("next"), "/account")
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        if not _auth_throttle(email):
            flash("Too many attempts. Try again in a few minutes.", "error")
            return render_template("auth.html", mode="login", next=nxt), 429
        u = q1("SELECT * FROM users WHERE email=?", (email,))
        if u and check_password_hash(u["password_hash"], request.form.get("password", "")):
            login_user(u)
            return redirect(nxt)
        flash("Email or password is incorrect.", "error")
    return render_template("auth.html", mode="login", next=nxt)


@app.route("/register", methods=["GET", "POST"])
def register():
    nxt = safe_next(request.values.get("next"), "/account")
    if request.method == "POST":
        name = request.form.get("name", "").strip()[:100]
        email = request.form.get("email", "").strip().lower()
        pw = request.form.get("password", "")
        if not _auth_throttle(email):
            flash("Too many attempts. Try again in a few minutes.", "error")
        elif not (2 <= len(name)) or not valid_email(email):
            flash("Enter your name and a valid email address.", "error")
        elif len(pw) < 8 or len(pw) > 200:
            flash("Choose a password with at least 8 characters.", "error")
        elif q1("SELECT 1 FROM users WHERE email=?", (email,)):
            flash("An account with this email already exists. Sign in instead.", "error")
        else:
            cur = run("INSERT INTO users(email,name,password_hash) VALUES(?,?,?)", (email, name, generate_password_hash(pw)))
            login_user(q1("SELECT * FROM users WHERE id=?", (cur.lastrowid,)))
            return redirect(nxt)
    return render_template("auth.html", mode="register", next=nxt)


@app.route("/logout", methods=["POST"])
def logout():
    csrf = session.get("csrf")
    session.clear()
    session["csrf"] = csrf
    return redirect("/")


@app.route("/account")
@login_required
def account():
    u = current_user()
    orders = q("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC", (u["id"],))
    items = {o["id"]: q("SELECT i.*, p.slug FROM order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.order_id=?", (o["id"],)) for o in orders}
    return render_template("account.html", orders=orders, items=items, max_dl=int(settings().get("max_downloads") or 10))


@app.route("/order/<order_no>")
@login_required
def order_view(order_no):
    u = current_user()
    o = q1("SELECT * FROM orders WHERE order_no=? AND user_id=?", (order_no, u["id"])) or abort(404)
    items = q("SELECT i.*, p.slug FROM order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.order_id=?", (o["id"],))
    return render_template("order.html", o=o, items=items)


# ---- JSON APIs ----------------------------------------------------------------
def _ids(raw):
    out = []
    for x in (raw if isinstance(raw, list) else str(raw or "").split(",")):
        try:
            n = int(x)
            if n > 0 and n not in out:
                out.append(n)
        except (TypeError, ValueError):
            pass
    return out[:50]


@app.route("/api/cart")
def api_cart():
    ids = _ids(request.args.get("ids"))
    if not ids:
        return jsonify(items=[])
    rows = q(f"SELECT * FROM products WHERE active=1 AND id IN ({','.join('?' * len(ids))})", ids)
    return jsonify(items=[_product_json(p) for p in rows])


@app.route("/api/product/<slug>")
def api_product(slug):
    p = q1("SELECT * FROM products WHERE slug=? AND active=1", (slug,)) or abort(404)
    d = _product_json(p)
    d["includes"] = core.lines(p["includes"])[:6]
    d["license"] = p["usage_rights"]
    return jsonify(d)


def compute_cart(ids, code=""):
    ids = _ids(ids)
    if not ids:
        return dict(error="Your cart is empty.")
    prods = q(f"SELECT * FROM products WHERE active=1 AND id IN ({','.join('?' * len(ids))})", ids)
    if not prods:
        return dict(error="These products are no longer available.")
    subtotal = sum(p["price"] for p in prods)
    discount, coupon, cerr = 0, None, None
    code = (code or "").strip().upper()
    if code:
        c = q1("SELECT * FROM coupons WHERE code=?", (code,))
        if not c or not c["active"]:
            cerr = "That coupon code isn't valid."
        elif c["expires_at"] and c["expires_at"] < time.strftime("%Y-%m-%d"):
            cerr = "That coupon has expired."
        elif c["max_uses"] and c["used"] >= c["max_uses"]:
            cerr = "That coupon has reached its usage limit."
        elif subtotal < (c["min_total"] or 0):
            cerr = f"This coupon needs a cart of at least {core.inr(c['min_total'])}."
        else:
            coupon = c
            discount = min(subtotal, subtotal * (c["percent"] or 0) // 100 + (c["amount_off"] or 0))
    return dict(products=prods, subtotal=subtotal, discount=discount, total=subtotal - discount, coupon=coupon, coupon_error=cerr)


@app.route("/api/coupon", methods=["POST"])
def api_coupon():
    if not rate_limit(f"coupon:{client_ip()}", 20, 600):
        return jsonify(ok=False, error="Too many attempts. Try again shortly."), 429
    d = request.get_json(silent=True) or {}
    c = compute_cart(d.get("ids"), d.get("code"))
    if c.get("error"):
        return jsonify(ok=False, error=c["error"]), 400
    if c.get("coupon_error"):
        return jsonify(ok=False, error=c["coupon_error"]), 400
    if not c["coupon"]:
        return jsonify(ok=False, error="Enter a coupon code."), 400
    return jsonify(ok=True, discount=c["discount"], subtotal=c["subtotal"], total=c["total"],
                   discount_label=core.inr(c["discount"]), total_label=core.inr(c["total"]), code=c["coupon"]["code"])


@app.route("/api/search")
def api_search():
    s = request.args.get("q", "").strip()
    if len(s) < 2:
        return jsonify(products=[], work=[], services=[])
    like = f"%{s}%"
    prods = q("SELECT * FROM products WHERE active=1 AND (name LIKE ? OR short_desc LIKE ?) LIMIT 6", (like, like))
    work = q("SELECT * FROM portfolio WHERE active=1 AND (title LIKE ? OR summary LIKE ?) LIMIT 6", (like, like))
    sv = [dict(title=x["title"], url=url_for("services") + "#" + x["slug"]) for x in SERVICES
          if s.lower() in x["title"].lower() or any(s.lower() in i.lower() for i in x["bullets"])][:4]
    return jsonify(products=[dict(title=p["name"], sub=p["price"] and core.inr(p["price"]), url=url_for("product", slug=p["slug"]), thumb=product_thumb(p)) for p in prods],
                   work=[dict(title=w["title"], sub=PCAT_NAME.get(w["category"], ""), url=url_for("portfolio_item", slug=w["slug"]), thumb=work_thumb(w)) for w in work],
                   services=sv)


def _check_trap(data):
    """Honeypot + minimum fill time. Returns an error string or None."""
    if (data.get("website") or "").strip():
        return "Submission rejected."
    try:
        t0 = signer.loads(data.get("_t", ""), max_age=60 * 60 * 6)
    except (BadSignature, SignatureExpired):
        return "This form expired. Reload the page and try again."
    if time.time() - int(t0) < 3:
        return "That was very quick. Please check the form and send it again."
    return None


@app.route("/api/newsletter", methods=["POST"])
def api_newsletter():
    d = request.get_json(silent=True) or request.form
    if not rate_limit(f"news:{client_ip()}", 6, 3600):
        return jsonify(ok=False, error="Too many attempts. Please try again later."), 429
    if (d.get("website") or "").strip():
        return jsonify(ok=True, message="You're subscribed.")  # silently drop bots
    email = (d.get("email") or "").strip().lower()
    if not valid_email(email):
        return jsonify(ok=False, error="Enter a valid email address."), 400
    if q1("SELECT 1 FROM subscribers WHERE email=?", (email,)):
        return jsonify(ok=True, message="You're already subscribed.")
    run("INSERT INTO subscribers(email) VALUES(?)", (email,))
    return jsonify(ok=True, message="You're subscribed. Thanks for joining.")


@app.route("/api/inquiry", methods=["POST"])
def api_inquiry():
    d = request.get_json(silent=True) or request.form
    if not rate_limit(f"inq:{client_ip()}", 5, 3600):
        return jsonify(ok=False, error="Too many requests from your connection. Please try again later."), 429
    err = _check_trap(d)
    if err:
        return jsonify(ok=False, error=err), 400
    f = {k: (d.get(k) or "").strip() for k in ("name", "email", "business", "service", "description", "budget", "deadline", "links")}
    errors = {}
    if not 2 <= len(f["name"]) <= 100:
        errors["name"] = "Enter your full name."
    if not valid_email(f["email"]):
        errors["email"] = "Enter a valid email address."
    if f["service"] not in INQUIRY_SERVICES:
        errors["service"] = "Choose a service."
    if not 20 <= len(f["description"]) <= 4000:
        errors["description"] = "Describe your project in at least 20 characters."
    if f["budget"] and f["budget"] not in BUDGETS:
        errors["budget"] = "Choose a budget range."
    if f["deadline"] and not re.match(r"^\d{4}-\d{2}-\d{2}$", f["deadline"]):
        errors["deadline"] = "Use a valid date."
    if len(f["links"]) > 1000 or len(f["business"]) > 150:
        errors["links"] = "That field is too long."
    if errors:
        return jsonify(ok=False, errors=errors, error="Please fix the highlighted fields."), 400
    cur = run("INSERT INTO inquiries(name,email,business,service,description,budget,deadline,links,ip) VALUES(?,?,?,?,?,?,?,?,?)",
              (f["name"], f["email"], f["business"], f["service"], f["description"], f["budget"], f["deadline"], f["links"], client_ip()))
    ref = f"INQ-{cur.lastrowid:05d}"
    notify = os.environ.get("NOTIFY_EMAIL") or settings().get("contact_email")
    send_mail(notify, f"New project inquiry {ref}: {f['service']}",
              "\n".join(f"{k}: {v}" for k, v in f.items()))
    return jsonify(ok=True, ref=ref, message=f"Inquiry received. Your reference is {ref}. We'll reply to {f['email']}.")


# ---- checkout -----------------------------------------------------------------
@app.route("/checkout")
@login_required
def checkout():
    return render_template("checkout.html", rzp_key=RZP_KEY_ID if RZP_CONFIGURED else "")


def _rzp_create_order(amount, receipt):
    req = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=json.dumps({"amount": amount, "currency": "INR", "receipt": receipt}).encode(),
        headers={"Content-Type": "application/json",
                 "Authorization": "Basic " + base64.b64encode(f"{RZP_KEY_ID}:{RZP_KEY_SECRET}".encode()).decode()})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def mark_paid(order_id, provider, payment_id):
    """Idempotent. Only ever called after a server-verified payment (or a zero-value order)."""
    o = q1("SELECT * FROM orders WHERE id=?", (order_id,))
    if not o or o["status"] == "paid":
        return
    run("UPDATE orders SET status='paid', paid_at=?, provider=?, provider_payment_id=? WHERE id=?", (now(), provider, payment_id, order_id))
    if o["coupon_code"]:
        run("UPDATE coupons SET used=used+1 WHERE code=?", (o["coupon_code"],))
    send_mail(o["email"], f"Your AI MANGA INDIA order {o['order_no']}",
              f"Thanks for your purchase. Your files are available under My Account > Downloads.\nOrder: {o['order_no']}")


@app.route("/api/checkout/create", methods=["POST"])
@login_required
def api_checkout_create():
    u = current_user()
    d = request.get_json(silent=True) or {}
    if not rate_limit(f"co:{u['id']}", 15, 600):
        return jsonify(ok=False, error="Too many attempts. Try again shortly."), 429
    c = compute_cart(d.get("ids"), d.get("code"))
    if c.get("error"):
        return jsonify(ok=False, error=c["error"]), 400
    if c.get("coupon_error"):
        return jsonify(ok=False, error=c["coupon_error"]), 400
    owned = q(f"SELECT p.name FROM order_items i JOIN orders o ON o.id=i.order_id JOIN products p ON p.id=i.product_id "
              f"WHERE o.user_id=? AND o.status='paid' AND i.product_id IN ({','.join('?' * len(c['products']))})",
              [u["id"]] + [p["id"] for p in c["products"]])
    if owned:
        return jsonify(ok=False, error=f"You already own “{owned[0]['name']}”. Remove it from your cart or download it from My Account."), 409
    if c["total"] > 0 and not (RZP_CONFIGURED or DEMO_PAYMENTS):
        return jsonify(ok=False, error="Online payments aren't switched on for this site yet. Please contact support to place an order."), 503
    order_no = "AMI-" + secrets.token_hex(4).upper()
    cur = run("INSERT INTO orders(order_no,user_id,email,subtotal,discount,total,coupon_code,status) VALUES(?,?,?,?,?,?,?,'pending')",
              (order_no, u["id"], u["email"], c["subtotal"], c["discount"], c["total"], c["coupon"]["code"] if c["coupon"] else None))
    oid = cur.lastrowid
    for p in c["products"]:
        run("INSERT INTO order_items(order_id,product_id,name,price) VALUES(?,?,?,?)", (oid, p["id"], p["name"], p["price"]))
    if c["total"] == 0:
        mark_paid(oid, "free", None)
        return jsonify(ok=True, free=True, redirect=url_for("order_view", order_no=order_no))
    if RZP_CONFIGURED:
        try:
            ro = _rzp_create_order(c["total"], order_no)
        except (urllib.error.URLError, ValueError, OSError) as e:
            app.logger.error("razorpay order failed: %s", e)
            run("UPDATE orders SET status='failed' WHERE id=?", (oid,))
            return jsonify(ok=False, error="We couldn't start the payment. Please try again in a moment."), 502
        run("UPDATE orders SET provider='razorpay', provider_order_id=? WHERE id=?", (ro["id"], oid))
        return jsonify(ok=True, provider="razorpay", order_no=order_no, key=RZP_KEY_ID, razorpay_order_id=ro["id"],
                       amount=c["total"], name=u["name"] or "", email=u["email"])
    run("UPDATE orders SET provider='demo' WHERE id=?", (oid,))
    return jsonify(ok=True, provider="demo", order_no=order_no, amount=c["total"])


@app.route("/api/checkout/verify", methods=["POST"])
@login_required
def api_checkout_verify():
    u = current_user()
    d = request.get_json(silent=True) or {}
    o = q1("SELECT * FROM orders WHERE order_no=? AND user_id=?", (d.get("order_no"), u["id"]))
    if not o or o["provider"] != "razorpay":
        return jsonify(ok=False, error="Order not found."), 404
    if o["status"] == "paid":
        return jsonify(ok=True, redirect=url_for("order_view", order_no=o["order_no"]))
    if d.get("razorpay_order_id") != o["provider_order_id"] or not core.rzp_signature_ok(
            o["provider_order_id"], d.get("razorpay_payment_id"), d.get("razorpay_signature")):
        run("UPDATE orders SET status='failed' WHERE id=? AND status='pending'", (o["id"],))
        return jsonify(ok=False, error="We couldn't verify this payment. If money was deducted, contact support with your order number."), 400
    mark_paid(o["id"], "razorpay", d["razorpay_payment_id"])
    return jsonify(ok=True, redirect=url_for("order_view", order_no=o["order_no"]))


@app.route("/api/checkout/demo-pay", methods=["POST"])
@login_required
def api_demo_pay():
    """Development-only. Returns 404 unless DEMO_PAYMENTS=1 and APP_ENV != production."""
    if not DEMO_PAYMENTS:
        abort(404)
    u = current_user()
    o = q1("SELECT * FROM orders WHERE order_no=? AND user_id=? AND provider='demo'", ((request.get_json(silent=True) or {}).get("order_no"), u["id"])) or abort(404)
    mark_paid(o["id"], "demo", "demo-" + secrets.token_hex(4))
    return jsonify(ok=True, redirect=url_for("order_view", order_no=o["order_no"]))


@app.route("/api/webhooks/razorpay", methods=["POST"])
def razorpay_webhook():
    if not RZP_WEBHOOK_SECRET:
        abort(404)
    raw = request.get_data()
    sig = request.headers.get("X-Razorpay-Signature", "")
    if not hmac.compare_digest(hmac.new(RZP_WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest(), sig):
        abort(400)
    ev = json.loads(raw or b"{}")
    pay = (ev.get("payload", {}).get("payment", {}) or {}).get("entity", {})
    order = q1("SELECT * FROM orders WHERE provider_order_id=?", (pay.get("order_id"),)) if pay.get("order_id") else None
    if order:
        if ev.get("event") in ("payment.captured", "order.paid"):
            mark_paid(order["id"], "razorpay", pay.get("id"))
        elif ev.get("event") == "payment.failed" and order["status"] == "pending":
            run("UPDATE orders SET status='failed' WHERE id=?", (order["id"],))
    return jsonify(ok=True)


# ---- protected downloads --------------------------------------------------------
def _owned_item(item_id):
    u = current_user()
    return q1("""SELECT i.*, o.status, o.user_id, p.file_path, p.file_name FROM order_items i
                 JOIN orders o ON o.id=i.order_id LEFT JOIN products p ON p.id=i.product_id
                 WHERE i.id=? AND o.user_id=?""", (item_id, u["id"]))


@app.route("/api/download-link", methods=["POST"])
@login_required
def api_download_link():
    it = _owned_item((request.get_json(silent=True) or {}).get("item_id"))
    if not it or it["status"] != "paid":
        return jsonify(ok=False, error="This purchase isn't available for download."), 403
    if not it["file_path"]:
        return jsonify(ok=False, error="The file for this product isn't available yet. Contact support."), 404
    if it["download_count"] >= int(settings().get("max_downloads") or 10):
        return jsonify(ok=False, error="Download limit reached. Contact support and we'll help."), 403
    tok = signer.dumps({"i": it["id"], "u": it["user_id"]}, salt="download")
    return jsonify(ok=True, url=url_for("download", token=tok), expires_in=600)


@app.route("/dl/<token>")
@login_required
def download(token):
    try:
        d = signer.loads(token, salt="download", max_age=600)
    except SignatureExpired:
        abort(410, "This download link has expired. Request a new one from My Account.")
    except BadSignature:
        abort(404)
    u = current_user()
    if d.get("u") != u["id"]:
        abort(403)
    it = _owned_item(d["i"])
    if not it or it["status"] != "paid" or not it["file_path"]:
        abort(403)
    if it["download_count"] >= int(settings().get("max_downloads") or 10):
        abort(403)
    path = os.path.realpath(os.path.join(PROTECTED, os.path.basename(it["file_path"])))
    if not path.startswith(os.path.realpath(PROTECTED)) or not os.path.isfile(path):
        abort(404)
    run("UPDATE order_items SET download_count=download_count+1 WHERE id=?", (it["id"],))
    return send_file(path, as_attachment=True, download_name=it["file_name"] or os.path.basename(path), max_age=0)


# ---- SEO ------------------------------------------------------------------------
@app.route("/robots.txt")
def robots():
    base = (os.environ.get("SITE_URL") or request.host_url).rstrip("/")
    return Response(f"User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nDisallow: /api/\nDisallow: /dl/\n\nSitemap: {base}/sitemap.xml\n", mimetype="text/plain")


@app.route("/sitemap.xml")
def sitemap():
    base = (os.environ.get("SITE_URL") or request.host_url).rstrip("/")
    urls = ["/", "/portfolio", "/services", "/shop", "/about", "/contact", "/faq", "/privacy", "/terms", "/refund-policy", "/license"]
    urls += [f"/shop/{p['slug']}" for p in q("SELECT slug FROM products WHERE active=1")]
    urls += [f"/portfolio/{w['slug']}" for w in q("SELECT slug FROM portfolio WHERE active=1")]
    body = "".join(f"<url><loc>{base}{u}</loc></url>" for u in urls)
    return Response(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>', mimetype="application/xml")

"""Private admin dashboard. Every route requires a signed-in user with is_admin=1."""
import csv
import io
import json
import os
import secrets
from decimal import Decimal, InvalidOperation

from flask import Response, abort, flash, redirect, render_template, request, url_for
from PIL import Image
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

import core
from content import (DEFAULT_SETTINGS, INQUIRY_STATUSES, ORDER_STATUSES, PORTFOLIO_CATS, PORTFOLIO_KINDS, PRODUCT_CATS,
                     SETTING_LABELS)
from art import STYLES
from core import (PROTECTED, PUBLIC_UPLOADS, admin_required, app, client_ip, current_user, login_user, q, q1,
                  rate_limit, run, safe_next, unique_slug, valid_email)

FILE_EXT = {"zip", "rar", "7z", "pdf", "txt", "csv", "json", "psd", "ai", "png", "jpg", "jpeg", "webp", "mp4", "mov",
            "docx", "xlsx", "pptx", "svg", "mp3", "wav", "fig"}


def save_image(fs, sub, max_px=1800):
    """Validate with Pillow, strip metadata, resize, store as WebP. Returns relative path or None."""
    if not fs or not fs.filename:
        return None
    try:
        img = Image.open(fs.stream)
        img.verify()
        fs.stream.seek(0)
        img = Image.open(fs.stream)
        if img.format not in ("PNG", "JPEG", "WEBP", "GIF"):
            raise ValueError
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        img.thumbnail((max_px, max_px))
    except Exception:
        flash(f"“{fs.filename}” isn't a valid PNG, JPG, WEBP or GIF image.", "error")
        return None
    os.makedirs(os.path.join(PUBLIC_UPLOADS, sub), exist_ok=True)
    rel = f"{sub}/{secrets.token_hex(8)}.webp"
    img.save(os.path.join(PUBLIC_UPLOADS, rel), "WEBP", quality=86)
    return rel


def save_protected(fs):
    if not fs or not fs.filename:
        return None, None
    ext = fs.filename.rsplit(".", 1)[-1].lower() if "." in fs.filename else ""
    if ext not in FILE_EXT:
        flash(f"File type .{ext} isn't allowed. Zip your files and upload the .zip.", "error")
        return None, None
    name = secure_filename(fs.filename) or f"file.{ext}"
    stored = f"{secrets.token_hex(8)}_{name}"
    fs.save(os.path.join(PROTECTED, stored))
    return stored, name


def rupees(v, allow_blank=False):
    v = (v or "").replace(",", "").replace("₹", "").strip()
    if not v and allow_blank:
        return None
    try:
        d = Decimal(v)
        if d < 0 or d > 1_000_000:
            raise InvalidOperation
        return int((d * 100).to_integral_value())
    except InvalidOperation:
        raise ValueError("Enter prices as numbers, for example 499 or 499.50.")


def flag(name):
    return 1 if request.form.get(name) else 0


def create_admin(email, password, name="Admin"):
    email = email.strip().lower()
    u = q1("SELECT * FROM users WHERE email=?", (email,))
    if u:
        run("UPDATE users SET is_admin=1, password_hash=? WHERE id=?", (generate_password_hash(password), u["id"]))
    else:
        run("INSERT INTO users(email,name,password_hash,is_admin) VALUES(?,?,?,1)", (email, name, generate_password_hash(password)))


@app.cli.command("create-admin")
def cli_create_admin():
    """flask --app app create-admin  (reads ADMIN_EMAIL / ADMIN_PASSWORD or prompts)"""
    import getpass
    email = os.environ.get("ADMIN_EMAIL") or input("Admin email: ")
    pw = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Admin password (min 10 chars): ")
    if not valid_email(email) or len(pw) < 10:
        raise SystemExit("Need a valid email and a password of at least 10 characters.")
    create_admin(email, pw)
    print("Admin saved:", email)


# ---- auth -----------------------------------------------------------------------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    nxt = safe_next(request.values.get("next"), "/admin")
    u = current_user()
    if u and u["is_admin"]:
        return redirect(nxt)
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        if not rate_limit(f"adm:{client_ip()}", 6, 900):
            flash("Too many attempts. Wait 15 minutes and try again.", "error")
            return render_template("admin/login.html"), 429
        row = q1("SELECT * FROM users WHERE email=? AND is_admin=1", (email,))
        if row and check_password_hash(row["password_hash"], request.form.get("password", "")):
            login_user(row)
            return redirect(nxt)
        flash("Email or password is incorrect, or this account isn't an administrator.", "error")
    return render_template("admin/login.html")


# ---- dashboard ------------------------------------------------------------------
@app.route("/admin")
@admin_required
def admin_home():
    st = dict(
        orders=q1("SELECT COUNT(*) n FROM orders WHERE status='paid'")["n"],
        revenue=q1("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status='paid'")["s"],
        products=q1("SELECT COUNT(*) n FROM products WHERE active=1")["n"],
        inquiries=q1("SELECT COUNT(*) n FROM inquiries WHERE status='new'")["n"],
        subscribers=q1("SELECT COUNT(*) n FROM subscribers")["n"],
    )
    return render_template("admin/home.html", st=st,
                           orders=q("SELECT o.*, u.name FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 6"),
                           inquiries=q("SELECT * FROM inquiries ORDER BY id DESC LIMIT 6"),
                           payments_ok=core.RZP_CONFIGURED, demo=core.DEMO_PAYMENTS,
                           demo_products=q1("SELECT COUNT(*) n FROM products WHERE is_demo=1")["n"])


# ---- products -------------------------------------------------------------------
@app.route("/admin/products")
@admin_required
def admin_products():
    return render_template("admin/products.html", rows=q("SELECT * FROM products ORDER BY id DESC"))


@app.route("/admin/products/new", methods=["GET", "POST"])
@app.route("/admin/products/<int:pid>", methods=["GET", "POST"])
@admin_required
def admin_product(pid=None):
    p = q1("SELECT * FROM products WHERE id=?", (pid,)) if pid else None
    if pid and not p:
        abort(404)
    if request.method == "POST":
        f = request.form
        try:
            price = rupees(f.get("price"))
            orig = rupees(f.get("original_price"), True)
        except ValueError as e:
            flash(str(e), "error")
            return render_template("admin/product_form.html", p=f, pid=pid, styles=STYLES), 400
        name = f.get("name", "").strip()
        if not name:
            flash("Product name is required.", "error")
            return render_template("admin/product_form.html", p=f, pid=pid, styles=STYLES), 400
        faqs = []
        for line in f.get("faqs", "").splitlines():
            if "|" in line:
                a, b = line.split("|", 1)
                if a.strip() and b.strip():
                    faqs.append([a.strip(), b.strip()])
        try:
            ac = int(f["asset_count"]) if f.get("asset_count", "").strip() else None
        except ValueError:
            ac = None
        thumb = save_image(request.files.get("thumb"), "products", 1400) or (p["thumb_path"] if p else None)
        fpath, fname = save_protected(request.files.get("file"))
        if fpath is None and p:
            fpath, fname = p["file_path"], p["file_name"]
        elif fpath and p and p["file_path"]:
            try:
                os.remove(os.path.join(PROTECTED, os.path.basename(p["file_path"])))
            except OSError:
                pass
        vals = (name, f.get("short_desc", "").strip(), f.get("description", "").strip(), f.get("category"), price, orig,
                f.get("format", "").strip(), f.get("compat", "").strip(), f.get("includes", "").strip(), ac,
                f.get("file_formats", "").strip(), f.get("file_size", "").strip(), f.get("usage_rights", "").strip(),
                json.dumps(faqs), f.get("thumb_style") if f.get("thumb_style") in STYLES else "portal",
                int(f.get("thumb_seed") or 1) if (f.get("thumb_seed") or "1").isdigit() else 1, thumb, fpath, fname,
                flag("featured"), flag("is_new"), flag("is_bundle"), flag("active"), flag("is_demo"))
        cols = ("name,short_desc,description,category,price,original_price,format,compat,includes,asset_count,file_formats,"
                "file_size,usage_rights,faqs,thumb_style,thumb_seed,thumb_path,file_path,file_name,featured,is_new,is_bundle,active,is_demo").split(",")
        if p:
            run(f"UPDATE products SET {','.join(c + '=?' for c in cols)} WHERE id=?", vals + (pid,))
        else:
            slug = unique_slug("products", name)
            pid = run(f"INSERT INTO products(slug,{','.join(cols)}) VALUES(?,{','.join('?' * len(cols))})", (slug,) + vals).lastrowid
        flash("Saved. The product is live on the store." if flag("active") else "Saved as hidden (not on the store).", "ok")
        return redirect(url_for("admin_product", pid=pid))
    return render_template("admin/product_form.html", p=p, pid=pid, styles=STYLES,
                           faq_text="\n".join(f"{a}|{b}" for a, b in core.fromjson(p["faqs"])) if p else "")


@app.route("/admin/products/<int:pid>/delete", methods=["POST"])
@admin_required
def admin_product_delete(pid):
    p = q1("SELECT * FROM products WHERE id=?", (pid,)) or abort(404)
    if q1("SELECT 1 FROM order_items WHERE product_id=?", (pid,)):
        run("UPDATE products SET active=0 WHERE id=?", (pid,))
        flash("This product has orders, so it was hidden instead of deleted. Buyers keep their downloads.", "ok")
    else:
        if p["file_path"]:
            try:
                os.remove(os.path.join(PROTECTED, os.path.basename(p["file_path"])))
            except OSError:
                pass
        run("DELETE FROM products WHERE id=?", (pid,))
        flash("Product deleted.", "ok")
    return redirect(url_for("admin_products"))


# ---- orders ---------------------------------------------------------------------
@app.route("/admin/orders")
@admin_required
def admin_orders():
    st = request.args.get("status", "")
    rows = q("SELECT o.*, u.name FROM orders o LEFT JOIN users u ON u.id=o.user_id" + (" WHERE o.status=?" if st in ORDER_STATUSES else "") + " ORDER BY o.id DESC LIMIT 300",
             (st,) if st in ORDER_STATUSES else ())
    items = {o["id"]: [i["name"] for i in q("SELECT name FROM order_items WHERE order_id=?", (o["id"],))] for o in rows}
    return render_template("admin/orders.html", rows=rows, items=items, statuses=ORDER_STATUSES, st=st)


@app.route("/admin/orders/<int:oid>/status", methods=["POST"])
@admin_required
def admin_order_status(oid):
    s = request.form.get("status")
    if s not in ORDER_STATUSES:
        abort(400)
    o = q1("SELECT * FROM orders WHERE id=?", (oid,)) or abort(404)
    if s == "paid" and o["status"] != "paid":
        flash("Orders are marked paid automatically after the payment provider confirms them. Set Paid manually only after checking the payment in your Razorpay dashboard.", "warn")
        if request.form.get("confirm") != "yes":
            return redirect(url_for("admin_orders"))
    run("UPDATE orders SET status=? WHERE id=?", (s, oid))
    flash(f"Order {o['order_no']} set to {s}. Downloads are only available while an order is paid.", "ok")
    return redirect(url_for("admin_orders"))


# ---- portfolio ------------------------------------------------------------------
@app.route("/admin/portfolio")
@admin_required
def admin_portfolio():
    return render_template("admin/portfolio.html", rows=q("SELECT * FROM portfolio ORDER BY sort, id"))


@app.route("/admin/portfolio/new", methods=["GET", "POST"])
@app.route("/admin/portfolio/<int:wid>", methods=["GET", "POST"])
@admin_required
def admin_work(wid=None):
    w = q1("SELECT * FROM portfolio WHERE id=?", (wid,)) if wid else None
    if wid and not w:
        abort(404)
    if request.method == "POST":
        f = request.form
        title = f.get("title", "").strip()
        if not title:
            flash("Title is required.", "error")
            return render_template("admin/work_form.html", w=f, wid=wid, styles=STYLES), 400
        image = save_image(request.files.get("image"), "portfolio") or (w["image_path"] if w else None)
        gallery = core.fromjson(w["gallery"]) if w else []
        if f.get("clear_gallery"):
            gallery = []
        for fs in request.files.getlist("gallery"):
            g = save_image(fs, "portfolio")
            if g:
                gallery.append(g)
        kind = f.get("kind") if f.get("kind") in PORTFOLIO_KINDS else "personal"
        try:
            sort = int(f.get("sort") or 0)
        except ValueError:
            sort = 0
        cols = "title,category,kind,client_name,summary,description,tools,process,thumb_style,thumb_seed,image_path,gallery,video_url,featured,active,sort".split(",")
        vals = (title, f.get("category"), kind, f.get("client_name", "").strip(), f.get("summary", "").strip(), f.get("description", "").strip(),
                f.get("tools", "").strip(), f.get("process", "").strip(), f.get("thumb_style") if f.get("thumb_style") in STYLES else "portal",
                int(f.get("thumb_seed")) if (f.get("thumb_seed") or "").isdigit() else 1, image, json.dumps(gallery),
                f.get("video_url", "").strip(), flag("featured"), flag("active"), sort)
        if w:
            run(f"UPDATE portfolio SET {','.join(c + '=?' for c in cols)} WHERE id=?", vals + (wid,))
        else:
            wid = run(f"INSERT INTO portfolio(slug,{','.join(cols)}) VALUES(?,{','.join('?' * len(cols))})", (unique_slug("portfolio", title),) + vals).lastrowid
        flash("Saved.", "ok")
        return redirect(url_for("admin_work", wid=wid))
    return render_template("admin/work_form.html", w=w, wid=wid, styles=STYLES)


@app.route("/admin/portfolio/<int:wid>/delete", methods=["POST"])
@admin_required
def admin_work_delete(wid):
    run("DELETE FROM portfolio WHERE id=?", (wid,))
    flash("Project deleted.", "ok")
    return redirect(url_for("admin_portfolio"))


# ---- inquiries / subscribers / testimonials / coupons / settings -----------------
@app.route("/admin/inquiries", methods=["GET", "POST"])
@admin_required
def admin_inquiries():
    if request.method == "POST":
        if request.form.get("status") in INQUIRY_STATUSES:
            run("UPDATE inquiries SET status=? WHERE id=?", (request.form["status"], request.form.get("id")))
            flash("Status updated.", "ok")
        return redirect(url_for("admin_inquiries"))
    return render_template("admin/inquiries.html", rows=q("SELECT * FROM inquiries ORDER BY id DESC LIMIT 300"), statuses=INQUIRY_STATUSES)


@app.route("/admin/subscribers")
@admin_required
def admin_subscribers():
    rows = q("SELECT * FROM subscribers ORDER BY id DESC")
    if request.args.get("csv"):
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["email", "subscribed_at"])
        for r in rows:
            w.writerow([r["email"], r["created_at"]])
        return Response(buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=subscribers.csv"})
    return render_template("admin/subscribers.html", rows=rows)


@app.route("/admin/testimonials", methods=["GET", "POST"])
@admin_required
def admin_testimonials():
    if request.method == "POST":
        if request.form.get("delete"):
            run("DELETE FROM testimonials WHERE id=?", (request.form["delete"],))
        else:
            name, quote = request.form.get("name", "").strip(), request.form.get("quote", "").strip()
            if name and quote:
                try:
                    rating = max(1, min(5, int(request.form.get("rating", 5))))
                except ValueError:
                    rating = 5
                run("INSERT INTO testimonials(name,role,quote,rating) VALUES(?,?,?,?)", (name, request.form.get("role", "").strip(), quote, rating))
                flash("Added. Only add feedback that a real customer gave you permission to publish.", "ok")
            else:
                flash("Name and feedback are required.", "error")
        return redirect(url_for("admin_testimonials"))
    return render_template("admin/testimonials.html", rows=q("SELECT * FROM testimonials ORDER BY id DESC"))


@app.route("/admin/coupons", methods=["GET", "POST"])
@admin_required
def admin_coupons():
    if request.method == "POST":
        f = request.form
        if f.get("delete"):
            run("DELETE FROM coupons WHERE code=?", (f["delete"],))
        elif f.get("toggle"):
            run("UPDATE coupons SET active=1-active WHERE code=?", (f["toggle"],))
        else:
            code = f.get("code", "").strip().upper()
            try:
                pct = int(f.get("percent") or 0)
                off = rupees(f.get("amount_off") or "0")
                mx = int(f.get("max_uses") or 0)
                mn = rupees(f.get("min_total") or "0")
            except (ValueError, TypeError):
                flash("Check the numbers you entered.", "error")
                return redirect(url_for("admin_coupons"))
            if not code.isalnum() or not (1 <= pct <= 100 or off > 0):
                flash("Use letters and numbers for the code, and set a percentage (1-100) or a rupee amount.", "error")
            else:
                run("INSERT OR REPLACE INTO coupons(code,percent,amount_off,active,expires_at,max_uses,min_total,note,used) VALUES(?,?,?,1,?,?,?,?,COALESCE((SELECT used FROM coupons WHERE code=?),0))",
                    (code, pct, off, f.get("expires_at") or None, mx, mn, f.get("note", ""), code))
                flash("Coupon saved.", "ok")
        return redirect(url_for("admin_coupons"))
    return render_template("admin/coupons.html", rows=q("SELECT * FROM coupons ORDER BY code"))


@app.route("/admin/settings", methods=["GET", "POST"])
@admin_required
def admin_settings():
    if request.method == "POST":
        for k in SETTING_LABELS:
            if k in request.form:
                v = request.form[k].strip()
                if k.endswith("_url") and v and not v.startswith(("http://", "https://")):
                    flash(f"{SETTING_LABELS[k]} must start with http:// or https://", "error")
                    continue
                run("INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)", (k, v))
        flash("Settings saved.", "ok")
        return redirect(url_for("admin_settings"))
    return render_template("admin/settings.html", labels=SETTING_LABELS, S=core.settings())


def bootstrap_admin():
    email, pw = os.environ.get("ADMIN_EMAIL"), os.environ.get("ADMIN_PASSWORD")
    if email and pw and valid_email(email) and len(pw) >= 10:
        c = core.connect()
        if not c.execute("SELECT 1 FROM users WHERE email=? AND is_admin=1", (email.lower(),)).fetchone():
            if c.execute("SELECT 1 FROM users WHERE email=?", (email.lower(),)).fetchone():
                c.execute("UPDATE users SET is_admin=1 WHERE email=?", (email.lower(),))
            else:
                c.execute("INSERT INTO users(email,name,password_hash,is_admin) VALUES(?,?,?,1)", (email.lower(), "Admin", generate_password_hash(pw)))
            c.commit()
        c.close()

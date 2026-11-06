"""Core: app configuration, database, security helpers, template filters."""
import hashlib
import hmac
import json
import os
import re
import secrets
import smtplib
import sqlite3
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from urllib.parse import urlparse

from flask import Flask, abort, g, jsonify, redirect, request, session, url_for
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from content import DEFAULT_SETTINGS

BASE = os.path.dirname(os.path.abspath(__file__))
INSTANCE = os.path.join(BASE, "instance")
os.makedirs(INSTANCE, exist_ok=True)
ENV = os.environ.get("APP_ENV", "development").lower()
IS_PROD = ENV == "production"

# ---- secrets ---------------------------------------------------------------
SECRET = os.environ.get("SECRET_KEY")
if not SECRET:
    if IS_PROD:
        raise RuntimeError("SECRET_KEY must be set when APP_ENV=production")
    kp = os.path.join(INSTANCE, "dev_secret.key")
    if not os.path.exists(kp):
        with open(kp, "w") as f:
            f.write(secrets.token_hex(32))
    SECRET = open(kp).read().strip()

RZP_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RZP_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RZP_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
RZP_CONFIGURED = bool(RZP_KEY_ID and RZP_KEY_SECRET)
# Test-only switch. It is ignored whenever APP_ENV=production.
DEMO_PAYMENTS = (not IS_PROD) and os.environ.get("DEMO_PAYMENTS") == "1"

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(INSTANCE, "site.db"))
PROTECTED = os.environ.get("PROTECTED_DIR", os.path.join(INSTANCE, "protected"))
PUBLIC_UPLOADS = os.path.join(BASE, "static", "uploads")
for d in (PROTECTED, PUBLIC_UPLOADS):
    os.makedirs(d, exist_ok=True)

app = Flask(__name__, instance_path=INSTANCE)
app.config.update(
    SECRET_KEY=SECRET,
    MAX_CONTENT_LENGTH=int(os.environ.get("MAX_UPLOAD_MB", "512")) * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=IS_PROD,
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 14,
    JSON_SORT_KEYS=False,
)
signer = URLSafeTimedSerializer(SECRET, salt="ami-signed")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, short_desc TEXT, description TEXT,
  category TEXT, price INTEGER NOT NULL, original_price INTEGER, format TEXT, compat TEXT, includes TEXT, asset_count INTEGER,
  file_formats TEXT, file_size TEXT, usage_rights TEXT, faqs TEXT, thumb_style TEXT DEFAULT 'portal', thumb_seed INTEGER DEFAULT 1,
  thumb_path TEXT, file_path TEXT, file_name TEXT, featured INTEGER DEFAULT 0, is_new INTEGER DEFAULT 0, is_bundle INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1, is_demo INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, order_no TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL, email TEXT,
  subtotal INTEGER, discount INTEGER DEFAULT 0, total INTEGER, coupon_code TEXT, status TEXT DEFAULT 'pending', provider TEXT,
  provider_order_id TEXT, provider_payment_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, paid_at TEXT);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, name TEXT, price INTEGER,
  download_count INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS coupons(code TEXT PRIMARY KEY, percent INTEGER DEFAULT 0, amount_off INTEGER DEFAULT 0, active INTEGER DEFAULT 1,
  expires_at TEXT, max_uses INTEGER DEFAULT 0, used INTEGER DEFAULT 0, min_total INTEGER DEFAULT 0, note TEXT);
CREATE TABLE IF NOT EXISTS portfolio(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, category TEXT, kind TEXT DEFAULT 'personal',
  client_name TEXT, summary TEXT, description TEXT, tools TEXT, process TEXT, thumb_style TEXT DEFAULT 'portal', thumb_seed INTEGER DEFAULT 1,
  image_path TEXT, gallery TEXT, video_url TEXT, featured INTEGER DEFAULT 0, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS inquiries(id INTEGER PRIMARY KEY, name TEXT, email TEXT, business TEXT, service TEXT, description TEXT, budget TEXT,
  deadline TEXT, links TEXT, status TEXT DEFAULT 'new', ip TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS subscribers(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS testimonials(id INTEGER PRIMARY KEY, name TEXT, role TEXT, quote TEXT, rating INTEGER DEFAULT 5, approved INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
"""


def connect():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.execute("PRAGMA journal_mode=WAL")
    return c


def db():
    if "db" not in g:
        g.db = connect()
    return g.db


@app.teardown_appcontext
def _close(_):
    c = g.pop("db", None)
    if c:
        c.close()


def q(sql, args=()):
    return db().execute(sql, args).fetchall()


def q1(sql, args=()):
    return db().execute(sql, args).fetchone()


def run(sql, args=()):
    cur = db().execute(sql, args)
    db().commit()
    return cur


def init_db():
    c = connect()
    c.executescript(SCHEMA)
    c.commit()
    from seed import seed
    seed(c, BASE)
    c.close()


# ---- settings ---------------------------------------------------------------
def settings():
    if "settings" not in g:
        s = dict(DEFAULT_SETTINGS)
        for r in q("SELECT key,value FROM settings"):
            s[r["key"]] = r["value"]
        g.settings = s
    return g.settings


# ---- security ---------------------------------------------------------------
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$")


def valid_email(e):
    return bool(e) and len(e) <= 254 and bool(EMAIL_RE.match(e))


def csrf_token():
    if "csrf" not in session:
        session["csrf"] = secrets.token_urlsafe(32)
    return session["csrf"]


@app.before_request
def _csrf_guard():
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.endpoint not in ("razorpay_webhook",):
        sent = request.headers.get("X-CSRFToken") or request.form.get("csrf_token", "")
        if not sent or not hmac.compare_digest(sent, session.get("csrf", "")):
            if request.path.startswith("/api/"):
                return jsonify(ok=False, error="Your session expired. Reload the page and try again."), 400
            abort(400, "Invalid or missing CSRF token. Reload the page and try again.")


_hits = {}


def rate_limit(key, limit, window):
    """In-memory limiter (per process). Use Redis or your host's WAF for multi-worker setups."""
    now = time.time()
    arr = [t for t in _hits.get(key, []) if now - t < window]
    if len(arr) >= limit:
        _hits[key] = arr
        return False
    arr.append(now)
    _hits[key] = arr
    return True


def client_ip():
    if os.environ.get("TRUST_PROXY") == "1":
        return (request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.remote_addr or "?")
    return request.remote_addr or "?"


def safe_next(n, default="/"):
    if n and n.startswith("/") and not n.startswith("//") and "\\" not in n:
        return n
    return default


@app.after_request
def _headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    resp.headers.setdefault("Content-Security-Policy",
        "default-src 'self'; script-src 'self' https://checkout.razorpay.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https:; media-src 'self' blob: https:; "
        "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://api.razorpay.com; "
        "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com; form-action 'self'; base-uri 'self'; object-src 'none'")
    if IS_PROD:
        resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    if request.path.startswith(("/account", "/admin", "/api/checkout", "/dl/", "/order/")):
        resp.headers["Cache-Control"] = "no-store"
    return resp


# ---- auth -------------------------------------------------------------------
def current_user():
    if "user" not in g:
        g.user = None
        uid = session.get("uid")
        if uid:
            g.user = q1("SELECT * FROM users WHERE id=?", (uid,))
    return g.user


def login_user(user):
    csrf = session.get("csrf")
    session.clear()
    session["uid"] = user["id"]
    session["csrf"] = csrf or secrets.token_urlsafe(32)
    session.permanent = True


def login_required(f):
    from functools import wraps

    @wraps(f)
    def w(*a, **k):
        if not current_user():
            if request.path.startswith("/api/"):
                return jsonify(ok=False, error="Please sign in to continue.", login_url=url_for("login", next=request.args.get("next", "/checkout"))), 401
            return redirect(url_for("login", next=request.path))
        return f(*a, **k)
    return w


def admin_required(f):
    from functools import wraps

    @wraps(f)
    def w(*a, **k):
        u = current_user()
        if not u or not u["is_admin"]:
            if u:
                abort(403)
            return redirect(url_for("admin_login", next=request.path))
        return f(*a, **k)
    return w


# ---- money / filters --------------------------------------------------------
def inr(paise):
    if paise is None:
        return ""
    paise = int(paise)
    rupees, rem = divmod(abs(paise), 100)
    s = str(rupees)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts + [tail])
    out = "₹" + s + (f".{rem:02d}" if rem else "")
    return "-" + out if paise < 0 else out


app.jinja_env.filters["inr"] = inr


@app.template_filter("paras")
def paras(text):
    return [p.strip() for p in (text or "").split("\n\n") if p.strip()]


@app.template_filter("lines")
def lines(text):
    return [l.strip() for l in (text or "").splitlines() if l.strip()]


@app.template_filter("embed")
def embed(url):
    """Return ('youtube'|'vimeo'|'file', src) for a video URL."""
    if not url:
        return None
    m = re.search(r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})", url)
    if m:
        return ("youtube", f"https://www.youtube-nocookie.com/embed/{m.group(1)}")
    m = re.search(r"vimeo\.com/(\d+)", url)
    if m:
        return ("vimeo", f"https://player.vimeo.com/video/{m.group(1)}")
    if urlparse(url).scheme in ("http", "https", "") and re.search(r"\.(mp4|webm|mov)(\?|$)", url, re.I):
        return ("file", url)
    return None


@app.template_filter("fromjson")
def fromjson(s):
    try:
        return json.loads(s) if s else []
    except Exception:
        return []


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


# ---- mail (optional) ----------------------------------------------------------
def send_mail(to, subject, body):
    host = os.environ.get("SMTP_HOST")
    if not host or not to:
        return False
    try:
        m = EmailMessage()
        m["From"] = os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", "no-reply@localhost"))
        m["To"], m["Subject"] = to, subject
        m.set_content(body)
        with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", "587")), timeout=15) as s:
            s.starttls()
            if os.environ.get("SMTP_USER"):
                s.login(os.environ["SMTP_USER"], os.environ.get("SMTP_PASSWORD", ""))
            s.send_message(m)
        return True
    except Exception as e:  # never break the request because email failed
        app.logger.warning("mail failed: %s", e)
        return False


# ---- payment signature (Razorpay) ---------------------------------------------
def rzp_signature_ok(order_id, payment_id, signature):
    if not (RZP_KEY_SECRET and order_id and payment_id and signature):
        return False
    expected = hmac.new(RZP_KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s[:80] or "item"


def unique_slug(table, base, exclude_id=None):
    slug, n = slugify(base), 2
    while True:
        row = q1(f"SELECT id FROM {table} WHERE slug=?", (slug,))
        if not row or row["id"] == exclude_id:
            return slug
        slug = f"{slugify(base)}-{n}"
        n += 1

"""Shared helpers for the AI MANGA INDIA Python backend (Vercel serverless functions).

No third-party packages: standard library only.
Delivery is by SMTP e-mail to the site owner. Nothing is stored on the server.
A function only reports success when the mail server accepted the message; if mail is not
configured it answers 503 {"error": "not_configured"} so the website never pretends it was sent.

Environment variables (set them in Vercel -> Project -> Settings -> Environment Variables):
  SMTP_HOST      default smtp.gmail.com
  SMTP_PORT      default 587
  SMTP_SECURITY  starttls (default) | ssl | none
  SMTP_USER      mailbox that sends the notification (e.g. ai.mangaindia.in@gmail.com)
  SMTP_PASS      its password. For Gmail use an App Password (needs 2-Step Verification), never the normal password
  MAIL_TO        where inquiries are delivered (default: SMTP_USER)
  MAIL_FROM      optional From address (default: SMTP_USER)
  ALLOWED_ORIGINS optional comma list of extra site origins allowed to call the API (e.g. https://yourdomain.com)
"""
import json, os, re, smtplib, ssl, time
from email.message import EmailMessage
from email.utils import formataddr
from http.server import BaseHTTPRequestHandler

SITE_NAME = "AI MANGA INDIA"
SERVICES = {
    "AI Video Production & Animation", "AI Video Advertising & Commercials", "AI Graphic Design & Visual Branding",
    "AI Digital Art & Illustration", "AI Manga, Anime & Character Design", "Custom Creative Services",
    "Creative Packages for Businesses & Content Creators", "Other",
}
EMAIL_RE = re.compile(r"^[^\s@<>\"',;]+@[^\s@<>\"',;]+\.[^\s@<>\"',;]{2,}$")
URL_RE = re.compile(r"^https?://[^\s<>\"']+\.[^\s<>\"']+$")
MAX_BODY = 20_000
_hits = {}  # ip -> [timestamps]; best effort only (each serverless instance has its own memory)


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message); self.status, self.code, self.message = status, code, message


def clean(value, limit, multiline=False):
    """String -> trimmed text without control characters (blocks header injection)."""
    if value is None: return ""
    if not isinstance(value, str): raise ApiError(400, "invalid", "Invalid field type.")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    if not multiline: value = re.sub(r"\s+", " ", value)
    return value.strip()[:limit]


def mail_config():
    user, pw = os.environ.get("SMTP_USER", "").strip(), os.environ.get("SMTP_PASS", "").strip()
    if not user or not pw: return None
    return {
        "host": os.environ.get("SMTP_HOST", "smtp.gmail.com").strip(), "port": int(os.environ.get("SMTP_PORT", "587") or 587),
        "security": os.environ.get("SMTP_SECURITY", "starttls").strip().lower(), "user": user, "password": pw,
        "to": os.environ.get("MAIL_TO", "").strip() or user, "from": os.environ.get("MAIL_FROM", "").strip() or user,
    }


def send_mail(subject, body, reply_to=None):
    cfg = mail_config()
    if not cfg: raise ApiError(503, "not_configured", "Email delivery is not configured on the server yet.")
    msg = EmailMessage()
    msg["Subject"] = clean(subject, 200); msg["From"] = formataddr((SITE_NAME + " website", cfg["from"])); msg["To"] = cfg["to"]
    if reply_to and EMAIL_RE.match(reply_to): msg["Reply-To"] = reply_to
    msg.set_content(body)
    try:
        if cfg["security"] == "ssl":
            smtp = smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=10, context=ssl.create_default_context())
        else:
            smtp = smtplib.SMTP(cfg["host"], cfg["port"], timeout=10)
        with smtp:
            if cfg["security"] == "starttls": smtp.starttls(context=ssl.create_default_context())
            if cfg["security"] != "none" or cfg["password"]: 
                try: smtp.login(cfg["user"], cfg["password"])
                except smtplib.SMTPNotSupportedError: pass
            smtp.send_message(msg)
    except ApiError: raise
    except Exception as e:  # network / auth failure: never leak details to the visitor
        print("mail error:", type(e).__name__, str(e)[:200])
        raise ApiError(502, "delivery_failed", "The message could not be delivered. Please try again or email us directly.")


def check_origin(headers):
    origin = headers.get("Origin") or ""
    if not origin: return  # non-browser or same-origin GET; the honeypot / validation still apply
    host = headers.get("X-Forwarded-Host") or headers.get("Host") or ""
    allowed = {f"https://{host}", f"http://{host}"} | {o.strip().rstrip("/") for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()}
    if origin.rstrip("/") not in allowed: raise ApiError(403, "forbidden_origin", "Request not allowed from this site.")


def rate_limit(ip, limit=5, window=600):
    now = time.time(); hits = [t for t in _hits.get(ip, []) if now - t < window]
    if len(hits) >= limit: raise ApiError(429, "rate_limited", "Too many requests. Please wait a few minutes and try again.")
    hits.append(now); _hits[ip] = hits
    if len(_hits) > 2000: _hits.clear()


def validate_inquiry(d):
    name, email = clean(d.get("name"), 100), clean(d.get("email"), 200).lower()
    service, message = clean(d.get("service"), 100), clean(d.get("message"), 5000, True)
    brand, budget, deadline = clean(d.get("brand"), 100), clean(d.get("budget"), 40), clean(d.get("deadline"), 20)
    links = clean(d.get("links"), 1000)
    if len(name) < 2: raise ApiError(422, "invalid", "Please enter your name.")
    if not EMAIL_RE.match(email): raise ApiError(422, "invalid", "Please enter a valid email address.")
    if service not in SERVICES: raise ApiError(422, "invalid", "Please choose a service.")
    if len(message) < 20: raise ApiError(422, "invalid", "Please describe your project (at least 20 characters).")
    if deadline and not re.match(r"^\d{4}-\d{2}-\d{2}$", deadline): raise ApiError(422, "invalid", "Invalid deadline date.")
    bad = [u for u in re.split(r"[\s,]+", links) if u and not URL_RE.match(u)]
    if bad: raise ApiError(422, "invalid", "Reference links must start with http:// or https://")
    return dict(name=name, email=email, service=service, message=message, brand=brand, budget=budget, deadline=deadline, links=links)


class JsonHandler(BaseHTTPRequestHandler):
    """Base class: JSON in / JSON out, CORS-less (same origin), no caching. Subclasses implement process(data)."""
    def _send(self, status, payload):
        raw = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff"); self.send_header("Content-Length", str(len(raw)))
        self.end_headers(); self.wfile.write(raw)

    def client_ip(self):
        return (self.headers.get("X-Forwarded-For") or self.client_address[0] or "?").split(",")[0].strip()

    def do_POST(self):
        try:
            check_origin(self.headers)
            if "application/json" not in (self.headers.get("Content-Type") or ""): raise ApiError(415, "invalid", "Send JSON.")
            n = int(self.headers.get("Content-Length") or 0)
            if n <= 0 or n > MAX_BODY: raise ApiError(413, "invalid", "Request too large or empty.")
            try: data = json.loads(self.rfile.read(n))
            except ValueError: raise ApiError(400, "invalid", "Invalid JSON.")
            if not isinstance(data, dict): raise ApiError(400, "invalid", "Invalid JSON.")
            if data.get("company_website"):  # honeypot filled: pretend success, send nothing
                return self._send(200, {"ok": True})
            rate_limit(self.client_ip())
            self._send(200, self.process(data))
        except ApiError as e:
            self._send(e.status, {"ok": False, "error": e.code, "message": e.message})
        except Exception as e:
            print("unhandled:", type(e).__name__, str(e)[:200])
            self._send(500, {"ok": False, "error": "server_error", "message": "Something went wrong. Please try again."})

    def do_GET(self): self._send(405, {"ok": False, "error": "method_not_allowed", "message": "Use POST."})
    def log_message(self, *a): pass

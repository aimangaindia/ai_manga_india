"""Quick self-check. Run:  python tests/smoke.py
Uses a throwaway database; touches none of your real data."""
import os, sys, tempfile
tmp = tempfile.mkdtemp()
os.environ.update(DATABASE_PATH=f"{tmp}/t.db", PROTECTED_DIR=f"{tmp}/prot", APP_ENV="development",
                  ADMIN_EMAIL="admin@test.local", ADMIN_PASSWORD="TestPass12345")
os.environ.pop("DEMO_PAYMENTS", None)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as site
c = site.app.test_client()
fails = 0
def check(name, ok, extra=""):
    global fails
    fails += not ok
    print("PASS" if ok else "FAIL", name, extra)

for u in ["/", "/portfolio", "/services", "/shop", "/shop/premium-prompt-bundle", "/about", "/contact", "/faq",
          "/cart", "/login", "/register", "/privacy", "/terms", "/refund-policy", "/license", "/robots.txt", "/sitemap.xml",
          "/api/cart"]:
    r = c.get(u); check(f"GET {u}", r.status_code == 200, str(r.status_code))
check("unknown page gives 404", c.get("/nope").status_code == 404)
for u in ["/checkout", "/account", "/admin", "/admin/products", "/admin/orders"]:
    r = c.get(u); check(f"{u} blocked when signed out", r.status_code in (302, 401, 403), str(r.status_code))
r = c.get("/dl/forged"); check("forged download link never serves a file", r.status_code != 200 and not r.headers.get("Content-Disposition"), str(r.status_code))
check("test-payment endpoint off by default", c.post("/api/checkout/demo-pay", json={}).status_code >= 400)
html = c.get("/").get_data(as_text=True)
check("home has the headline", "STORYTELLING" in html.upper())
check("sitemap lists products", "premium-prompt-bundle" in c.get("/sitemap.xml").get_data(as_text=True))
print("\n%s" % ("ALL PASSED" if not fails else f"{fails} FAILED"))
sys.exit(1 if fails else 0)

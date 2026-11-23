#!/usr/bin/env python3
"""Generates the static HTML entry pages for the multi-page Services system from data/catalog.json.

  python3 tools/build_pages.py

Writes:  services/index.html                (/services)
         services/<slug>/index.html         (/services/<slug>)
         product/<slug>/index.html          (/product/<slug>)
         sitemap.xml                        (all public pages)

Each page gets its own <title>, description, canonical URL, Open Graph tags, breadcrumb JSON-LD and a plain-HTML
fallback (what search engines and no-JS visitors see). js/catalog.js then renders the full interactive page from the same JSON.
Run it again after editing data/catalog.json. Safe to re-run; it only overwrites the files listed above."""
import json, html, os, re, shutil, datetime
from urllib.parse import quote
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = re.search(r'siteUrl:\s*"([^"]+)"', open(os.path.join(ROOT, "js/config.js")).read()).group(1).rstrip("/")
CAT = json.load(open(os.path.join(ROOT, "data/catalog.json")))
E = lambda s: html.escape(str(s), quote=True)
TODAY = datetime.date.today().isoformat()
ORG = {"@id": SITE + "/#org"}

def crumbs_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}

def page(path, title, desc, view, slug, body, ld, og_img):
    url = SITE + path
    ldtags = "\n".join('<script type="application/ld+json">%s</script>' % json.dumps(x, ensure_ascii=False) for x in ld)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<base href="/">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="#080A12">
<link rel="canonical" href="{E(url)}">
<link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">
<meta property="og:site_name" content="AI MANGA INDIA">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{E(url)}">
<meta property="og:image" content="{SITE}/assets/images/og-image.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}/assets/images/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap">
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/responsive.css">
<link rel="stylesheet" href="css/animations.css">
<link rel="stylesheet" href="css/services.css">
{ldtags}
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<div id="site-header"></div>
<main id="main" data-view="{view}" data-slug="{E(slug)}">
<div id="view">
{body}
</div>
</main>
<div id="site-footer"></div>
<script src="js/config.js" defer></script>
<script src="js/data.js" defer></script>
<script src="js/icons.js" defer></script>
<script src="js/main.js" defer></script>
<script src="js/filters.js" defer></script>
<script src="js/navigation.js" defer></script>
<script src="js/order.js" defer></script>
<script src="js/cart.js" defer></script>
<script src="js/contact.js" defer></script>
<script src="js/catalog.js" defer></script>
</body>
</html>
'''

def crumbs_html(items):
    out = []
    for i, (n, u) in enumerate(items):
        out.append(f'<a href="{E(u)}">{E(n)}</a>' if i < len(items) - 1 else E(n))
    return '<nav class="crumbs" aria-label="Breadcrumb">' + '<span aria-hidden="true">/</span>'.join(out) + '</nav>'

def write(path, content):
    full = os.path.join(ROOT, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(content)

urls = []
# ---- /services
S = CAT["services"]
sub = "Discover creative solutions designed to bring your ideas to life. From cinematic AI videos to professional graphic design, explore our services and find the perfect solution for your vision."
body = f'''<section class="page-hero"><div class="container">{crumbs_html([("Home", "/"), ("Services", "/services")])}
<h1>Explore Our Creative Services</h1><p>{E(sub)}</p>
<ul class="static-list">{"".join(f'<li><a href="/services/{s["slug"]}">{E(s["title"])}</a> — {E(s["short"])}</li>' for s in S)}</ul></div></section>'''
ld = [crumbs_ld([("Home", "/"), ("Services", "/services")]),
      {"@context": "https://schema.org", "@type": "ItemList", "name": "AI MANGA INDIA creative services", "itemListElement": [
          {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/services/{s['slug']}", "name": s["title"]} for i, s in enumerate(S)]}]
write("/services", page("/services", "Explore Our Creative Services | AI MANGA INDIA",
      "Explore AI video production, video advertising, graphic design, digital art, manga and character design, and custom creative services from AI MANGA INDIA.",
      "services", "", body, ld, ""))
urls.append("/services")

for s in S:
    p = f"/services/{s['slug']}"
    cr = [("Home", "/"), ("Services", "/services"), (s["title"], p)]
    desc = f"{s['lead']} {', '.join(s['highlights'][:3])}. Request a quote from AI MANGA INDIA."
    body = f'''<section class="page-hero"><div class="container">{crumbs_html(cr)}
<h1>{E(s["title"])}</h1><p>{E(s["lead"])}</p><p>{E(s["intro"]["offers"])}</p>
<h2 class="static-h">What we offer</h2><ul class="static-list">{"".join(f'<li><a href="/product/{o["slug"]}">{E(o["title"])}</a> — {E(o["short"])}</li>' for o in s["offerings"])}</ul>
<p><a class="btn btn-primary" href="contact.html?service={quote(s["value"])}">Request a Custom Project</a></p></div></section>'''
    ld = [crumbs_ld(cr), {"@context": "https://schema.org", "@type": "Service", "name": s["title"], "description": s["lead"], "url": SITE + p, "provider": ORG, "areaServed": "Worldwide",
          "hasOfferCatalog": {"@type": "OfferCatalog", "name": s["title"], "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": o["title"], "url": f"{SITE}/product/{o['slug']}"}} for o in s["offerings"]]}}]
    write(p, page(p, f"{s['title']} Services | AI MANGA INDIA", desc[:300], "service", s["slug"], body, ld, ""))
    urls.append(p)
    for o in s["offerings"]:
        q = f"/product/{o['slug']}"
        cr2 = [("Home", "/"), ("Services", "/services"), (s["title"], p), (o["title"], q)]
        body = f'''<section class="page-hero"><div class="container">{crumbs_html(cr2)}
<h1>{E(o["title"])}</h1><p>{E(o["short"])}</p><p>Part of <a href="{p}">{E(s["title"])}</a>. Pricing: quote on request.</p>
<h2 class="static-h">What you can request</h2><ul class="static-list">{"".join(f"<li>{E(i)}</li>" for i in o["includes"])}</ul>
<p><a class="btn btn-primary" href="contact.html?service={quote(s["value"])}&amp;topic={quote(o["title"])}">Request This Service</a></p></div></section>'''
        ld = [crumbs_ld(cr2), {"@context": "https://schema.org", "@type": "Service", "name": o["title"], "description": o["short"], "url": SITE + q, "provider": ORG,
              "serviceType": s["title"], "areaServed": "Worldwide"}]
        write(q, page(q, f"{o['title']} | {s['title']} — AI MANGA INDIA", f"{o['short']} Part of {s['title']}. Request a quote from AI MANGA INDIA.", "product", o["slug"], body, ld, ""))
        urls.append(q)

# ---- sitemap: static pages + generated pages
static = ["/", "/portfolio.html", "/editor.html", "/shop.html", "/about.html", "/contact.html", "/faq.html", "/privacy.html", "/terms.html", "/refund.html", "/license.html"]
rows = "".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in static[:1] + ["/services"] + static[1:] + [u for u in urls if u != "/services"])
open(os.path.join(ROOT, "sitemap.xml"), "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows + "</urlset>\n")
print(f"built {len(urls)} pages + sitemap ({SITE})")

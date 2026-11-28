# AI MANGA INDIA — Website

Premium AI creative studio, portfolio and digital-product storefront.
Pure **HTML5 + CSS3 + vanilla JavaScript (ES6+)** — no frameworks, no build step, no npm packages.

> **Imagine Beyond Limits. Create Beyond Reality.**

## What works today (and what doesn't)

| Area | Status |
|---|---|
| 16 pages, shared header/footer, mobile menu, search, 404 | ✅ working |
| Portfolio: filters, search, project modal, gallery, full-screen, video support, deep links | ✅ working |
| Services: cards + expandable detail sections, pre-filled inquiry links | ✅ working |
| Shop: search, category/quick filters, sorting, load more, quick view, product pages, gallery, related items | ✅ working |
| Cart: add/remove/quantity, coupon, localStorage persistence, drawer + cart page, checkout summary | ✅ working |
| Forms: validation, honeypot + time-trap spam protection, honest success/error states | ✅ working — **needs a form endpoint to actually deliver** |
| Payments & protected downloads | ⚙️ **front-end prepared only** — needs a backend (see roadmap). Checkout is deliberately disabled; nothing is ever simulated. |
| Accounts, orders, admin dashboard | ❌ not in a static site — structure/preview only (see roadmap) |
| Products, portfolio images, contact details | 🟡 **demonstration/placeholder content**, clearly labelled "Demo" |

## Project structure

```
AI-MANGA-INDIA/
├── index.html  portfolio.html  shop.html  product.html   (product.html = Digital Shop item)
├── services/…  product/…   Services system (generated): /services, /services/<service>, /product/<offering>
├── data/catalog.json       ← services, offerings and packages (edit this, then run tools/build_pages.py)
├── vercel.json             clean URLs, /services.html → /services redirect
├── about.html  contact.html  cart.html  checkout.html  account.html  faq.html
├── privacy.html  terms.html  refund.html  license.html  404.html
├── sitemap.xml  robots.txt
├── css/   style.css (design system) · responsive.css · animations.css
├── js/
│   ├── config.js      ← ONE place for contact details, endpoints, payment keys (public only), coupons
│   ├── data.js        ← ONE place for products, portfolio projects, services, FAQs, testimonials
│   ├── icons.js       Lucide-style inline SVG icons (no network)
│   ├── main.js        utilities, toasts, modal focus-trap, reveal, particles, parallax, transitions
│   ├── filters.js     search/chip/paging helpers shared by shop + portfolio
│   ├── navigation.js  header, mobile menu, search dialog, newsletter band, footer
│   ├── cart.js        cart state, drawer, cart page, checkout page, payment hand-off
│   ├── shop.js        product cards, shop page, quick view, product detail page
│   ├── portfolio.js   portfolio grid, filter, project modal
│   ├── contact.js     validation, spam protection, inquiry + newsletter submission
│   ├── services.js    home service cards, FAQ, testimonials, marquee, account tabs
│   └── catalog.js     renders /services, /services/<slug> and /product/<slug> from data/catalog.json
├── assets/  images/ products/ logos/ icons/ videos/
├── editor.html, js/editor.js, js/editor-templates.js, css/editor.css   Template Studio (in-browser editor)
└── tools/gen_assets.py   regenerates the placeholder artwork + logos (optional)
```

Header and footer are injected by `js/navigation.js`, so a link or footer column is edited **once**.

## Run it locally

Any static server works (opening files by double-click also mostly works, but a server is closer to production):

```bash
cd AI-MANGA-INDIA
python3 -m http.server 8000      # then open http://localhost:8000
# or:  npx serve   |   VS Code "Live Server" extension
```

To test on your phone (same Wi-Fi): `python3 -m http.server 8000 --bind 0.0.0.0`, then open `http://<your-computer-IP>:8000`.

### Test checklist
1. **Visitor:** Home → Portfolio (filter, search) → open a project → "Request a Similar Project" → fill the inquiry (the form tells you plainly it isn't connected yet and offers email).
2. **Shop:** Shop → filter/sort/search → Quick View → Add to Cart → cart page (quantity, coupon `WELCOME10`) → Checkout (payment button stays disabled until connected).
3. **Newsletter:** footer form — bad email is rejected; a valid one says "not subscribed yet" until an endpoint is set.
4. **Mobile:** open the menu, browse the 2-up product grid, add to cart, open the drawer.
5. Resize from 320px to 1920px — there should be no horizontal scrolling.
6. Enable "Reduce motion" in your OS — animations stop, content stays visible.

## Replace the sample content

* **Contact email, social links, endpoints** → `js/config.js` (also update `siteUrl`).
* **Products, prices, sale prices, descriptions, specs** → `js/data.js` → `products`. Put the real image in `assets/products/` and set `demo: false`, `available: true` only when the product truly exists and can be delivered.
* **Portfolio** → `js/data.js` → `projects`. Add real images/videos (`video: "assets/videos/x.mp4"`), a real `workflow`, and set `type` to `"client"` **only** for genuinely commissioned work. Set `demo: false`.
* **Testimonials** → `js/data.js` → `testimonials` (leave empty until you have real, permitted feedback — an honest "coming soon" state shows meanwhile).
* **Hero showreel (optional)** → put a short, compressed, muted video in `assets/videos/` and set `heroVideo` in `config.js`. The animated image hero shows if it's missing.
* **Logo / favicon** → `assets/logos/`, `assets/icons/favicon.svg`.
* **Legal pages** are **draft templates** — have them reviewed by a legal professional.

## Add your social media links + QR codes

Open `js/config.js` and paste each profile link into `socialProfiles` (leave `url: ""` to hide a platform):

```js
{ id: "instagram", name: "Instagram", url: "https://www.instagram.com/yourname/", handle: "@yourname", qrImage: "" },
```

A card with an auto-generated, scannable QR code and a "Download QR" (PNG) button then appears in the **Follow the studio** section on the Home and Contact pages, and the icon appears in the footer. To use your own branded QR image instead, put it in `assets/images/` and set `qrImage`. With no links added the section shows an honest "coming soon" note.

## Connect the forms (no backend needed)

Create a form endpoint with a service such as Formspree or Web3Forms, then set `contactFormEndpoint` / `newsletterEndpoint` in `config.js`. The page reports success **only** after a 2xx response. For newsletters use your email provider's form/API endpoint.

## Deploy

It's a static site, so any static host works — **Vercel, Netlify, Cloudflare Pages, GitHub Pages**:
1. Push the folder to a Git repository, import it in the host (no build command, output directory = repo root).
2. Add your custom domain; HTTPS is automatic.
3. Replace `https://ai-manga-india.vercel.app` in `js/config.js`, `sitemap.xml`, `robots.txt` and the `canonical`/`og:` tags in each HTML page (search & replace).
4. Add a real `assets/images/og-image` (1200×630 PNG/JPG recommended — social networks prefer raster over SVG) and update the `og:image` path.
5. Submit `sitemap.xml` in Google Search Console.

## Backend & payment roadmap (needed before selling)

Browser code cannot safely take payments or protect paid files. Add a small server (Node/Express, a serverless function, or Supabase/Firebase functions):

1. **Create order** — `POST /api/create-order` receives `{items:[{id,qty}], coupon, customer}`. The server looks prices up from **its own** product table (never trust the browser), re-validates the coupon, creates a Razorpay (or Stripe) order and returns `{provider, orderId, amount, currency}`. `js/cart.js → startPayment()` already speaks this contract.
2. **Pay** — Razorpay Checkout opens (UPI, cards, netbanking, wallets). Put only the **public** key id in `config.js`.
3. **Verify** — `POST /api/verify-payment` receives the payment id, order id and signature; the server verifies the HMAC with the **secret key**, and ideally also confirms via the provider's webhook. Only then mark the order paid.
4. **Deliver** — store files in private storage (Supabase Storage, S3, R2). After verification, issue **short-lived signed URLs** per authorised purchaser; never link files publicly. Log downloads.
5. **Accounts** — authentication (email/OTP or provider), orders table, download table; this powers `account.html` (My Orders, Downloads, History, Details, Support).
6. **Admin** — a protected dashboard (server-side authorised) for products, prices, orders, inquiries.
7. Switch `shopLive: true` and set `createOrderEndpoint` / `verifyPaymentEndpoint` **only after** steps 1–4 are tested with test-mode keys and one real low-value purchase.
8. Replace client-side coupons with server-side ones; add GST/tax handling as required; add webhooks, refunds and receipts; add rate limiting and bot protection (e.g. Turnstile/reCAPTCHA) to forms.

## Quality notes

* Accessible: skip link, keyboard-operable menu/modals with focus trap and Esc, visible focus, labelled forms, ARIA tabs/live regions, `prefers-reduced-motion` honoured.
* Performance: no framework, ~zero third-party JS, lazy-loaded images with width/height, one font request (Google Fonts, `display=swap`), particles pause off-screen. SVG placeholders are tiny — when you add photos, export **WebP/AVIF** at the displayed sizes.
* SEO: unique titles/descriptions, canonical placeholders, Open Graph/Twitter tags, Organization + FAQ + Breadcrumb JSON-LD (Product schema is emitted only for real, available products), sitemap and robots.txt. Because navigation/footer are injected by JavaScript, internal links are discoverable by modern crawlers; if you want them in raw HTML too, copy the generated markup into the pages.
* Lighthouse scores were **not** measured here — run Lighthouse on your deployed site and tune from there.

## Credits
Icons: Lucide-style paths (ISC licence). Fonts: Space Grotesk & Inter via Google Fonts (OFL).

## Template Studio (editor.html)

A Canva-style editor that runs fully in the visitor's browser (no server, no uploads): templates, drag/resize/rotate,
text styling, 11 shape types, emoji, photo upload with filters/flip, layers, align tools, copy/paste, custom sizes, undo/redo, autosave in the browser,
save/open `.ami` files, and download as PNG, JPG, WEBP, PDF (image-based) or SVG (vector; fonts are referenced by name), at 0.5×–3× size, with optional transparent background.
Add or change starter templates in `js/editor-templates.js`. Link to a template with `editor.html?t=<id>` (e.g. `?t=neon`).
Limits: single page only, no accounts or cloud saving, no stock library, no AI tools, no animation/video editing, no real-time collaboration.
Photo filters use the canvas filter API, which some Safari versions do not support.

## SEO / Google

* Site URL is set to `https://ai-manga-india.vercel.app` in `js/config.js`, every page's canonical/Open Graph tags, `sitemap.xml` and `robots.txt`.
  When you buy a custom domain, search-and-replace that URL in those files (and re-submit the sitemap in Google Search Console).
* Structured data: Organization + WebSite (home), WebApplication (Template Studio), BreadcrumbList/Product (product pages).
* Social preview image: `assets/images/og-image.png` (1200×630). Cart, checkout, account, 404 and the demo product page are `noindex`.
* Submit to Google: Search Console → Add property (URL prefix) → verify → Sitemaps → `sitemap.xml`.

## Services system (multi-page)

Journey: **Home → /services → /services/<service> → /product/<offering> → request a quote** (contact form is pre-filled).

* Content lives in `data/catalog.json`: 6 services, 54 offerings (from your offer list) and a `packages` list per service.
* **Prices:** none are invented. Offerings show "Quote on request". Add `"price": 999` (INR) to an offering or package only when it is real.
* **Packages:** every service has `"packages": []`, so each page shows an honest "No fixed packages published yet" state.
  Add `{ "slug", "title", "tier", "price", "delivery", "features": [] }` objects to publish a real package.
* **No cart for services:** these are made-to-order, so buttons lead to the inquiry form. Ready-made downloads stay in the Digital Shop.
* After editing `catalog.json`, run `python3 tools/build_pages.py` — it rewrites the static pages, their SEO tags and `sitemap.xml`.
* Cover and gallery images are the site's illustrative placeholder art (labelled "Illustrative artwork"). Replace them with real work in `catalog.json` (`image`).

## Ordering (no online payment)
The site takes no payments. Every **Buy Now / Request Customization / Request This Service** button opens a popup (`js/order.js`)
showing the app icons from `socialProfiles` in `js/config.js` (plus Email). Tapping one copies a ready-made message and opens that
profile, so the visitor can pay and agree details with you in chat. Add or remove a social link in `config.js` and the popup updates.
The cart, checkout and account pages are no longer linked and redirect to the shop (`vercel.json`).

## 3D homepage hero
`js/hero3d.js` + `css/hero3d.css` (no libraries). A canvas-2D engine draws the energy core, holographic planet, orbit rings, particles and portal;
the five floating service objects are real links to `/services/<slug>` (artwork from `assets/portfolio/`). Intro: particles gather → core forms →
expands into the planet → rings, portal and panels appear → idle loop. Mouse/touch tilt the scene; scrolling moves the core back and spreads the panels;
the CTA band has a portal that grows as it nears. Respects `prefers-reduced-motion` (one static frame), pauses off-screen/hidden, and the panels stay
visible and clickable if canvas/JS is unavailable. To change a panel, edit the `.h3-item` blocks in `index.html`.
Optional looping video behind the hero: set `heroVideo` in `js/config.js`.

### Hero video (`assets/video/hero-3d.mp4`)
The hero's main visual is a 5-second looping 3D animation (muted, no audio, 1.5 MB), cut from the reference video so it contains no baked-in text.
It loads only when allowed: skipped for reduced-motion and data-saver users; if it cannot play, the canvas scene is used instead.
To swap it, replace `assets/video/hero-3d.mp4` (keep it muted, short and under ~2 MB).


## 3D hero: desktop only
The 3D scene (reference video, canvas and floating service panels) loads only on landscape desktop/laptop screens (width ≥ 1025px with a mouse). Phones, tablets and portrait windows get a separate portrait 3D video stage (`assets/video/hero-3d-portrait.mp4`, 720x1280, ~1.2 MB, 4.8 s seamless loop cut from the supplied portrait clip; the part with baked-in text is not used) above a static grid of the five service links. It shows its poster first, plays only while on screen and the tab is visible, and stays a still image for reduced-motion or data-saver users. Layout: single column on phones, video beside the cards on portrait tablets, 4:3 stage above a 2-column grid on landscape touch tablets.

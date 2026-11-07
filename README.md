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
├── index.html  portfolio.html  services.html  shop.html  product.html
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
│   └── services.js    service cards, FAQ, testimonials, marquee, account tabs
├── assets/  images/ products/ logos/ icons/ videos/
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
1. **Visitor:** Home → Portfolio (filter, search) → open a project → "Request a Similar Project" → fill the inquiry (the form tells you plainly it isn't connected yet and offers email/WhatsApp).
2. **Shop:** Shop → filter/sort/search → Quick View → Add to Cart → cart page (quantity, coupon `WELCOME10`) → Checkout (payment button stays disabled until connected).
3. **Newsletter:** footer form — bad email is rejected; a valid one says "not subscribed yet" until an endpoint is set.
4. **Mobile:** open the menu, browse the 2-up product grid, add to cart, open the drawer.
5. Resize from 320px to 1920px — there should be no horizontal scrolling.
6. Enable "Reduce motion" in your OS — animations stop, content stays visible.

## Replace the sample content

* **Contact, social links, WhatsApp, endpoints** → `js/config.js` (also update `siteUrl`).
* **Products, prices, sale prices, descriptions, specs** → `js/data.js` → `products`. Put the real image in `assets/products/` and set `demo: false`, `available: true` only when the product truly exists and can be delivered.
* **Portfolio** → `js/data.js` → `projects`. Add real images/videos (`video: "assets/videos/x.mp4"`), a real `workflow`, and set `type` to `"client"` **only** for genuinely commissioned work. Set `demo: false`.
* **Testimonials** → `js/data.js` → `testimonials` (leave empty until you have real, permitted feedback — an honest "coming soon" state shows meanwhile).
* **Hero showreel (optional)** → put a short, compressed, muted video in `assets/videos/` and set `heroVideo` in `config.js`. The animated image hero shows if it's missing.
* **Logo / favicon** → `assets/logos/`, `assets/icons/favicon.svg`.
* **Legal pages** are **draft templates** — have them reviewed by a legal professional.

## Connect the forms (no backend needed)

Create a form endpoint with a service such as Formspree or Web3Forms, then set `contactFormEndpoint` / `newsletterEndpoint` in `config.js`. The page reports success **only** after a 2xx response. For newsletters use your email provider's form/API endpoint.

## Deploy

It's a static site, so any static host works — **Vercel, Netlify, Cloudflare Pages, GitHub Pages**:
1. Push the folder to a Git repository, import it in the host (no build command, output directory = repo root).
2. Add your custom domain; HTTPS is automatic.
3. Replace `https://www.example.com` in `js/config.js`, `sitemap.xml`, `robots.txt` and the `canonical`/`og:` tags in each HTML page (search & replace).
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

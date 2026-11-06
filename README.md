# AI MANGA INDIA — site

Flask + SQLite storefront, portfolio, admin dashboard and Razorpay checkout.

## Run locally
    pip install -r requirements.txt
    ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' python app.py   # http://127.0.0.1:5000
Add `DEMO_PAYMENTS=1` to try checkout without a gateway (ignored when APP_ENV=production).

## Deploy
    APP_ENV=production gunicorn app:app
Set the variables in `.env.example`. Serve over HTTPS and put `DATABASE_PATH` and `PROTECTED_DIR` on persistent disk.

## What needs your input
- **Razorpay**: add the key id/secret, then add a webhook to `/api/webhooks/razorpay` (events payment.captured, order.paid, payment.failed) with the webhook secret. Without keys, production checkout is disabled; no payment is ever simulated.
- **Admin login**: `/admin/login` with ADMIN_EMAIL / ADMIN_PASSWORD.
- **Real content**: demo products and portfolio items are labelled "Demo". Replace via Admin. Upload your real product files; buyers can't download a product with no file.
- **Social links, contact email, copy**: Admin > Settings.
- **Testimonials**: hidden until you add real ones.
- **Newsletter / inquiries**: stored in the database (Admin). Email notification needs SMTP settings.
- **Not built**: Supabase and Next.js (this environment couldn't install packages; the Flask stack covers the same features).

## Docker / hosting
`docker build -t ami . && docker run -p 8000:8000 --env-file .env -v ami-data:/var/data ami`
A `Procfile` is included for Render/Railway/Heroku-style hosts. Point your domain at the host and enable its HTTPS.

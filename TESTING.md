# Testing your website

## 1. Run it on your computer
    pip install -r requirements.txt
    ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' DEMO_PAYMENTS=1 python app.py
Open http://127.0.0.1:5000. `DEMO_PAYMENTS=1` adds a "Place test order" button so you can try the full
purchase flow without Razorpay. It is ignored when `APP_ENV=production`.

## 2. Automatic check (10 seconds)
    python tests/smoke.py
Checks every page loads, protected pages are locked, and forged download links don't work.

## 3. Click-through checklist
1. **Visitor:** Home -> Portfolio (try filters, search) -> open a project -> Contact -> send an inquiry. Then check Admin -> Inquiries.
2. **Shop:** Digital Shop -> product -> Add to Cart -> Checkout (create an account) -> Place test order -> Download.
3. **Admin:** /admin/login -> Products -> Add product with a file -> see it in the Shop.
4. **Newsletter:** footer signup; try a bad email, then a good one; see Admin -> Subscribers.
5. **Phone:** open the site on your phone (same Wi-Fi: run with `flask`/`app.run(host="0.0.0.0")` or use your deployed URL) and repeat 2.

## 4. Before going live
- Set Razorpay keys, make one real small purchase of your own, and confirm the download unlocks.
- Test a refund/failed payment: no download should appear.
- Replace demo products and portfolio items; upload real product files.

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
5. **Phone:** see the next section, then repeat step 2 on the phone.

## 4. Before going live
- Set Razorpay keys, make one real small purchase of your own, and confirm the download unlocks.
- Test a refund/failed payment: no download should appear.
- Replace demo products and portfolio items; upload real product files.

## 5. Testing on a phone
**A. Same Wi-Fi (easiest).** On your computer:

    HOST=0.0.0.0 DEMO_PAYMENTS=1 ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' python app.py

Find your computer's local IP (Windows: `ipconfig`, Mac: `ipconfig getifaddr en0`, Linux: `hostname -I`), e.g. 192.168.1.20.
On the phone (same Wi-Fi) open `http://192.168.1.20:5000`. If it doesn't load, allow Python through your firewall.
Only do this on a network you trust, and stop the server afterwards.

**B. From anywhere.** Use a tunnel, e.g. `cloudflared tunnel --url http://localhost:5000` or `ngrok http 5000`, and open the https link it prints.

**C. No phone needed.** Chrome DevTools (F12) > device toolbar (Ctrl+Shift+M) > pick iPhone/Pixel. Good for layout; still confirm on a real phone for touch and keyboards.

**What to check:** menu opens; shop filters scroll sideways; Add to Cart and the cart drawer; checkout is easy to complete with the keyboard; no sideways scrolling; buttons are comfortable to tap; forms show clear errors; product images load quickly on mobile data.

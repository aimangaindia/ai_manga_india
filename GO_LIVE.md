# Go-live checklist (the four things only you can supply)

1. **Hosting** - Render: New > Blueprint > pick this repo (uses `render.yaml`). Fill the blank variables. Add your domain; HTTPS is automatic.
2. **Razorpay** - Dashboard > API Keys: put key id/secret in the env vars. Webhooks > add `https://YOURDOMAIN/api/webhooks/razorpay` for payment.captured, order.paid, payment.failed; paste its secret as RAZORPAY_WEBHOOK_SECRET. Make one small real purchase and confirm the download unlocks.
3. **Content** - /admin: delete demo products/portfolio items; upload real products (thumbnail + file) and portfolio work; add real testimonials only when you have them.
4. **Email & links** - Set SMTP_* so inquiries email you. Admin > Settings: contact email, YouTube, Instagram, LinkedIn, hero video URL.

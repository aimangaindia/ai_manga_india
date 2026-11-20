/* ==========================================================================
   SITE CONFIG — the one file you edit to connect real services.
   Nothing here is secret: NEVER put payment secret keys in front-end code.
   ========================================================================== */
window.AMI_CONFIG = {
  siteName: "AI MANGA INDIA",
  siteUrl: "https://www.example.com",            // ← your real domain (also update sitemap.xml / canonical tags)
  currency: "INR", locale: "en-IN",

  // ---- contact details: PLACEHOLDERS until you provide real ones ----
  contactEmail: "ai.mangaindia.in@gmail.com",
  // ---- social media: paste your profile links below. A card + QR code appears for every link you fill in. ----
  // Leave url "" to hide a platform. `handle` is the text shown on the card (e.g. "@aimangaindia").
  // QR codes are generated automatically from the link. To use your own branded QR image instead,
  // put it in assets/images/ and set qrImage, e.g. qrImage: "assets/images/qr-instagram.png".
  socialProfiles: [
    { id: "youtube",   name: "YouTube",   url: "https://www.youtube.com/@aimangaindia", handle: "@aimangaindia", qrImage: "assets/images/qr/youtube-qr.jpg" },
    { id: "instagram", name: "Instagram", url: "https://www.instagram.com/ai.manga.india.in", handle: "@ai.manga.india.in", qrImage: "assets/images/qr/instagram-qr.png" },
    { id: "linkedin",  name: "LinkedIn",  url: "", handle: "", qrImage: "" },
    { id: "facebook",  name: "Facebook",  url: "https://www.facebook.com/profile.php?id=61588187667972", handle: "AI MANGA INDIA", qrImage: "assets/images/qr/facebook-qr.jpg" },
    { id: "xsocial",   name: "X (Twitter)", url: "", handle: "", qrImage: "" },
    { id: "telegram",  name: "Telegram",  url: "", handle: "", qrImage: "" },
    { id: "pinterest", name: "Pinterest", url: "", handle: "", qrImage: "" },
    { id: "snapchat",   name: "Snapchat",  url: "https://www.snapchat.com/add/faijan_shekh28", handle: "faijan_shekh28", qrImage: "assets/images/qr/snapchat-qr.jpg" }
  ],

  // ---- forms ----
  // Paste a form-service endpoint (e.g. Formspree "https://formspree.io/f/xxxx", Web3Forms, your own API).
  // While empty, forms validate and then offer a pre-filled email (mailto:) fallback; they never claim "sent".
  contactFormEndpoint: "",
  newsletterEndpoint: "",

  // ---- shop ----
  // false = demo mode: products are samples, checkout shows a clear "payments not connected" state.
  // Set true ONLY after a backend verifies payments and authorises downloads (see README → Roadmap).
  shopLive: false,
  // Backend endpoint that creates a payment order from the cart and returns provider data. See js/cart.js → startPayment().
  createOrderEndpoint: "",
  verifyPaymentEndpoint: "",                     // server route that verifies the payment signature and unlocks downloads
  paymentProvider: "razorpay",                   // "razorpay" | "stripe"
  razorpayKeyId: "",                             // PUBLIC key id only (rzp_live_xxx). Secret stays on the server.

  // Demo discount codes. Client-side codes can be bypassed, so the server must re-validate in production.
  coupons: { WELCOME10: { type: "percent", value: 10, label: "10% off (demo code)" } },

  // Real sales data hides/shows the "Best selling" filter. Keep empty until you have verified sales.
  salesData: {},

  // Optional hero showreel: put a short muted mp4/webm in assets/videos/ and set the path. Empty = animated image hero.
  heroVideo: ""                                  // e.g. "assets/videos/showreel.mp4"
};

// Older code (footer icons, contact page links) reads a simple { id: url } map; build it from socialProfiles.
window.AMI_CONFIG.social = {};
window.AMI_CONFIG.socialProfiles.forEach(p => { if (p.url) window.AMI_CONFIG.social[p.id] = p.url; });

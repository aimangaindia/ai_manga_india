/* ==========================================================================
   SITE CONFIG — the one file you edit to connect real services.
   Nothing here is secret: NEVER put payment secret keys in front-end code.
   ========================================================================== */
window.AMI_CONFIG = {
  siteName: "AI MANGA INDIA",
  siteUrl: "https://www.example.com",            // ← your real domain (also update sitemap.xml / canonical tags)
  currency: "INR", locale: "en-IN",

  // ---- contact details: PLACEHOLDERS until you provide real ones ----
  contactEmail: "hello@example.com",
  whatsappNumber: "910000000000",               // international format, digits only (no +)
  social: {
    youtube: "https://www.youtube.com/",         // ← your channel URL
    instagram: "https://www.instagram.com/",
    linkedin: "https://www.linkedin.com/",
    pinterest: ""                                // optional; leave empty to hide
  },

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

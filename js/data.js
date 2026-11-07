/* ==========================================================================
   CONTENT DATA — edit this file to replace sample products, projects, services.
   Everything marked demo:true is sample content shown with a "Demo" badge.
   Set demo:false once an entry is real (real image/file/price).
   ========================================================================== */
window.AMI_DATA = (() => {
  const productCategories = {
    video:   { label: "AI Video Assets",         page: "AI Video Assets" },
    prompts: { label: "AI Prompts & Workflows",  page: "AI Prompts & Workflows" },
    manga:   { label: "AI Manga Assets",         page: "AI Manga Assets" },
    graphic: { label: "Graphic Design Assets",   page: "Graphic Design Assets" },
    art:     { label: "Digital Art Collections", page: "Digital Art Collections" }
  };

  const portfolioCategories = {
    video:   "AI Video Creation",
    ads:     "AI Video Advertisements",
    art:     "AI Graphics & Digital Art",
    graphic: "AI Graphic Design",
    manga:   "AI Manga & 3D Animation"
  };

  // type: "personal" (personal concept) | "experimental" (experimental AI artwork) | "client" (commissioned — only if real)
  const SAMPLE_WORKFLOW = "Sample entry — replace with your real AI tools and workflow.";
  const mk = (id, title, category, type, projectType, image, description, extra = {}) =>
    ({ id, title, category, type, projectType, image, description, workflow: SAMPLE_WORKFLOW, video: "", gallery: [image], demo: true, ...extra });

  const projects = [
    mk("neon-city-sequence", "Neon City Sequence", "video", "personal", "Cinematic AI video", "assets/images/p-neon-city.svg",
       "A moody night-city establishing shot concept. Demonstration card — swap in your real video and description."),
    mk("dragon-peak-saga", "Dragon Peak Saga", "video", "experimental", "AI storytelling concept", "assets/images/p-dragon-peak.svg",
       "Fantasy landscape storytelling experiment. Demonstration card showing how a video project is presented."),
    mk("orbit-product-ad", "Orbit — Product Ad Concept", "ads", "personal", "Product advertisement concept", "assets/images/p-orbit-ad.svg",
       "A conceptual product commercial layout. Personal concept, not a commissioned client project."),
    mk("sneaker-motion-ad", "Stride — Social Ad Concept", "ads", "personal", "Short-form social ad", "assets/images/p-sneaker-ad.svg",
       "A short-form vertical advertisement concept for social platforms. Demonstration content."),
    mk("portal-tale", "The Portal Tale", "manga", "personal", "3D animation concept", "assets/images/p-portal-tale.svg",
       "Animated environment concept for an original story world. Demonstration content."),
    mk("city-3d-environment", "Skyline 3D Environment", "manga", "experimental", "Animated environment", "assets/images/p-city-3d.svg",
       "A stylised 3D city environment experiment. Demonstration content."),
    mk("manga-burst-panel", "Burst — Manga-Inspired Panel", "manga", "personal", "Manga-inspired artwork", "assets/images/p-manga-burst.svg",
       "Manga-inspired panel composition with halftone and speed lines. Demonstration content."),
    mk("spirit-gate", "Spirit Gate", "art", "experimental", "Fantasy concept art", "assets/images/p-spirit-gate.svg",
       "Surreal gateway environment concept art. Demonstration content."),
    mk("fantasy-realm", "Fantasy Realm Wallpaper", "art", "personal", "Digital wallpaper", "assets/images/p-fantasy-realm.svg",
       "Wide fantasy landscape wallpaper concept. Demonstration content."),
    mk("cyber-poster", "Cyber Poster Series", "graphic", "personal", "Digital poster", "assets/images/p-cyber-poster.svg",
       "A poster layout study with typography and futuristic imagery. Demonstration content."),
    mk("brand-launch-kit", "Brand Launch Graphics", "graphic", "personal", "Marketing creatives", "assets/images/p-brand-launch.svg",
       "Social and banner layout concepts for a fictional brand launch. Demonstration content."),
    mk("thumbnail-system", "Thumbnail System", "graphic", "personal", "YouTube thumbnail concepts", "assets/images/p-thumb-kit.svg",
       "A consistent thumbnail layout system for a fictional channel. Demonstration content.")
  ];

  // Product helper. price/original in INR. `available:false` = sample item, cannot be bought.
  const P = (id, name, category, price, o) => ({
    id, name, category, price, original: null, sale: false, featured: false, isNew: false, bundle: false, demo: true, available: false,
    format: "ZIP", compat: "Any editor", files: null, size: "—", resolution: "", created: "2026-01-01", gallery: null, faq: [], ...o,
    image: `assets/products/${id}.svg`
  });
  const LIC = "Personal and commercial use in your own projects. No resale or redistribution of the files themselves. Full terms: License Policy.";

  const products = [
    P("cinematic-broll", "Cinematic B-Roll Pack", "video", 799, { short: "Atmospheric AI-generated B-roll clips for edits and intros.", format: "MP4", compat: "Premiere, DaVinci, CapCut, Final Cut",
      files: 20, size: "≈ 1.2 GB (sample)", resolution: "1920×1080 (sample)", featured: true, bundle: true, created: "2026-03-10",
      long: "A sample listing showing how a video-asset bundle is presented. Replace this text and the specs with the real contents of your pack before selling.",
      includes: ["20 short B-roll clips (sample count)", "Usage guide (PDF)", "License file"], license: LIC }),
    P("loop-backgrounds", "Looping Background Videos", "video", 499, { short: "Seamless abstract loops for streams, lyric videos and overlays.", format: "MP4", compat: "Any video editor",
      files: 12, size: "≈ 600 MB (sample)", resolution: "1920×1080 (sample)", isNew: true, created: "2026-10-20",
      long: "Sample listing for looping backgrounds. Replace with real details.", includes: ["12 looping backgrounds (sample count)", "License file"], license: LIC }),
    P("prompt-starter", "AI Prompt Starter Pack", "prompts", 149, { short: "A compact set of image-generation prompts to get started fast.", format: "PDF + TXT", compat: "Any AI image tool",
      files: 2, size: "< 5 MB (sample)", created: "2026-02-02",
      long: "Sample low-price starter listing. Replace with your own prompts and an honest prompt count.", includes: ["Prompt collection (PDF)", "Copy-ready TXT file"], license: LIC }),
    P("prompt-cinematic", "Cinematic Video Prompt Collection", "prompts", 449, { short: "Structured prompts for cinematic AI video scenes and camera moves.", format: "PDF + Notion + TXT", compat: "Any AI video tool",
      files: 3, size: "< 10 MB (sample)", featured: true, bundle: true, created: "2026-04-18", sale: true, original: 599,
      long: "Sample listing with a sale price to demonstrate the layout. Use real discounts only.", includes: ["Prompt library (PDF)", "Editable TXT", "Quick-start guide"], license: LIC }),
    P("character-prompts", "Character Consistency Prompts", "prompts", 349, { short: "Prompt patterns for keeping characters consistent across scenes.", format: "PDF", compat: "Any AI image tool",
      files: 1, size: "< 5 MB (sample)", isNew: true, created: "2026-10-28", long: "Sample listing. Replace with real content.", includes: ["Prompt guide (PDF)"], license: LIC }),
    P("manga-backgrounds", "Manga-Style Backgrounds", "manga", 599, { short: "Black-and-white and colour backgrounds for comics and manga panels.", format: "PNG", compat: "Clip Studio, Photoshop, Procreate",
      files: 30, size: "≈ 400 MB (sample)", resolution: "3000×2000 (sample)", featured: true, created: "2026-05-05",
      long: "Sample listing for manga background assets. Replace with real details.", includes: ["30 backgrounds (sample count)", "License file"], license: LIC }),
    P("character-sheets", "Character Reference Sheets", "manga", 399, { short: "Blank and example reference-sheet templates for character design.", format: "PSD + PNG", compat: "Photoshop, Krita",
      files: 8, size: "≈ 120 MB (sample)", created: "2026-06-12", long: "Sample listing. Replace with real content.", includes: ["8 templates (sample count)", "Usage notes"], license: LIC }),
    P("thumbnail-kit", "YouTube Thumbnail Templates", "graphic", 299, { short: "Editable thumbnail layouts built for readability at small sizes.", format: "PSD + PNG", compat: "Photoshop, Photopea",
      files: 15, size: "≈ 250 MB (sample)", resolution: "1280×720", isNew: true, created: "2026-10-30", long: "Sample listing. Replace with real templates and a true count.", includes: ["15 PSD templates (sample count)", "Font list", "License file"], license: LIC }),
    P("social-templates", "Social Media Template Kit", "graphic", 349, { short: "Post and story layouts for consistent social branding.", format: "PSD + PNG", compat: "Photoshop, Photopea",
      files: 24, size: "≈ 300 MB (sample)", created: "2026-07-01", sale: true, original: 449, long: "Sample listing. Replace with real content.", includes: ["24 layouts (sample count)", "License file"], license: LIC }),
    P("poster-pack", "Poster Design Pack", "graphic", 449, { short: "Print-ready poster layouts with a cinematic look.", format: "PSD + PDF", compat: "Photoshop, Illustrator",
      files: 10, size: "≈ 350 MB (sample)", resolution: "A3 @ 300 DPI (sample)", created: "2026-08-14", long: "Sample listing. Replace with real content.", includes: ["10 poster layouts (sample count)", "License file"], license: LIC }),
    P("fantasy-wallpapers", "Fantasy Wallpaper Collection", "art", 249, { short: "High-resolution fantasy scenes for desktop and mobile.", format: "JPG + PNG", compat: "Any device",
      files: 25, size: "≈ 500 MB (sample)", resolution: "3840×2160 (sample)", created: "2026-09-09", featured: true, long: "Sample listing. Replace with your real artwork collection.", includes: ["25 wallpapers (sample count)", "Mobile crops"], license: "Personal use. Commercial use requires a separate licence — contact us." }),
    P("ad-script-pack", "AI Ad Script Pack", "prompts", 399, { short: "Short-form ad script frameworks and shot lists for product videos.", format: "PDF + DOCX", compat: "Any text editor",
      files: 2, size: "< 5 MB (sample)", created: "2026-09-30", long: "Sample listing. Replace with real content.", includes: ["Script frameworks (PDF)", "Editable DOCX"], license: LIC })
  ];
  products.forEach(p => { p.faq = [
    { q: "Is this product available to buy right now?", a: p.available ? "Yes." : "Not yet. This is a sample listing that demonstrates the store design. Real products will be marked as available." },
    { q: "How are downloads delivered?", a: "After payment is verified by the server, download links appear in your account and order confirmation. Links are personal and expire." },
    { q: "Can I use it commercially?", a: p.license }
  ]; });

  const services = [
    { id: "video", num: "01", icon: "video", title: "AI Video Production", cta: "Request Video Project", value: "AI Video Production",
      desc: "AI-generated videos for brands, creators and businesses.",
      includes: ["Cinematic AI videos", "AI-generated storytelling", "3D animated videos", "Promotional videos", "Social media content", "Product showcase videos"],
      custom: "Length, aspect ratio (16:9, 9:16, 1:1), style and delivery formats are agreed per project before work begins. Revisions, turnaround and resolution are quoted in your proposal." },
    { id: "ads", num: "02", icon: "megaphone", title: "AI Video Advertising", cta: "Create My Advertisement", value: "AI Video Advertisement",
      desc: "Creative AI-powered advertisements designed to make products and brands visually memorable.",
      includes: ["Product advertisements", "Promotional campaigns", "Social media advertisements", "Commercial-style videos", "AI product showcases", "Short-form advertisements"],
      custom: "Share your product, audience and platform. We propose a concept and storyboard first; scope, revisions and timeline are confirmed in writing." },
    { id: "graphic", num: "03", icon: "palette", title: "AI Graphic Design", cta: "Request Graphic Design", value: "AI Graphic Design",
      desc: "Digital graphics and marketing visuals for modern brands.",
      includes: ["Social media designs", "YouTube thumbnails", "Promotional posters", "Advertising graphics", "Digital banners", "Creative brand visuals"],
      custom: "Tell us the sizes, platforms and brand colours. Packages (single design or multi-piece sets) and revision rounds are defined in the quote." },
    { id: "art", num: "04", icon: "image", title: "AI Digital Art", cta: "Explore Digital Art", value: "AI Digital Art", href: "portfolio.html#art",
      desc: "Unique AI-generated artwork for personal and commercial creative projects.",
      includes: ["Character artwork", "Fantasy illustrations", "Concept art", "Digital posters", "Background artwork", "Creative visual assets"],
      custom: "Commissioned artwork is scoped by subject, style, resolution and intended use (personal or commercial). Usage rights are stated in the quote." },
    { id: "manga", num: "05", icon: "film", title: "AI Manga & Animation", cta: "Start Animation Project", value: "AI Manga & Animation",
      desc: "Cinematic animation and AI-assisted visual storytelling.",
      includes: ["3D animated storytelling", "Character concepts", "Manga-inspired artwork", "Animated scenes", "Storyboard development", "Visual world-building"],
      custom: "Animation is planned in stages — story, storyboard, character look, scenes. Length and complexity decide scope; we agree these up front." },
    { id: "custom", num: "06", icon: "sparkles", title: "Custom AI Creative Solutions", cta: "Discuss Your Idea", value: "Custom Creative Project",
      desc: "Customised creative production based on your business, content or personal requirements.",
      includes: ["AI content workflows", "Prompt and workflow design", "Story development", "Creative production planning"],
      custom: "Don't see your idea above? Describe it — we'll say honestly whether we can deliver it and what it would involve." }
  ];

  const faqs = [
    { q: "What services does AI MANGA INDIA offer?", a: "AI video production, AI video advertisements, AI graphic design, AI digital art, AI manga and animation, and custom creative projects. We also sell downloadable digital assets in the Digital Shop." },
    { q: "How can I order a custom AI video?", a: "Use the Contact page to send a project inquiry with your idea, budget and any reference links. We review it and reply with questions or a proposal." },
    { q: "Can I request a custom advertisement?", a: "Yes. Choose “AI Video Advertisement” on the inquiry form and describe your product and audience." },
    { q: "What digital products are available?", a: "The shop is organised into AI video assets, prompts and workflows, manga assets, graphic design assets and digital art collections. Products currently shown are samples until marked available." },
    { q: "How do digital downloads work?", a: "Once the store is live, downloads are unlocked after the server verifies your payment. You'll find them in your account and order confirmation. Links are personal and expire for security." },
    { q: "Which file formats are included?", a: "Each product page lists its exact formats (for example MP4, PNG, PSD, PDF) and software compatibility." },
    { q: "Can I use purchased assets commercially?", a: "Each product states its licence. Most allow use in your own projects, including commercial ones; none allow reselling or redistributing the files. See the License Policy." },
    { q: "Are refunds available for digital products?", a: "Because digital files can't be returned, refunds are limited — see the Refund Policy. If a file is faulty or not as described, contact us and we'll fix it or refund you." },
    { q: "How long does a custom project take?", a: "It depends on length and complexity. We give a realistic estimate in your proposal rather than a fixed promise up front." },
    { q: "How can I contact AI MANGA INDIA?", a: "Use the Contact page form, email us, or message us on WhatsApp. Contact details are on the Contact page." }
  ];

  const capabilities = ["AI VIDEO PRODUCTION", "AI ADVERTISING", "DIGITAL ART", "GRAPHIC DESIGN", "AI STORYTELLING"];
  const testimonials = []; // ← add ONLY real, permission-given feedback: { name, role, rating, text, product }

  return { productCategories, portfolioCategories, projects, products, services, faqs, capabilities, testimonials };
})();

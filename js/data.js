/* ==========================================================================
   CONTENT DATA — edit this file to replace sample products, projects, services.
   Everything marked demo:true is sample content shown with a "Demo" badge.
   Set demo:false once an entry is real (real image/file/price).
   ========================================================================== */
window.AMI_DATA = (() => {
  const productCategories = {
    video:     { label: "Video Assets",           page: "Video Assets",           icon: "video",   blurb: "Cinematic video backgrounds, overlays, motion graphics assets, video templates, B-roll collections and animated backgrounds." },
    graphic:   { label: "Graphic Design Assets",  page: "Graphic Design Assets",  icon: "palette", blurb: "Social media, YouTube thumbnail, poster and banner templates, digital design elements and creative overlay packs." },
    art:       { label: "Digital Art Assets",     page: "Digital Art Assets",     icon: "image",   blurb: "Wallpaper and fantasy background collections, character artwork, manga background packs, digital posters and illustration packs." },
    resources: { label: "Creative Resources",     page: "Creative Resources",     icon: "sparkles", blurb: "Prompt collections for video, images and storytelling, character design and storyboard templates, script packs, planners and workflow guides." }
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
    mk("future-of-wealth", "The Future of Wealth", "graphic", "personal", "YouTube thumbnail design (finance)", "assets/portfolio/future-of-wealth.webp",
       "Premium gold-and-green finance thumbnail with bold typography and a market-chart backdrop. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/future-of-wealth.webp"] }),
    mk("ultimate-workout", "Ultimate Workout", "graphic", "personal", "YouTube thumbnail design (fitness)", "assets/portfolio/ultimate-workout.webp",
       "High-energy fitness thumbnail with red light streaks, sparks and a title placeholder for easy customisation. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/ultimate-workout.webp"] }),
    mk("future-of-ai-tech", "The Future of AI & Tech", "graphic", "personal", "YouTube thumbnail design (technology)", "assets/portfolio/future-of-ai-tech.webp",
       "Futuristic tech thumbnail with a glowing holographic brain, neon frame and a 'New Update' badge. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/future-of-ai-tech.webp"] }),
    mk("god-mode", "God Mode — New Meta", "graphic", "personal", "YouTube thumbnail design (gaming)", "assets/portfolio/god-mode.webp",
       "Gaming thumbnail with an armoured warrior, lightning effects and bold gradient lettering. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/god-mode.webp"] }),
    mk("creamy-tomato-pasta", "Creamy Tomato Pasta", "graphic", "personal", "YouTube thumbnail design (food)", "assets/portfolio/creamy-tomato-pasta.webp",
       "Appetising recipe thumbnail with a cheesy skillet shot, warm tones and a '20-minute recipe' callout. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/creamy-tomato-pasta.webp"] }),
    mk("this-is-insane", "This Is Insane!", "graphic", "personal", "YouTube thumbnail design (reaction)", "assets/portfolio/this-is-insane.webp",
       "High-impact reaction thumbnail with a surprised expression, arrow pointer and burst lighting. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/this-is-insane.webp"] }),
    mk("luxury-lifestyle", "The Art of Luxury Lifestyle", "graphic", "personal", "YouTube thumbnail design (lifestyle)", "assets/portfolio/luxury-lifestyle.webp",
       "Elegant luxury lifestyle thumbnail with refined serif typography and a cinematic night scene. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/luxury-lifestyle.webp"] }),
    mk("learn-anything-fast", "How to Learn Anything Fast", "graphic", "personal", "YouTube thumbnail design (education)", "assets/portfolio/learn-anything-fast.webp",
       "Clean educational thumbnail with bold blue-and-yellow styling, icons and a clear step-by-step call-out. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/learn-anything-fast.webp"] }),
    mk("the-last-chosen", "The Last Chosen", "art", "personal", "Cinematic fantasy artwork", "assets/portfolio/the-last-chosen.webp",
       "Cinematic fantasy scene of a cloaked wanderer facing a glowing portal, built as a story-poster concept. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/the-last-chosen.webp"] }),
    mk("mountain-sunrise", "Mountain Sunrise", "art", "personal", "AI landscape artwork", "assets/portfolio/mountain-sunrise.webp",
       "Photorealistic AI mountain landscape at sunrise with a lone hiker above a misty valley. AI-generated personal concept, not a client project.", { demo: false, workflow: "AI-assisted image generation with custom text and layout design.", gallery: ["assets/portfolio/mountain-sunrise.webp"] }),
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
    P("prompt-starter", "AI Prompt Starter Pack", "resources", 149, { short: "A compact set of image-generation prompts to get started fast.", format: "PDF + TXT", compat: "Any AI image tool",
      files: 2, size: "< 5 MB (sample)", created: "2026-02-02",
      long: "Sample low-price starter listing. Replace with your own prompts and an honest prompt count.", includes: ["Prompt collection (PDF)", "Copy-ready TXT file"], license: LIC }),
    P("prompt-cinematic", "Cinematic Video Prompt Collection", "resources", 449, { short: "Structured prompts for cinematic AI video scenes and camera moves.", format: "PDF + Notion + TXT", compat: "Any AI video tool",
      files: 3, size: "< 10 MB (sample)", featured: true, bundle: true, created: "2026-04-18", sale: true, original: 599,
      long: "Sample listing with a sale price to demonstrate the layout. Use real discounts only.", includes: ["Prompt library (PDF)", "Editable TXT", "Quick-start guide"], license: LIC }),
    P("character-prompts", "Character Consistency Prompts", "resources", 349, { short: "Prompt patterns for keeping characters consistent across scenes.", format: "PDF", compat: "Any AI image tool",
      files: 1, size: "< 5 MB (sample)", isNew: true, created: "2026-10-28", long: "Sample listing. Replace with real content.", includes: ["Prompt guide (PDF)"], license: LIC }),
    P("manga-backgrounds", "Manga-Style Backgrounds", "art", 599, { short: "Black-and-white and colour backgrounds for comics and manga panels.", format: "PNG", compat: "Clip Studio, Photoshop, Procreate",
      files: 30, size: "≈ 400 MB (sample)", resolution: "3000×2000 (sample)", featured: true, created: "2026-05-05",
      long: "Sample listing for manga background assets. Replace with real details.", includes: ["30 backgrounds (sample count)", "License file"], license: LIC }),
    P("character-sheets", "Character Reference Sheets", "resources", 399, { short: "Blank and example reference-sheet templates for character design.", format: "PSD + PNG", compat: "Photoshop, Krita",
      files: 8, size: "≈ 120 MB (sample)", created: "2026-06-12", long: "Sample listing. Replace with real content.", includes: ["8 templates (sample count)", "Usage notes"], license: LIC }),
    P("thumbnail-kit", "YouTube Thumbnail Templates", "graphic", 299, { short: "Editable thumbnail layouts built for readability at small sizes.", format: "PSD + PNG", compat: "Photoshop, Photopea",
      files: 15, size: "≈ 250 MB (sample)", resolution: "1280×720", isNew: true, created: "2026-10-30", long: "Sample listing. Replace with real templates and a true count.", includes: ["15 PSD templates (sample count)", "Font list", "License file"], license: LIC }),
    P("social-templates", "Social Media Template Kit", "graphic", 349, { short: "Post and story layouts for consistent social branding.", format: "PSD + PNG", compat: "Photoshop, Photopea",
      files: 24, size: "≈ 300 MB (sample)", created: "2026-07-01", sale: true, original: 449, long: "Sample listing. Replace with real content.", includes: ["24 layouts (sample count)", "License file"], license: LIC }),
    P("poster-pack", "Poster Design Pack", "graphic", 449, { short: "Print-ready poster layouts with a cinematic look.", format: "PSD + PDF", compat: "Photoshop, Illustrator",
      files: 10, size: "≈ 350 MB (sample)", resolution: "A3 @ 300 DPI (sample)", created: "2026-08-14", long: "Sample listing. Replace with real content.", includes: ["10 poster layouts (sample count)", "License file"], license: LIC }),
    P("fantasy-wallpapers", "Fantasy Wallpaper Collection", "art", 249, { short: "High-resolution fantasy scenes for desktop and mobile.", format: "JPG + PNG", compat: "Any device",
      files: 25, size: "≈ 500 MB (sample)", resolution: "3840×2160 (sample)", created: "2026-09-09", featured: true, long: "Sample listing. Replace with your real artwork collection.", includes: ["25 wallpapers (sample count)", "Mobile crops"], license: "Personal use. Commercial use requires a separate licence — contact us." }),
    P("ad-script-pack", "AI Ad Script Pack", "resources", 399, { short: "Short-form ad script frameworks and shot lists for product videos.", format: "PDF + DOCX", compat: "Any text editor",
      files: 2, size: "< 5 MB (sample)", created: "2026-09-30", long: "Sample listing. Replace with real content.", includes: ["Script frameworks (PDF)", "Editable DOCX"], license: LIC })
  ];
  products.forEach(p => { p.faq = [
    { q: "Is this product available to buy right now?", a: p.available ? "Yes." : "Not yet. This is a sample listing that demonstrates the store design. Real products will be marked as available." },
    { q: "How are downloads delivered?", a: "Orders are arranged in chat. Tap Buy Now, pick an app (or email), and we confirm details with you and send the files directly." },
    { q: "Can I use it commercially?", a: p.license }
  ]; });

  const services = [
    { id: "video", num: "01", icon: "video", title: "AI Video Production & Animation", cta: "Request Video Project", value: "AI Video Production & Animation",
      desc: "Cinematic AI videos and animation for brands, creators and storytellers.",
      includes: ["Cinematic Video Production", "3D Animated Videos", "Animated Short Films", "Story-Based Animation", "Fantasy & Adventure Animation", "Character Animation", "Promotional Videos", "Social Media Videos", "YouTube Videos", "Explainer Videos", "Cinematic Visual Storytelling", "Custom Animated Projects"],
      custom: "Length, aspect ratio (16:9, 9:16, 1:1), style and delivery formats are agreed per project before work begins. Revisions, turnaround and resolution are quoted in your proposal." },
    { id: "ads", num: "02", icon: "megaphone", title: "AI Video Advertising & Commercials", cta: "Create My Advertisement", value: "AI Video Advertising & Commercials",
      desc: "Creative AI-powered advertisements designed to make products and brands visually memorable.",
      includes: ["Product Advertisement Videos", "Brand Promotional Videos", "Commercial Advertisement Films", "Social Media Video Ads", "Luxury Product Advertisements", "Fashion & Lifestyle Advertisements", "Food & Beverage Advertisements", "Business Promotional Videos", "Product Showcase Videos", "Short-Form Marketing Videos", "Creative Advertising Campaigns"],
      custom: "Share your product, audience and platform. We propose a concept and storyboard first; scope, revisions and timeline are confirmed in writing." },
    { id: "graphic", num: "03", icon: "palette", title: "AI Graphic Design & Visual Branding", cta: "Request Graphic Design", value: "AI Graphic Design & Visual Branding",
      desc: "Digital graphics and visual branding for modern businesses and creators.",
      includes: ["Professional Logo Design", "Brand Identity Design", "Social Media Post Design", "Instagram Post & Story Design", "YouTube Thumbnail Design", "YouTube Channel Art", "Advertising Banners", "Promotional Posters", "Digital Flyers", "Business Marketing Graphics", "Website Graphics", "Presentation Designs", "Packaging & Label Design", "Typography & Creative Layouts"],
      custom: "Tell us the sizes, platforms and brand colours. Packages (single design or multi-piece sets) and revision rounds are defined in the quote." },
    { id: "art", num: "04", icon: "image", title: "AI Digital Art & Illustration", cta: "Request Digital Art", value: "AI Digital Art & Illustration",
      desc: "Unique AI-generated artwork for personal and commercial creative projects.",
      includes: ["Digital Illustrations", "Fantasy Artwork", "Cinematic Concept Art", "Character Illustrations", "3D Character Artwork", "Futuristic Artwork", "Surreal Digital Art", "Landscape & Environment Artwork", "Digital Wallpapers", "Printable Posters", "Custom Digital Artwork", "Exclusive Art Collections"],
      custom: "Commissioned artwork is scoped by subject, style, resolution and intended use (personal or commercial). Usage rights are stated in the quote." },
    { id: "manga", num: "05", icon: "film", title: "AI Manga, Anime & Character Design", cta: "Start Character Project", value: "AI Manga, Anime & Character Design",
      desc: "Manga, anime and character work for original stories and visual worlds.",
      includes: ["Manga-Style Illustrations", "Anime-Style Artwork", "Original Character Design", "3D Animated Character Design", "Character Reference Sheets", "Character Expression Sheets", "Manga Backgrounds", "Comic Book Artwork", "Manga Cover Design", "Storyboard Design", "Fantasy Character Concepts", "Original Visual Storytelling Projects"],
      custom: "Character and story work is planned in stages — concept, reference sheets, then finished scenes. We agree the scope and number of characters up front." },
    { id: "custom", num: "06", icon: "sparkles", title: "Custom Creative Services", cta: "Discuss Your Idea", value: "Custom Creative Services",
      desc: "Made-to-order creative work built around your idea, brand or audience.",
      includes: ["Custom AI Video Projects", "Custom Brand Advertisements", "Custom Animated Stories", "Custom Character Creation", "Custom Digital Illustrations", "Custom Graphic Design Projects", "Custom Social Media Campaigns", "Custom Promotional Content", "Personalized Digital Artwork", "Complete Visual Content Packages"],
      custom: "Don't see your idea above? Describe it — we'll say honestly whether we can deliver it and what it would involve." },
    { id: "packages", num: "07", icon: "package", title: "Creative Packages for Businesses & Content Creators", cta: "Ask About Packages", value: "Creative Packages for Businesses & Content Creators",
      desc: "Bundled creative work for businesses and creators who need a steady stream of visuals.",
      includes: ["Social Media Content Packages", "YouTube Creator Design Packages", "Business Advertising Packages", "Brand Visual Identity Packages", "Product Marketing Packages", "Video Content Packages", "Digital Creative Bundles", "Complete Promotional Campaign Packages"],
      custom: "Package contents and pricing are agreed with you individually — tell us what you need and your budget, and we'll propose a bundle." }
  ];

  const faqs = [
    { q: "What services does AI MANGA INDIA offer?", a: "AI video production and animation, AI video advertising, graphic design and visual branding, digital art and illustration, manga, anime and character design, custom creative services, and creative packages for businesses and content creators. We also sell downloadable digital assets in the Digital Shop." },
    { q: "How can I order a custom AI video?", a: "Use the Contact page to send a project inquiry with your idea, budget and any reference links. We review it and reply with questions or a proposal." },
    { q: "Can I request a custom advertisement?", a: "Yes. Choose “AI Video Advertisements” on the inquiry form and describe your product and audience." },
    { q: "What digital products are available?", a: "The shop is organised into video assets, graphic design assets, digital art assets and creative resources (prompt collections, templates, script packs and guides). Products currently shown are samples until marked available." },
    { q: "How do digital downloads work?", a: "This website doesn't take payments. Tap Buy Now on a product, choose how to contact us, and we'll agree price, customisation and delivery with you directly, then send the files." },
    { q: "Which file formats are included?", a: "Each product page lists its exact formats (for example MP4, PNG, PSD, PDF) and software compatibility." },
    { q: "Can I use purchased assets commercially?", a: "Each product states its licence. Most allow use in your own projects, including commercial ones; none allow reselling or redistributing the files. See the License Policy." },
    { q: "Are refunds available for digital products?", a: "Because digital files can't be returned, refunds are limited — see the Refund Policy. If a file is faulty or not as described, contact us and we'll fix it or refund you." },
    { q: "How long does a custom project take?", a: "It depends on length and complexity. We give a realistic estimate in your proposal rather than a fixed promise up front." },
    { q: "How can I contact AI MANGA INDIA?", a: "Use the Contact page form or email us. Contact details are on the Contact page." }
  ];

  const capabilities = ["AI VIDEO PRODUCTION", "AI ADVERTISING", "DIGITAL ART", "GRAPHIC DESIGN", "AI STORYTELLING"];
  const testimonials = []; // ← add ONLY real, permission-given feedback: { name, role, rating, text, product }

  return { productCategories, portfolioCategories, projects, products, services, faqs, capabilities, testimonials };
})();

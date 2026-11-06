"""Static site content and defaults. Anything in DEFAULT_SETTINGS can be overridden
from Admin > Settings without touching code."""

PRODUCT_CATS = [
    ("ai-video-assets", "AI Video Assets", "Cinematic packs, backgrounds, overlays and motion resources."),
    ("ai-prompts", "AI Prompt Collections", "Image, video and story prompts you can adapt to your own tools."),
    ("manga-assets", "AI Manga & Animation Assets", "Backgrounds, storyboards and manga-inspired design resources."),
    ("graphic-design", "AI Graphic Design Assets", "Thumbnail, poster and social media templates."),
    ("marketing-kits", "AI Business & Marketing Kits", "Ad scripts, content planners and promotion templates."),
]
PORTFOLIO_CATS = [
    ("ai-videos", "AI-Generated Videos"),
    ("video-ads", "AI Video Advertisements"),
    ("3d-animation", "3D Animation & Storytelling"),
    ("digital-art", "AI Graphics & Digital Art"),
    ("graphic-design", "AI Graphic Design"),
    ("manga-art", "Manga & Anime-Inspired Art"),
]
PORTFOLIO_KINDS = {
    "client": "Client project",
    "personal": "Personal concept",
    "demo": "Demo placeholder",
}
INQUIRY_SERVICES = ["AI Video Production", "AI Video Advertisements", "3D Animation", "AI Graphic Design",
                    "AI Digital Art", "Custom AI Projects", "Other"]
BUDGETS = ["Under ₹5,000", "₹5,000 – ₹15,000", "₹15,000 – ₹50,000", "₹50,000+", "Not sure yet"]
INQUIRY_STATUSES = ["new", "contacted", "in_progress", "won", "closed"]
ORDER_STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"]

SERVICES = [
    dict(slug="ai-video-production", title="AI Video Production", style="portal", seed=11,
         desc="Cinematic, story-led videos built with AI-assisted workflows, from a single atmospheric clip to a short sequence.",
         bullets=["Cinematic AI videos", "Promotional videos", "Social media videos", "Storytelling videos",
                "AI-generated video sequences", "Short-form video content"],
         deliver="Final video in the agreed resolution and aspect ratio (for example 16:9 or 9:16), plus a captioned cut on request.",
         custom="Tell us the mood, length, platform and references. Visual direction is shaped around your brief."),
    dict(slug="ai-video-advertisements", title="AI Video Advertisements", style="city", seed=23,
         desc="Product and brand ads for social platforms and websites, from concept through the finished edit.",
         bullets=["Product advertisements", "Brand promotional campaigns", "Social media ad creatives",
                "AI-powered commercial concepts", "Promotional video editing"],
         deliver="Ad cut(s) sized for the platforms you name, with a concept summary so you can review direction before production.",
         custom="Share your product, audience and brand assets. Scripts, tone and format are tailored to the campaign."),
    dict(slug="3d-animation-storytelling", title="3D Animation & Storytelling", style="peaks", seed=34,
         desc="Character-driven stories and cinematic scenes in fantasy, adventure, mystery, comedy and more.",
         bullets=["3D animated storytelling", "Character-driven animation", "Animated short films",
                "Fantasy and adventure animation", "Cinematic scene creation"],
         deliver="Animated scenes or a short film in the agreed format, with a storyboard or scene plan for approval.",
         custom="Bring a story idea or a rough outline. Scope, length and style are agreed before work starts."),
    dict(slug="ai-graphic-design", title="AI Graphic Design", style="grid", seed=45,
         desc="Thumbnails, posters, banners and social creatives designed to look consistent across your channels.",
         bullets=["YouTube thumbnails", "Posters", "Social media designs", "Promotional banners",
                "Digital advertisements", "Marketing creatives"],
         deliver="Final images in PNG or JPG at the sizes you request; editable files by agreement.",
         custom="Share your brand colours, text and references. Revisions are discussed when the quote is agreed."),
    dict(slug="ai-digital-art", title="AI Digital Art", style="manga", seed=56,
         desc="Original characters, concept art and manga-inspired illustrations for covers, stories and wallpapers.",
         bullets=["Character design", "Concept art", "Fantasy artwork", "Manga-inspired illustrations",
                "Digital backgrounds", "Custom artwork"],
         deliver="High-resolution artwork files in the agreed format and size.",
         custom="Describe the character, world or scene. Reference links help us match the look you want."),
    dict(slug="ai-creative-consulting", title="AI Creative Consulting & Prompt Design", style="orbs", seed=67,
         desc="Workflow planning and prompt design for creators and businesses who want to produce their own AI content.",
         bullets=["AI content workflows", "Image-generation prompts", "Video-generation prompts",
                "Story development", "AI creative production planning"],
         deliver="Written workflow or prompt documents tailored to your tools and goals.",
         custom="Tell us which tools you use and what you want to make. Scope is agreed before we begin."),
]

WHY = [
    ("Creative storytelling", "Visual concepts built around a story, not just a good-looking frame."),
    ("AI-assisted production", "Modern AI tools in a workflow that is reviewed and refined by a person."),
    ("Custom visual direction", "Assets shaped around your project requirements and references."),
    ("Multiple creative services", "Video, animation, advertisements and graphic design in one place."),
    ("Accessible digital products", "Downloadable creative resources you can buy and use right away."),
    ("Flexible collaboration", "A clear inquiry process, so you know what happens after you reach out."),
]
PROCESS = [
    ("Discover", "We listen to your idea, audience and requirements.", "search"),
    ("Concept", "We develop the visual direction and creative concept.", "bulb"),
    ("Create", "We produce the AI-assisted visuals, animation or designs.", "spark"),
    ("Refine", "We review the output together and improve it.", "sliders"),
    ("Deliver", "You receive approved files in the agreed formats.", "box"),
]
CAPABILITIES = ["Cinematic AI video", "Advertisement concepts", "3D animated storytelling", "Character design",
                "Manga-inspired illustration", "Graphic design", "Prompt design", "Creative workflow planning"]

FAQ = [
    ("What services does AI MANGA INDIA offer?",
     "We offer AI video production, AI video advertisements, 3D animation and storytelling, AI graphic design, AI digital art, and creative consulting and prompt design. You can also buy ready-made digital products from the shop."),
    ("How can I order a custom AI video?",
     "Open the Hire Me page, choose the service, and describe your idea, budget and deadline. We review your request and reply to the email you provide with questions or a quote."),
    ("Can I request a custom advertisement?",
     "Yes. Choose AI Video Advertisements in the inquiry form and tell us about your product, audience and where the ad will run."),
    ("What digital products are available?",
     "The shop has AI video assets, prompt collections, manga and animation assets, graphic design templates, and marketing kits. Each product page lists what is included."),
    ("How do digital downloads work?",
     "After your payment is confirmed by our payment provider, the files appear in My Account under Downloads. You need to be signed in to download. Download links are generated for you and expire after a short time, so request a new one whenever you need it."),
    ("Which file formats are included?",
     "It depends on the product. Each product page lists its file formats, file size and software compatibility before you buy."),
    ("Can I use purchased assets commercially?",
     "Usage rights are listed on every product page and explained in full in the License & Usage Policy. In general you may use the files in your own projects, but you may not resell or redistribute them."),
    ("Are refunds available for digital products?",
     "Because digital files cannot be returned, refunds are handled case by case, for example when a file is defective or not as described. See the Refund Policy for details."),
    ("How long does a custom project take?",
     "It depends on the length, complexity and number of revisions. We agree a timeline with you in the quote before any work begins."),
    ("How can I contact AI MANGA INDIA?",
     "Use the Hire Me form for project requests, or email the support address shown on the Contact page for questions about orders and downloads."),
]

DEFAULT_SETTINGS = {
    "site_name": "AI MANGA INDIA",
    "tagline": "Imagine Beyond Limits. Create Beyond Reality.",
    "hero_title": "The future of visual storytelling starts here.",
    "hero_subtitle": "From cinematic AI-generated videos and captivating animated stories to high-impact advertisements and premium digital designs, we transform imagination into extraordinary visual experiences.",
    "hero_video_url": "",
    "announcement": "",
    "contact_email": "hello@example.com",
    "support_email": "support@example.com",
    "youtube_url": "https://www.youtube.com/",
    "instagram_url": "https://www.instagram.com/",
    "linkedin_url": "https://www.linkedin.com/",
    "newsletter_blurb": "Get exclusive creative resources, new digital products, and studio updates.",
    "max_downloads": "10",
    "about_intro": "AI MANGA INDIA is an independent AI-powered creative brand exploring the possibilities of artificial intelligence, animation, visual storytelling, and digital design.",
}
SETTING_LABELS = {
    "hero_title": "Homepage headline", "hero_subtitle": "Homepage supporting text",
    "hero_video_url": "Hero showreel video URL (.mp4, optional)", "announcement": "Announcement bar text (blank = hidden)",
    "contact_email": "Public contact email", "support_email": "Support email (orders and downloads)",
    "youtube_url": "YouTube channel URL", "instagram_url": "Instagram URL", "linkedin_url": "LinkedIn URL",
    "newsletter_blurb": "Newsletter text", "max_downloads": "Downloads allowed per purchased file",
    "about_intro": "About page introduction",
}

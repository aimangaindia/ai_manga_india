"""Demonstration content. Everything seeded here is flagged is_demo / kind='demo' so it
is clearly shown as sample content on the site. Replace or delete it in the admin."""
import json
import os
import zipfile

LICENSE_STD = ("Personal and commercial use inside your own projects (videos, designs, social posts, client work). "
               "No resale, sharing or redistribution of the original files. One license per purchaser.")

# slug, name, cat, price(rupees), short, format, compat, style, seed, flags
P = [
    ("mini-cinematic-prompt-pack", "Mini Cinematic Prompt Pack", "ai-prompts", 149,
     "A small starter set of cinematic image and video prompts.", "PDF, TXT", "Any text-to-image or text-to-video tool", "portal", 101, ""),
    ("premium-prompt-bundle", "Premium Prompt Bundle", "ai-prompts", 449,
     "Image, video and storytelling prompts grouped by genre.", "PDF, TXT, CSV", "Any text-to-image or text-to-video tool", "orbs", 102, "bundle,featured"),
    ("character-consistency-prompts", "Character Consistency Prompts", "ai-prompts", 299,
     "Prompt structures for keeping a character recognisable across scenes.", "PDF, TXT", "Any text-to-image or text-to-video tool", "manga", 103, "new"),
    ("ad-generation-prompt-kit", "Advertisement Prompt Kit", "ai-prompts", 349,
     "Prompt templates for product shots and short ad concepts.", "PDF, TXT", "Any text-to-image or text-to-video tool", "city", 104, ""),
    ("cinematic-backgrounds-pack", "Cinematic Backgrounds Pack", "ai-video-assets", 599,
     "Atmospheric backgrounds for video projects and thumbnails.", "MP4, JPG", "Premiere Pro, DaVinci Resolve, CapCut, Canva", "peaks", 105, "new"),
    ("video-overlay-motion-bundle", "Video Overlay & Motion Bundle", "ai-video-assets", 799,
     "Overlays and motion elements for editors.", "MP4, MOV, PNG", "Premiere Pro, DaVinci Resolve, After Effects, CapCut", "grid", 106, "bundle,featured"),
    ("manga-backgrounds-collection", "Manga Backgrounds Collection", "manga-assets", 399,
     "Manga-inspired scenery for comics, covers and wallpapers.", "PNG, JPG", "Any image editor or comic tool", "manga", 107, ""),
    ("storyboard-template-set", "Storyboard Template Set", "manga-assets", 249,
     "Printable and digital storyboard layouts for animation planning.", "PDF, PNG", "Any PDF reader or image editor", "city", 108, "new"),
    ("youtube-thumbnail-templates", "YouTube Thumbnail Templates", "graphic-design", 299,
     "Layered thumbnail layouts you can restyle to your channel.", "PSD, PNG", "Photoshop, Photopea", "grid", 109, ""),
    ("social-media-template-kit", "Social Media Template Kit", "graphic-design", 449,
     "Post and story layouts in a consistent style.", "PSD, PNG", "Photoshop, Photopea", "orbs", 110, ""),
    ("ad-script-pack", "Advertisement Script Pack", "marketing-kits", 349,
     "Short ad script frameworks for video and social.", "PDF, DOCX", "Any word processor", "portal", 111, ""),
    ("premium-creator-kit", "Premium Creator Kit", "marketing-kits", 1499,
     "A combined kit of prompts, templates and planners for creators.", "ZIP (PDF, PSD, PNG, TXT)", "Photoshop or Photopea, any PDF reader", "peaks", 112, "bundle,featured"),
]

INCLUDES = {
    "ai-prompts": ["Prompt collection document", "Plain-text copy for easy pasting", "Short usage notes"],
    "ai-video-assets": ["Video and image assets", "Usage notes", "Licence summary"],
    "manga-assets": ["Image files", "Usage notes", "Licence summary"],
    "graphic-design": ["Template files", "Font and usage notes", "Licence summary"],
    "marketing-kits": ["Documents and templates", "Usage notes", "Licence summary"],
}

# slug, title, cat, kind, style, seed, summary, tools
W = [
    ("neon-shrine-cinematic", "Neon Shrine – Cinematic Clip", "ai-videos", "demo", "portal", 201,
     "A slow, atmospheric clip concept built around a glowing gateway.", "AI video generation, colour grading"),
    ("sky-harbour-sequence", "Sky Harbour – Fantasy Sequence", "ai-videos", "demo", "peaks", 202,
     "An establishing sequence for a fantasy adventure.", "AI video generation, editing"),
    ("product-spotlight-ad", "Product Spotlight – Ad Concept", "video-ads", "demo", "grid", 203,
     "A conceptual product commercial layout and storyboard.", "AI image and video generation, editing"),
    ("city-launch-promo", "City Launch – Promo Concept", "video-ads", "demo", "city", 204,
     "A promotional concept for a brand launch.", "AI video generation, motion text"),
    ("lantern-night-story", "Lantern Night – Animated Story", "3d-animation", "demo", "city", 205,
     "A short animated story concept with a mystery setup.", "3D-style AI animation, sound design"),
    ("echo-temple-adventure", "Echo Temple – Adventure Scene", "3d-animation", "demo", "portal", 206,
     "Adventure-scene concept with character-driven framing.", "3D-style AI animation, editing"),
    ("dream-atlas-concept", "Dream Atlas – Concept Art", "digital-art", "demo", "orbs", 207,
     "Surreal environment concept art.", "AI image generation, retouching"),
    ("crystal-ridge-poster", "Crystal Ridge – Fantasy Poster", "digital-art", "demo", "peaks", 208,
     "A fantasy poster composition.", "AI image generation, layout"),
    ("thumbnail-set-demo", "Thumbnail Style Set", "graphic-design", "demo", "grid", 209,
     "A set of thumbnail layouts in one visual system.", "AI image generation, layout"),
    ("campaign-banner-demo", "Campaign Banner Set", "graphic-design", "demo", "orbs", 210,
     "A banner set for a sample campaign.", "AI image generation, layout"),
    ("ronin-sky-manga", "Ronin Sky – Manga Illustration", "manga-art", "demo", "manga", 211,
     "Manga-inspired illustration with dramatic speed lines.", "AI image generation, retouching"),
    ("moonlit-dojo-wallpaper", "Moonlit Dojo – Wallpaper", "manga-art", "demo", "manga", 212,
     "Manga-inspired wallpaper concept.", "AI image generation, retouching"),
]


def seed(conn, base_dir):
    cur = conn.cursor()
    if cur.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        pdir = os.environ.get("PROTECTED_DIR") or os.path.join(base_dir, "instance", "protected")
        os.makedirs(pdir, exist_ok=True)
        for slug, name, cat, price, short, fmt, compat, style, seedn, flags in P:
            fname = f"demo_{slug}.zip"
            with zipfile.ZipFile(os.path.join(pdir, fname), "w") as z:
                z.writestr("README_DEMO.txt",
                           f"{name}\n\nThis is a placeholder file for a DEMONSTRATION product.\n"
                           "Replace it with your real product file in Admin > Products.\n")
            desc = (f"{short}\n\nThis is a demonstration listing. Replace the description, included items, formats and "
                    "file sizes with the real details of your product before you start selling.")
            faqs = [["Is this a demo product?", "Yes. It is sample content so you can see how a finished product page works."],
                    ["How do I download after purchase?", "Sign in, open My Account, and use the Download button next to your purchase."]]
            cur.execute("""INSERT INTO products(slug,name,short_desc,description,category,price,format,compat,includes,asset_count,
                file_formats,file_size,usage_rights,faqs,thumb_style,thumb_seed,file_path,file_name,featured,is_new,is_bundle,active,is_demo)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1)""",
                        (slug, name, short, desc, cat, price * 100, fmt, compat, "\n".join(INCLUDES[cat]), None,
                         fmt, "Demo value", LICENSE_STD, json.dumps(faqs), style, seedn, fname, f"{slug}.zip",
                         int("featured" in flags), int("new" in flags), int("bundle" in flags)))
    if cur.execute("SELECT COUNT(*) FROM portfolio").fetchone()[0] == 0:
        for i, (slug, title, cat, kind, style, seedn, summary, tools) in enumerate(W):
            cur.execute("""INSERT INTO portfolio(slug,title,category,kind,summary,description,tools,process,thumb_style,thumb_seed,featured,active,sort)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)""",
                        (slug, title, cat, kind, summary,
                         f"{summary}\n\nThis is placeholder artwork. Upload your real work in Admin > Portfolio and it will replace this entry's visuals and text.",
                         tools, "Brief and references → concept → AI-assisted generation → review and refinement → final export.",
                         style, seedn, int(i < 6), i))
    cur.execute("INSERT OR IGNORE INTO coupons(code,percent,amount_off,active,note) VALUES('DEMO10',10,0,1,'Demo coupon. Delete or disable before launch.')")
    conn.commit()

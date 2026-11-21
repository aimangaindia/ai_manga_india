/* editor-templates.js — starter templates for the Template Studio (editor.html).
   Each template is plain data: edit/add entries here. All designs are original to AI MANGA INDIA.
   Element types: text | rect | ellipse | image.  Colours are hex.  Sizes are in design pixels. */
(() => {
  const AMI = (window.AMI = window.AMI || {});
  const T = (o) => Object.assign({ type: "text", x: 80, y: 80, w: 600, text: "Text", font: "Space Grotesk", size: 64, weight: 700, italic: false, color: "#FFFFFF", align: "left", ls: 0, lh: 1.1, upper: false, stroke: null, shadow: null, rot: 0, op: 1 }, o);
  const R = (o) => Object.assign({ type: "rect", x: 0, y: 0, w: 200, h: 200, fill: "#7865FF", fill2: null, stroke: null, sw: 0, r: 0, rot: 0, op: 1 }, o);
  const E = (o) => R(Object.assign({ type: "ellipse" }, o));
  const glow = (c, b = 24) => ({ c, b, x: 0, y: 0 });

  AMI.studioSizes = [
    { id: "post", label: "Post 1080×1080", w: 1080, h: 1080 },
    { id: "portrait", label: "Portrait 1080×1350", w: 1080, h: 1350 },
    { id: "story", label: "Story 1080×1920", w: 1080, h: 1920 },
    { id: "yt", label: "Thumbnail 1280×720", w: 1280, h: 720 },
    { id: "banner", label: "Banner 1500×500", w: 1500, h: 500 },
    { id: "pin", label: "Pinterest Pin 1000×1500", w: 1000, h: 1500 },
    { id: "fbcover", label: "Facebook Cover 1640×624", w: 1640, h: 624 },
    { id: "a4", label: "A4 Flyer / Poster 1240×1754", w: 1240, h: 1754 }
  ];

  AMI.studioTemplates = [
    { id: "episode", name: "Episode Poster", w: 1080, h: 1350, make: () => ({ bg: { c1: "#2a0608", c2: "#8a1c0c", img: null }, objs: [
      E({ x: 140, y: 560, w: 800, h: 800, fill: "#ff8a1f", fill2: "#2a0608", op: .55 }),
      T({ x: 60, y: 90, w: 960, text: "YOUR TITLE HERE!", font: "Lilita One", size: 150, weight: 400, color: "#FFC23A", align: "center", lh: 1, stroke: { c: "#5a1204", w: 14 }, shadow: glow("#ff7a00", 34) }),
      T({ x: 80, y: 420, w: 920, text: "A short line about this episode", font: "Poppins", size: 40, weight: 500, color: "#FFE9C9", align: "center" }),
      R({ x: 60, y: 1170, w: 260, h: 96, r: 18, fill: "#FFC23A", fill2: "#ff7a00", stroke: "#5a1204", sw: 6 }),
      T({ x: 60, y: 1190, w: 260, text: "PART 1", font: "Lilita One", size: 54, weight: 400, color: "#3a0c04", align: "center" }),
      T({ x: 560, y: 1200, w: 460, text: "@yourhandle", font: "Poppins", size: 34, weight: 500, color: "#FFE9C9", align: "right" })
    ] }) },
    { id: "neon", name: "Neon Announcement", w: 1080, h: 1080, make: () => ({ bg: { c1: "#0b0d1a", c2: "#2a1a6e", img: null }, objs: [
      E({ x: 560, y: -160, w: 700, h: 700, fill: "#00D9FF", fill2: "#7865FF", op: .35 }),
      R({ x: 80, y: 100, w: 150, h: 10, r: 5, fill: "#00D9FF", fill2: "#7865FF" }),
      T({ x: 80, y: 140, w: 700, text: "NEW\nDROP", font: "Anton", size: 250, weight: 400, color: "#FFFFFF", lh: .95 }),
      T({ x: 80, y: 700, w: 760, text: "Write one clear sentence about your announcement here.", font: "Inter", size: 42, weight: 500, color: "#C9CEE6", lh: 1.3 }),
      R({ x: 80, y: 900, w: 360, h: 92, r: 46, fill: "#00D9FF", fill2: "#7865FF" }),
      T({ x: 80, y: 920, w: 360, text: "Learn more", font: "Space Grotesk", size: 40, color: "#06081a", align: "center" })
    ] }) },
    { id: "quote", name: "Quote Card", w: 1080, h: 1080, make: () => ({ bg: { c1: "#f6f1e7", c2: null, img: null }, objs: [
      T({ x: 80, y: 60, w: 300, text: "“", font: "Playfair Display", size: 340, color: "#7865FF", lh: 1 }),
      T({ x: 100, y: 330, w: 880, text: "Creativity has no limits. Write your quote here.", font: "Playfair Display", size: 82, color: "#15172a", lh: 1.2 }),
      R({ x: 100, y: 850, w: 90, h: 8, r: 4, fill: "#7865FF" }),
      T({ x: 100, y: 890, w: 700, text: "— Your Name", font: "Poppins", size: 38, weight: 500, color: "#4b4f66" })
    ] }) },
    { id: "sale", name: "Product Spotlight", w: 1080, h: 1080, make: () => ({ bg: { c1: "#101321", c2: "#1b2136", img: null }, objs: [
      E({ x: 190, y: 190, w: 700, h: 700, fill: "#7865FF", fill2: "#00D9FF", op: .9 }),
      R({ x: 330, y: 330, w: 420, h: 420, r: 40, fill: "#FFFFFF", op: .12, stroke: "#FFFFFF", sw: 3 }),
      T({ x: 330, y: 500, w: 420, text: "Add your\nproduct image", font: "Poppins", size: 36, weight: 500, color: "#FFFFFF", align: "center", lh: 1.3 }),
      T({ x: 70, y: 70, w: 700, text: "PRODUCT NAME", font: "Bebas Neue", size: 120, weight: 400, color: "#FFFFFF", ls: 4 }),
      T({ x: 70, y: 930, w: 940, text: "Short description  •  Your price here", font: "Poppins", size: 40, weight: 500, color: "#C9CEE6" })
    ] }) },
    { id: "story", name: "Story — Coming Soon", w: 1080, h: 1920, make: () => ({ bg: { c1: "#08090D", c2: "#3b1d8a", img: null }, objs: [
      E({ x: -200, y: 1100, w: 1000, h: 1000, fill: "#A855F7", fill2: "#08090D", op: .6 }),
      E({ x: 520, y: 200, w: 640, h: 640, fill: "#28D9FF", fill2: "#08090D", op: .35 }),
      T({ x: 80, y: 560, w: 920, text: "COMING\nSOON", font: "Anton", size: 270, weight: 400, color: "#FFFFFF", align: "center", lh: .95, shadow: glow("#7865FF", 40) }),
      T({ x: 120, y: 1170, w: 840, text: "Tell people what is on the way", font: "Inter", size: 48, weight: 500, color: "#D5D9F0", align: "center" }),
      R({ x: 340, y: 1500, w: 400, h: 96, r: 48, fill: "#FFFFFF" }),
      T({ x: 340, y: 1522, w: 400, text: "Follow", font: "Space Grotesk", size: 44, color: "#08090D", align: "center" })
    ] }) },
    { id: "thumb", name: "YouTube Thumbnail", w: 1280, h: 720, make: () => ({ bg: { c1: "#1b0f4a", c2: "#c2185b", img: null }, objs: [
      E({ x: 720, y: 60, w: 600, h: 600, fill: "#FFD23A", fill2: "#ff6a00", op: .9 }),
      T({ x: 60, y: 90, w: 780, text: "BIG BOLD\nTITLE", font: "Bangers", size: 190, weight: 400, color: "#FFFFFF", lh: .95, stroke: { c: "#12082e", w: 16 }, shadow: { c: "#000000", b: 0, x: 8, y: 8 } }),
      R({ x: 60, y: 520, w: 520, h: 100, r: 14, fill: "#FFD23A" }),
      T({ x: 60, y: 540, w: 520, text: "SUBTITLE HERE", font: "Anton", size: 64, weight: 400, color: "#12082e", align: "center" })
    ] }) },
    { id: "manga", name: "Manga Cover", w: 1080, h: 1350, make: () => ({ bg: { c1: "#ffffff", c2: null, img: null }, objs: [
      R({ x: 40, y: 40, w: 1000, h: 1270, fill: "#ffffff", stroke: "#0b0b0b", sw: 10 }),
      R({ x: 40, y: 40, w: 1000, h: 330, fill: "#0b0b0b" }),
      T({ x: 80, y: 80, w: 920, text: "MANGA\nTITLE", font: "Anton", size: 190, weight: 400, color: "#FFFFFF", lh: .95 }),
      E({ x: 300, y: 560, w: 640, h: 640, fill: "#e11d48", fill2: null }),
      T({ x: 300, y: 790, w: 640, text: "Add your\nartwork here", font: "Poppins", size: 40, weight: 700, color: "#FFFFFF", align: "center", lh: 1.25 }),
      T({ x: 80, y: 1180, w: 560, text: "CHAPTER 01", font: "Bebas Neue", size: 90, weight: 400, color: "#0b0b0b", ls: 3 })
    ] }) },
    { id: "banner", name: "Channel Banner", w: 1500, h: 500, make: () => ({ bg: { c1: "#08090D", c2: "#1b1060", img: null }, objs: [
      E({ x: 1000, y: -200, w: 800, h: 800, fill: "#28D9FF", fill2: "#7865FF", op: .35 }),
      T({ x: 90, y: 130, w: 1000, text: "YOUR CHANNEL NAME", font: "Anton", size: 130, weight: 400, color: "#FFFFFF", ls: 2 }),
      T({ x: 90, y: 300, w: 1000, text: "Your tagline goes here", font: "Poppins", size: 46, weight: 500, color: "#C9CEE6" })
    ] }) },
    { id: "pin", name: "Pinterest Pin", w: 1000, h: 1500, make: () => ({ bg: { c1: "#fff4e0", c2: null, img: null }, objs: [
      R({ x: 60, y: 60, w: 880, h: 760, r: 40, fill: "#7865FF", fill2: "#28D9FF" }),
      T({ x: 100, y: 330, w: 800, text: "Add your\nphoto here", font: "Poppins", size: 64, weight: 700, color: "#FFFFFF", align: "center", lh: 1.2 }),
      T({ x: 60, y: 880, w: 880, text: "5 IDEAS FOR YOUR NEXT PROJECT", font: "Bebas Neue", size: 150, weight: 400, color: "#15172a", lh: .95 }),
      T({ x: 60, y: 1250, w: 880, text: "Write a short helpful description for your pin.", font: "Inter", size: 40, weight: 500, color: "#4b4f66", lh: 1.3 }),
      R({ x: 60, y: 1360, w: 320, h: 80, r: 40, fill: "#15172a" }), T({ x: 60, y: 1378, w: 320, text: "Read more", font: "Space Grotesk", size: 36, color: "#FFFFFF", align: "center" })
    ] }) },
    { id: "fbcover", name: "Facebook Cover", w: 1640, h: 624, make: () => ({ bg: { c1: "#0b0d1a", c2: "#3b1d8a", img: null }, objs: [
      E({ x: 1100, y: -100, w: 700, h: 700, fill: "#A855F7", fill2: "#28D9FF", op: .45 }),
      { type: "poly", kind: "star", x: 1240, y: 120, w: 260, h: 260, fill: "#FFC23A", fill2: null, stroke: null, sw: 0, r: 0, rot: 15, op: 1, shadow: { c: "#FFC23A", b: 40, x: 0, y: 0 } },
      T({ x: 100, y: 200, w: 1000, text: "YOUR PAGE NAME", font: "Anton", size: 140, weight: 400, color: "#FFFFFF", ls: 2 }),
      T({ x: 100, y: 390, w: 1000, text: "Short tagline about what you do", font: "Poppins", size: 48, weight: 500, color: "#C9CEE6" })
    ] }) },
    { id: "flyer", name: "A4 Flyer", w: 1240, h: 1754, make: () => ({ bg: { c1: "#ffffff", c2: null, img: null }, objs: [
      R({ x: 0, y: 0, w: 1240, h: 760, fill: "#15172a", fill2: "#3b1d8a" }),
      { type: "poly", kind: "burst", x: 820, y: 360, w: 360, h: 360, fill: "#FFC23A", fill2: null, stroke: null, sw: 0, r: 0, rot: 0, op: 1, shadow: null },
      T({ x: 884, y: 480, w: 232, text: "NEW!", font: "Bangers", size: 90, weight: 400, color: "#15172a", align: "center" }),
      T({ x: 80, y: 120, w: 1000, text: "EVENT\nTITLE", font: "Anton", size: 230, weight: 400, color: "#FFFFFF", lh: .95 }),
      T({ x: 80, y: 860, w: 1080, text: "Date  •  Time  •  Place", font: "Space Grotesk", size: 64, weight: 700, color: "#15172a" }),
      R({ x: 80, y: 960, w: 120, h: 10, r: 5, fill: "#7865FF" }),
      T({ x: 80, y: 1020, w: 1080, text: "Write the details of your event here. Keep it short and clear so people can read it quickly.", font: "Inter", size: 48, weight: 400, color: "#4b4f66", lh: 1.35 }),
      T({ x: 80, y: 1600, w: 1080, text: "yourwebsite.com  •  @yourhandle", font: "Poppins", size: 42, weight: 500, color: "#15172a" })
    ] }) }
  ];
})();

#!/usr/bin/env python3
"""Generates the SVG logo set and the sample artwork used as clearly-labelled placeholders.
Run:  python3 tools/gen_assets.py     (no dependencies)
Replace any generated file in assets/images or assets/products with your own work (same filename or
update js/data.js)."""
import math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "images")
PRD = os.path.join(ROOT, "assets", "products")
LOGO = os.path.join(ROOT, "assets", "logos")
for d in (IMG, PRD, LOGO, os.path.join(ROOT, "assets", "icons")):
    os.makedirs(d, exist_ok=True)

W, H = 800, 600
PAL = {  # (dark bg, mid, accent1, accent2)
    "violet": ("#0b0a1c", "#1c1550", "#7865FF", "#B38CFF"),
    "cyan":   ("#06101a", "#0b2a45", "#00D9FF", "#7865FF"),
    "ember":  ("#12080f", "#3a1230", "#ff5d8f", "#B38CFF"),
    "aurora": ("#06130f", "#0c3a3a", "#00D9FF", "#58f5c0"),
    "sunset": ("#120a14", "#3b1a4a", "#ff8a5c", "#B38CFF"),
    "steel":  ("#080a12", "#1a2140", "#8ea2ff", "#00D9FF"),
}


def head(p, uid):
    d, m, a, b = PAL[p]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
            f'<defs><linearGradient id="bg{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{d}"/>'
            f'<stop offset="1" stop-color="{m}"/></linearGradient>'
            f'<radialGradient id="gl{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{a}" stop-opacity=".9"/>'
            f'<stop offset="1" stop-color="{a}" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="ac{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/>'
            f'<stop offset="1" stop-color="{b}"/></linearGradient>'
            f'<filter id="bl{uid}"><feGaussianBlur stdDeviation="6"/></filter></defs>'
            f'<rect width="{W}" height="{H}" fill="url(#bg{uid})"/>')


def stars(r, n=70, op=.7):
    return "".join(f'<circle cx="{r.uniform(0,W):.0f}" cy="{r.uniform(0,H*.6):.0f}" r="{r.uniform(.5,1.8):.1f}" '
                   f'fill="#fff" opacity="{r.uniform(.2,op):.2f}"/>' for _ in range(n))


def ridge(r, base, amp, color, op=1, steps=16):
    pts = [(0, H)]
    for i in range(steps + 1):
        x = W * i / steps
        pts.append((x, base - amp * (math.sin(i * r.uniform(.6, 1.4) + r.random() * 6) * .5 + .5) - r.uniform(0, amp * .4)))
    pts.append((W, H))
    return f'<polygon points="{" ".join(f"{x:.0f},{y:.0f}" for x, y in pts)}" fill="{color}" opacity="{op}"/>'


def scene_mountain(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u) + stars(r)
    s += f'<circle cx="{r.uniform(480,640):.0f}" cy="{r.uniform(150,220):.0f}" r="150" fill="url(#gl{u})" opacity=".55"/>'
    s += f'<circle cx="560" cy="190" r="46" fill="url(#ac{u})"/>'
    for i, (base, amp, op) in enumerate([(380, 120, .5), (450, 110, .75), (520, 90, 1)]):
        s += ridge(r, base, amp, [m, "#10142b", d][i], op)
    s += f'<rect y="540" width="{W}" height="60" fill="{d}"/>'
    return s + "</svg>"


def scene_city(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u) + stars(r, 40, .5)
    s += f'<ellipse cx="400" cy="420" rx="420" ry="150" fill="url(#gl{u})" opacity=".45"/>'
    x = -10
    while x < W:
        w, h = r.randint(40, 100), r.randint(130, 400)
        col = ["#0d1026", "#121733", "#0a0d1f"][r.randint(0, 2)]
        s += f'<rect x="{x}" y="{H-h-40}" width="{w}" height="{h}" fill="{col}"/>'
        for wy in range(H - h - 25, H - 50, 22):
            for wx in range(x + 8, x + w - 8, 14):
                if r.random() < .28:
                    s += f'<rect x="{wx}" y="{wy}" width="6" height="9" fill="{r.choice([a, b, "#fff"])}" opacity="{r.uniform(.4,.95):.2f}"/>'
        x += w + r.randint(-6, 6)
    s += f'<rect y="{H-40}" width="{W}" height="40" fill="{d}"/>'
    s += f'<rect y="{H-40}" width="{W}" height="2" fill="{a}" opacity=".8"/>'
    return s + "</svg>"


def scene_orb(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u) + stars(r, 50, .5)
    cx, cy = 400, 300
    s += f'<circle cx="{cx}" cy="{cy}" r="260" fill="url(#gl{u})" opacity=".5"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="120" fill="url(#ac{u})"/>'
    s += f'<circle cx="{cx-35}" cy="{cy-40}" r="60" fill="#fff" opacity=".12"/>'
    for i, rx in enumerate((190, 240, 300)):
        s += (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{rx*.28:.0f}" fill="none" stroke="{[a,b,"#fff"][i]}" '
              f'stroke-width="{[2,1.5,1][i]}" opacity="{[.8,.55,.3][i]}" transform="rotate({-18+i*14} {cx} {cy})"/>')
    return s + "</svg>"


def scene_manga(p, r, u):
    d, m, a, b = PAL[p]
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice"><defs>' \
        f'<linearGradient id="ac{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>' \
        f'<pattern id="dt{u}" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.6" fill="#000" opacity=".28"/></pattern></defs>'
    s += f'<rect width="{W}" height="{H}" fill="#f4f1ff"/><rect width="{W}" height="{H}" fill="url(#dt{u})"/>'
    cx, cy = r.randint(330, 470), r.randint(240, 340)
    for i in range(54):
        ang = i / 54 * math.tau
        a1, a2 = ang - .02, ang + .02
        s += (f'<polygon points="{cx},{cy} {cx+1100*math.cos(a1):.0f},{cy+1100*math.sin(a1):.0f} '
              f'{cx+1100*math.cos(a2):.0f},{cy+1100*math.sin(a2):.0f}" fill="#12142a" opacity="{.9 if i%2 else .0}"/>')
    s += f'<circle cx="{cx}" cy="{cy}" r="150" fill="#f4f1ff"/>'
    s += f'<path d="M{cx-150} {cy} A150 150 0 0 1 {cx+150} {cy} L{cx+150} {cy+30} L{cx-150} {cy+30}Z" fill="url(#ac{u})"/>'
    s += f'<rect x="30" y="30" width="{W-60}" height="{H-60}" fill="none" stroke="#12142a" stroke-width="8"/>'
    return s + "</svg>"


def scene_portal(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u) + stars(r, 60, .6)
    s += f'<ellipse cx="400" cy="330" rx="320" ry="250" fill="url(#gl{u})" opacity=".4"/>'
    for i in range(7):
        w = 250 - i * 32
        s += (f'<path d="M{400-w} {H-60} V{300-i*10} A{w} {w} 0 0 1 {400+w} {300-i*10} V{H-60}" fill="none" '
              f'stroke="{a if i%2==0 else b}" stroke-width="{3 if i<3 else 2}" opacity="{.85-i*.1:.2f}"/>')
    s += ridge(r, 520, 70, d, 1)
    s += f'<rect y="{H-60}" width="{W}" height="60" fill="{d}"/>'
    return s + "</svg>"


def scene_poster(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u)
    s += f'<rect x="170" y="60" width="460" height="480" rx="8" fill="#0a0c18" stroke="{a}" stroke-width="2" opacity=".95"/>'
    s += f'<circle cx="400" cy="250" r="120" fill="url(#ac{u})"/><circle cx="400" cy="250" r="170" fill="none" stroke="{b}" opacity=".5"/>'
    for i in range(5):
        s += f'<rect x="210" y="{410+i*18}" width="{[300,220,260,180,240][i]}" height="6" rx="3" fill="#fff" opacity="{.7-i*.1:.2f}"/>'
    return s + "</svg>"


def scene_waves(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u) + f'<circle cx="400" cy="200" r="200" fill="url(#gl{u})" opacity=".4"/>'
    for i in range(12):
        y = 260 + i * 28
        pts = " ".join(f"{x},{y + math.sin(x / 70 + i * .6) * (10 + i * 2):.0f}" for x in range(0, W + 20, 20))
        s += f'<polyline points="{pts}" fill="none" stroke="{a if i%3 else b}" stroke-width="{1+i*.2:.1f}" opacity="{.25+i*.06:.2f}"/>'
    return s + "</svg>"


def scene_grid(p, r, u):
    d, m, a, b = PAL[p]
    s = head(p, u)
    for i in range(0, W + 1, 50):
        s += f'<line x1="{i}" y1="0" x2="{i}" y2="{H}" stroke="{a}" opacity=".12"/>'
    for j in range(0, H + 1, 50):
        s += f'<line x1="0" y1="{j}" x2="{W}" y2="{j}" stroke="{a}" opacity=".12"/>'
    for _ in range(9):
        w, h = r.choice([100, 150, 200]), r.choice([60, 100, 140])
        x, y = r.randrange(0, W - w, 50), r.randrange(0, H - h, 50)
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{r.choice([a, b, m])}" opacity="{r.uniform(.25,.8):.2f}"/>'
    s += f'<circle cx="640" cy="130" r="70" fill="url(#ac{u})"/>'
    return s + "</svg>"


SCENES = dict(mountain=scene_mountain, city=scene_city, orb=scene_orb, manga=scene_manga,
              portal=scene_portal, poster=scene_poster, waves=scene_waves, grid=scene_grid)


def make(folder, name, scene, pal, seed):
    r = random.Random(seed)
    svg = SCENES[scene](pal, r, f"{seed}")
    with open(os.path.join(folder, name + ".svg"), "w") as f:
        f.write(svg)


# name, scene, palette
PORTFOLIO = [
    ("p-neon-city", "city", "violet"), ("p-dragon-peak", "mountain", "ember"), ("p-orbit-ad", "orb", "cyan"),
    ("p-portal-tale", "portal", "aurora"), ("p-sneaker-ad", "waves", "sunset"), ("p-brand-launch", "grid", "violet"),
    ("p-fantasy-realm", "mountain", "aurora"), ("p-cyber-poster", "poster", "cyan"), ("p-thumb-kit", "grid", "ember"),
    ("p-manga-burst", "manga", "violet"), ("p-city-3d", "city", "steel"), ("p-spirit-gate", "portal", "sunset"),
]
PRODUCTS = [
    ("cinematic-broll", "mountain", "violet"), ("loop-backgrounds", "waves", "cyan"), ("prompt-starter", "orb", "violet"),
    ("prompt-cinematic", "portal", "ember"), ("character-prompts", "orb", "sunset"), ("manga-backgrounds", "manga", "violet"),
    ("character-sheets", "manga", "steel"), ("thumbnail-kit", "grid", "ember"), ("social-templates", "grid", "cyan"),
    ("poster-pack", "poster", "violet"), ("fantasy-wallpapers", "mountain", "aurora"), ("ad-script-pack", "poster", "sunset"),
]
for i, (n, s, p) in enumerate(PORTFOLIO):
    make(IMG, n, s, p, 100 + i)
ALT = [("waves", "cyan"), ("orb", "ember"), ("grid", "aurora"), ("mountain", "steel"), ("portal", "violet"), ("city", "sunset")]
for i, (n, s, p) in enumerate(PRODUCTS):
    make(PRD, n, s, p, 500 + i)
    for k in (2, 3):  # extra sample previews for the product gallery
        s2, p2 = ALT[(i + k) % len(ALT)]
        make(PRD, f"{n}-{k}", s2, p2, 700 + i * 3 + k)
make(IMG, "hero-a", "city", "violet", 901)
make(IMG, "hero-b", "portal", "cyan", 902)
make(IMG, "hero-c", "manga", "violet", 903)
make(IMG, "hero-d", "orb", "ember", 904)
make(IMG, "og-image", "city", "violet", 905)

# ---------------- logo: manga panel + neural "M" ----------------
MARK = ('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7865FF"/>'
        '<stop offset="1" stop-color="#00D9FF"/></linearGradient></defs>'
        '<path d="M14 4h44l-8 56H6z" fill="#0b0d1a" stroke="url(#g)" stroke-width="3" stroke-linejoin="round"/>'
        '<path d="M18 46 L24 20 L34 38 L44 18 L48 46" fill="none" stroke="#fff" stroke-width="3.4" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        '<circle cx="24" cy="20" r="3.6" fill="#00D9FF"/><circle cx="34" cy="38" r="3.6" fill="#B38CFF"/>'
        '<circle cx="44" cy="18" r="3.6" fill="#00D9FF"/>')
open(os.path.join(LOGO, "logo-mark.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{MARK}</svg>')
open(os.path.join(ROOT, "assets", "icons", "favicon.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{MARK}</svg>')


def full(text_fill, sub_fill, panel_fill):
    m = MARK.replace("#0b0d1a", panel_fill).replace('stroke="#fff"', f'stroke="{text_fill}"')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 64"><g>{m}</g>'
            f'<text x="82" y="34" font-family="Space Grotesk,Sora,Arial,sans-serif" font-weight="700" font-size="25" letter-spacing="2" fill="{text_fill}">AI MANGA</text>'
            f'<text x="82" y="56" font-family="Space Grotesk,Sora,Arial,sans-serif" font-weight="500" font-size="14" letter-spacing="9" fill="{sub_fill}">INDIA</text></svg>')


open(os.path.join(LOGO, "logo-dark-bg.svg"), "w").write(full("#FFFFFF", "#00D9FF", "#0b0d1a"))
open(os.path.join(LOGO, "logo-light-bg.svg"), "w").write(full("#0b0d1a", "#7865FF", "#ffffff"))
print("generated", len(os.listdir(IMG)), "images,", len(os.listdir(PRD)), "product images, logos")

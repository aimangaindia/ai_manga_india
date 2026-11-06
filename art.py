"""Procedural placeholder artwork.

Every image produced here is a *placeholder* generated from a seed. It exists so the
site looks complete before real portfolio/product images are uploaded. Replace by
uploading real thumbnails in the admin dashboard (they take priority over art).
"""
import random
from xml.sax.saxutils import escape

BLUE, PURPLE, CYAN = "#397BFF", "#A855F7", "#28D9FF"
PALETTES = [
    (BLUE, PURPLE, CYAN),
    (PURPLE, BLUE, CYAN),
    (CYAN, BLUE, PURPLE),
    (PURPLE, "#FF4FA3", BLUE),
]
STYLES = ["portal", "city", "peaks", "manga", "grid", "orbs"]


def _defs(c1, c2, c3, uid):
    return f"""<defs>
<linearGradient id="bg{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060A"/><stop offset=".55" stop-color="#0D1020"/><stop offset="1" stop-color="#151a33"/></linearGradient>
<radialGradient id="glow{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{c1}" stop-opacity=".95"/><stop offset=".45" stop-color="{c2}" stop-opacity=".35"/><stop offset="1" stop-color="{c2}" stop-opacity="0"/></radialGradient>
<radialGradient id="glow2{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{c3}" stop-opacity=".7"/><stop offset="1" stop-color="{c3}" stop-opacity="0"/></radialGradient>
<linearGradient id="fade{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08090D" stop-opacity="0"/><stop offset="1" stop-color="#08090D" stop-opacity=".92"/></linearGradient>
<linearGradient id="ln{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c3}"/></linearGradient>
</defs>"""


def art_svg(style="portal", seed=1, w=800, h=500, title=None, tag=None):
    rnd = random.Random(f"{style}-{seed}")
    c1, c2, c3 = PALETTES[rnd.randrange(len(PALETTES))]
    u = f"{abs(hash((style, seed))) % 10_000}"
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice" role="img">',
         _defs(c1, c2, c3, u), f'<rect width="{w}" height="{h}" fill="url(#bg{u})"/>']
    # stars
    for _ in range(46):
        o.append(f'<circle cx="{rnd.uniform(0, w):.0f}" cy="{rnd.uniform(0, h * .6):.0f}" r="{rnd.uniform(.4, 1.5):.1f}" fill="#fff" opacity="{rnd.uniform(.15, .7):.2f}"/>')
    cx, cy = w * rnd.uniform(.35, .65), h * rnd.uniform(.38, .5)

    if style == "portal":
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{h * .62}" fill="url(#glow{u})"/>')
        for i in range(7):
            r = h * (.08 + i * .045)
            o.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r * .72:.0f}" ry="{r:.0f}" fill="none" stroke="url(#ln{u})" stroke-width="{3 - i * .3:.1f}" opacity="{.95 - i * .1:.2f}" transform="rotate({rnd.uniform(-14, 14):.0f} {cx} {cy})"/>')
        o.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{h * .05}" ry="{h * .09}" fill="#fff" opacity=".9"/>')
        o.append(_floor(w, h, c3))
    elif style == "city":
        o.append(f'<circle cx="{cx}" cy="{h * .45}" r="{h * .5}" fill="url(#glow{u})" opacity=".8"/>')
        x = -10
        while x < w:
            bw, bh = rnd.uniform(34, 90), rnd.uniform(h * .18, h * .62)
            col = rnd.choice(["#0b0e1a", "#10142a", "#0d1124"])
            o.append(f'<rect x="{x:.0f}" y="{h - bh:.0f}" width="{bw:.0f}" height="{bh:.0f}" fill="{col}"/>')
            for wy in range(int(h - bh + 10), h - 8, 16):
                for wx in range(int(x + 6), int(x + bw - 8), 12):
                    if rnd.random() < .28:
                        o.append(f'<rect x="{wx}" y="{wy}" width="5" height="7" fill="{rnd.choice([c3, c1, "#fff"])}" opacity="{rnd.uniform(.4, .95):.2f}"/>')
            x += bw + rnd.uniform(2, 10)
        o.append(f'<rect y="{h * .55}" width="{w}" height="{h * .45}" fill="url(#fade{u})"/>')
    elif style == "peaks":
        o.append(f'<circle cx="{cx}" cy="{h * .36}" r="{h * .16}" fill="{c3}" opacity=".9"/><circle cx="{cx}" cy="{h * .36}" r="{h * .5}" fill="url(#glow2{u})"/>')
        for layer in range(4):
            base = h * (.55 + layer * .09)
            pts = [f"0,{h}"]
            xx = 0
            while xx <= w + 60:
                pts.append(f"{xx:.0f},{base - rnd.uniform(20, 130) + layer * 10:.0f}")
                xx += rnd.uniform(60, 130)
            pts.append(f"{w},{h}")
            shade = ["#1a1f3f", "#131735", "#0e1229", "#080a17"][layer]
            o.append(f'<polygon points="{" ".join(pts)}" fill="{shade}"/>')
        o.append(f'<rect y="{h * .5}" width="{w}" height="{h * .5}" fill="url(#fade{u})" opacity=".6"/>')
    elif style == "manga":
        o.append(f'<rect width="{w}" height="{h}" fill="#0a0b14"/>')
        for i in range(70):
            import math
            a = i / 70 * math.tau
            r1, r2 = h * rnd.uniform(.12, .3), w
            o.append(f'<line x1="{cx + math.cos(a) * r1:.0f}" y1="{cy + math.sin(a) * r1:.0f}" x2="{cx + math.cos(a) * r2:.0f}" y2="{cy + math.sin(a) * r2:.0f}" stroke="{rnd.choice([c1, c3, "#ffffff"])}" stroke-width="{rnd.uniform(.4, 2.6):.1f}" opacity="{rnd.uniform(.12, .5):.2f}"/>')
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{h * .2}" fill="#0a0b14"/><circle cx="{cx}" cy="{cy}" r="{h * .2}" fill="none" stroke="#fff" stroke-width="3"/>')
        o.append(f'<polygon points="{w * .55:.0f},0 {w:.0f},0 {w:.0f},{h * .6:.0f}" fill="{c2}" opacity=".35"/>')
        for dx in range(0, 12):
            for dy in range(0, 7):
                o.append(f'<circle cx="{14 + dx * 9}" cy="{h - 70 + dy * 9}" r="{1 + dy * .25:.1f}" fill="#fff" opacity=".35"/>')
    elif style == "grid":
        o.append(f'<circle cx="{cx}" cy="{h * .4}" r="{h * .55}" fill="url(#glow{u})" opacity=".7"/>')
        o.append(_floor(w, h, c1, strong=True))
        for i in range(3):
            bx, by = rnd.uniform(.15, .75) * w, rnd.uniform(.15, .45) * h
            o.append(f'<rect x="{bx:.0f}" y="{by:.0f}" width="{rnd.uniform(80, 170):.0f}" height="{rnd.uniform(60, 110):.0f}" rx="6" fill="none" stroke="{[c1, c2, c3][i]}" stroke-width="2" transform="rotate({rnd.uniform(-9, 9):.0f} {bx:.0f} {by:.0f})"/>')
    else:  # orbs
        for _ in range(14):
            r = rnd.uniform(14, 120)
            col = rnd.choice([c1, c2, c3])
            o.append(f'<circle cx="{rnd.uniform(0, w):.0f}" cy="{rnd.uniform(0, h):.0f}" r="{r:.0f}" fill="{col}" opacity="{rnd.uniform(.08, .32):.2f}"/>')
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{h * .55}" fill="url(#glow{u})" opacity=".55"/>')
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{h * .1}" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>')

    if title:
        t = escape(title)[:34]
        o.append(f'<rect x="0" y="{h - 78}" width="{w}" height="78" fill="#08090D" opacity=".62"/>')
        o.append(f'<text x="26" y="{h - 34}" fill="#fff" font-family="Sora,Inter,Arial,sans-serif" font-size="26" font-weight="700">{t}</text>')
    if tag:
        o.append(f'<text x="{w - 18}" y="26" text-anchor="end" fill="#fff" opacity=".55" font-family="Inter,Arial,sans-serif" font-size="12">{escape(tag)}</text>')
    o.append("</svg>")
    return "".join(o)


def _floor(w, h, col, strong=False):
    y0 = h * .72
    out = [f'<rect y="{y0}" width="{w}" height="{h - y0}" fill="#07080f" opacity=".85"/>']
    for i in range(1, 9):
        y = y0 + (h - y0) * (i / 8) ** 1.7
        out.append(f'<line x1="0" y1="{y:.0f}" x2="{w}" y2="{y:.0f}" stroke="{col}" stroke-width="1" opacity="{.5 if strong else .28}"/>')
    for i in range(-10, 11):
        out.append(f'<line x1="{w / 2 + i * 14:.0f}" y1="{y0}" x2="{w / 2 + i * 120:.0f}" y2="{h}" stroke="{col}" stroke-width="1" opacity="{.45 if strong else .22}"/>')
    return "".join(out)

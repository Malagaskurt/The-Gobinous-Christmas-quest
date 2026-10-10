#!/usr/bin/env python3
"""Fabrique la vidéo animée de Barnabé (quête 5) : assets/video/barnabe.mp4
(et sa version .webm pour les navigateurs sans H.264)

    python3 tools/generer-video.py

Un vrai petit film en pixel art, dans la DA du jeu, filmé par une « caméra
de surveillance » du 33ᵉ étage :
  1. de nuit, devant un panorama de gratte-ciels, Barnabé salue (« GG ») ;
  2. son réveil affiche presque minuit, « +7H » : il bâille, la lune brille ;
  3. la caméra zoome sur son écran : une tour immense de plus de 600 m ;
  4. il salue (« MATANÉ ! »)… et file avec le sac. Signal perdu.
La bouche de Barnabé bouge au rythme de sa voix. La voix (traque.videoVoix,
fichier ElevenLabs fourni) et une musique japonaise discrète sont mixées dans
la vidéo. Les décors suivent les sous-titres de config/quetes.js
(traque.sousTitres, champ `scene`), décalés de 0,6 s (début de la voix).

Tout est dessiné ici (aucune image externe) : la vidéo est libre de droits.
Prérequis : Python 3 avec numpy, Node.js (lecture de la configuration) et
ffmpeg.
"""
import json
import math
import os
import re
import subprocess
import tempfile
import wave

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets", "video", "barnabe.mp4")
W, H, SCALE, FPS = 135, 180, 4, 12  # 540 × 720 px
SR = 44100
rng = np.random.default_rng(33)

PAL = {
    "k": (10, 31, 69), "K": (6, 18, 42),
    "w": (246, 239, 226), "W": (255, 255, 255),
    "s": (243, 199, 161), "S": (217, 150, 122),
    "h": (176, 122, 72), "H": (132, 86, 48),
    "g": (34, 128, 92), "G": (20, 92, 66),
    "b": (23, 66, 140), "B": (14, 42, 94),
    "c": (0, 173, 225), "C": (143, 220, 245),
    "r": (200, 16, 46), "R": (142, 10, 32),
    "m": (120, 20, 40), "y": (143, 220, 245),
    "p": (255, 170, 200), "P": (230, 110, 150),
    "n": (90, 60, 40), "o": (60, 40, 28),
}


def rgb(c):
    return np.array(PAL[c] if isinstance(c, str) else c, dtype=np.uint8)


# ---------------------------------------------------------------------------
# Configuration du jeu et police pixel (celle des titres tricotés)
# ---------------------------------------------------------------------------

def config():
    js = (
        "global.window={};require(process.argv[1]);"
        "const r=window.GAME_CONFIG.quetes.traque;"
        "console.log(JSON.stringify({subs:r.sousTitres,voix:r.videoVoix}));"
    )
    out = subprocess.run(["node", "-e", js, os.path.join(ROOT, "config", "quetes.js")], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def font():
    src = open(os.path.join(ROOT, "js", "knit.js"), encoding="utf8").read()
    block = src[src.index("var FONT = {"):src.index("};", src.index("var FONT = {"))]
    glyphs = {}
    for key, rows in re.findall(r"^\s*('.'|\"'\"|\w):\s*\[([^\]]*)\]", block, re.M):
        k = key.strip("'\"") if len(key) > 1 else key
        glyphs[k] = re.findall(r"'([.#]*)'", rows)
    glyphs["+"] = [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."]
    glyphs["."] = [".", ".", ".", ".", ".", ".", "#"]
    glyphs["●"] = [".....", ".###.", "#####", "#####", "#####", ".###.", "....."]
    return glyphs


FONT = font()


# ---------------------------------------------------------------------------
# Dessin
# ---------------------------------------------------------------------------

def rect(img, x, y, w, h, color):
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 > x0 and y1 > y0:
        img[y0:y1, x0:x1] = rgb(color)


def blit(img, grid, x, y, scale=1, flip=False):
    for dy, row in enumerate(grid):
        if flip:
            row = row[::-1]
        for dx, ch in enumerate(row):
            if ch in PAL:
                rect(img, x + dx * scale, y + dy * scale, scale, scale, ch)


def text(img, s, x, y, color="w", scale=1, gap=1):
    """Texte en lettres pixel 5 × 7 ; renvoie la largeur dessinée."""
    cx = x
    for ch in s.upper():
        g = FONT.get(ch, FONT[" "])
        for dy, row in enumerate(g):
            for dx, v in enumerate(row):
                if v == "#":
                    rect(img, cx + dx * scale, y + dy * scale, scale, scale, color)
        cx += (len(g[0]) + gap) * scale
    return cx - x


def text_width(s, scale=1, gap=1):
    return sum((len(FONT.get(ch, FONT[" "])[0]) + gap) * scale for ch in s.upper())


# ---------------------------------------------------------------------------
# Barnabé : 24 × 30 pixels, de face (bonnet vert, oreilles pointues,
# moustache et bouc, comme sur sa photo de badge)
# ---------------------------------------------------------------------------

def barnabe(mouth=0, blink=False, legs=0, arm=None, wave=0):
    """mouth : 0 fermée, 1 entrouverte, 2 grande ouverte.
    arm : None, 'wave' (bras levé), 'point' (bras tendu), 'carry' (sac)."""
    eye = "SS" if blink else "wk"
    pupil = "SS" if blink else "kk"
    mouths = ["ssssmmmmssss", "sssmmmmmmsss", "sssmRRRRmsss"]
    m2 = ["ssssssssssss", "sssssmmsssss", "ssssmmmmssss"]
    face = [
        "hssssssssssh",
        "ssssssssssss",
        "ss" + eye + "ssss" + eye + "ss",
        "ss" + pupil + "ssss" + pupil + "ss",
        "sssssSSsssss",
        "ssshhhhhhsss",
        mouths[mouth],
        m2[mouth][:5] + "hh" + m2[mouth][7:] if mouth == 0 else m2[mouth],
        ".ssssshhsss.",
        "...ssssss...",
    ]
    ears_l = ["S...", ".Ss.", "..ss", "...s", "....", "....", "....", "....", "....", "...."]
    ears_r = ["...S", ".sS.", "ss..", "s...", "....", "....", "....", "....", "....", "...."]
    hat = [
        "..........ww..........",
        ".........wwww.........",
        "..........gg..........",
        ".......gggggggg.......",
        "......gggggggggg......",
        ".....gggggggggggg.....",
        ".....GGGGGGGGGGGG.....",
        ".....GGGGGGGGGGGG.....",
    ]
    rows = ["." + r + "." for r in hat]
    for i in range(10):
        rows.append(".." + ears_l[i] + face[i] + ears_r[i] + ".")
    body = [
        ".....rrrrrrrrrrrr.....",
        "....bbbbrrrrrrbbbb....",
        "...bbbbbbbbbbbbbbbb...",
        "..sbbbbbbbbbbbbbbbbs..",
        "..sbccccccccccccccbs..",
        "...bbbbbbbbbbbbbbbb...",
        "...BBBBBBByyBBBBBBB...",
    ]
    legs_a = ["....BBBBB..BBBBB.....", "....BBBBB..BBBBB.....", "...rrrrrr..rrrrrr....", "..rrrrrr....rrrrrr..."]
    legs_b = [".....BBBBBBBBBB......", "......BBB..BBB.......", ".....rrrr..rrrr......", "....rrrr....rrrr....."]
    for r in body:
        rows.append("." + r + ".")
    for r in (legs_a if legs == 0 else legs_b):
        rows.append("." + r.ljust(22, ".")[:22] + ".")
    grid = [list(r.ljust(27, ".")) for r in rows]
    # bras (côté droit de l'image)
    if arm in ("wave", "point", "carry"):
        y0 = 18 + 3  # rangée des mains
        grid[y0][20] = "b"
        grid[y0 + 1][20] = "b"
        if arm == "wave":
            dx = 1 if wave else 0
            for yy in range(y0 - 4, y0 + 1):
                grid[yy][21] = "b"
            grid[y0 - 6][21 + dx - 1] = "s"
            grid[y0 - 5][21 + dx - 1] = "s"
            grid[y0 - 6][22 + dx - 1] = "s"
            grid[y0 - 5][22 + dx - 1] = "s"
        elif arm == "point":
            for xx in range(20, 23):
                grid[y0 - 1][xx] = "b"
            grid[y0 - 1][23] = "s"
        else:  # carry : main posée sur le sac
            grid[y0][21] = "s"
    return ["".join(r) for r in grid]


def sack(t):
    """Gros sac rouge du Cadeau Officiel (qui gigote un peu)."""
    wob = 1 if int(t * 3) % 2 else 0
    g = [
        "......ww......",
        ".....wyyw.....",
        "......yy......",
        "....rrrrrr....",
        "...rrrrrrrr...",
        "..rrrrrrrrrr..",
        ".rrrrrwrrrrrr.",
        ".rrrrwwwrrrrr.",
        "rrrrrrwrrrrrrr",
        "rrrrrrrrrrrrrr",
        "rrrrrrrrrrrrrR",
        "rrrrrrrrrrrrRR",
        ".rrrrrrrrrrRR.",
        "..RRRRRRRRRR..",
    ]
    if wob:
        g = [r[1:] + "." for r in g[:6]] + g[6:]
    return g


def tree(img, x, y, t):
    """Petit sapin du bureau, guirlande qui clignote."""
    g = [
        "....y....",
        "....b....",
        "...bbb...",
        "..bbbbb..",
        "...bbb...",
        "..bbbbb..",
        ".bbbbbbb.",
        "..bbbbb..",
        ".bbbbbbb.",
        "bbbbbbbbb",
        "....n....",
        "...ooo...",
    ]
    blit(img, g, x, y, 2)
    lights = [(3, 3), (5, 5), (2, 6), (6, 8), (3, 9), (5, 9)]
    for i, (lx, ly) in enumerate(lights):
        on = (int(t * 4) + i) % 3 != 0
        rect(img, x + lx * 2, y + ly * 2, 2, 2, ("r", "c", "W")[i % 3] if on else "B")


# ---------------------------------------------------------------------------
# Décor : le repaire du 33ᵉ étage, de nuit
# ---------------------------------------------------------------------------

STARS = [(int(x), int(y)) for x, y in zip(rng.integers(10, 126, 26), rng.integers(22, 60, 26))]
SNOW = [(float(x), float(y), float(v)) for x, y, v in zip(rng.uniform(10, 126, 34), rng.uniform(20, 92, 34), rng.uniform(4, 9, 34))]
BUILDINGS = [(10, 16, 70), (26, 12, 62), (38, 18, 74), (56, 10, 66), (66, 20, 58), (86, 14, 70), (100, 16, 64), (116, 12, 72)]
WIN_LIT = rng.random(400) < 0.45


def room(img, t, desk=False):
    img[:] = rgb("K")
    rect(img, 0, 12, W, 120, (16, 40, 88))  # mur
    for x in range(0, W, 8):  # papier peint discret
        rect(img, x, 12, 1, 120, (18, 45, 96))
    # fenêtre panoramique
    rect(img, 8, 18, 119, 76, "k")
    rect(img, 10, 20, 115, 72, (8, 20, 52))
    for i, (sx, sy) in enumerate(STARS):
        if (int(t * 2) + i) % 5:
            rect(img, sx, sy, 1, 1, "C" if i % 3 else "W")
    moon = [".www.", "wwwww", "wwwwW", "wwwww", ".www."]  # lune
    blit(img, moon, 104, 26, 2)
    rect(img, 107, 29, 2, 2, "C")
    k = 0
    for bx, bw, top in BUILDINGS:
        rect(img, bx, top, bw, 92 - top, (12, 30, 70))
        for wy in range(top + 3, 90, 4):
            for wx in range(bx + 2, bx + bw - 2, 4):
                if WIN_LIT[k % len(WIN_LIT)]:
                    rect(img, wx, wy, 2, 2, "y" if k % 7 else "c")
                k += 1
    for sx, sy, v in SNOW:  # neige derrière la vitre
        y = 20 + (sy - 20 + t * v) % 72
        x = sx + math.sin(t * 1.3 + sy) * 1.5
        rect(img, int(x), int(y), 1, 1, "W")
    rect(img, 66, 18, 3, 76, "k")  # montant de la fenêtre
    # guirlande au-dessus de la fenêtre
    for x in range(8, 127, 6):
        rect(img, x, 15 + (1 if (x // 6) % 2 else 0), 6, 1, "B")
        rect(img, x + 2, 17, 2, 2, ("r", "W", "c")[(x // 6 + int(t * 3)) % 3])
    # sol
    rect(img, 0, 132, W, 48, (24, 52, 110))
    for y in range(136, 180, 6):
        rect(img, 0, y, W, 1, (20, 46, 98))
    rect(img, 0, 132, W, 2, "B")
    if not desk:
        tree(img, 116, 126, t)
    if desk:
        rect(img, 76, 118, 58, 4, "n")
        rect(img, 78, 122, 4, 22, "o")
        rect(img, 128, 122, 4, 22, "o")


def hud(img, t, frame):
    rect(img, 0, 0, W, 12, "K")
    if int(t * 2) % 2 == 0:
        text(img, "●", 3, 3, "r")
    text(img, "REC", 10, 3, "w")
    label = "CAM 33-07"
    text(img, label, W - 3 - text_width(label), 3, "C")
    secs = 23 * 3600 + 48 * 60 + 12 + int(t)
    stamp = f"{secs // 3600 % 24:02d}:{secs // 60 % 60:02d}:{secs % 60:02d}"
    rect(img, 0, H - 11, W, 11, "K")
    text(img, stamp, 3, H - 9, "C")
    text(img, "33E ETAGE", W - 3 - text_width("33E ETAGE"), H - 9, "w")


# ---------------------------------------------------------------------------
# Accessoires des scènes
# ---------------------------------------------------------------------------

def clock(img, x, y, t):
    """Réveil sur le bureau : il est presque minuit chez Barnabé (+7 h)."""
    rect(img, x, y, 50, 30, "k")
    rect(img, x + 2, y + 2, 46, 26, (6, 16, 40))
    rect(img, x + 6, y + 30, 6, 3, "k")
    rect(img, x + 38, y + 30, 6, 3, "k")
    mins = 47 + int(t / 8) % 3
    sep = ":" if int(t * 2) % 2 == 0 else " "
    text(img, f"23{sep}{mins:02d}", x + 7, y + 5, "r")
    text(img, "+7H", x + 15, y + 17, "C")
    # lune et « z z z » de fatigue
    blit(img, [".www.", "wwww.", "www..", "wwww.", ".www."], x + 52, y - 18, 2)
    for i in range(3):
        k = (t * 1.2 + i * 0.6) % 2.4
        if k < 1.8:
            text(img, "Z", x - 4 + i * 6, int(y - 14 - k * 8 - i * 6), "C")


def big_screen(img, x, y, t):
    """Écran d'ordinateur : panorama de gratte-ciels de nuit et une tour
    immense (plus de 600 m), toute vitrée, avec son feu rouge clignotant."""
    w, h = 62, 48
    rect(img, x, y, w, h, "k")
    rect(img, x + 2, y + 2, w - 4, h - 4, (4, 10, 30))
    base = y + h - 3
    k = 0
    for bx in range(x + 3, x + w - 4, 5):  # gratte-ciels
        bh = 8 + (bx * 7 % 13)
        rect(img, bx, base - bh, 4, bh, (14, 34, 78))
        for wy in range(base - bh + 2, base - 1, 3):
            if (bx + wy + k) % 3:
                rect(img, bx + 1, wy, 1, 1, "C" if (bx + wy) % 4 else "W")
        k += 1
    cx = x + w // 2
    top = y + 5
    for yy in range(top + 6, base):  # la tour : fine, élancée, deux plateformes
        half = 1 + (yy - top) // 12
        for xx in range(cx - half, cx + half + 1):
            shine = (xx + yy + int(t * 12)) % 8 == 0
            rect(img, xx, yy, 1, 1, "W" if shine else ("c" if (xx + yy) % 2 else "C"))
    rect(img, cx, top, 1, 6, "C")
    if int(t * 2) % 2 == 0:
        rect(img, cx, top - 1, 1, 1, "r")
    rect(img, cx - 4, top + 15, 9, 2, "W")
    rect(img, cx - 5, top + 24, 11, 2, "W")
    text(img, "600", x + 4, y + 4, "W")
    text(img, "M+", x + 4, y + 13, "W")
    rect(img, x + w // 2 - 4, y + h, 8, 5, "k")
    rect(img, x + w // 2 - 10, y + h + 5, 20, 2, "k")


def bubble(img, x, y, label):
    """Bulle de BD avec un mot en lettres pixel."""
    wpx = text_width(label) + 7
    rect(img, x, y, wpx, 13, "k")
    rect(img, x + 1, y + 1, wpx - 2, 11, "w")
    rect(img, x + 4, y + 13, 4, 2, "k")
    rect(img, x + 5, y + 12, 2, 2, "w")
    text(img, label, x + 4, y + 3, "r")


def static(img, amount=1.0):
    noise = rng.integers(0, 2, (H, W)).astype(bool)
    grey = rng.integers(40, 220, (H, W, 1)).astype(np.uint8)
    img[noise] = (img[noise] * (1 - amount) + grey[noise] * amount).astype(np.uint8)
    for _ in range(4):
        y = int(rng.integers(0, H - 3))
        img[y:y + 2] = np.roll(img[y:y + 2], int(rng.integers(-12, 12)), axis=1)


# ---------------------------------------------------------------------------
# Audio : voix, musique et enveloppe (pour la bouche)
# ---------------------------------------------------------------------------

def decode(path):
    out = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.int16).astype(np.float32) / 32768


def envelope(sig):
    hop = SR // FPS
    n = len(sig) // hop + 1
    env = np.array([np.sqrt(np.mean(sig[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(n)])
    return env / (np.max(env) or 1)


# ---------------------------------------------------------------------------
# Montage
# ---------------------------------------------------------------------------

def main():
    cfg = config()
    subs = cfg["subs"]
    voice = decode(os.path.join(ROOT, cfg["voix"]))
    lead = 0.6
    end_voice = lead + len(voice) / SR
    total = end_voice + 1.8
    n_frames = int(total * FPS)

    # piste son : voix fournie + musique japonaise discrète
    mix = np.zeros(int(total * SR) + SR)
    i = int(lead * SR)
    mix[i:i + len(voice)] += voice
    env = np.zeros(n_frames + FPS)
    e = envelope(voice)
    f0 = int(lead * FPS)
    env[f0:f0 + len(e)] = e[: len(env) - f0]
    music = decode(os.path.join(ROOT, "assets", "audio", "musique-japon.mp3"))
    music = np.tile(music, int(math.ceil(len(mix) / len(music))))[: len(mix)]
    fade = np.ones(len(mix))
    k = int(1.5 * SR)
    fade[:k] = np.linspace(0, 1, k)
    end_i = int((total - 0.4) * SR)
    fade[end_i - k:end_i] = np.linspace(1, 0, k)
    fade[end_i:] = 0
    mix += music * 0.12 * fade
    mix = mix / (np.max(np.abs(mix)) or 1) * 0.9

    tmp = tempfile.mkdtemp()
    wav_path = os.path.join(tmp, "son.wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())

    # début de chaque décor (scènes 2, 3, 4) d'après les sous-titres
    cuts = []
    for n in (2, 3, 4):
        firsts = [x["de"] for x in subs if x.get("scene") == n]
        cuts.append(min(firsts) if firsts else total)
    last = subs[-1]
    matane = last["de"]
    leave = end_voice + 0.1

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W * SCALE}x{H * SCALE}", "-r", str(FPS), "-i", "-",
         "-i", wav_path,
         "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-tune", "animation",
         "-c:a", "aac", "-b:a", "96k", "-af", "loudnorm=I=-16:TP=-1.5:LRA=9",
         "-movflags", "+faststart", "-shortest", OUT],
        stdin=subprocess.PIPE,
    )
    scan = np.ones((H * SCALE, 1, 1), dtype=np.float32)
    scan[3::SCALE] = 0.82
    yy, xx = np.mgrid[0:H * SCALE, 0:W * SCALE]
    vig = 1 - 0.28 * (((xx / (W * SCALE) - 0.5) ** 2 + (yy / (H * SCALE) - 0.5) ** 2) * 2.2)
    shade = (scan * vig[..., None]).astype(np.float32)

    img = np.zeros((H, W, 3), dtype=np.uint8)
    for f in range(n_frames):
        t = f / FPS
        scene = sum(t >= c for c in cuts)
        talk = env[f] if f < len(env) else 0
        mouth = 2 if talk > 0.55 else 1 if talk > 0.18 else 0
        blink = (f % 40) in (0, 1)
        y = 54  # Barnabé (×3) : pieds sur le sol
        room(img, t, desk=scene in (1, 2))
        if scene == 0:
            gg = 2.9 <= t < 7.7  # « GG à vous » : il salue
            blit(img, barnabe(mouth, blink, arm="wave" if gg else "carry", wave=(f // 3) % 2), 2, y, 3)
            blit(img, sack(t), 84, 122, 2)
        elif scene == 1:
            blit(img, barnabe(mouth, blink or (f % 24) < 3, arm="point"), -2, y, 3)
            clock(img, 80, 86, t)
        elif scene == 2:
            # « zoomez sur cette tour » : la caméra s'approche de l'écran
            blit(img, barnabe(mouth, blink, arm="point"), -4, y, 3)
            big_screen(img, 70, 66, t)
        else:
            if t < leave:
                blit(img, barnabe(mouth, blink, arm="wave", wave=(f // 3) % 2), 4, y, 3)
                blit(img, sack(t), 86, 122, 2)
                if t >= matane:
                    bubble(img, 62, 40, "MATANE !")
            else:
                run = (t - leave) * 80
                x = int(4 + run)
                blit(img, barnabe(0, False, legs=(f // 2) % 2, arm="carry"), x, y - (f % 2), 3)
                blit(img, sack(t * 3), x + 70, 122 - (f % 2), 2)
        frame = img
        if scene == 2:
            z = 1 + 0.55 * min(1, (t - cuts[1]) / 3.5)
            cw, ch = int(W / z), int(H / z)
            cx = min(W - cw, max(0, int(101 - cw / 2)))
            cy = min(H - ch, max(0, int(90 - ch / 2)))
            crop = img[cy:cy + ch, cx:cx + cw]
            ys = (np.arange(H) * ch / H).astype(int)
            xs = (np.arange(W) * cw / W).astype(int)
            frame = crop[ys][:, xs].copy()
        hud(frame, t, f)
        if any(abs(t - c) < 0.17 for c in cuts) or t > total - 1.0:
            static(frame, 0.85 if t > total - 1.0 else 0.6)
            if t > total - 1.0:
                rect(frame, 20, 80, 95, 18, "K")
                label = "SIGNAL PERDU"
                text(frame, label, (W - text_width(label)) // 2, 85, "r")
        big = frame.repeat(SCALE, axis=0).repeat(SCALE, axis=1).astype(np.float32) * shade
        ff.stdin.write(np.clip(big, 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    os.remove(wav_path)
    print("✔", os.path.relpath(OUT, ROOT), f"({os.path.getsize(OUT) // 1024} Ko, {total:.1f} s)")
    # Version WebM : lue par les navigateurs sans H.264 (certains Android).
    webm = OUT[:-4] + ".webm"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", OUT, "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0",
         "-row-mt", "1", "-c:a", "libopus", "-b:a", "80k", webm],
        check=True,
    )
    print("✔", os.path.relpath(webm, ROOT), f"({os.path.getsize(webm) // 1024} Ko)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Compose et enregistre les musiques de fond du jeu (instrumentales).

    python3 tools/generer-musique.py

Produit :
  assets/audio/musique-noel-1.mp3  « Douce nuit », boîte à musique et nappe
  assets/audio/musique-noel-2.mp3  « Deck the Halls », boîte à musique, tout doux
  assets/audio/musique-japon.mp3   koto et nappe (mixée dans la vidéo de Barnabé)
  assets/audio/musique-fete.mp3    pop-électro dansante (ancien écran de fin)
  assets/audio/musique-fin.mp3     R&B de Noël festif (écran de fin) : arrangement
                                   original de « Jingle Bells » (domaine public)

Ambiance très discrète : une boîte à musique, une nappe et une basse
douce, sans batterie. Les accords sont écrits mesure par mesure sur la
mélodie (aucune dissonance). Les deux morceaux de Noël s'enchaînent, à très
bas volume (voir config/parametres.js → musique).
Les mélodies sont du domaine public (« Douce nuit », « Deck the Halls »,
« Sakura Sakura ») et l'arrangement est original : tout le son est
synthétisé ici, sans échantillon externe. Les fichiers produits sont donc
libres de droits.
Prérequis : Python 3 avec numpy, et ffmpeg pour l'encodage MP3.
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets", "audio")
rng = np.random.default_rng(1225)

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def freq(name):
    """« A4 », « F#5 »… → fréquence en Hz."""
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + NOTE[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_exp(n, decay):
    t = np.arange(n) / SR
    return np.exp(-t / decay)


def attack(sig, ms=4):
    k = min(len(sig), int(SR * ms / 1000))
    sig[:k] *= np.linspace(0, 1, k)
    return sig


# ---------------------------------------------------------------------------
# Instruments
# ---------------------------------------------------------------------------

def music_box(f, dur=2.6, vel=1.0):
    """Lame de boîte à musique, timbre rond (peu d'harmoniques aiguës)."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for mult, amp, dec in ((1, 1.0, 1.3), (2.0, 0.22, 0.6), (3.0, 0.06, 0.3), (4.2, 0.025, 0.15)):
        sig += amp * np.sin(2 * np.pi * f * mult * t) * env_exp(n, dec)
    return attack(sig * vel, 6)


def soft_bass(f, dur, vel=1.0):
    """Basse ronde (sinus) qui s'éteint doucement."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(4 * np.pi * f * t)
    e = env_exp(n, dur * 0.6)
    r = min(n, int(SR * 0.08))
    e[-r:] *= np.linspace(1, 0, r)
    return attack(sig * e * vel, 15)


def bell(f, dur=2.6, vel=1.0):
    """Clochette (glockenspiel)."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for mult, amp, dec in ((1, 1.0, 0.9), (2.76, 0.45, 0.4), (5.4, 0.25, 0.18), (8.93, 0.12, 0.08)):
        sig += amp * np.sin(2 * np.pi * f * mult * t) * env_exp(n, dec)
    return attack(sig * vel, 1)


def pad(freqs, dur, vel=1.0):
    """Nappe douce (accord tenu) : sinus et triangle désaccordés, filtrés."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * f * (1 + det / 100) * t
            sig += np.sin(ph) * 0.6 + 0.15 * np.sin(3 * ph) / 3
    a = int(SR * min(0.6, dur / 3))
    r = int(SR * min(0.9, dur / 2))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] = np.linspace(1, 0, r)
    return sig * e * vel / max(1, len(freqs))


def koto(f, dur=2.5, vel=1.0):
    """Corde pincée (Karplus-Strong) : timbre proche du koto."""
    n = int(SR * dur)
    period = int(SR / f)
    # excitation adoucie (bruit filtré) : son rond plutôt que métallique
    buf = rng.uniform(-1, 1, period)
    for _ in range(3):
        buf = np.convolve(buf, [0.25, 0.5, 0.25], mode="same")
    buf /= np.max(np.abs(buf)) or 1
    # attaque plus brillante, puis amortissement progressif
    out = np.zeros(n)
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = 0.4962 * (buf[idx] + buf[nxt])
        idx = nxt
    # léger « bend » caractéristique : on module à peine l'amplitude
    t = np.arange(n) / SR
    out *= 1 + 0.04 * np.sin(2 * np.pi * 5 * t) * env_exp(n, 0.4)
    out = lowpass(out, 3200)
    return attack(out * vel, 1)


def lowpass(sig, cutoff):
    """Filtre passe-bas du premier ordre."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    out = np.empty_like(sig)
    y = 0.0
    for i, x in enumerate(sig):
        y = (1 - a) * x + a * y
        out[i] = y
    return out


def reverb(sig, seconds=2.4, mix=0.32):
    """Réverbération par convolution avec une réponse de bruit décroissant."""
    n = int(SR * seconds)
    ir = rng.standard_normal(n) * env_exp(n, seconds / 5)
    ir[: int(SR * 0.012)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(sig) + n)))
    wet = np.fft.irfft(np.fft.rfft(sig, size) * np.fft.rfft(ir, size), size)[: len(sig)]
    return sig * (1 - mix) + wet * mix * 0.9


# ---------------------------------------------------------------------------
# Séquenceur
# ---------------------------------------------------------------------------

class Track:
    def __init__(self, seconds):
        self.buf = np.zeros(int(SR * seconds) + SR * 4)

    def add(self, at, sig, gain=1.0):
        i = int(at * SR)
        j = min(len(self.buf), i + len(sig))
        self.buf[i:j] += sig[: j - i] * gain


def melody(track, notes, start, beat, inst, gain, octave_shift=0):
    """notes : liste de (note, durée en temps) ; None = silence."""
    t = start
    for name, length in notes:
        if name:
            f = freq(name) * (2 ** octave_shift)
            track.add(t, inst(f, vel=1.0), gain)
        t += length * beat
    return t



# ---------------------------------------------------------------------------
# Mélodies (domaine public) et accords, mesure par mesure
# Une note = (nom, durée en noires). Une mesure d'accords = liste de
# (accord, durée en noires) dont le total fait la longueur de la mesure.
# ---------------------------------------------------------------------------

VOICING = {  # accords serrés dans le médium, sans frottement
    "C": ["C3", "E3", "G3"], "G": ["B2", "D3", "G3"], "G7": ["B2", "D3", "F3", "G3"],
    "F": ["C3", "F3", "A3"], "Am": ["C3", "E3", "A3"], "Em": ["B2", "E3", "G3"],
    "D": ["D3", "F#3", "A3"], "Dm": ["D3", "F3", "A3"],
}
BASS = {"C": "C2", "G": "G2", "G7": "G2", "F": "F2", "Am": "A2", "Em": "E2", "D": "D2", "Dm": "D2"}

SILENT = [  # « Douce nuit » (Gruber, 1818), 6/8 : une mesure = 3 noires
    ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("D5", 2), ("D5", 1), ("B4", 3),
    ("C5", 2), ("C5", 1), ("G4", 3),
    ("A4", 2), ("A4", 1), ("C5", 1.5), ("B4", 0.5), ("A4", 1),
    ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("A4", 2), ("A4", 1), ("C5", 1.5), ("B4", 0.5), ("A4", 1),
    ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("D5", 2), ("D5", 1), ("F5", 1.5), ("D5", 0.5), ("B4", 1),
    ("C5", 3), ("E5", 3),
    ("C5", 1.5), ("G4", 0.5), ("E4", 1), ("G4", 1.5), ("F4", 0.5), ("D4", 1),
    ("C4", 6),
]
SILENT_BARS = [[(c, 3)] for c in
               "C C C C G G C C F F C C F F C C G G7 C C C G7 C C".split()]

DECK = [  # « Deck the Halls » (air gallois traditionnel), 4/4
    ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("C4", 1),
    ("D4", 0.5), ("E4", 0.5), ("F4", 0.5), ("D4", 0.5), ("E4", 1.5), ("D4", 0.5), ("C4", 1), ("B3", 1), ("C4", 2),
    ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("C4", 1),
    ("D4", 0.5), ("E4", 0.5), ("F4", 0.5), ("D4", 0.5), ("E4", 1.5), ("D4", 0.5), ("C4", 1), ("B3", 1), ("C4", 2),
    ("D4", 1.5), ("E4", 0.5), ("F4", 1), ("D4", 1), ("E4", 1.5), ("F4", 0.5), ("G4", 1), ("D4", 1),
    ("E4", 0.5), ("F#4", 0.5), ("G4", 1), ("A4", 0.5), ("B4", 0.5), ("C5", 1), ("B4", 1), ("A4", 1), ("G4", 2),
    ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("C4", 1),
    ("A4", 0.5), ("A4", 0.5), ("A4", 0.5), ("A4", 0.5), ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 2),
]
_A = [[("C", 3), ("G", 1)], [("C", 1), ("G", 1), ("C", 2)], [("G7", 2), ("C", 2)], [("C", 1), ("G", 1), ("C", 2)]]
DECK_BARS = _A + _A + [
    [("G", 2), ("G7", 2)], [("C", 2), ("G", 2)], [("Em", 2), ("Am", 2)], [("G", 1), ("D", 1), ("G", 2)],
    [("C", 3), ("G", 1)], [("C", 1), ("G", 1), ("C", 2)], [("F", 2), ("C", 2)], [("C", 1), ("G", 1), ("C", 2)],
]


def accompany(tr, bars, start, beat, arpeggio=True):
    """Nappe, basse et (si demandé) arpège léger de boîte à musique."""
    t = start
    for bar in bars:
        for name, beats in bar:
            notes = VOICING[name]
            tr.add(t, pad([freq(n) for n in notes], beats * beat + 0.5), 0.16)
            tr.add(t, soft_bass(freq(BASS[name]), beats * beat + 0.2), 0.10)
            if arpeggio:
                for i in range(int(beats)):
                    tone = notes[(i + 1) % len(notes)]
                    f = freq(tone) * 4  # deux octaves plus haut
                    tr.add(t + i * beat + beat / 2, music_box(f, 1.6), 0.05)
            t += beats * beat
    return t


def gentle(notes, bars, beat, name, passes=2):
    """Assemble un morceau doux : mélodie à l'octave supérieure, accords."""
    total = length(notes) * beat
    tr = Track(total * passes + 8)
    t = 1.0
    for p in range(passes):
        accompany(tr, bars, t, beat, arpeggio=p > 0)
        end = melody(tr, notes, t, beat, music_box, 0.34, octave_shift=1)
        t = end + beat
    sig = tr.buf[: int(SR * (t + 2.5))]
    sig = reverb(sig, 2.8, 0.34)
    sig = lowpass_fast(sig, 5200)
    sig = normalize(crossfade_loop(sig, 2.0), 0.5)
    save_mp3(stereo(sig), name, kbps=96)


def noel1():
    gentle(SILENT, SILENT_BARS, 0.62, "musique-noel-1.mp3")


def noel2():
    gentle(DECK, DECK_BARS, 0.58, "musique-noel-2.mp3")


SAKURA = [  # gamme miyako-bushi
    ("A4", 1), ("A4", 1), ("B4", 2), ("A4", 1), ("A4", 1), ("B4", 2),
    ("A4", 1), ("B4", 1), ("C5", 1), ("B4", 1), ("A4", 1), ("B4", 0.5), ("A4", 0.5), ("F4", 2),
    ("E4", 1), ("C4", 1), ("E4", 1), ("F4", 1), ("E4", 1), ("E4", 0.5), ("C4", 0.5), ("B3", 2),
    ("A4", 1), ("B4", 1), ("C5", 1), ("B4", 1), ("A4", 1), ("B4", 0.5), ("A4", 0.5), ("F4", 2),
    ("E4", 1), ("C4", 1), ("E4", 1), ("F4", 1), ("E4", 1), ("E4", 0.5), ("C4", 0.5), ("B3", 2),
    ("A4", 1), ("A4", 1), ("B4", 2), ("A4", 1), ("A4", 1), ("B4", 2),
    ("E4", 1), ("F4", 1), ("B4", 0.5), ("A4", 0.5), ("F4", 1), ("E4", 4),
]


def length(notes):
    return sum(d for _, d in notes)


def normalize(sig, peak=0.5):
    m = np.max(np.abs(sig)) or 1
    return sig / m * peak


def crossfade_loop(sig, fade=1.5):
    """Boucle sans à-coup : la fin se fond dans le début."""
    n = int(SR * fade)
    head, tail = sig[:n].copy(), sig[-n:].copy()
    w = np.linspace(0, 1, n)
    sig = sig[: -n]
    sig[:n] = head * w + tail * (1 - w)
    return sig


def stereo(sig, width=0.0025):
    d = int(SR * width)
    left = sig
    right = np.concatenate([np.zeros(d), sig[:-d]])
    return np.stack([left, right], axis=1)


def save_mp3(stereo_sig, name, kbps=112):
    os.makedirs(OUT, exist_ok=True)
    pcm = (np.clip(stereo_sig, -1, 1) * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    out = os.path.join(OUT, name)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", out],
        check=True,
    )
    os.remove(path)
    print("✔", os.path.relpath(out, ROOT), f"({os.path.getsize(out) // 1024} Ko)")


def lowpass_fast(sig, cutoff):
    """Passe-bas dans le domaine fréquentiel (pente douce)."""
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(sig))


def japon():
    beat = 60 / 76
    total = length(SAKURA) * beat + 4
    tr = Track(total * 2 + 6)
    t = 1.0
    for rep in range(2):
        drone = pad([freq("A2"), freq("E3")], length(SAKURA) * beat + 1, 1.0)
        tr.add(t, drone, 0.18)
        end = melody(tr, SAKURA, t, beat, koto, 0.5)
        # accompagnement : quintes pincées sur chaque mesure de 4 temps
        for i in range(0, int(length(SAKURA)), 4):
            tr.add(t + i * beat, koto(freq("A3"), vel=0.6), 0.22)
            tr.add(t + (i + 2) * beat, koto(freq("E3"), vel=0.6), 0.18)
        if rep == 1:
            tr.add(t + 8 * beat, bell(freq("E6"), vel=0.4), 0.05)
        t = end + 1.0
    sig = tr.buf[: int(SR * (t + 2))]
    sig = reverb(sig, 3.2, 0.34)
    sig = normalize(crossfade_loop(sig, 2.0), 0.55)
    save_mp3(stereo(sig), "musique-japon.mp3")


# ---------------------------------------------------------------------------
# Écran de fin : morceau pop-électro dansant (composition originale)
# Suite d'accords la plus courante de la pop actuelle (Am – F – C – G),
# 4 temps au sol, claps, charleston, basse 808 et gimmick de synthé.
# ---------------------------------------------------------------------------

def kick(vel=1.0):
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 30)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return attack(sig * vel, 1)


def clap(vel=1.0):
    n = int(SR * 0.22)
    noise = rng.standard_normal(n)
    noise = np.concatenate([[0], np.diff(noise)])
    e = np.zeros(n)
    for d in (0, 0.012, 0.024):
        i = int(d * SR)
        e[i:] += np.exp(-np.arange(n - i) / SR * 38)
    return noise * e * 0.35 * vel


def hat(vel=1.0, open_=False):
    n = int(SR * (0.18 if open_ else 0.05))
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * np.exp(-np.arange(n) / SR * (14 if open_ else 70)) * 0.18 * vel


def sub808(f, dur, vel=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.tanh(np.sin(2 * np.pi * f * t) * 1.6) * np.exp(-t * 1.6)
    r = min(n, int(SR * 0.03))
    sig[-r:] *= np.linspace(1, 0, r)
    return attack(sig * vel, 3)


def pluck(f, dur=0.35, vel=1.0):
    """Gimmick de synthé : deux dents de scie désaccordées, filtre qui se ferme."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    saw = lambda fr: 2 * ((fr * t) % 1) - 1
    sig = (saw(f * 1.003) + saw(f * 0.997)) * 0.5 + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    sig = lowpass_fast(sig * np.exp(-t * 7), 3200)
    return attack(sig * vel, 2)


def chord_stab(freqs, dur, vel=1.0):
    return pad(freqs, dur, vel) * 1.4


FETE_CHORDS = [("Am", ["A3", "C4", "E4"], "A1"), ("F", ["A3", "C4", "F4"], "F1"),
               ("C", ["G3", "C4", "E4"], "C2"), ("G", ["G3", "B3", "D4"], "G1")]
FETE_HOOK = [  # une mesure par accord, en temps
    [("A4", 0.5), (None, 0.5), ("C5", 0.5), ("E5", 0.5), ("D5", 0.5), ("C5", 0.5), ("A4", 1)],
    [("F4", 0.5), (None, 0.5), ("A4", 0.5), ("C5", 0.5), ("A4", 0.5), ("C5", 0.5), ("F5", 1)],
    [("G4", 0.5), (None, 0.5), ("C5", 0.5), ("E5", 0.5), ("G5", 0.5), ("E5", 0.5), ("C5", 1)],
    [("B4", 0.5), (None, 0.5), ("D5", 0.5), ("G5", 0.5), ("D5", 0.5), ("B4", 0.5), ("G4", 1)],
]


def fete():
    beat = 60 / 124
    bar = beat * 4
    # intro (4) · refrain (8) · pause (4) · refrain (8)
    plan = ["intro"] * 4 + ["hook"] * 8 + ["break"] * 4 + ["hook"] * 8
    tr = Track(len(plan) * bar + 4)
    for b, part in enumerate(plan):
        t0 = 0.2 + b * bar
        name, notes, root = FETE_CHORDS[b % 4]
        tr.add(t0, chord_stab([freq(n) for n in notes], bar), 0.10 if part != "break" else 0.16)
        if part != "break":
            for k in range(4):
                tr.add(t0 + k * beat, kick(), 0.9)
                tr.add(t0 + k * beat + beat / 2, hat(open_=k % 2 == 1), 0.8)
                tr.add(t0 + k * beat + beat / 4, hat(), 0.4)
                tr.add(t0 + k * beat + 3 * beat / 4, hat(), 0.4)
            tr.add(t0 + beat, clap(), 0.9)
            tr.add(t0 + 3 * beat, clap(), 0.9)
            for k, off in enumerate((0, 1.5, 2.5)):  # basse syncopée
                tr.add(t0 + off * beat, sub808(freq(root), beat * (1.4 if k == 0 else 0.9)), 0.55)
        if part == "hook" or (part == "break" and b % 2 == 1):
            t = t0
            for n, d in FETE_HOOK[b % 4]:
                if n:
                    tr.add(t, pluck(freq(n), min(0.4, d * beat + 0.08)), 0.22 if part == "hook" else 0.12)
                t += d * beat
    sig = tr.buf[: int(SR * (len(plan) * bar + 0.4))]
    sig = reverb(sig, 1.2, 0.12)
    sig = normalize(crossfade_loop(sig, 0.15), 0.6)
    save_mp3(stereo(sig), "musique-fete.mp3", kbps=112)
    # Volume harmonisé (morceau festif : bien présent, sans saturer).
    out = os.path.join(OUT, "musique-fete.mp3")
    tmp = out + ".tmp.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-af", "loudnorm=I=-16:TP=-1.5:LRA=8",
                    "-codec:a", "libmp3lame", "-b:a", "128k", tmp], check=True)
    os.replace(tmp, out)


# ---------------------------------------------------------------------------
# Écran de fin : pop rétro de Noël, cuivrée et entraînante (composition
# originale, dans l'esprit des grands classiques des années 60 : cuivres,
# grelots de traîneau, sabots de cheval en woodblock, coup de fouet).
# ---------------------------------------------------------------------------

def brass(f, dur, vel=1.0):
    """Section de cuivres : dents de scie désaccordées, attaque franche."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) * 5, 0, 1)
    saw = lambda fr: 2 * ((np.cumsum(fr * vib) / SR) % 1) - 1
    sig = saw(f * 0.996) + saw(f) + saw(f * 1.004)
    env = np.minimum(1, t / 0.025) * (0.75 + 0.25 * np.exp(-t * 9))
    r = min(n, int(SR * 0.06))
    env[-r:] *= np.linspace(1, 0, r)
    return lowpass_fast(sig * env / 3, 2600) * vel


def sleigh_bells(vel=1.0):
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    metal = sum(np.sin(2 * np.pi * fr * t) for fr in (5200, 6900, 8300, 9700)) / 4
    noise = np.diff(rng.standard_normal(n + 1))
    return (metal * 0.7 + noise * 0.3) * np.exp(-t * 38) * 0.22 * vel


def woodblock(f, vel=1.0):
    n = int(SR * 0.08)
    t = np.arange(n) / SR
    sig = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.7 * t)) * np.exp(-t * 60)
    return attack(sig * 0.5 * vel, 1)


def whip(vel=1.0):
    n = int(SR * 0.25)
    t = np.arange(n) / SR
    noise = np.diff(np.diff(rng.standard_normal(n + 2)))
    return noise * np.exp(-t * 22) * np.minimum(1, t / 0.004) * 0.25 * vel


def walking_bass(f, dur, vel=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    return attack(sig * np.exp(-t * 3.5) * vel, 4)


FIN_CHORDS = [  # (voicing, basse)
    (["C4", "E4", "G4"], ["C2", "G2"]), (["A3", "C4", "E4"], ["A1", "E2"]),
    (["D4", "F4", "A4"], ["D2", "A2"]), (["G3", "B3", "F4"], ["G1", "D2"]),
    (["C4", "E4", "G4"], ["C2", "G2"]), (["A3", "C#4", "G4"], ["A1", "E2"]),
    (["D4", "F4", "A4"], ["D2", "G1"]), (["C4", "E4", "G4"], ["C2", "G2"]),
]
FIN_MELODY = [
    [("E5", 1), ("G5", 0.5), ("E5", 0.5), ("C5", 1), ("D5", 0.5), ("E5", 0.5)],
    [("A5", 1), ("G5", 0.5), ("E5", 0.5), ("C5", 2)],
    [("D5", 0.5), ("E5", 0.5), ("F5", 1), ("A5", 1), ("F5", 1)],
    [("G5", 1.5), ("F5", 0.5), ("E5", 0.5), ("D5", 0.5), ("B4", 1)],
    [("E5", 1), ("G5", 0.5), ("E5", 0.5), ("C6", 1), ("B5", 0.5), ("A5", 0.5)],
    [("G5", 1), ("E5", 0.5), ("C#5", 0.5), ("A4", 2)],
    [("F5", 1), ("A5", 1), ("G5", 0.5), ("F5", 0.5), ("D5", 1)],
    [("C5", 1), ("E5", 0.5), ("G5", 0.5), ("C6", 2)],
]


def traineau():
    beat = 60 / 152
    bar = beat * 4
    plan = ["intro"] * 2 + ["a"] * 8 + ["b"] * 8
    tr = Track(len(plan) * bar + 4)
    for b, part in enumerate(plan):
        t0 = 0.15 + b * bar
        voicing, bass = FIN_CHORDS[(b - 2) % 8] if part != "intro" else FIN_CHORDS[0 if b == 0 else 3]
        # Grelots et sabots (croches), coup de fouet en début de phrase.
        for k in range(8):
            tr.add(t0 + k * beat / 2, sleigh_bells(1.0 if k % 2 == 0 else 0.6), 0.9)
            tr.add(t0 + k * beat / 2, woodblock(820 if k % 2 == 0 else 1040, 0.8 if k % 2 == 0 else 0.55), 0.55)
        if part != "intro" and (b - 2) % 8 == 0:
            tr.add(t0 - 0.05, whip(), 0.9)
        if part == "intro":
            if b == 1:
                tr.add(t0 + 3 * beat, whip(), 1.0)
            continue
        # Batterie légère, basse qui marche, cuivres « pah » sur 2 et 4.
        for k in range(4):
            tr.add(t0 + k * beat, kick(0.7), 0.55 if k % 2 == 0 else 0.0)
            if k % 2 == 1:
                tr.add(t0 + k * beat, clap(0.8), 0.6)
            tr.add(t0 + k * beat, walking_bass(freq(bass[k % 2]), beat * 0.9), 0.32)
            if k % 2 == 1:
                tr.add(t0 + k * beat, sum(brass(freq(n), beat * 0.35) for n in voicing), 0.12)
        # Mélodie aux trompettes (et glockenspiel en reprise).
        t = t0
        for n, d in FIN_MELODY[(b - 2) % 8]:
            if part == "b":
                tr.add(t, brass(freq(n), d * beat * 0.92), 0.2)
                tr.add(t, bell(freq(n) * 2, 1.2, 0.8), 0.07)
            else:
                tr.add(t, brass(freq(n), d * beat * 0.92), 0.17)
            t += d * beat
    sig = tr.buf[: int(SR * (len(plan) * bar + 0.3))]
    sig = reverb(sig, 1.4, 0.16)
    sig = normalize(crossfade_loop(sig, 0.2), 0.6)
    save_mp3(stereo(sig), "musique-fin.mp3", kbps=128)
    out = os.path.join(OUT, "musique-fin.mp3")
    tmp = out + ".tmp.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-af", "loudnorm=I=-15:TP=-1.5:LRA=8",
                    "-codec:a", "libmp3lame", "-b:a", "128k", tmp], check=True)
    os.replace(tmp, out)


# ---------------------------------------------------------------------------
# Écran de fin : R&B de Noël festif (arrangement original de « Jingle Bells »,
# domaine public) : groove chaloupé à 92 BPM, piano électrique, basse ronde,
# claps, charleston en doubles croches, grelots, accords R&B (maj9, m9, 13).
# ---------------------------------------------------------------------------

def rhodes(f, dur, vel=1.0):
    """Piano électrique : fondamentale, harmonique douce, « tine » brillante,
    léger trémolo."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
    tine = 0.22 * np.sin(2 * np.pi * 14.0 * f * t) * np.exp(-t * 26)
    trem = 1 - 0.16 * (0.5 + 0.5 * np.sin(2 * np.pi * 4.6 * t))
    sig = (body + tine) * np.exp(-t * 1.25) * trem
    r = min(n, int(SR * 0.05))
    sig[-r:] *= np.linspace(1, 0, r)
    return attack(sig * vel, 3)


def rnb_bass(f, dur, vel=1.0):
    """Basse ronde (sinus saturé doucement), petite glissade d'attaque."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    fr = f * (1 + 0.06 * np.exp(-t * 30))
    sig = np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(fr) / SR)) * np.exp(-t * 0.9)
    r = min(n, int(SR * 0.04))
    sig[-r:] *= np.linspace(1, 0, r)
    return attack(sig * vel, 6)


def lead(f, dur, vel=1.0):
    """Voix lead façon synthé soul : sinus + un peu de dent de scie filtrée,
    vibrato qui arrive doucement."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) * 4, 0, 1)
    ph = np.cumsum(f * vib) / SR
    sig = np.sin(2 * np.pi * ph) + 0.18 * (2 * (ph % 1) - 1)
    sig = lowpass_fast(sig, 2600)
    env = np.minimum(1, t / 0.03) * np.exp(-t * 0.6)
    r = min(n, int(SR * 0.06))
    env[-r:] *= np.linspace(1, 0, r)
    return sig * env * vel


def snare(vel=1.0):
    n = int(SR * 0.25)
    t = np.arange(n) / SR
    noise = np.diff(rng.standard_normal(n + 1))
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (noise * np.exp(-t * 22) * 0.4 + body * 0.5) * vel


RNB_CH = {
    "Cmaj9": (["E3", "G3", "B3", "D4"], "C2"), "Am9": (["C3", "E3", "G3", "B3"], "A1"),
    "Fmaj9": (["A3", "C4", "E4", "G4"], "F1"), "G13": (["F3", "A3", "B3", "E4"], "G1"),
    "Dm9": (["F3", "A3", "C4", "E4"], "D2"), "Em7": (["G3", "B3", "D4"], "E2"),
}
# Refrain de « Jingle Bells » (domaine public), une mesure par ligne.
JB_A = [
    ("Cmaj9", [("E5", 1), ("E5", 1), ("E5", 2)]),
    ("Am9", [("E5", 1), ("E5", 1), ("E5", 2)]),
    ("Fmaj9", [("E5", 1), ("G5", 1), ("C5", 1.5), ("D5", 0.5)]),
    ("G13", [("E5", 4)]),
    ("Fmaj9", [("F5", 1), ("F5", 1), ("F5", 1.5), ("F5", 0.5)]),
    ("Dm9", [("F5", 1), ("E5", 1), ("E5", 1), ("E5", 0.5), ("E5", 0.5)]),
    ("G13", [("E5", 1), ("D5", 1), ("D5", 1), ("E5", 1)]),
    ("G13", [("D5", 2), ("G5", 2)]),
]
JB_B = JB_A[:6] + [
    ("G13", [("G5", 1), ("G5", 1), ("F5", 1), ("D5", 1)]),
    ("Cmaj9", [("C5", 4)]),
]


def rnb():
    beat = 60 / 92
    bar = beat * 4
    swing = 0.12  # décalage des doubles croches paires (groove chaloupé)
    plan = ([("intro", ch) for ch in ["Cmaj9", "Am9", "Fmaj9", "G13"]] +
            [("A", m) for m in JB_A] + [("B", m) for m in JB_B] +
            [("break", ch) for ch in ["Fmaj9", "Em7", "Dm9", "G13"]] +
            [("A", m) for m in JB_A] + [("B", m) for m in JB_B] +
            [("outro", ch) for ch in ["Cmaj9", "Am9", "Fmaj9", "G13"]])
    tr = Track(len(plan) * bar + 4)
    for b, (part, item) in enumerate(plan):
        t0 = 0.15 + b * bar
        ch, mel = (item, None) if isinstance(item, str) else item
        notes, root = RNB_CH[ch]
        fs = [freq(x) for x in notes]
        # Piano électrique : accords sur le 1 et en anticipation sur le « et » du 2.
        for off, d, g in ((0, 1.6, 0.11), (1.5 + swing / 2, 1.2, 0.08), (3, 1.0, 0.07)):
            for f in fs:
                tr.add(t0 + off * beat, rhodes(f, d * beat), g)
        full = part in ("A", "B")
        # Basse : 1, « et » du 2, 3 et anticipation.
        if part != "intro":
            for off, d in ((0, 1.2), (1.75, 0.7), (2.5, 0.9), (3.5, 0.45)):
                tr.add(t0 + off * beat, rnb_bass(freq(root), d * beat), 0.42)
        # Batterie.
        if part != "intro" or b >= 2:
            half = part == "break"
            for k, off in enumerate((0, 1.75, 2.5) if not half else (0, 2.5)):
                tr.add(t0 + off * beat, kick(), 0.85)
            for off in ((1, 3) if not half else (2,)):
                tr.add(t0 + off * beat, snare(), 0.55)
                tr.add(t0 + off * beat + 0.012, clap(), 0.7)
            for k in range(16):
                o = k * beat / 4 + (swing * beat / 4 if k % 2 else 0)
                v = 0.34 if k % 4 == 0 else 0.2 if k % 2 == 0 else 0.13
                tr.add(t0 + o, hat(), v)
            if b % 4 == 3 and not half:  # petit roulement de charleston en triolets
                for k in range(6):
                    tr.add(t0 + 3 * beat + k * beat / 6, hat(), 0.28)
        # Grelots de Noël en croches, plus présents sur les refrains.
        if part != "intro":
            for k in range(8):
                tr.add(t0 + k * beat / 2 + (swing * beat / 2 if k % 2 else 0), sleigh_bells(), 0.28 if full else 0.16)
        # Mélodie.
        if mel:
            t = t0
            for n, d in mel:
                tr.add(t, lead(freq(n) / 2, d * beat * 0.95), 0.26 if part in ("A", "B") else 0.14)
                t += d * beat
    sig = tr.buf[: int(SR * (len(plan) * bar + 0.3))]
    sig = reverb(sig, 1.6, 0.16)
    sig = normalize(crossfade_loop(sig, 0.3), 0.6)
    save_mp3(stereo(sig), "musique-fin.mp3", kbps=128)
    out = os.path.join(OUT, "musique-fin.mp3")
    tmp = out + ".tmp.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-af", "loudnorm=I=-15:TP=-1.5:LRA=8",
                    "-codec:a", "libmp3lame", "-b:a", "128k", tmp], check=True)
    os.replace(tmp, out)


if __name__ == "__main__":
    import sys
    only = sys.argv[1:]
    # traineau (ancien écran de fin) n'est plus lancé par défaut : rnb le remplace.
    for fn in (noel1, noel2, japon, fete, rnb):
        if not only or fn.__name__ in only:
            fn()

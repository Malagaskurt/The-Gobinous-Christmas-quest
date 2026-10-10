#!/usr/bin/env python3
"""Compose et enregistre les musiques de fond du jeu (instrumentales).

    python3 tools/generer-musique.py

Produit :
  assets/audio/musique-noel-1.mp3  « Jingle Bells », version rythmée (batterie,
                                   basse, cuivres, grelots)
  assets/audio/musique-noel-2.mp3  « Deck the Halls » / « We Wish You a Merry
                                   Christmas », version swing
  assets/audio/musique-japon.mp3   koto et nappe, sous la vidéo de Barnabé

Les deux musiques de Noël s'enchaînent pendant tout le parcours.
Les mélodies sont du domaine public (« Jingle Bells », « Deck the Halls »,
« We Wish You a Merry Christmas », « Sakura Sakura ») et l'arrangement est
original : tout le son est synthétisé ici, sans échantillon externe. Les
fichiers produits sont donc libres de droits.
Prérequis : Python 3 avec numpy, et ffmpeg pour l'encodage MP3.
Pour utiliser une autre musique (Suno, banque sonore…), remplacez
simplement les fichiers MP3.
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

def music_box(f, dur=2.2, vel=1.0):
    """Lame de boîte à musique : partiels légèrement inharmoniques."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for mult, amp, dec in ((1, 1.0, 1.1), (2.0, 0.35, 0.5), (3.01, 0.12, 0.25), (5.43, 0.08, 0.12), (8.2, 0.04, 0.06)):
        sig += amp * np.sin(2 * np.pi * f * mult * t) * env_exp(n, dec)
    return attack(sig * vel, 2)


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


def sleigh(dur=0.25, vel=1.0):
    """Grelots : bruit filtré très court."""
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    # passe-haut simple
    hp = np.concatenate([[0], np.diff(noise)])
    shimmer = np.sin(2 * np.pi * 7200 * np.arange(n) / SR) * 0.3
    return (hp * 0.5 + shimmer * noise * 0.4) * env_exp(n, 0.05) * vel


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


def chords(track, prog, start, beat, beats_per_chord, gain):
    t = start
    for ch in prog:
        track.add(t, pad([freq(n) for n in ch], beats_per_chord * beat + 0.4), gain)
        t += beats_per_chord * beat
    return t


# Mélodies (domaine public)
JINGLE = [
    ("E5", 1), ("E5", 1), ("E5", 2), ("E5", 1), ("E5", 1), ("E5", 2),
    ("E5", 1), ("G5", 1), ("C5", 1.5), ("D5", 0.5), ("E5", 4),
    ("F5", 1), ("F5", 1), ("F5", 1.5), ("F5", 0.5), ("F5", 1), ("E5", 1), ("E5", 1), ("E5", 0.5), ("E5", 0.5),
    ("E5", 1), ("D5", 1), ("D5", 1), ("E5", 1), ("D5", 2), ("G5", 2),
    ("E5", 1), ("E5", 1), ("E5", 2), ("E5", 1), ("E5", 1), ("E5", 2),
    ("E5", 1), ("G5", 1), ("C5", 1.5), ("D5", 0.5), ("E5", 4),
    ("F5", 1), ("F5", 1), ("F5", 1.5), ("F5", 0.5), ("F5", 1), ("E5", 1), ("E5", 1), ("E5", 0.5), ("E5", 0.5),
    ("G5", 1), ("G5", 1), ("F5", 1), ("D5", 1), ("C5", 4),
]
JINGLE_CHORDS = [  # un accord toutes les 4 temps
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"],
    ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["D3", "F#3", "A3"], ["G2", "B2", "D3"],
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"],
    ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["G2", "B2", "D3"], ["C3", "E3", "G3"],
]

WISH = [  # 3/4, en sol
    ("D4", 1),
    ("G4", 1), ("G4", 0.5), ("A4", 0.5), ("G4", 0.5), ("F#4", 0.5),
    ("E4", 1), ("E4", 1), ("E4", 1),
    ("A4", 1), ("A4", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5),
    ("F#4", 1), ("D4", 1), ("D4", 1),
    ("B4", 1), ("B4", 0.5), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5),
    ("G4", 1), ("E4", 1), ("D4", 0.5), ("D4", 0.5),
    ("E4", 1), ("A4", 1), ("F#4", 1),
    ("G4", 3),
]
WISH_CHORDS = [  # un accord par mesure de 3 temps (après la levée)
    ["G2", "B2", "D3"], ["C3", "E3", "G3"], ["A2", "C#3", "E3"], ["D3", "F#3", "A3"],
    ["B2", "D#3", "F#3"], ["E3", "G3", "B3"], ["C3", "E3", "G3"], ["G2", "B2", "D3"],
]

SILENT = [  # « Douce nuit », couplet, en 6/8 lent
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
    ("C5", 1), ("G4", 1), ("E4", 1), ("G4", 1.5), ("F4", 0.5), ("D4", 1),
    ("C4", 6),
]
SILENT_CHORDS = [  # un accord toutes les 6 croches
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["G2", "B2", "D3"], ["C3", "E3", "G3"],
    ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["F3", "A3", "C4"], ["C3", "E3", "G3"],
    ["G2", "B2", "D3"], ["C3", "E3", "G3"], ["G2", "B2", "D3"], ["C3", "E3", "G3"],
]

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


# ---------------------------------------------------------------------------
# Instruments rythmés (versions dynamiques)
# ---------------------------------------------------------------------------

def kick(vel=1.0):
    n = int(SR * 0.32)
    t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_exp(n, 0.11) * vel


def snare(vel=1.0):
    n = int(SR * 0.22)
    noise = rng.standard_normal(n)
    noise = np.concatenate([[0], np.diff(noise)]) * 0.6
    tone = np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env_exp(n, 0.05)
    return (noise * env_exp(n, 0.07) + tone * 0.6) * vel


def hat(vel=1.0, open_=False):
    n = int(SR * (0.22 if open_ else 0.045))
    noise = rng.standard_normal(n)
    hp = np.concatenate([[0], np.diff(np.concatenate([[0], np.diff(noise)]))])
    return hp * env_exp(n, 0.08 if open_ else 0.012) * vel * 0.35


def brass(f, dur, vel=1.0):
    """Cuivres synthétiques : dents de scie filtrées, attaque douce."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) * 4, 0, 1)
    for h in range(1, 9):
        amp = (1 / h) * np.exp(-h * 0.28)
        sig += amp * np.sin(2 * np.pi * f * h * t * vib)
    a = min(n, int(SR * 0.03))
    r = min(n, int(SR * 0.06))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return sig * e * vel


def pluck_bass(f, dur, vel=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    e = env_exp(n, 0.22)
    r = min(n, int(SR * 0.02))
    e[-r:] *= np.linspace(1, 0, r)
    return attack(sig * e * vel, 3)


def stab(freqs, dur=0.28, vel=1.0):
    """Accord « piano » bref, joué à contretemps."""
    n = int(SR * (dur + 0.4))
    out = np.zeros(n)
    for f in freqs:
        out += music_box(f, dur + 0.4, vel)[:n] * 0.6
        b = brass(f, dur, vel) * 0.25
        out[: len(b)] += b
    return out / max(1, len(freqs))


def root_of(ch):
    return ch[0][:-1] + "2" if ch[0][-1] in "34" else ch[0]


def band(tr, start, beat, bars, chords_per_bar, swing=0.0, fill_every=8):
    """Batterie, basse, contretemps et grelots sur une grille de 4 temps."""
    t = start
    for b in range(bars):
        ch = chords_per_bar[b % len(chords_per_bar)]
        r = freq(root_of(ch))
        fifth = r * 1.5
        for k in range(4):
            on = t + k * beat
            off = on + beat * (0.5 + swing)
            if k in (0, 2):
                tr.add(on, kick(), 0.55)
            if k in (1, 3):
                tr.add(on, snare(), 0.32)
            tr.add(on, hat(), 0.22)
            tr.add(off, hat(), 0.14)
            tr.add(on, pluck_bass(r if k % 2 == 0 else fifth, beat * 0.9), 0.38)
            tr.add(off, stab([freq(n) for n in ch], beat * 0.4), 0.22)
            for q in range(4):  # grelots en doubles croches, très discrets
                tr.add(on + q * beat / 4, lowpass(sleigh(vel=0.5), 7000), 0.004 if q % 2 else 0.007)
        if fill_every and (b + 1) % fill_every == 0:
            for q in range(4):
                tr.add(t + 3 * beat + q * beat / 4, snare(vel=0.7), 0.22)
            tr.add(t + 4 * beat, hat(open_=True), 0.2)
        t += 4 * beat
    return t


def lead(tr, notes, start, beat, gain, octave=0):
    t = start
    for name, length in notes:
        if name:
            f = freq(name) * (2 ** octave)
            tr.add(t, brass(f, length * beat * 0.92), gain)
            tr.add(t, bell(f * 2, dur=1.2), gain * 0.18)
        t += length * beat
    return t


# Couplet de Jingle Bells (domaine public)
JINGLE_VERSE = [
    ("G4", 1), ("E5", 1), ("D5", 1), ("C5", 1), ("G4", 3), ("G4", 0.5), ("G4", 0.5),
    ("G4", 1), ("E5", 1), ("D5", 1), ("C5", 1), ("A4", 4),
    ("A4", 1), ("F5", 1), ("E5", 1), ("D5", 1), ("B4", 4),
    ("G5", 1), ("G5", 1), ("F5", 1), ("D5", 1), ("E5", 4),
    ("G4", 1), ("E5", 1), ("D5", 1), ("C5", 1), ("G4", 4),
    ("G4", 1), ("E5", 1), ("D5", 1), ("C5", 1), ("A4", 3), ("A4", 1),
    ("A4", 1), ("F5", 1), ("E5", 1), ("D5", 1), ("G5", 1), ("G5", 1), ("G5", 1), ("G5", 1),
    ("A5", 1), ("G5", 1), ("F5", 1), ("D5", 1), ("C5", 2), ("G5", 2),
]
JINGLE_VERSE_CHORDS = [
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["F3", "A3", "C4"],
    ["F3", "A3", "D4"], ["G3", "B3", "D4"], ["G3", "B3", "F4"], ["C3", "E3", "G3"],
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["F3", "A3", "C4"],
    ["F3", "A3", "D4"], ["G3", "B3", "D4"], ["G3", "B3", "F4"], ["C3", "E3", "G3"],
]

# Deck the Halls (domaine public), en do majeur
DECK = [
    ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("C4", 1),
    ("D4", 0.5), ("E4", 0.5), ("F4", 0.5), ("D4", 0.5), ("E4", 1.5), ("D4", 0.5), ("C4", 1), ("B3", 1), ("C4", 2),
    ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("C4", 1),
    ("D4", 0.5), ("E4", 0.5), ("F4", 0.5), ("D4", 0.5), ("E4", 1.5), ("D4", 0.5), ("C4", 1), ("B3", 1), ("C4", 2),
    ("D4", 1.5), ("E4", 0.5), ("F4", 1), ("D4", 1), ("E4", 1.5), ("F4", 0.5), ("G4", 1), ("D4", 1),
    ("E4", 0.5), ("F#4", 0.5), ("G4", 1), ("A4", 0.5), ("B4", 0.5), ("C5", 1), ("B4", 1), ("A4", 1), ("G4", 2),
    ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("C4", 1),
    ("A4", 0.5), ("A4", 0.5), ("A4", 0.5), ("A4", 0.5), ("G4", 1.5), ("F4", 0.5), ("E4", 1), ("D4", 1), ("C4", 2),
]
DECK_CHORDS = [
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["G3", "B3", "D4"], ["C3", "E3", "G3"],
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["G3", "B3", "D4"], ["C3", "E3", "G3"],
    ["G3", "B3", "D4"], ["G3", "B3", "D4"], ["D3", "F#3", "A3"], ["G3", "B3", "D4"],
    ["C3", "E3", "G3"], ["C3", "E3", "G3"], ["F3", "A3", "C4"], ["C3", "E3", "G3"],
]
WISH_UP = [  # We Wish You…, ramené en 4/4 pour enchaîner
    ("D4", 1), ("G4", 1), ("G4", 0.5), ("A4", 0.5), ("G4", 0.5), ("F#4", 0.5), ("E4", 1), ("E4", 1),
    ("E4", 1), ("A4", 1), ("A4", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5), ("F#4", 1), ("D4", 1),
    ("D4", 1), ("B4", 1), ("B4", 0.5), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 1), ("E4", 1),
    ("D4", 0.5), ("D4", 0.5), ("E4", 1), ("A4", 1), ("F#4", 1), ("G4", 4),
]
WISH_UP_CHORDS = [
    ["G3", "B3", "D4"], ["C3", "E3", "G3"], ["A3", "C#4", "E4"], ["D3", "F#3", "A3"],
    ["B3", "D#4", "F#4"], ["E3", "G3", "B3"], ["C3", "E3", "G3"], ["G3", "B3", "D4"],
]


def lowpass_fast(sig, cutoff):
    """Passe-bas dans le domaine fréquentiel (pente douce)."""
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(sig))


def master(sig, name):
    sig = reverb(sig, 1.6, 0.18)
    sig = lowpass_fast(sig, 8500)  # aigus adoucis : pas de souffle agressif
    # léger compresseur : volume régulier, rien qui « saute » aux oreilles
    peak = np.max(np.abs(sig)) or 1
    sig = np.tanh(sig / peak * 1.15) / np.tanh(1.15)
    sig = normalize(crossfade_loop(sig, 1.2), 0.55)
    save_mp3(stereo(sig), name)


def noel1():
    """Jingle Bells, 156 bpm : intro, refrain, couplet, refrain ×2."""
    beat = 60 / 156
    tr = Track(110)
    t = 0.3
    t = band(tr, t, beat, 2, [["C3", "E3", "G3"]], fill_every=2)              # intro
    band(tr, t, beat, 16, JINGLE_CHORDS)
    end = lead(tr, JINGLE, t, beat, 0.30)
    lead(tr, JINGLE, t, beat, 0.10, octave=-1)
    t = end
    band(tr, t, beat, 16, JINGLE_VERSE_CHORDS)
    end = lead(tr, JINGLE_VERSE, t, beat, 0.26)
    t = end
    band(tr, t, beat, 16, JINGLE_CHORDS)
    end = lead(tr, JINGLE, t, beat, 0.30)
    melody(tr, JINGLE, t, beat, bell, 0.12, octave_shift=1)
    t = band(tr, end, beat, 2, [["C3", "E3", "G3"]], fill_every=0)
    master(tr.buf[: int(SR * (t + 1.0))], "musique-noel-1.mp3")


def noel2():
    """Deck the Halls puis We Wish You, 140 bpm, léger swing."""
    beat = 60 / 140
    tr = Track(110)
    t = 0.3
    t = band(tr, t, beat, 2, [["C3", "E3", "G3"]], swing=0.08, fill_every=2)
    band(tr, t, beat, 16, DECK_CHORDS, swing=0.08)
    end = lead(tr, DECK, t, beat, 0.30, octave=1)
    melody(tr, DECK, t, beat, bell, 0.08, octave_shift=2)
    t = end
    band(tr, t, beat, 8, WISH_UP_CHORDS, swing=0.08)
    end = lead(tr, WISH_UP, t, beat, 0.30, octave=1)
    t = end
    band(tr, t, beat, 16, DECK_CHORDS, swing=0.08)
    end = lead(tr, DECK, t, beat, 0.30, octave=1)
    melody(tr, DECK, t, beat, music_box, 0.12, octave_shift=1)
    t = band(tr, end, beat, 2, [["C3", "E3", "G3"]], swing=0.08, fill_every=0)
    master(tr.buf[: int(SR * (t + 1.0))], "musique-noel-2.mp3")


# ---------------------------------------------------------------------------
# Musique japonaise : Sakura Sakura au koto, nappe et carillon
# ---------------------------------------------------------------------------

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


if __name__ == "__main__":
    noel1()
    noel2()
    japon()

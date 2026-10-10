#!/usr/bin/env python3
"""Compose et enregistre les musiques de fond du jeu (instrumentales).

    python3 tools/generer-musique.py

Produit :
  assets/audio/musique-noel.mp3   boucle douce de Noël (boîte à musique,
                                  clochettes, nappe), pendant tout le jeu
  assets/audio/musique-japon.mp3  koto et nappe, sous la vidéo de Barnabé

Les mélodies sont du domaine public (« Jingle Bells », « We Wish You a
Merry Christmas », « Douce nuit », « Sakura Sakura »). Tout le son est
synthétisé ici : aucun échantillon externe, aucun droit à payer.
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
# Musique de Noël : Jingle Bells → We Wish You… → Douce nuit, en boucle
# ---------------------------------------------------------------------------

def noel():
    tr = Track(170)
    t = 0.5
    # 1. Jingle Bells, boîte à musique, 112 bpm
    beat = 60 / 112
    chords(tr, JINGLE_CHORDS, t, beat, 4, 0.22)
    for i in range(int(length(JINGLE))):  # grelots légers sur les temps 2 et 4
        if i % 2 == 1:
            tr.add(t + i * beat, lowpass(sleigh(vel=0.6), 9000), 0.018)
    end = melody(tr, JINGLE, t, beat, music_box, 0.42)
    melody(tr, JINGLE[:20], t + 16 * beat, beat, bell, 0.1, octave_shift=1)  # écho de clochettes
    t = end + beat
    # 2. We Wish You a Merry Christmas, 3/4, 132 bpm
    beat = 60 / 132
    chords(tr, WISH_CHORDS, t + beat, beat, 3, 0.2)
    end = melody(tr, WISH, t, beat, bell, 0.34, octave_shift=1)
    melody(tr, WISH, t, beat, music_box, 0.18)
    t = end + 2 * beat
    # 3. Douce nuit, 6/8 très doux (une croche = un temps)
    beat = 60 / 150
    chords(tr, SILENT_CHORDS, t, beat, 6, 0.24)
    end = melody(tr, SILENT, t, beat, music_box, 0.4)
    t = end + 2.0
    sig = tr.buf[: int(SR * t)]
    sig = reverb(sig, 2.6, 0.3)
    sig = normalize(crossfade_loop(sig), 0.55)
    save_mp3(stereo(sig), "musique-noel.mp3")


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
    noel()
    japon()

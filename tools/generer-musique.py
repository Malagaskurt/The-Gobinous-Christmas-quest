#!/usr/bin/env python3
"""Compose et enregistre les musiques de fond du jeu (instrumentales).

    python3 tools/generer-musique.py

Produit :
  assets/audio/musique-noel-1.mp3  « Douce nuit », boîte à musique et nappe
  assets/audio/musique-noel-2.mp3  « Deck the Halls », boîte à musique, tout doux
  assets/audio/musique-japon.mp3   koto et nappe (mixée dans la vidéo de Barnabé)

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


if __name__ == "__main__":
    noel1()
    noel2()
    japon()

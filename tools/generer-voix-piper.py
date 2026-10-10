#!/usr/bin/env python3
"""Génère les voix de Barnabé hors ligne, avec le moteur Piper.

    pip install piper-tts
    python3 tools/generer-voix-piper.py chemin/vers/fr-gilles-low.onnx

Voix utilisée : « gilles » (voix masculine française, enregistrements sous
licence CC0, moteur Piper sous licence MIT) : libre de droits.
Modèle : https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-gilles-low.tar.gz

Produit les mêmes fichiers que tools/generer-voix.mjs (ElevenLabs) :
assets/audio/barnabe-video-1.mp3 … barnabe-video-4.mp3 et barnabe-appel.mp3.
Le texte prononcé est le champ `voix` (ou `messageVocalVoix`) de
config/quetes.js, écrit pour être bien lu à voix haute.

Réglages : débit un peu plus lent que la normale (posé et articulé), voix
légèrement rajeunie, puis volume harmonisé pour être bien entendu sur un
téléphone.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
LENGTH_SCALE = 1.12   # > 1 : débit plus posé
NOISE_SCALE = 0.45    # plus bas : prononciation plus nette
NOISE_W = 0.6
PITCH = 1.07          # légère montée de la voix (plus jeune), débit conservé


def config():
    """Lit config/quetes.js avec Node.js (fichier JavaScript)."""
    js = (
        "global.window={};require(process.argv[1]);"
        "const r=window.GAME_CONFIG.quetes.traque;"
        "console.log(JSON.stringify({subs:r.sousTitres,audio:r.audio,msg:r.messageVocalVoix||r.messageVocal}));"
    )
    out = subprocess.run(["node", "-e", js, os.path.join(ROOT, "config", "quetes.js")], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def spoken(text):
    text = re.sub(r"[«»\"]", "", text)
    text = re.sub(r"[\U0001F300-\U0001FAFF☀-➿]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def synth(model, text, out_mp3):
    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(model)
    cfg = SynthesisConfig(length_scale=LENGTH_SCALE, noise_scale=NOISE_SCALE, noise_w_scale=NOISE_W)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
    with wave.open(wav_path, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=cfg)
        rate = w.getframerate()
    # Voix un peu plus jeune (hauteur +7 %, même débit), nettoyage du grave,
    # présence dans les médiums, puis volume harmonisé (-16 LUFS).
    filters = (
        f"asetrate={int(rate * PITCH)},aresample=44100,atempo={1 / PITCH:.4f},"
        "highpass=f=90,equalizer=f=3000:t=q:w=1.2:g=3,"
        "acompressor=threshold=-20dB:ratio=3:attack=5:release=80,"
        "loudnorm=I=-16:TP=-1.5:LRA=7,"
        "apad=pad_dur=0.25"
    )
    os.makedirs(os.path.dirname(out_mp3), exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-af", filters, "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "96k", out_mp3],
        check=True,
    )
    os.remove(wav_path)
    print("✔", os.path.relpath(out_mp3, ROOT))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    model = sys.argv[1]
    c = config()
    jobs = [(s["audio"], s.get("voix") or s["texte"]) for s in c["subs"]] + [(c["audio"], c["msg"])]
    for path, text in jobs:
        synth(model, spoken(text), os.path.join(ROOT, path))


if __name__ == "__main__":
    main()

// Génère les voix de Barnabé (quête 5) avec ElevenLabs.
//
// Usage :
//   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… node tools/generer-voix.mjs
//
// Produit, dans assets/audio/ (chemins définis dans config/quetes.js) :
//   barnabe-video-1.mp3 … barnabe-video-4.mp3   les 4 répliques de la vidéo
//   barnabe-appel.mp3                           le message vocal du faux appel
//
// Choisir la voix (ELEVENLABS_VOICE_ID) : sur elevenlabs.io, menu Voices →
// « Voice Design », décrivez la voix (voir README, § « Voix de Barnabé »),
// enregistrez-la puis copiez son identifiant (Voice ID).
//
// Options (variables d'environnement) :
//   ELEVENLABS_MODEL   modèle (défaut : eleven_multilingual_v2, très bon en français)
//   SEULEMENT          ne générer qu'un fichier, ex. SEULEMENT=barnabe-appel.mp3
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
if (!KEY || !VOICE) {
  console.error('Renseignez ELEVENLABS_API_KEY et ELEVENLABS_VOICE_ID (voir l\'en-tête de ce fichier).');
  process.exit(1);
}

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, 'config/quetes.js'), 'utf8'), ctx);
const R = ctx.window.GAME_CONFIG.quetes.traque;

// Texte prononcé : on retire les émojis, les guillemets et on fait dire
// « MDR » en toutes lettres, comme le dirait un lutin de la génération Z.
const spoken = (s) => String(s)
  .replace(/[«»"]/g, '')
  .replace(/\p{Extended_Pictographic}/gu, '')
  .replace(/\bMDR\b/g, 'Mdr')
  .replace(/\s+/g, ' ')
  .trim();

const jobs = R.sousTitres.map((s) => ({ file: s.audio, text: spoken(s.voix || s.texte) }));
jobs.push({ file: R.audio, text: spoken(R.messageVocalVoix || R.messageVocal) });

// Réglages : voix expressive et joueuse (stabilité basse, style élevé),
// tout en restant bien articulée.
const settings = { stability: 0.32, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true, speed: 1.05 };

for (const job of jobs) {
  if (!job.file) continue;
  if (process.env.SEULEMENT && !job.file.endsWith(process.env.SEULEMENT)) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: job.text, model_id: MODEL, voice_settings: settings }),
  });
  if (!res.ok) {
    console.error(`✖ ${job.file} : ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    continue;
  }
  const out = join(root, job.file);
  mkdirSync(join(out, '..'), { recursive: true });
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log(`✔ ${job.file}`);
}

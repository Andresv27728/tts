// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(express.json());
app.use('/downloads', express.static(path.join(__dirname, 'outputs')));

// -----------------------------------------------------------------------------
// Helper: limpiar archivos temporales
function cleanFiles(files = []) {
  files.forEach(f => {
    try { fs.unlinkSync(f.path); } catch (e) { /* no-op */ }
  });
}

// -----------------------------------------------------------------------------
// PROVIDER WRAPPERS (ejemplos modulares, reemplaza endpoints/headers según docs)
// Nota: Rellena URLs y headers con las que te dé cada servicio en tu cuenta.

// 1) UBERDUCK (ejemplo)
async function uberduck_speak({ voice, text }) {
  // Reemplaza con la URL real y auth (Uberduck usa API key/secret en Basic Auth o token)
  const url = process.env.UBERDUCK_SPEAK_URL || 'https://api.uberduck.ai/speak';
  const key = process.env.UBERDUCK_KEY || '';
  const secret = process.env.UBERDUCK_SECRET || '';

  // ejemplo: Basic Auth; consulta docs de Uberduck y ajusta
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  const body = { voice, speech: text };

  const resp = await axios.post(url, body, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    responseType: 'json'
  });

  // la forma de obtener URL/archivo depende de la API real; ajusta aquí:
  return resp.data; // puede contener { path / url } -> adapta según respuesta real
}

// 2) PLAYHT (ejemplo)
async function playht_speak({ voice, text }) {
  const url = process.env.PLAYHT_TTS_URL || 'https://play.ht/api/v1/convert';
  const key = process.env.PLAYHT_KEY || '';
  const body = { voice, content: text };

  const resp = await axios.post(url, body, {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    responseType: 'json'
  });

  return resp.data;
}

// 3) RESEMBLE AI (ejemplo)
async function resemble_speak({ voice_id, text }) {
  const url = process.env.RESEMBLE_TTS_URL || `https://app.resemble.ai/api/v1/projects/${process.env.RESEMBLE_PROJECT}/clips`;
  const key = process.env.RESEMBLE_KEY || '';

  const body = {
    // Ajusta el body según la API real de Resemble
    audio: { voice: voice_id, text }
  };

  const resp = await axios.post(url, body, {
    headers: {
      'Authorization': `Token token=${key}`,
      'Content-Type': 'application/json'
    },
    responseType: 'json'
  });

  return resp.data;
}

// 4) ANYVOICE (ejemplo)
async function anyvoice_speak({ voice_id, text }) {
  const url = process.env.ANYVOICE_TTS_URL || 'https://api.anyvoice.example/v1/speak';
  const key = process.env.ANYVOICE_KEY || '';
  const resp = await axios.post(url, { voice_id, text }, {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  return resp.data;
}

// 5) FISH.AUDIO (ejemplo)
async function fishaudio_speak({ voice_id, text }) {
  const url = process.env.FISHAUDIO_TTS_URL || 'https://api.fish.audio/v1/tts';
  const key = process.env.FISHAUDIO_KEY || '';
  const resp = await axios.post(url, { voice_id, text }, {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  return resp.data;
}

// -----------------------------------------------------------------------------
// GENERIC ROUTE: /tools/text-to-speech
// Query or body: provider (uberduck|playht|resemble|anyvoice|fish), voice/voice_id, text
app.post('/tools/text-to-speech', async (req, res) => {
  try {
    const { provider, text } = req.body;
    if (!provider || !text) return res.status(400).json({ error: 'provider y text son obligatorios' });

    let result;

    switch ((provider || '').toLowerCase()) {
      case 'uberduck':
        result = await uberduck_speak({ voice: req.body.voice || req.body.voice_id, text });
        break;
      case 'playht':
        result = await playht_speak({ voice: req.body.voice || req.body.voice_id, text });
        break;
      case 'resemble':
        result = await resemble_speak({ voice_id: req.body.voice_id, text });
        break;
      case 'anyvoice':
        result = await anyvoice_speak({ voice_id: req.body.voice_id, text });
        break;
      case 'fishaudio':
        result = await fishaudio_speak({ voice_id: req.body.voice_id, text });
        break;
      default:
        return res.status(400).json({ error: 'provider no soportado' });
    }

    // Normaliza respuesta: intenta devolver url directa si la hay
    return res.json({ ok: true, provider, raw: result });
  } catch (e) {
    console.error(e.response?.data || e.message);
    return res.status(500).json({ error: e.response?.data || e.message });
  }
});

// -----------------------------------------------------------------------------
// CLONE ROUTE (cuando el proveedor soporte clonación)
// - Requiere consentimiento: body.consent === 'yes'
// - files: multipart 'samples'
app.post('/clone-voice', upload.array('samples', 12), async (req, res) => {
  try {
    const { provider, name = 'my-clone', consent } = req.body;
    if (!provider) return res.status(400).json({ error: 'provider es obligatorio' });
    if (!consent || consent !== 'yes') {
      cleanFiles(req.files);
      return res.status(400).json({ error: 'Se requiere consentimiento (consent=yes) para clonar una voz' });
    }

    // Armar FormData y enviar a la API del proveedor elegido (ejemplo genérico)
    const form = new FormData();
    form.append('name', name);
    req.files.forEach(f => form.append('files', fs.createReadStream(f.path), f.originalname));

    let providerResp;
    switch ((provider || '').toLowerCase()) {
      case 'uberduck':
        // Ejemplo: Uberduck puede tener endpoint para upload / training
        providerResp = await axios.post(process.env.UBERDUCK_VOICE_CREATE_URL || 'https://api.uberduck.ai/voices/create', form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Basic ${Buffer.from(`${process.env.UBERDUCK_KEY}:${process.env.UBERDUCK_SECRET}`).toString('base64')}`
          },
          maxBodyLength: Infinity
        });
        break;

      case 'resemble':
        providerResp = await axios.post(process.env.RESEMBLE_ADD_VOICE_URL || 'https://app.resemble.ai/api/v1/projects/' + process.env.RESEMBLE_PROJECT + '/assets', form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Token token=${process.env.RESEMBLE_KEY}`
          },
          maxBodyLength: Infinity
        });
        break;

      // Otros: playht/anyvoice/fish -> si ofrecen clonación usa endpoint correspondiente
      default:
        cleanFiles(req.files);
        return res.status(400).json({ error: 'Clonación no soportada o endpoint no configurado para ese provider' });
    }

    // limpiar archivos temporales
    cleanFiles(req.files);

    return res.json({ ok: true, provider, created: providerResp.data });
  } catch (e) {
    cleanFiles(req.files);
    console.error(e.response?.data || e.message);
    return res.status(500).json({ error: e.response?.data || e.message });
  }
});

// -----------------------------------------------------------------------------
// Simple health check
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Start
const PORT = process.env.PORT || 3000;
if (!fs.existsSync('./outputs')) fs.mkdirSync('./outputs', { recursive: true });
app.listen(PORT, () => console.log(`TTS aggregator running on :${PORT}`));

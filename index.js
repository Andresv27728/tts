import express from "express";
import cors from "cors";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { textToSpeech } from "./utils/tts.js";
import { readTextFromImage } from "./utils/ocr.js";
import { captureScreenshot } from "./utils/screenshot.js";
import { saveWebsiteToZip } from "./utils/zip.js";
import { textToQr } from "./utils/qr.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.send("🦈 Gura-API Online!"));

// ✅ Estado
app.get("/api/status", (req, res) => {
  res.json({
    status: true,
    creator: "YO SOY YO",
    result: {
      status: "Ready",
      totalrequest: 0,
      totalfitur: 5,
      runtime: "22s",
      domain: "render/vercel compatible"
    }
  });
});

// ✅ Text-to-speech
app.get("/api/tts", async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ error: "Falta el parámetro 'text'" });
  const audio = await textToSpeech(text);
  res.json({ audio });
});

// ✅ OCR
app.get("/api/ocr", async (req, res) => {
  const result = await readTextFromImage();
  res.json({ result });
});

// ✅ Screenshot
app.get("/api/screenshot", async (req, res) => {
  const { url } = req.query;
  const file = await captureScreenshot(url);
  res.sendFile(file);
});

// ✅ Web → ZIP
app.get("/api/savezip", async (req, res) => {
  const { url } = req.query;
  const file = await saveWebsiteToZip(url);
  res.download(file);
});

// ✅ Text → QR
app.get("/api/text2qr", async (req, res) => {
  const { text } = req.query;
  const qr = await textToQr(text);
  res.json({ qr });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🦈 Gura-API corriendo en puerto", PORT));

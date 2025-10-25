import Tesseract from "tesseract.js";

/**
 * Extrae texto de una imagen mediante OCR (sin API externa)
 * @param {Buffer|string} imageBuffer - Buffer o URL de imagen
 * @returns {Promise<string>} Texto detectado
 */
export async function extractTextFromImage(imageBuffer) {
  try {
    const { data } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (info) => console.log(info.status),
    });
    return data.text.trim();
  } catch (err) {
    console.error("Error en OCR:", err);
    return "No se pudo reconocer texto.";
  }
}

import JSZip from "jszip";
import fs from "fs";

/**
 * Crea un archivo ZIP con los buffers o archivos especificados
 * @param {Array<{name: string, data: Buffer|string}>} files - Archivos a comprimir
 * @param {string} [outputPath] - Ruta donde guardar el ZIP (opcional)
 * @returns {Promise<Buffer>} - Devuelve el ZIP como Buffer si no se guarda en disco
 */
export async function createZip(files = [], outputPath = null) {
  const zip = new JSZip();

  for (const file of files) {
    if (file.data instanceof Buffer) {
      zip.file(file.name, file.data);
    } else if (fs.existsSync(file.data)) {
      const content = fs.readFileSync(file.data);
      zip.file(file.name, content);
    } else {
      throw new Error(`Archivo no encontrado o inválido: ${file.name}`);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  if (outputPath) {
    fs.writeFileSync(outputPath, zipBuffer);
    return outputPath;
  }

  return zipBuffer;
}

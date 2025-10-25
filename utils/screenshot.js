import puppeteer from "puppeteer";

/**
 * Toma una captura de pantalla de una página web
 * @param {string} url - URL de la página a capturar
 * @returns {Promise<Buffer>} - Imagen en formato PNG
 */
export async function takeScreenshot(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote"
      ],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    const buffer = await page.screenshot({ fullPage: true });
    await browser.close();

    return buffer;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error("Error al tomar screenshot:", err);
    throw new Error("No se pudo capturar la imagen");
  }
}

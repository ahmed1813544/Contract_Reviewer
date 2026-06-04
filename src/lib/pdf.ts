import { defineUnPDFConfig, decodePDFText } from "unpdf";

let pdfConfigInitialized = false;

async function ensurePDFConfig() {
  if (!pdfConfigInitialized) {
    await defineUnPDFConfig({
      pdfjs: async () => {
        const mod = await import("pdfjs-dist/legacy/build/pdf.js");
        return mod.default ?? mod;
      },
    });
    pdfConfigInitialized = true;
  }
}

export async function parsePDF(buffer: Buffer): Promise<string> {
  await ensurePDFConfig();
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const result = await decodePDFText(arrayBuffer, { mergePages: true });
  return Array.isArray(result.text) ? result.text.join("\n") : result.text || "";
}

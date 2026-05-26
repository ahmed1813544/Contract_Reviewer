import { PDFParse } from "pdf-parse";

export async function parsePDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    const textResult = await parser.getText();
    return textResult.text;
  } finally {
    await parser.destroy();
  }
}

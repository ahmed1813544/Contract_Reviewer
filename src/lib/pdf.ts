import pdfParse from "pdf-parse";

export async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfData = await pdfParse(buffer);
  return pdfData.text || "";
}

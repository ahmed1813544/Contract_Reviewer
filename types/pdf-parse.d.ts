declare module 'pdf-parse' {
  interface PDFParseData {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    version?: string;
    textAsHtml?: string;
    outline?: unknown[];
    formImage?: unknown;
  }

  function pdfParse(data: Buffer | Uint8Array | string, options?: unknown): Promise<PDFParseData>;
  export default pdfParse;
}

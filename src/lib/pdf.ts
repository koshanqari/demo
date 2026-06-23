import "server-only";
import { PDFParse } from "pdf-parse";

export interface PdfPage {
  page: number;
  text: string;
}

export async function extractPdfPages(buffer: Buffer): Promise<PdfPage[]> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.pages.map((p) => ({
      page: p.num,
      text: (p.text ?? "").replace(/\s+/g, " ").trim(),
    }));
  } finally {
    await parser.destroy();
  }
}

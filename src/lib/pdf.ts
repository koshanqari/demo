import "server-only";
import { extractText } from "unpdf";

export interface PdfPage {
  page: number;
  text: string;
}

export async function extractPdfPages(buffer: Buffer): Promise<PdfPage[]> {
  const { text: pages } = await extractText(new Uint8Array(buffer), {
    mergePages: false,
  });
  return pages.map((t, i) => ({
    page: i + 1,
    text: (t ?? "").replace(/\s+/g, " ").trim(),
  }));
}

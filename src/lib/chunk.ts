export interface Chunk {
  text: string;
  page: number;
  index: number;
}

export function chunkText(
  pages: { page: number; text: string }[],
  { size = 900, overlap = 150 }: { size?: number; overlap?: number } = {},
): Chunk[] {
  const out: Chunk[] = [];
  let idx = 0;
  for (const { page, text } of pages) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) continue;
    for (let i = 0; i < clean.length; i += size - overlap) {
      const slice = clean.slice(i, i + size).trim();
      if (slice.length < 40) continue;
      out.push({ text: slice, page, index: idx++ });
      if (i + size >= clean.length) break;
    }
  }
  return out;
}

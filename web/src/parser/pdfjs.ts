import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { groupLines, parseLines, type TextItem } from "./parse";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export { pdfjs };

export async function readPdfText(data: ArrayBuffer): Promise<TextItem[]> {
  const doc = await pdfjs.getDocument({ data }).promise;
  const items: TextItem[] = [];
  for (let page = 1; page <= doc.numPages; page++) {
    const content = await (await doc.getPage(page)).getTextContent();
    for (const item of content.items) {
      if (!("str" in item)) continue;
      items.push({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        size: Math.hypot(item.transform[2], item.transform[3]) || item.height,
        page,
      });
    }
  }
  return items;
}

export async function parsePdf(file: File) {
  return parseLines(groupLines(await readPdfText(await file.arrayBuffer())));
}

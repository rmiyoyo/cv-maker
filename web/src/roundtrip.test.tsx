import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { expect, it } from "vitest";
import { groupLines, parseLines, type TextItem } from "./parser/parse";
import { ResumePdf } from "./pdf/ResumePdf";
import { initialState } from "./types";

it("reads back a CV it made itself", async () => {
  const state = initialState();
  const buffer = await renderToBuffer(<ResumePdf state={state} />);
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const items: TextItem[] = [];
  for (let page = 1; page <= doc.numPages; page++) {
    const content = await (await doc.getPage(page)).getTextContent();
    for (const item of content.items) {
      if (!("str" in item)) continue;
      items.push({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        size: Math.hypot(item.transform[2], item.transform[3]),
        page,
      });
    }
  }
  expect(parseLines(groupLines(items))).toEqual(state.resume);
});

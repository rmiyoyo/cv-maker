import { pdf } from "@react-pdf/renderer";
import { useEffect, useRef, useState } from "react";
import { pdfjs } from "../parser/pdfjs";
import { ResumePdf } from "../pdf/ResumePdf";
import type { CvState } from "../types";

export async function renderPdfBlob(state: CvState) {
  return pdf(<ResumePdf state={state} />).toBlob();
}

export function Preview({ state }: { state: CvState }) {
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await renderPdfBlob(state);
        const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        const canvases: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "preview-page";
          await page.render({ canvas, viewport }).promise;
          canvases.push(canvas);
        }
        if (!cancelled && holder.current) {
          holder.current.replaceChildren(...canvases);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Preview failed");
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state]);

  return (
    <div className="preview">
      {error ? <p className="error">{error}</p> : null}
      <div ref={holder} />
    </div>
  );
}

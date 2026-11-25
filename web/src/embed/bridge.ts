import type { Resume } from "../types";

export const params = new URLSearchParams(location.search);
export const isEmbedded = params.get("embed") === "1" && window.parent !== window;

const parentOrigin = (() => {
  const ancestor = location.ancestorOrigins?.[0];
  if (ancestor) return ancestor;
  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
})();

export type EmbedMessage =
  | { type: "monica-cv:resize"; height: number }
  | { type: "monica-cv:change"; resume: Resume }
  | { type: "monica-cv:download"; name: string };

export function notifyParent(message: EmbedMessage) {
  if (isEmbedded && parentOrigin) window.parent.postMessage(message, parentOrigin);
}

export function reportHeight() {
  if (!isEmbedded) return;
  const observer = new ResizeObserver(() => {
    notifyParent({ type: "monica-cv:resize", height: document.documentElement.scrollHeight });
  });
  observer.observe(document.body);
}

export function accentFromParams() {
  const accent = params.get("accent");
  return accent && /^#?[0-9a-f]{6}$/i.test(accent) ? `#${accent.replace("#", "")}` : null;
}

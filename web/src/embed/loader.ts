const script = document.currentScript as HTMLScriptElement | null;
const appOrigin = new URL(script?.src ?? location.href).origin;

export function mount(container: HTMLElement) {
  if (container.dataset.monicaCvMounted) return;
  container.dataset.monicaCvMounted = "1";

  const src = new URL("/", appOrigin);
  src.searchParams.set("embed", "1");
  if (container.dataset.accent) src.searchParams.set("accent", container.dataset.accent.replace("#", ""));

  const frame = document.createElement("iframe");
  frame.src = src.toString();
  frame.title = "Monica CV Maker";
  frame.loading = "lazy";
  frame.style.cssText = "display:block;width:100%;min-height:720px;border:0;";
  container.appendChild(frame);

  window.addEventListener("message", (event) => {
    if (event.origin !== appOrigin || event.source !== frame.contentWindow) return;
    const data = event.data as { type?: string; height?: number };
    if (typeof data?.type !== "string" || !data.type.startsWith("monica-cv:")) return;
    if (data.type === "monica-cv:resize" && typeof data.height === "number") {
      frame.style.height = `${data.height}px`;
      return;
    }
    container.dispatchEvent(new CustomEvent(data.type, { detail: data, bubbles: true }));
  });
}

function mountAll() {
  document.querySelectorAll<HTMLElement>("[data-monica-cv]").forEach(mount);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
else mountAll();

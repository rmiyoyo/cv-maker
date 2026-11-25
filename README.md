# Monica CV Maker

A free CV builder and CV reader from [Monica](https://monicahr.com). People fill in a form, watch their CV update live, and download an ATS-friendly PDF. They can also import an existing PDF CV and edit it. Everything runs in the browser: no sign-up, and the CV is saved in the visitor's own browser storage.

It runs on its own (planned at `cv.monicahr.com`) and as an embed on any Monica page or partner site.

## Features

- Form for details, work experience, education, projects, skills and referees
- Live preview, rendered with pdf.js so it works on phones
- PDF download (A4 or US Letter, colour, font, font size, section order and visibility)
- Import: reads a PDF CV back into the form
- Drop-in embed with auto height and events for the host page

## Layout

| Path | What it is |
| --- | --- |
| `web/` | React and TypeScript app (Vite). PDF made with `@react-pdf/renderer`, read with `pdfjs-dist` |
| `web/src/parser/` | CV reader: `parse.ts` is pure and tested, `pdfjs.ts` pulls text out of the PDF |
| `web/src/pdf/` | The CV template |
| `web/src/embed/` | `loader.ts` becomes `embed.js` for host pages, `bridge.ts` talks to the host from inside the iframe |
| `server/` | Go server: serves the build, sets `frame-ancestors`, cache headers and `/healthz` |
| `examples/embed.html` | Embed example |

## Run it

```sh
cd web
npm install
npm run dev
```

With the Go server (what production runs):

```sh
cd web && npm run build
cd ../server && go run .
```

Open http://localhost:8080.

## Tests

```sh
cd web && npm test
cd server && go test ./...
```

The web tests include a round trip: the sample CV is rendered to PDF, read back by the parser, and must match the original data.

## Embed

```html
<div data-monica-cv data-accent="#ff6600"></div>
<script src="https://cv.monicahr.com/embed.js" async></script>
```

The loader adds an iframe that grows with its content. The container receives these events:

| Event | `event.detail` |
| --- | --- |
| `monica-cv:change` | `{ resume }`, the CV data, after edits |
| `monica-cv:download` | `{ name }`, when a PDF is downloaded |

```js
document.querySelector("[data-monica-cv]").addEventListener("monica-cv:download", (e) => {
  gtag("event", "cv_download");
});
```

Embedding is limited by `FRAME_ANCESTORS`. Add a site there before embedding on it.

## Configuration

| Variable | Default |
| --- | --- |
| `PORT` | `8080` |
| `STATIC_DIR` | `../web/dist` |
| `FRAME_ANCESTORS` | `'self' https://monicahr.com https://*.monicahr.com` |

## Docker

```sh
docker build -t cv-maker .
docker run -p 8080:8080 cv-maker
```

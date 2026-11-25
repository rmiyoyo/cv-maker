package main

import (
	"log"
	"mime"
	"net/http"
	"os"
	"strings"
	"time"
)

const defaultFrameAncestors = "'self' https://monicahr.com https://*.monicahr.com"

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func newHandler(staticDir, frameAncestors string) http.Handler {
	files := http.FileServer(http.Dir(staticDir))
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("ok"))
	})

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		switch {
		case r.URL.Path == "/embed.js":
			h.Set("Access-Control-Allow-Origin", "*")
			h.Set("Cache-Control", "public, max-age=300")
		case strings.HasPrefix(r.URL.Path, "/assets/"):
			h.Set("Cache-Control", "public, max-age=31536000, immutable")
		default:
			h.Set("Content-Security-Policy", "frame-ancestors "+frameAncestors)
			h.Set("Cache-Control", "no-cache")
		}
		files.ServeHTTP(w, r)
	})

	return mux
}

func main() {
	mime.AddExtensionType(".mjs", "text/javascript")

	addr := ":" + env("PORT", "8080")
	server := &http.Server{
		Addr:              addr,
		Handler:           newHandler(env("STATIC_DIR", "../web/dist"), env("FRAME_ANCESTORS", defaultFrameAncestors)),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("cv-maker listening on %s", addr)
	log.Fatal(server.ListenAndServe())
}

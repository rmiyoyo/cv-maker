package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func testServer(t *testing.T) http.Handler {
	t.Helper()
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html></html>"), 0o644)
	os.WriteFile(filepath.Join(dir, "embed.js"), []byte("void 0"), 0o644)
	os.MkdirAll(filepath.Join(dir, "assets"), 0o755)
	os.WriteFile(filepath.Join(dir, "assets", "app.js"), []byte("void 0"), 0o644)
	return newHandler(dir, "'self' https://monicahr.com")
}

func get(h http.Handler, path string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

func TestAppPageLimitsWhoCanFrameIt(t *testing.T) {
	rec := get(testServer(t), "/")
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if got := rec.Header().Get("Content-Security-Policy"); got != "frame-ancestors 'self' https://monicahr.com" {
		t.Fatalf("csp %q", got)
	}
}

func TestEmbedScriptIsShareable(t *testing.T) {
	rec := get(testServer(t), "/embed.js")
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatal("embed.js should allow any origin")
	}
	if rec.Header().Get("Content-Security-Policy") != "" {
		t.Fatal("embed.js should not carry a frame policy")
	}
}

func TestAssetsAreCachedForever(t *testing.T) {
	rec := get(testServer(t), "/assets/app.js")
	if rec.Header().Get("Cache-Control") != "public, max-age=31536000, immutable" {
		t.Fatalf("cache %q", rec.Header().Get("Cache-Control"))
	}
}

func TestHealth(t *testing.T) {
	if rec := get(testServer(t), "/healthz"); rec.Body.String() != "ok" {
		t.Fatalf("body %q", rec.Body.String())
	}
}

"""Serves a static export the way GitHub Pages does.

A plain file server maps /office to a directory listing; Pages maps it to
office.html. Testing against the wrong one produces failures that do not
exist in production, which is worse than not testing at all.
Resolution order per request: exact file -> path.html -> path/index.html -> 404.html
"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8099

class Pages(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = super().translate_path(path.split("?")[0].split("#")[0])
        if os.path.isfile(p):
            return p
        for cand in (p.rstrip("/") + ".html", os.path.join(p, "index.html")):
            if os.path.isfile(cand):
                return cand
        four04 = os.path.join(ROOT, "Truth-Estate", "404.html")
        return four04 if os.path.isfile(four04) else p
    def log_message(self, *a):
        pass

os.chdir(ROOT)
print(f"serving {ROOT} on {PORT} with Pages-style routing", flush=True)
ThreadingHTTPServer(("127.0.0.1", PORT), Pages).serve_forever()

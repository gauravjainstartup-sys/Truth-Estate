# ════════════════════════════════════════════════════════════════
#  Truth Estate — the static export, containerised for Cloud Run.
#
#  The build happens in CI (it needs the Supabase snapshot and the Maps
#  key), so this image only serves. Copying a prebuilt `out/` keeps the
#  image small and the deploy fast, and means the artifact that ships is
#  byte-identical to the one the test suite ran against — a rebuild
#  inside the image would be a second, unverified build.
# ════════════════════════════════════════════════════════════════
FROM nginx:1.27-alpine

# nginx:alpine already runs envsubst over anything in this directory at
# container start, which is how ${PORT} gets substituted — Cloud Run picks
# the port and injects it, and a hardcoded 8080 breaks the day it doesn't.
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template

# The 301 map from the old truthestate.in URLs. Shipped as its own file so
# it can be regenerated from a crawl without touching the server config.
COPY deploy/redirects.conf /etc/nginx/redirects.conf

COPY out/ /usr/share/nginx/html/

# Documentation only — Cloud Run reads $PORT, not EXPOSE.
EXPOSE 8080

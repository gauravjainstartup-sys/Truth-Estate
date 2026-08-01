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

# nginx:alpine runs envsubst over /etc/nginx/templates at start, which is
# how ${PORT} is filled in — Cloud Run chooses the port and injects it, and
# a hardcoded 8080 breaks the day it doesn't.
#
# THE FILTER IS NOT OPTIONAL. Left unset, that entrypoint substitutes EVERY
# environment variable it can see, and the config is full of things that
# look exactly like variables to it: $uri, $host, $request_uri,
# $http_x_forwarded_proto, $cache_control. Any environment variable sharing
# one of those names — or anything setting HOST, which plenty of build
# tooling does — would blank that token before nginx ever parsed it, and
# the failure is a config that is still syntactically valid. Restricted to
# PORT, which is the only one meant to be substituted.
ENV NGINX_ENVSUBST_FILTER=PORT

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template

# The 301 map from the old truthestate.in URLs. Shipped as its own file so
# it can be regenerated from a crawl without touching the server config.
COPY deploy/redirects.conf /etc/nginx/redirects.conf

COPY out/ /usr/share/nginx/html/

# Documentation only — Cloud Run reads $PORT, not EXPOSE.
EXPOSE 8080

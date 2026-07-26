# Browser tests

Three harnesses that drive the **built export** in real Chromium at 390px
and 1440px. They exist because five separate defects this codebase shipped
were invisible to typechecking and to reading the code: a slug regex that
matched none of 198 pages, a title duplicated on 822 pages, a dashboard
with no `h1`, demo scaffolding above the verdict, and a fit score that tied
three unrelated projects at 55%.

## Running

```bash
SUPABASE_FIXTURES=.data-snapshot npm run build
mkdir -p /tmp/serve && cp -r out /tmp/serve/Truth-Estate
python3 tests/pages-server.py /tmp/serve 8100 &

node tests/site-sweep.mjs      # every route · errors, h1, overflow, titles · 4 widths
node tests/flows.mjs           # journeys · unlock→pay, chat, dashboard, owner path,
                               #   paywall-follows-session, free sections · 3 widths
node tests/auth-surfaces.mjs   # all six sign-in surfaces, incl. international
```

Build the export with `NEXT_PUBLIC_GMAPS_KEY=test-key` before running `flows.mjs`.
`process.env.NEXT_PUBLIC_*` is inlined at build time, so a key-less export
short-circuits every Google Places call and the owner path's confirm step is
never exercised — the tests still pass, having tested a configuration that
never ships. CI builds with the real key; test with a fake one and stub the
endpoint (`ctx.route('https://places.googleapis.com/**', …)`).

`pages-server.py` is not a convenience — a plain file server maps `/office`
to a directory listing while GitHub Pages maps it to `office.html`. Testing
against the wrong one invents failures that do not exist in production.

## Widths, and why these ones

360 is the commonest Android width and the tightest real case — where a
fixed-width child overflows. 390 is iPhone. **768 is Tailwind's `md:`
boundary**, where a mobile treatment hands over to a desktop one; both
recent layout regressions lived exactly there and neither viewport was
being tested. 1440 is the laptop.

## Two traps that cost real time

**Playwright matches routes last-registered-first.** Register the
catch-all BEFORE the specific stubs or it shadows them, and the page
silently receives the wrong payload — which looks exactly like a broken
feature.

**Chromium does not read `HTTPS_PROXY`.** Pass `proxy: { server, bypass:
'127.0.0.1,localhost' }` or every Supabase call fails and the UI renders
its empty state, which again looks like a bug in the feature.

More of these runs' "failures" were bad selectors than real defects. When
one fails, reproduce it by hand or screenshot it before believing it.

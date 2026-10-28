# Polygon finish, Pro package

`@geoman-io/maplibre-geoman-pro` 0.13.2. Copy `.npmrc.example` to `.npmrc` and put your license key in it, then:

```sh
npm install
npm run check   # headless Chrome; set CHROME_PATH to use another Chromium
npm run dev     # open / for cases A to D, /?geofencing for case E (1000 x 800 window)
```

`check.mjs` replays:

- cases A to D with `settings.validateGeometry: true`, closing on the first vertex, then with Enter;
- case E: a keep-out square registered with `gm.geofencing.setIntersectionRestriction`, then a triangle drawn around it and closed on the first vertex, on the last vertex, or with Enter. E0 is a control: a vertex whose segment crosses the square is refused.

For each run it prints the created features (type and number of parts), the public `gm:*` event names received through `gm.setGlobalEventsListener` (with the event `action` when there is one), and whether the drawing is still open. That last value is read from internal fields of the draw mode, for diagnosis only.

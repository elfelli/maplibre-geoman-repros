# Polygon finish, free package

Cases A to D of the issue, on `@geoman-io/maplibre-geoman-free` 0.10.2.

```sh
npm install
npm run check   # headless Chrome; set CHROME_PATH to use another Chromium
npm run dev     # to click the points yourself (1000 x 800 window)
```

`check.mjs` clicks the points of each case, closes on the first vertex, then prints the created features and the event names received through `gm.setGlobalEventsListener`, split into public `gm:*` events and internal `_gm:*` events.

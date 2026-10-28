# geoman-repro-import-rewind

Reproduction for a documentation / option request: `gm.features.importGeoJson` passes every line and polygon through `@turf/rewind`, which also reverses some `LineString`s.

The page imports one clockwise polygon and four lines, then exports them. It then replaces the imported line's geometry with `updateGeometry`, and finally imports the same line alone with `importGeoJsonFeature`. Each output is compared with its input (`order kept` or `reversed`).

Uses `@geoman-io/maplibre-geoman-free` 0.10.2 and `maplibre-gl` 6.14.0.

```sh
npm install
npm run dev     # open the page, the coordinates are printed in the bottom left corner
npm run check   # headless run (Chrome, or set CHROME_PATH), prints the coordinates
```

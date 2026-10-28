# validateGeometry rejects polygons with holes

With `validateGeometry: true`, Maplibre-Geoman Pro 0.13.2 rejects a valid polygon whose hole is fully inside the outer ring. This page shows:

- `validateFeatureGeometry` on the same polygon with and without the hole;
- `repairFeatureGeometry` on the polygon with the hole;
- `importGeoJson` of the polygon with the hole;
- `edit.addHole` on an imported polygon without a hole.

## Run

1. Copy `.npmrc.example` to `.npmrc` and put your Geoman Pro license key in it.
2. `npm install`
3. `npm run check` prints the results in the terminal (headless Chrome). `npm run dev` shows them on the page.

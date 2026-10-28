# Snapping to a MapLibre layer is not exact

Maplibre-Geoman Pro 0.13.2, `settings.snapping.targets` pointing at a MapLibre GeoJSON source. The page draws a synthetic neighbour polygon (400 vertices) and a polygon is drawn by clicking about 5 px away from three of its vertices. `window.snapReport()` tells, for each drawn vertex, whether it is an exact copy of a neighbour vertex and how far it is from the nearest one.

URL parameters:

- `target=layer` (default): the neighbour is a MapLibre layer used as a snapping target, with `acquire=rendered|source`;
- `target=feature`: the neighbour is imported as a Geoman feature with `__gm_disableEdit: true`, no snapping target;
- `target=custom`: the neighbour vertices are passed to `setCustomSnappingCoordinates`, no snapping target;
- `z=13|15|17`: initial zoom.

`window.sourceFeaturesReport()` compares the coordinates returned by `map.querySourceFeatures('neighbour')` with the original vertices (plain MapLibre, no Geoman involved).

## Run

1. Copy `.npmrc.example` to `.npmrc` and put your Geoman Pro license key in it.
2. `npm install`
3. `npm run check` replays every case in headless Chrome and prints the results (set `CHROME_PATH` to use another Chrome binary). `npm run dev` lets you draw by hand.

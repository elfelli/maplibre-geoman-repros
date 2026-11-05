# Maplibre-Geoman reproductions

Small runnable projects for issues reported on [geoman-io/maplibre-geoman](https://github.com/geoman-io/maplibre-geoman). Each folder has its own README and a `npm run check` script that replays the scenario in headless Chrome (Playwright) and prints the observations quoted in the issue. Aggregates over several runs and results from patched builds are described as such in the issues.

| Folder | Issue | Package |
|---|---|---|
| `1-merge-geojson-diff/free-micro` | `mergeGeoJsonDiff` is quadratic when a `remove` is pending | free 0.10.2 |
| `1-merge-geojson-diff/pro-gesture` | same issue, real gesture on a 19,000-vertex polygon | Pro 0.13.2 |
| `2-options-merge-arrays` | options merge: arrays can't be replaced (keyboard bindings) | Pro 0.13.2, plus a script that needs no license |
| `3-cancellable-hook` | no public hook to refuse an edit before it happens | free 0.10.2 |
| `4-polygon-finish/free` | polygon finish: zero-area ring, 2-vertex ring | free 0.10.2 |
| `4-polygon-finish/pro` | same cases, plus closing despite a geofencing violation | Pro 0.13.2 |
| `5-validate-holes` | `validateGeometry` rejects valid polygons with a hole | Pro 0.13.2 |
| `6-auto-trace` | auto trace merges close vertices and drops the last traced section | Pro 0.13.2 |
| `7-import-rewind` | `importGeoJson` reverses some LineStrings depending on their position | free 0.10.2 |
| `8-snapping-layer-targets` | snapping to a GeoJSON layer target doesn't keep the source vertex coordinates | Pro 0.13.2 |
| `9-large-polygon-drag` | dragging a vertex of a large polygon: the map catches up with a delay that grows with the vertex count | free 0.10.4 |
| `10-drag-release-over-overlay` | releasing a vertex drag over an element laid over the map (app toolbar, Geoman control) leaves the edit stuck | free 0.10.4 |
| `11-large-polygon-vertex-marker` | dragging a vertex of a large polygon: the vertex marker stays at the drag start | free 0.10.7 |
| `12-validate-geometry-drag` | `validateGeometry`: a vertex drag that makes the ring cross itself throws uncaught errors | Pro 0.13.7 |

The checks need an installed Google Chrome, or a Chromium executable given through `CHROME_PATH` (`playwright-core` doesn't download a browser).

Pro folders need a license: copy `.npmrc.example` to `.npmrc` and put your own key in it before `npm install`. Never commit `.npmrc`.

Code adapted from maplibre-geoman (MIT) is listed in `THIRD_PARTY_NOTICES.md`.

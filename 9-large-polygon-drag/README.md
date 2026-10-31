# Dragging a vertex of a large polygon

`@geoman-io/maplibre-geoman-free` 0.10.4, `maplibre-gl` 6.14.0.

The page builds a synthetic ring of `n` vertices (default 19,000) roughly 6 to 7 km across, imports it and enables `edit` / `change`. Vertex 0, on the east side, is kept 8° away from its neighbours so that the midpoint markers of its edges don't cover it.

```sh
npm install
npm run dev            # http://localhost:5173/?n=19000 (whole ring) or ?n=19000&zoom=16
npm run check          # screenshot-based settling after a drag, 100 / 5,000 / 19,000 vertices, four views
npm run profile        # main-thread CPU profile of a 10-move drag at 19,000 vertices, zoom 16
npm run source-bench   # MapLibre updateData until idle: ring alone vs ring plus one point per vertex and midpoint
```

- `check` sends 10 awaited pointer moves, each followed by a 16 ms wait, keeps the button down, then takes screenshots of the area for four seconds. "Catch-up" is the time of the first screenshot of the final unchanged sequence: a screenshot-based settling measurement, not a direct input-to-render latency. It also reports what changed in the geometry after release.
- `profile` prints the functions with the most self and inclusive time while the 10 moves are sent.
- `source-bench` adds its own GeoJSON source to the page and times five `updateData` calls (the ring plus three points, as one vertex drag changes) until the map is idle. It measures the time to idle, not worker time alone.

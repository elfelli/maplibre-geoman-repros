# Dragging a vertex of a large polygon

`@geoman-io/maplibre-geoman-free` 0.10.4, `maplibre-gl` 6.14.0.

The page builds a ring of `n` vertices (default 19,000) about 6 km across, imports it and enables `edit` / `change`. Vertex 0, on the east side, is kept 8° away from its neighbours so that the midpoint markers of its edges don't cover it.

```sh
npm install
npm run dev        # http://localhost:5173/?n=19000 (whole ring) or ?n=19000&zoom=16
npm run check      # headless Chrome, prints the table below
```

`npm run check` drags vertex 0 by 10 pointer moves of (-8, -6) px, 16 ms apart, keeps the button down, then takes screenshots of the area until they stop changing. It prints, for 100, 5,000 and 19,000 vertices and four views:

- the time the 10 pointer moves took (the main thread handles each move before the next one),
- the time the rendered map kept changing after the last move (button still held),
- what changed in the geometry after release (always one vertex here).

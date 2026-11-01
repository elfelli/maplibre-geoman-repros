# Releasing a vertex drag over an element laid over the map leaves the edit stuck

`edit` / `change` mode, maplibre-geoman-free 0.10.4, maplibre-gl 6.14.0.

`npm install`, then `npm run check` (needs Google Chrome, or `CHROME_PATH`).

A vertex of an octagon is dragged and the mouse button is released:

1. over the map;
2. over an application toolbar laid over the map (an absolutely positioned `div`, sibling of the map container);
3. over a button of Geoman's own controls.

After each release, the check reports whether `map.dragPan` is enabled again, which Geoman source holds the polygon, what `exportGeoJson()` returns, and whether the vertex keeps following the pointer once the button is up.

`npm run dev` opens the same page for a manual try: drag a vertex of the octagon and release it over the toolbar at the top right, or over a Geoman control, then move the mouse over the map.

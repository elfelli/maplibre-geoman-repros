# Releasing a vertex drag on a large polygon after the map moved: every edge marker is sent again

`edit` / `change` mode, maplibre-geoman-free 0.10.8, maplibre-gl 6.14.0.

`npm install`, then `npm run check` (needs Google Chrome, or `CHROME_PATH`).

The page imports a rectangle whose bottom edge has many vertices and whose top corners are isolated. The check drags
the top-right corner 40 px up and releases the button, with a ring of 603 and of 20,003 positions, once without moving
the map and once after panning it 50 px. It counts the marker features Geoman updates in its internal source
(`updateData`) during the drag and at the release, and measures the time from the release to the map's `idle` event.

`npm run dev` opens the same page for a manual try (`?n=600` or `?n=20000`).

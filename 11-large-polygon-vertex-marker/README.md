# Dragging a vertex of a large polygon: the vertex marker stays at the drag start

`edit` / `change` mode, maplibre-geoman-free 0.10.7, maplibre-gl 6.14.0.

`npm install`, then `npm run check` (needs Google Chrome, or `CHROME_PATH`).

The page imports a rectangle whose bottom edge has many vertices and whose top corners are isolated. The check drags
the top-right corner 40 px up and releases the button, once with a ring of 103 positions and once with 603. After the
release it reports how many positions changed, how far the vertex moved, and the distance from the moved vertex and
from the drag start to the nearest vertex marker.

`npm run dev` opens the same page for a manual try (`?n=100` or `?n=600`): drag the top-right corner, release, then try
to grab it again.

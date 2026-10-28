# geoman-repro-cancellable-hook

Reproduction for a feature request: a public, cancellable hook before create, update and vertex removal.

A triangle is imported, `edit` / `change` mode is enabled, and a vertex is right-clicked. The page logs public events (`gm:create`, `gm:remove`, `gm:edit`, `gm:editend`) and internal events seen by the global listener, each with the store size at that moment.

Uses `@geoman-io/maplibre-geoman-free` 0.10.2 and `maplibre-gl` 6.14.0.

```sh
npm install
npm run dev     # open the page and right-click a vertex of the triangle
npm run check   # headless run (Chrome, or set CHROME_PATH), prints the events
```

# Vertex press on a 19,000-vertex polygon (Pro)

Imports a polygon with id `big` (19,000 vertices), selects it in `edit/change` mode, then presses a vertex and drags it a few pixels. `npm run check` runs the gesture three times: `renderSelection: true`, `renderSelection: true` with the suggested fix applied at runtime (`?fix=1`), and `renderSelection: false`.

```sh
cp .npmrc.example .npmrc   # put your license key in .npmrc
npm install
npm run check              # headless Chrome via Playwright; set CHROME_PATH if needed
```

URL parameters for `npm run dev`: `n` (vertex count), `renderSelection=false`, `fix=1`, `probe=1` (records the largest number of pending adds seen while a remove is pending, in `window.__probe`).

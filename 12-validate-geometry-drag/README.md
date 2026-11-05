# validateGeometry: a vertex drag that makes the ring cross itself throws uncaught errors

`edit` / `change` mode with `validateGeometry: true`, Maplibre-Geoman Pro 0.13.7, maplibre-gl 6.14.0.

The page imports a square. The check drags its south-west corner beyond the east side in 10 pointer moves, so the
ring crosses itself during the last moves. For `validateGeometry: true` and `false`, it reports the uncaught page
errors per pointer move, the `gm:operation_rejected` reasons, and where the corner ends up. It then calls
`edit.setGeometry` with a crossing ring for comparison.

## Run

1. Copy `.npmrc.example` to `.npmrc` and put your Geoman Pro license key in it.
2. `npm install`
3. `npm run check` (needs Google Chrome, or `CHROME_PATH`). `npm run dev` opens the same page for a manual try
   (`?validate=1` or `?validate=0`).

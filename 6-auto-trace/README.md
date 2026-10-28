# Auto trace reproduction

Imports a non-editable polygon (41 vertices, vertices 10 and 11 about 0.5 m apart, in the same 1e-5° cell), enables snapping and auto trace, draws a polygon by clicking vertices 5, 16, 27 and 5 again, then prints which neighbour vertices the created polygon contains.

1. Copy `.npmrc.example` to `.npmrc` and put your Geoman Pro license key in it.
2. `npm install`
3. `npm run check`

The check uses the installed Google Chrome. Set `CHROME_PATH` to use another Chromium executable. `npm run dev` opens the same page in a browser.

With `@geoman-io/maplibre-geoman-pro` 0.13.2 we get:

```
created MultiPolygon 22 vertices; ring indexes: 5 6 7 8 9 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
missing ring vertices: 0 1 2 3 4 10 28 29 30 31 32 33 34 35 36 37 38 39 40
```

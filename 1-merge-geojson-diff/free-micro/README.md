# mergeGeoJsonDiff with a pending remove (free)

Merges N single-feature `add` diffs into a diff that has one pending `remove`, with the current `mergeGeoJsonDiff` and then with the suggested fix. No license needed.

```sh
npm install
npm run check   # headless Chrome via Playwright; set CHROME_PATH if Chrome is not in the default location
npm run fuzz    # compares the published mergeGeoJsonDiff with both fix variants on 5,000 random diff sequences
```

`npm run dev` opens the same page in a browser; the timings are printed at the bottom left.

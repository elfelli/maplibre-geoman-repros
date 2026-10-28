# Options merge: arrays that are not layer styles

Shows that a user array in the Geoman options does not replace the default array.
With `settings.keyboard.bindings`, `[]` keeps the last default key and `['F20']` is merged
index by index with the defaults.

The page creates two maps, because `deleteSelected: []` and `deleteSelected: ['F20']`
can't be in the same config:

- left map: `deleteSelected: []`, `finishShape: []`, `nudge: []`, `cancel: []`, `redo: ['F20']`
- right map: `deleteSelected: ['F20']`

For each requested binding it prints the effective value from `gm.options.settings.keyboard.bindings`.

## With a Pro license

```sh
cp .npmrc.example .npmrc   # then put your license key in .npmrc
npm install
npm run check              # headless Chrome, prints the requested and effective bindings
```

`npm run dev` opens the same page in the browser. `npm run check` uses the installed Chrome;
set `CHROME_PATH` to use another Chromium binary.

## Without a license

`customizer-standalone.mjs` is a copy of `mergeByTypeCustomizer` (free repo, commit a7f7d98)
applied with lodash `mergeWith`, the way `getMergedOptions` does. It prints the result with
the current code and with the suggested fix.

It only needs `lodash-es`. Since `npm install` in this folder would also fetch the Pro package,
run it from an empty folder:

```sh
mkdir standalone && cp customizer-standalone.mjs standalone/ && cd standalone
npm init -y && npm install lodash-es@4.18.1
node customizer-standalone.mjs
```

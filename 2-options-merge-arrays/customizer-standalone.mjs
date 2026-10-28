// No Geoman license needed. Copy of `mergeByTypeCustomizer`
// (packages/core/src/core/options/utils.ts, lines 14-42 at commit a7f7d98, v0.10.2) applied with
// lodash `mergeWith`, the way `getMergedOptions` does (packages/core/src/core/options/index.ts, line 56).
// It also prints the result with the fix suggested in the issue.
// Run from an empty folder: npm init -y && npm install lodash-es@4.18.1 && node customizer-standalone.mjs
import { cloneDeep, countBy, keyBy, mergeWith, values } from 'lodash-es';

const isPartialLayer = (object) =>
  !!object && typeof object === 'object' && 'type' in object && ['symbol', 'fill', 'line', 'circle'].includes(object.type);
const replaceArraysCustomizer = (_objValue, srcValue) => (Array.isArray(srcValue) ? srcValue : undefined);

const layerLogic = (objValue, srcValue) => {
  const baseMap = keyBy(objValue, 'type');
  const countMap = countBy(srcValue, 'type');
  if (Object.values(countMap).some((count) => count > 1)) throw new Error('Multiple layers for the same shape are detected.');
  srcValue.forEach((item) => {
    if (baseMap[item.type]) mergeWith(baseMap[item.type], item, replaceArraysCustomizer);
    else baseMap[item.type] = cloneDeep(item);
  });
  return values(baseMap);
};

// current code (v0.10.2)
const mergeByTypeCustomizer = (objValue, srcValue) => {
  if (!Array.isArray(objValue) || !Array.isArray(srcValue)) return undefined;
  if (srcValue.some((item) => !isPartialLayer(item))) {
    console.warn('  (warn) Wrong partial layer detected for layer styles');
    return undefined;
  }
  return layerLogic(objValue, srcValue);
};

// suggested fix
const isLayerList = (value) => value.length > 0 && value.every(isPartialLayer);
const fixedCustomizer = (objValue, srcValue) => {
  if (!Array.isArray(objValue) || !Array.isArray(srcValue)) return undefined;
  if (!isLayerList(objValue) && !isLayerList(srcValue)) return cloneDeep(srcValue);
  // existing layer styles logic, unchanged
  if (srcValue.some((item) => !isPartialLayer(item))) {
    console.warn('  (warn) Wrong partial layer detected for layer styles');
    return undefined;
  }
  return layerLogic(objValue, srcValue);
};

const keyboardDefaults = { deleteSelected: ['Delete', 'Backspace'], cancel: ['Escape'], redo: ['mod+shift+z', 'mod+y'] };
const cases = [
  ['keyboard, user []', keyboardDefaults, { deleteSelected: [], cancel: [], redo: [] }],
  ['keyboard, user ["F20"]', keyboardDefaults, { deleteSelected: ['F20'], cancel: ['F20'], redo: ['F20'] }],
  [
    'layer styles, partial line style',
    { gm_main: [{ type: 'fill', paint: { 'fill-opacity': 0.4 } }, { type: 'line', paint: { 'line-width': 2, 'line-color': '#000' } }] },
    { gm_main: [{ type: 'line', paint: { 'line-width': 5 } }] },
  ],
  ['layer styles, user []', { gm_main: [{ type: 'fill', paint: {} }, { type: 'line', paint: {} }] }, { gm_main: [] }],
  ['layer styles, two line layers on an empty default', { gm_internal: [] }, { gm_internal: [{ type: 'line', paint: {} }, { type: 'line', paint: {} }] }],
];

for (const [label, customizer] of [['current', mergeByTypeCustomizer], ['with fix', fixedCustomizer]]) {
  console.log(`${label}:`);
  for (const [name, defaults, user] of cases) {
    try {
      console.log(`  ${name} -> ${JSON.stringify(mergeWith(cloneDeep(defaults), cloneDeep(user), customizer))}`);
    } catch (error) {
      console.log(`  ${name} -> throws "${error.message}"`);
    }
  }
}

# GapCheck technical inventory

Source: `gapcheck/index.html` (2860 lines, single file, vanilla JS). All line numbers refer to that file.
Libraries (CDN, lines 8-11): Chart.js 4.4.4, chartjs-plugin-annotation 3.0.1 (auto-registered by UMD), SheetJS xlsx 0.18.5.
Structure: CSS 14-1347, HTML 1350-1698 (login 1354-1379; `#mainApp` opens 1384), `<script>` 1700-2856, closing mainApp div 2857.
`<html lang="es">` static, never changed. `<title>` static: `R&D PROCESS ENGINEERING`.
No localStorage / sessionStorage / cookies anywhere. Nothing persists across reloads (theme, language, login, data, image, marker positions).

---

## 1. Global state variables

| Name | Type | Initial | Line | Notes |
|---|---|---|---|---|
| `translations` | const `{es:{...},en:{...}}` | see sec. 10 | 1702-1795 | |
| `currentLang` | string | `'es'` | 1797 | set by `setLanguage` |
| `chart` | Chart instance/null | `null` | 1798 | |
| `rawData` | array | `[]` | 1799 | UNUSED |
| `points` | `Array<{name:string, values:number[]}>` | `[]` | 1800 | one per spreadsheet column with >=1 numeric value |
| `gapCheckTarget` | number (mm) | `5` | 1801 | recomputed by `computeGapCheck` (init call at 2607) |
| `coveringType` | `'hard'`/`'soft'` | `'hard'` | 1802 | |
| `dropZone` | DOM `#dropZone` | | 2169 | |
| `visiblePoints` | `Set<number>` (0-based point idx) | `new Set()` | 2250 | reset to all in `processData` |
| `visibleIters` | `Set<number>` (0-based iteration idx) | `new Set()` | 2251 | reset to all in `processData` |
| `_maxIter` | number | `0` | 2252 | `Math.max(...points.map(p=>p.values.length))` |
| `PALETTE_SOLID` | const string[15] | `'#4f8cff','#8b5cf6','#43b36b','#f59e0b','#ef5b67','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1','#14b8a6','#a855f7','#0ea5e9','#d97706','#10b981'` | 2254-2258 | iteration colors (chart + chips), index `j % 15`; also used by export markers |
| `gapLayoutImageLoaded` | boolean | `false` | 2612 | |
| `gapPointMarkers` | `Array<{element, pointIndex, x, y}>` | `[]` | 2613 | x,y = PERCENT (0-100) |
| `markerSize` | number px | `44` | 2614 | slider |
| `POINT_COLORS` | const string[15] | `'#4f8cff','#ef5b67','#43b36b','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1','#14b8a6','#a855f7','#0ea5e9','#d97706','#10b981'` | 2616-2620 | ON-SCREEN marker colors (differs from PALETTE_SOLID at idx 1,3,4) |
| `gapLayoutDropZone`, `gapLayoutImageInput`, `gapLayoutCanvasEl` (`<img>`), `gapLayoutCanvasWrap`, `gapMarkersContainer` | DOM refs | | 2622-2626 | |
| `markerSizeSlider`, `markerSizeValue` | DOM refs | | 2807-2808 | |
| `loginForm`, `passwordInput`, `loginMessage`, `loginScreen`, `mainApp` | DOM refs | | 2826-2830 | |

`visiblePoints/visibleIters/_maxIter/PALETTE_SOLID` are declared after `processData` (2205) but before any call: fine.

---

## 2. Functions

### 2A. PURE CALCULATION logic (port byte-identical)

#### computeGapCheck (2147-2166) - target formula
Reads `coveringType`; hard: `#skinThickness`, `#compressionPct`; soft: `#skinThicknessSoft`, `#foamThickness`, `#compressionPctSoft`. Writes `gapCheckTarget`, `#gapcheckValue.textContent`, `#gapcheckFormula.innerHTML`.
```js
// hard
const skin = parseFloat(document.getElementById('skinThickness').value) || 0;
const pct = parseFloat(document.getElementById('compressionPct').value) || 0;
const factor = 1 - pct / 100;
result = skin * factor;
formula = `Skin × (1 - ${pct}%)  →  ${skin} × ${factor.toFixed(2)} = <strong>${result.toFixed(2)} mm</strong>`;
// soft
const skin = parseFloat(document.getElementById('skinThicknessSoft').value) || 0;
const foam = parseFloat(document.getElementById('foamThickness').value) || 0;
const pct = parseFloat(document.getElementById('compressionPctSoft').value) || 0;
const factor = 1 - pct / 100;
result = skin + foam * factor;
formula = `Skin + Foam × (1 - ${pct}%)  →  ${skin} + ${foam} × ${factor.toFixed(2)} = <strong>${result.toFixed(2)} mm</strong>`;
// common
gapCheckTarget = result;
document.getElementById('gapcheckValue').textContent = result.toFixed(2);
document.getElementById('gapcheckFormula').innerHTML = formula;
```
Empty/NaN input -> 0. `pct`, `skin`, `foam` are interpolated RAW (default Number toString); only factor/result use toFixed(2). Formula has two literal spaces around `→` (collapsed by HTML). No clamping in JS (min/max attrs only): negative target / pct>100 possible.
Initial static HTML (replaced by init call at 2607): `Skin × 50% &nbsp;→&nbsp; 10 × 0.50`, value `5.00`.

#### Overview stats + compliance (applyChartFilters step 1-2, 2336-2363)
```js
const target = gapCheckTarget;
const visibleValues = [];
points.forEach((p, i) => {
    if (visiblePoints.has(i)) {
        p.values.forEach((v, iterIdx) => {
            if (visibleIters.has(iterIdx) && v !== undefined && v !== null) visibleValues.push(v);
        });
    }
});
if (visibleValues.length > 0) {
    const avg = visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length;
    totalRecords.textContent = visiblePoints.size;
    avgValue.textContent = avg.toFixed(2);
    minValue.textContent = Math.min(...visibleValues);   // no toFixed
    maxValue.textContent = Math.max(...visibleValues);   // no toFixed
    const meetingCount = visibleValues.filter(v => v <= target).length;
    meetingTarget.textContent = meetingCount + ' / ' + visibleValues.length;
} else { '0','0','0','0','0 / 0' }   // totalRecords, avg, min, max, meetingTarget
```
Compliance is `v <= target` (inclusive, no epsilon, no tolerance). Summation order: points in order then iterations in order.

#### Status classification (table, 2368-2380)
```js
const tolerance = target * 0.10;
if (value <= target)                  -> t.statusMet,     'status-good'
else if (value <= target + tolerance) -> t.statusWarning, 'status-warning'
else                                  -> t.statusNotMet,  'status-danger'
```

#### Chart point styling (2401-2406)
```js
ds.pointStyle       = dataPts.map(pt => pt.y <= target ? 'circle' : 'crossRot');
ds.pointRadius      = dataPts.map(pt => pt.y <= target ? 7 : 9);
ds.pointHoverRadius = dataPts.map(pt => pt.y <= target ? 10 : 12);
ds.borderWidth      = dataPts.map(pt => pt.y <= target ? 1.5 : 3);
```
Hidden iteration: `ds.data = []; pointStyle = []; pointRadius = []; pointHoverRadius = []; borderWidth = [];`

#### iterDataset (2321-2329)
```js
return points.map((p, i) => {
    if (!visiblePoints.has(i)) return null;
    const val = p.values[iterIdx];
    return (val !== undefined && val !== null) ? { x: i + 1, y: val } : null;
}).filter(Boolean);
```

#### Compression axis mapping (right-axis tick callback, 2531-2556)
```js
callback: function(value) {
    let compressionPercent;
    if (coveringType === 'hard') {
        const skinValue = parseFloat(document.getElementById('skinThickness').value) || 0;
        if (skinValue === 0) return '0%';
        compressionPercent = ((skinValue - value) / skinValue) * 100;
    } else {
        const skinValue = parseFloat(document.getElementById('skinThicknessSoft').value) || 0;
        const foamValue = parseFloat(document.getElementById('foamThickness').value) || 0;
        if (foamValue === 0) return '0%';
        const foamComprimidoActual = value - skinValue;
        compressionPercent = ((foamValue - foamComprimidoActual) / foamValue) * 100;
    }
    return compressionPercent.toFixed(0) + '%';
}
```
Left tick: `value.toFixed(2) + ' mm'`. The callback reads LIVE DOM inputs and `coveringType` at draw time (not the values at last "Update Comparison").

#### Other pure helpers
- `hexToRgba(hex, alpha)` (2312-2317): `` `rgba(${r},${g},${b},${alpha})` `` (no spaces), r/g/b via `parseInt(hex.slice(1,3),16)` etc.
- Default marker distribution (2678-2720) - sec. 8. Export scaling - sec. 9.

### 2B. UI / DOM functions

| Function | Lines | Purpose / side effects |
|---|---|---|
| `toggleTheme` (1st def) | 1805-1815 | DEAD: references missing `#themeIcon`; overridden by later declaration at 2094 |
| `toggleDropdown()` | 1818-1820 | `#settingsMenu` classList.toggle('show') |
| `closeDropdown()` | 1822-1824 | remove 'show' |
| `window.onclick` | 1827-1836 | if target not in `.dropdown`, remove 'show' from `.dropdown-content` |
| `exportToPNG()` | 1839-2079 | async (no awaits); sec. 9 |
| `setTheme(theme)` | 2081-2092 | set/remove `data-theme="dark"` on `<html>` (light = attribute removed); toggle `.active` on `#btnThemeDark`/`#btnThemeLight`; `#themeLogo.src = isDark ? 'logo2.png' : 'logo1.png'`; `if (chart) updateComparison();` |
| `toggleTheme()` | 2094-2096 | `setTheme(dark?'light':'dark')`; unwired |
| `setLanguage(lang)` | 2099-2105 | set `currentLang`; toggle `.active` `#btnLangEs/#btnLangEn`; `updateTranslations()`; `if (chart) updateComparison()` |
| `toggleLanguage()` | 2107-2109 | unwired |
| `updateTranslations()` | 2111-2125 | textContent of `#pageTitle`, `#pageSubtitle`, `#uploadSubtitle`; innerHTML `#dropText`; every `[data-i18n]`: `if (t[key])` TH -> textContent else innerHTML |
| `toggleCollapsible(header)` | 2128-2134 | toggle `.active` on header and `.open` on `header.nextElementSibling`; icon `.collapsible-icon` text `'-'` if open else `'+'`. CSS `.collapsible-content{max-height:0;overflow:hidden;transition:max-height .35s ease}` `.open{max-height:1500px}` |
| `onCoveringTypeChange(type)` | 2137-2144 | set `coveringType`; toggle `.hidden` on `#hardInputs`/`#softInputs`; `#btnHard.className='covering-btn'+(hard?' active-hard':'')`, `#btnSoft.className='covering-btn'+(soft?' active-soft':'')`; `computeGapCheck()` (no chart update) |
| `computeGapCheck()` | 2147-2166 | above; called on every covering input `oninput`, type change, `updateComparison`, and load (2607) |
| dropZone listeners | 2171-2184 | dragover(preventDefault,+`dragover`), dragleave(-), drop(preventDefault,-,`handleFile(e.dataTransfer.files[0])`) |
| `handleFile(file)` | 2186-2203 | sec. 3 |
| `processData(jsonRows)` | 2205-2247 | sec. 3 |
| `buildFilterChips()` | 2260-2310 | sec. 5 |
| `applyChartFilters()` | 2331-2410 | stats, table, dataset data, `chart.update()` |
| `createChart()` | 2412-2598 | destroy/recreate chart; then `buildFilterChips(); applyChartFilters();` |
| `updateComparison()` | 2600-2604 | `if (points.length === 0) return; computeGapCheck(); createChart();` |
| `handleGapLayoutImage` | 2644-2662 | sec. 8 |
| `createGapPointMarkers` | 2664-2732 | sec. 8 |
| `makePointMarkerDraggable` | 2734-2802 | sec. 8 |
| slider `input` listener | 2810-2821 | sec. 8 |
| login `submit` listener | 2832-2852 | sec. 11 |
| load calls | 2607, 2855 | `computeGapCheck()`, `updateTranslations()` |

DOM ids written: `fileName`, `dropZone`(class), `totalRecords`, `avgValue`, `minValue`, `maxValue`, `meetingTarget`, `tableBody`, `chartFilters`(style.display='flex'), `iterFilterChips`, `pointFilterChips`, `gapcheckValue`, `gapcheckFormula`, `hardInputs`, `softInputs`, `btnHard`, `btnSoft`, `settingsMenu`, `btnThemeDark/Light`, `btnLangEs/En`, `themeLogo`, `pageTitle`, `pageSubtitle`, `uploadSubtitle`, `dropText`, `markerSizeControl`, `markerSizeValue`, `gapLayoutFileName`, `gapLayoutCanvas`, `gapLayoutCanvasWrap`, `gapLayoutDropZone`, `gapMarkersContainer`, `loginMessage`, `loginScreen`, `mainApp`, `passwordInput`.
Read: `skinThickness`, `compressionPct`, `skinThicknessSoft`, `foamThickness`, `compressionPctSoft`, `mainChart`, `markerSizeSlider`, and in export the text of `totalRecords/meetingTarget/avgValue/minValue/maxValue`.
Logo fallback via inline `onerror/onload` (1364-1366, 1400).

---

## 3. Excel import

`<input type="file" id="fileInput" accept=".xlsx,.xls,.csv" onchange="handleFile(this.files[0])">` (1469), overlays the drop zone (absolute, opacity 0, z-index 10). Drop on `#dropZone` also calls `handleFile`.

`handleFile(file)` (2186-2203):
1. `if (!file) return;`
2. `#fileName.textContent = file.name; dropZone.classList.add('loaded')` (BEFORE parsing; even if parsing fails).
3. `FileReader.readAsArrayBuffer`; onload: `new Uint8Array(e.target.result)`; `XLSX.read(data, {type:'array'})`; `sheetName = workbook.SheetNames[0]` (always FIRST sheet); `XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })` -> array of arrays, empty = `null`; `processData(jsonRows)`.
4. CSV goes through the same `XLSX.read` (SheetJS parses CSV; no special code). No try/catch, no `reader.onerror`, no type/size validation (drop bypasses `accept`).

`processData(jsonRows)` (2205-2247) verbatim:
```js
if (!jsonRows || jsonRows.length === 0) return;
const firstRow = jsonRows[0] || [];
const hasHeaders = firstRow.some(
    cell => typeof cell === 'string' && cell.trim() !== '' && isNaN(cell)
);
const dataStart = hasHeaders ? 1 : 0;
const numCols = Math.max(...jsonRows.map(r => (r || []).length));
points = [];
for (let col = 0; col < numCols; col++) {
    const rawName = hasHeaders ? firstRow[col] : undefined;
    const name = (rawName !== undefined && rawName !== null && String(rawName).trim() !== '')
        ? String(rawName).trim()
        : `P${col + 1}`;
    const values = [];
    for (let row = dataStart; row < jsonRows.length; row++) {
        const cell = (jsonRows[row] || [])[col];
        if (typeof cell === 'number' && !isNaN(cell)) {
            values.push(cell);
        } else if (typeof cell === 'string' && cell.trim() !== '' && !isNaN(parseFloat(cell))) {
            values.push(parseFloat(cell));
        }
    }
    if (values.length > 0) points.push({ name, values });
}
if (points.length === 0) return;
_maxIter = Math.max(...points.map(p => p.values.length));
visiblePoints = new Set(points.map((_, i) => i));
visibleIters = new Set(Array.from({ length: _maxIter }, (_, i) => i));
document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('hidden'));
updateComparison();
if (gapLayoutImageLoaded) createGapPointMarkers();
```
Mapping: each COLUMN = one POINT (name = header cell trimmed, else `P{col+1}` with ORIGINAL column number); each numeric ROW below the header = one ITERATION. Iteration index = order of accepted values in that column (blank/non-numeric cells are skipped, NOT kept as gaps, so later values shift).
Accepted cells: JS numbers (non-NaN); strings non-empty with `parseFloat` not NaN (`"12abc"`->12, `"1,5"`->1, `" 3.2 "`->3.2). null/booleans/errors skipped. Columns with 0 numeric values are dropped (point indices and x positions are renumbered).
Header detection: first row has >=1 non-empty string that is non-numeric. Numeric-only header row (1,2,3) is treated as data.
Validation / error messages: NONE (silent returns on empty file / no numeric data; UI still shows file name and green loaded state). Only effect on success: ALL `.collapsible` elements lose `.hidden`.
Re-import: replaces `points`, resets filters, rebuilds chart, recreates layout markers (default positions) if image already loaded. Selecting the same file twice does not re-fire onchange (value not cleared).

---

## 4. Summary KPI cards (HTML 1486-1526; values set 2348-2363)

Order PTS, AVG, MIN, MAX, OK. Chip texts static, untranslated: `PTS`, `AVG`, `MIN`, `MAX`, `OK` (colors: PTS blue-bg/blue-text; AVG purple-bg/purple-text; MIN green; MAX amber; OK cyan). Section title key `overview` (ES "Resumen de Datos", EN "Data Overview"), emoji 📈.

| Card | value id | i18n key | ES | EN | Initial | Value / format |
|---|---|---|---|---|---|---|
| PTS | `totalRecords` | `points` | Puntos Medidos | Measurement Points | `0` | `visiblePoints.size` (integer) ; `'0'` if no visible values |
| AVG | `avgValue` | `avgValue` | Promedio Global | Global Average | `0` | `avg.toFixed(2)`; `'0'` if empty |
| MIN | `minValue` | `minValue` | Valor más bajo | Lowest Value | `0` | `Math.min(...visibleValues)` raw; `'0'` if empty |
| MAX | `maxValue` | `maxValue` | Valor más alto | Highest Value | `0` | `Math.max(...visibleValues)` raw; `'0'` if empty |
| OK | `meetingTarget` | `meetingTarget` | Cumplen Objetivo | Meeting Target | `0%` | `meetingCount + ' / ' + visibleValues.length`; `'0 / 0'` if empty (a count ratio, not percent) |

No units on cards. They respond to point & iteration chips. Export reuses their `textContent`.

---

## 5. Chart (createChart 2412-2598; applyChartFilters step 4 2392-2409)

Canvas `#mainChart` in `.chart-wrapper` (height 450px, width 100%, canvas `100% !important`). Section title key `chart` (ES "Gráfica de Datos", EN "Data Chart"), emoji 📊.
`isDark = documentElement.getAttribute('data-theme') === 'dark'`; `gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'`; `textColor = isDark ? '#a9b6cd' : '#5f6b7d'`; `xTickLabels = points.map(p => p.name)`.

Type `'scatter'`; `responsive:true, maintainAspectRatio:false`.
Datasets: ONE PER ITERATION (`Array.from({ length: _maxIter }, (_, j) => ...)`), points = measured points (x = point position 1..N, y = value):
```js
{ label: `Iter ${j + 1}`, data: [], backgroundColor: hexToRgba(color, 0.82), borderColor: color,
  borderWidth: 1.5, pointRadius: 7, pointHoverRadius: 10, pointStyle: 'circle', showLine: false }
// color = PALETTE_SOLID[j % PALETTE_SOLID.length]
```
Then per-point arrays set by applyChartFilters (circle/7/10/1.5 if `y <= target`, else `'crossRot'`/9/12/3).

Target line (annotation plugin) only `if (gapCheckTarget > 0)`:
```js
annotations.gapLine = {
    type: 'line', yMin: gapCheckTarget, yMax: gapCheckTarget,
    borderColor: '#43b36b', borderWidth: 2.5, borderDash: [6, 3],
    label: { display: true, content: `GapCheck: ${gapCheckTarget.toFixed(2)} mm`, position: 'end',
             backgroundColor: '#43b36b', color: '#fff', font: { size: 11, weight: '700' } }
};
plugins.annotation = { annotations }
```
Label text same in ES/EN. Line is baked at chart creation (changes only on rebuild).

Legend: `{ display:true, position:'bottom', labels:{ filter:(item)=>visibleIters.has(item.datasetIndex), color:textColor, font:{size:12,weight:'600'}, padding:15, usePointStyle:true, pointStyleWidth:14 } }`. No custom onClick -> default Chart.js legend click hides dataset, NOT synced with chips.

Tooltip:
```js
backgroundColor: isDark ? '#1a2742' : '#ffffff', titleColor: isDark ? '#edf3ff' : '#142033',
bodyColor: isDark ? '#a9b6cd' : '#5f6b7d', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
borderWidth: 1, padding: 12, cornerRadius: 10, displayColors: true,
callbacks: {
  title: (items) => { if (!items.length) return ''; const ptIdx = Math.round(items[0].parsed.x) - 1; return xTickLabels[ptIdx] || `P${ptIdx + 1}`; },
  label: (item) => ` ${item.dataset.label}: ${item.parsed.y} mm`   // leading space, raw y
}
```

Scales:
- `y` (left): `position:'left', beginAtZero:false` (auto range), `grid:{color:gridColor}`, title `display:true`, text ES `'Medición de Espesor (mm)'` / EN `'Thickness Measurement (mm)'`, `color:textColor, font:{size:12,weight:'700'}`; ticks `color:textColor, font:{size:11,weight:'600'}, callback: value.toFixed(2) + ' mm'`.
- `yPercentage` (right mirror axis, no datasets): `position:'right', beginAtZero:false, grid:{display:false}`, title ES `'Compresión Real (%)'` / EN `'Actual Compression (%)'` (same style as y title), ticks `color:textColor, font:{size:11,weight:'600'}`, callback = compression formula (2A), `min: ctx => ctx.chart.scales.y.min`, `max: ctx => ctx.chart.scales.y.max`, `afterBuildTicks: axis => { if (chart && chart.scales.y) axis.ticks = chart.scales.y.ticks.map(tick => ({ value: tick.value, label: tick.value })); }`. Intent: identical tick positions as left axis. Caveat: during first build `chart` is the stale/destroyed instance or null; `chart.update()` in applyChartFilters corrects it. In a port: mirror left ticks and apply the formula.
- `x`: `type:'linear', min:0, max: points.length + 1, grid:{color:gridColor}`, ticks `color:textColor, font:{size:11,weight:'600'}, stepSize:1, maxRotation:45, callback:(val)=>{ const idx = Math.round(val) - 1; return (idx >= 0 && idx < xTickLabels.length) ? xTickLabels[idx] : ''; }`. No x title.

Filter chips (`buildFilterChips` 2260-2310): `#chartFilters` set to `display:flex`; groups Points (`filterPoints`: ES "Puntos"/EN "Points") and Iterations (`filterIterations`: ES "Iteraciones"/EN "Iterations").
- Iteration chip: class `filter-chip iter-chip active`, content `<span class="chip-dot" style="background:${color}"></span>Iter ${j + 1}`, inline `borderColor=color; backgroundColor=hexToRgba(color,0.12); color=color`. Click: toggle j in `visibleIters`, toggle `.active`; visible -> re-apply those inline styles, hidden -> clear to `''`; `applyChartFilters()`.
- Point chip: class `filter-chip active`, `textContent = point.name`. Click: toggle i in `visiblePoints`, toggle `.active`, `applyChartFilters()`.
- Effects: dataset data (x only for visible points; hidden iteration => empty dataset), stats, table, legend entries. X axis range does not shrink.
- Observed bug: chips are always rebuilt as `.active` even if Sets exclude items (after theme/lang/Update rebuild).

---

## 6. Target values section (HTML 1561-1631)

Header 🎯 + `targets` (ES "Valores Objetivo", EN "Target Values"); open by default.
Untranslated static text: `Tipo de Covering` (1570), buttons `Hard Covering` / `Soft Covering`, eyebrow `GapCheck Objetivo` (1621), unit `mm`, `%` suffix.
Buttons `#btnHard` (initial `covering-btn active-hard`) / `#btnSoft`, `onclick="onCoveringTypeChange('hard'|'soft')"`. active-hard = gray border/bg, active-soft = blue.

Hard (`#hardInputs`, visible by default):
- `#skinThickness`: number, value 10, min 0, step 0.1, `oninput="computeGapCheck()"`; label key `skinThicknessLabel` (ES "Espesor de Skin (mm)", EN "Skin Thickness (mm)").
- `#compressionPct`: number, value 50, min 0, max 100, step 1, oninput computeGapCheck; label `compressionLabel` (ES "Compresión Buscada", EN "Target Compression").
Soft (`#softInputs`, `.hidden` by default):
- `#skinThicknessSoft`: value 10, min 0, step 0.1.
- `#foamThickness`: value 50, min 0, step 0.1; label `foamThicknessLabel` (ES "Espesor de Foam (mm)", EN "Foam Thickness (mm)").
- `#compressionPctSoft`: value 50, min 0, max 100, step 1.
Hard and soft fields are independent.

Result box: `#gapcheckValue` = `result.toFixed(2)` (initial 5.00) + static `mm`; `#gapcheckFormula` innerHTML:
- Hard default: `Skin × (1 - 50%)  →  10 × 0.50 = <strong>5.00 mm</strong>`
- Soft default: `Skin + Foam × (1 - 50%)  →  10 + 50 × 0.50 = <strong>35.00 mm</strong>`

Button: `<button class="btn btn-primary" onclick="updateComparison()"><span>🔄</span> <span data-i18n="updateBtn">`: ES "Actualizar Comparación", EN "Update Comparison". Behavior: no points -> nothing; else `computeGapCheck()` + `createChart()` (destroy/rebuild chart, chips, `applyChartFilters`).
While typing only `computeGapCheck()` runs: result box and `gapCheckTarget` update immediately; chart line/axis, stats, table update only on the button (or theme/lang change/new file). Later chip clicks use the new target for stats/table/point styles, but the annotation line stays old until rebuild (observed inconsistency).
Section is `.hidden` until a file parses successfully.

---

## 7. Data table (HTML 1634-1655; rows built 2365-2390)

Header 📋 + `table` (ES "Tabla de Datos", EN "Data Table"); initially COLLAPSED (header without `active`, icon `+`, content without `open`). Open height capped `max-height:1500px` with `overflow:hidden` -> long tables are clipped (observed).
Columns (data-i18n, TH textContent): `thPoint` (Punto/Point), `thIteration` (Iteración/Iteration), `thValue` (Valor/Value), `thTarget` (Objetivo/Target), `thStatus` (Estado/Status).
Rows: for each visible point (in order) and each iteration (in order) with `visibleIters.has(iter)` and non-null value:
```html
<tr>
    <td style="font-weight:700;color:var(--blue-text)">${point.name}</td>
    <td style="color:var(--text-2);font-weight:600">${iter + 1}</td>
    <td style="font-weight:700;color:var(--text)">${value}</td>
    <td style="color:var(--text-2);font-weight:600">${target.toFixed(2)} mm</td>
    <td><span class="status-badge ${statusClass}">${status}</span></td>
</tr>
```
(built via `tbody.innerHTML +=`). Value raw (no rounding); Target `toFixed(2)` + ` mm`.
Status text: ES `✅ Cumple` / `⚠️ Cerca` / `❌ No cumple`; EN `✅ Met` / `⚠️ Close` / `❌ Not Met`. Highlight ONLY via badge (no row/cell tint): `.status-badge` padding 5px 12px, radius 999px, 11px/800; `status-good` (bg `--green-bg`, text `--green-text`), `status-warning` (`--amber-bg`/`--amber-text`), `status-danger` (`--red-bg`/`--red-text`). Row hover bg `--panel-2`. Names inserted unescaped (HTML injection risk).
Theme values: light green `#eaf9ef`/`#217543`, amber `#fff5df`/`#9a6800`, red `#ffecee`/`#b82c3f`; dark green `#10281a`/`#9ae5b1`, amber `#322712`/`#ffd78f`, red `#34131a`/`#ffb0ba`; blue-text light `#235fd2`/dark `#a8cbff`; text-2 `#5f6b7d`/`#a9b6cd`; text `#142033`/`#edf3ff`.
Rebuilt on every `applyChartFilters`; language change updates it via `setLanguage -> updateComparison`.

---

## 8. Gapcheck Layout (HTML 1658-1693; JS 2612-2821)

Header 📐 + `gapLayout` (ES/EN "Gapcheck Layout"); open by default; hidden until data parsed. Subtitle `gapLayoutSubtitle`. `#gapLayoutContainer`: `min-height:600px; max-height:800px; overflow:auto`.

Upload: `#gapLayoutImageInput` (`accept="image/*"`) inside `#gapLayoutDropZone`; also dragover/dragleave/drop (2628-2639). Text key `gapLayoutDrop`.
`handleGapLayoutImage(file)` (2644-2662): if `!file.type.startsWith('image/')` -> `alert(currentLang === 'es' ? 'Por favor selecciona una imagen' : 'Please select an image')`; else `readAsDataURL` -> `gapLayoutCanvasEl.src = dataURL`; `img.onload`: `gapLayoutImageLoaded = true`; drop zone `.loaded` (display:none); wrap `.active` (display:block); `#markerSizeControl` display `flex`; `#gapLayoutFileName.textContent = file.name`; `if (points.length > 0) createGapPointMarkers()`. Image cannot be replaced after load (drop zone hidden). If Excel loads after the image, `processData` calls `createGapPointMarkers()`.
`<img class="layout-canvas">`: `width:100%; height:auto; min-height:600px; object-fit:contain; pointer-events:none`. Instruction bar (`gapLayoutInstructions`, sticky). `#gapLayoutCanvasWrap`: `position:relative; width:100%; min-height:600px; padding:10px`. `#gapMarkersContainer`: `position:absolute; inset:0` over the wrap.

Marker size: `#markerSizeSlider` range min 20 max 60 step 2 value 44; label `markerSizeLabel` (ES "Tamaño de Puntos:", EN "Point Size:"); `#markerSizeValue` text `${markerSize}px`. Slider input: `markerSize = parseInt(this.value)`; each marker: `width/height = markerSize+'px'`, `fontSize = Math.max(9, markerSize * 0.27) + 'px'`, `borderRadius = (markerSize / 4.4) + 'px'`.

`createGapPointMarkers()` (2664-2732): returns if no image or no points; clears container & `gapPointMarkers`; per point a `.gap-marker` div (default 44x44, `transform: translate(-50%,-50%)` so left/top = CENTER; `font-size 12px; weight 900; color #fff; border 2.5px solid rgba(255,255,255,.45); radius 10px; cursor move`): `backgroundColor = POINT_COLORS[i % POINT_COLORS.length]`, `textContent = point.name`, `dataset.label`, `dataset.pointIndex = i`. Initial position (percent of wrap), `count = points.length`, in every multi-row branch `row = Math.floor(i / cols); col = i % cols`:
```js
count <= 3:  x = 20 + i * 60 / count;                 y = 50;
count <= 6:  cols = Math.ceil(count / 2); x = 15 + (col * 70 / cols); y = 30 + row * 40;
count <= 12: cols = Math.ceil(count / 3); x = 10 + (col * 80 / cols); y = 25 + row * 30;
count <= 20: cols = Math.ceil(count / 4); x = 8  + (col * 84 / cols); y = 20 + row * 22;
count <= 30: cols = Math.ceil(count / 5); x = 6  + (col * 88 / cols); y = 15 + row * 18;
else:        cols = Math.ceil(count / 6); x = 5  + (col * 90 / cols); y = 12 + row * 15;
```
Then `style.left = x + '%'`, `style.top = y + '%'`, width/height/fontSize/borderRadius as slider, `makePointMarkerDraggable(marker)`, append, `gapPointMarkers.push({ element: marker, pointIndex: i, x, y })`.
Markers show only the point NAME (no value/status). Not hidden on-screen when a point chip is off (only export skips them). Hover scale 1.15, dragging scale 1.25.

Dragging (mouse: mousedown(preventDefault) + document mousemove/mouseup; touch: touchstart/touchmove/touchend):
```js
// start
const c = gapLayoutCanvasWrap.getBoundingClientRect(); sX = e.clientX; sY = e.clientY;
const r = marker.getBoundingClientRect(); mX0 = r.left - c.left; mY0 = r.top - c.top;
// move
const nx = Math.max(0, Math.min(mX0 + (e.clientX - sX), c.width - markerSize));
const ny = Math.max(0, Math.min(mY0 + (e.clientY - sY), c.height - markerSize));
marker.style.left = (nx / c.width) * 100 + '%'; marker.style.top = (ny / c.height) * 100 + '%';
// release
m.x = parseFloat(marker.style.left); m.y = parseFloat(marker.style.top);   // m found by pointIndex
```
Observed bugs: (a) translate(-50%,-50%) centering vs top-left math -> half-size jump at first drag and offset clamp; (b) on-screen % are relative to the wrap (with 10px padding and instruction bar area), export treats the same % as relative to the displayed IMAGE; (c) export colors differ from screen colors.
Persistence: none (reset whenever markers are recreated: new Excel or new image).

---

## 9. Export PNG (`exportToPNG`, 1839-2079; menu item 1417 `onclick="exportToPNG(); closeDropdown()"`, key `exportPng`: ES "Exportar PNG", EN "Export to PNG", icon 🖼️)

Guard: `if (!chart) { alert(currentLang === 'es' ? 'No hay datos para exportar.' : 'No data to export.'); return; }`
Sizes: `cWidth = chart.canvas.width; cHeight = chart.canvas.height` (backing-store px, includes DPR); `headerH = 380`; `eCanvas.width = Math.max(cWidth, 1200) + 80`; `eCanvas.height = cHeight + headerH + 40`.
Draw order:
1. Background: `isDark ? '#08111f' : '#f4f7fb'` full canvas.
2. Chart: `xOffset = (eCanvas.width - cWidth) / 2; ctx.drawImage(chart.canvas, xOffset, headerH)`.
3. Title: fill `isDark ? '#edf3ff' : '#142033'`, font `'bold 36px Inter, sans-serif'`, left/top, text `currentLang === 'es' ? 'Gapcheck Análisis' : 'Gapcheck Analysis'` at (50,50).
4. Subtitle: fill `isDark ? '#a9b6cd' : '#5f6b7d'`, font `'600 16px Inter, sans-serif'`, text `new Date().toLocaleString() + `   •   Covering: ${coveringStr}`` (3 spaces around bullet; `coveringStr` = `'Hard Covering'`/`'Soft Covering'`) at (50,95).
5. Colors: `cBg = isDark ? '#0f172a' : '#ffffff'`; `cBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'`; `cText = isDark ? '#edf3ff' : '#0f172a'`; `cTextSub = isDark ? '#71809c' : '#8a95a6'`.
6. `drawStatBadge(badgeText, bgCol, textCol, valueText, subText, x, y)`: card 160x85, roundRect radius 16, fill cBg, stroke cBorder lineWidth 1; badge pill font `'800 10px Inter, sans-serif'`, `badgeW = measureText(badgeText).width + 12`, roundRect(x+16, y+14, badgeW, 18, 6) fill bgCol, text centered at (x+16+badgeW/2, y+23) middle baseline fill textCol; value left/alphabetic fill cText font `'900 24px Inter, sans-serif'` at (x+16, y+58); subtext fill cTextSub font `'500 10px Inter, sans-serif'` at (x+16, y+74).
7. `drawGapcheckBlock(valueText, x, y)`: 160x85, linear gradient (x,y)->(x+160,y+85) dark `#11284c`->`#24183d` / light `#e9f1ff`->`#f3edff`; stroke `#4f8cff`, lineWidth 1.5, radius 16; label fill `isDark ? '#72a8ff' : '#235fd2'`, font `'800 9.5px Inter, sans-serif'`, middle baseline at (x+16, y+23), text `currentLang === 'es' ? 'GAPCHECK OBJETIVO' : 'GAPCHECK TARGET'`; value fill cText font `'900 26px Inter, sans-serif'` alphabetic at (x+16, y+58).
8. Grid: `y1 = 135; y2 = 230; x1 = 50; x2 = x1 + 170 (=220); x3 = x2 + 170 (=390)`.
   Row1: PTS (bg dark `#1a2437`/light `#f0f4f8`; text dark `#a9b6cd`/light `#5f6b7d`; value `#totalRecords` text; sub ES 'Puntos Medidos'/EN 'Measured Pts') at (x1,y1); OK (bg `#0c2d33`/`#e0f7fa`; text `#22d3ee`/`#0e7490`; value `#meetingTarget` text; sub 'Cumplen Objetivo'/'Meeting Target') at (x2,y1); Gapcheck block with `gapCheckTarget.toFixed(2) + ' mm'` at (x3,y1).
   Row2: AVG (bg `#24183d`/`#f3edff`; text `#a78bfa`/`#6942d0`; `#avgValue`; 'Promedio Global'/'Global Average') at (x1,y2); MIN (bg `#10281a`/`#eaf9ef`; text `#59c97f`/`#217543`; `#minValue`; 'Valor más bajo'/'Lowest Value') at (x2,y2); MAX (bg `#322712`/`#fff5df`; text `#f8b84f`/`#9a6800`; `#maxValue`; 'Valor más alto'/'Highest Value') at (x3,y2). (dark/light pairs)
9. Layout diagram, only `if (gapLayoutImageLoaded && gapLayoutCanvasEl && gapLayoutCanvasEl.src)` inside try/catch (`console.error("Error drawing layout to export canvas.", e)`): `boxW = 540; boxH = Math.min(300, headerH - 80)` (=300); `boxX = eCanvas.width - boxW - 50; boxY = 40`; roundRect radius 12, fill `isDark ? '#0f172a' : '#f8fafc'`, then `ctx.stroke()` with leftover style (cBorder, lineWidth 1). Image: `ratio = Math.min((boxW - 40) / nw, (boxH - 40) / nh); dw = nw * ratio; dh = nh * ratio; dx = boxX + (boxW - dw) / 2; dy = boxY + (boxH - dh) / 2; drawImage(img, dx, dy, dw, dh)` (nw/nh = naturalWidth/Height).
   Markers: for each `gapPointMarkers` entry with `visiblePoints.has(m.pointIndex)`: `mx = dx + (m.x / 100) * dw; my = dy + (m.y / 100) * dh; color = palette[m.pointIndex % palette.length]` (palette = same 15 hexes as PALETTE_SOLID, not POINT_COLORS); `baseScaleFactor = 0.68; scaledMarkerSize = Math.max(12, markerSize * ratio * baseScaleFactor); halfSize = scaledMarkerSize / 2; borderRadius = scaledMarkerSize / 4.4`; roundRect(mx-halfSize, my-halfSize, size, size, borderRadius) fill color; `lineWidth = Math.max(1.2, 2.5 * ratio * baseScaleFactor)`, stroke `'rgba(255, 255, 255, 0.45)'`; text fill `'#fff'`, `fontSize = Math.max(7, (markerSize * 0.27) * ratio * baseScaleFactor)`, font `` `900 ${fontSize}px Inter, sans-serif` ``, center/middle, `shadowColor 'rgba(0, 0, 0, 0.4)'`, `shadowBlur 3`, `shadowOffsetY 1`, `fillText(points[m.pointIndex].name, mx, my + 1)`; then shadow reset (`'transparent'`, 0, 0). Afterwards `textAlign='left'; textBaseline='top'`.
10. Download: `eCanvas.toDataURL('image/png')`; `<a>` `download = `Gapcheck-Export-${new Date().toISOString().split('T')[0]}.png`` (UTC date), appended, clicked, removed. Catch: `console.error("Error exporting image", err); alert("Error al exportar. Comprueba que las imágenes subidas no sean remotas (CORS).");` (Spanish only).
Not exported: data table, chips, formula text, input values (only covering type name). Chart canvas is the current rendered chart (with filters, includes its own legend). EN export sub-label 'Measured Pts' differs from UI 'Measurement Points'.

---

## 10. i18n (translations, lines 1702-1795) - verbatim

Applied through `[data-i18n]` (innerHTML; TH uses textContent; only truthy values) plus ids `pageTitle`, `pageSubtitle`, `uploadSubtitle`, `dropText`. Keys never used by any data-i18n or code: `targetMin`, `targetMax`, `toggleTheme`, `changeLanguage`. `loginSuccess`/`loginError` are used by the login handler.

| key | ES | EN |
|---|---|---|
| loginEnter | Ingresar | Enter |
| loginSuccess | Gracias por usar la app | Thank you for using the app |
| loginError | Contraseña incorrecta, por favor ingresa la contraseña correcta | Incorrect password, please enter the correct password |
| pageTitle | Gapcheck Análisis | Gapcheck Analysis |
| pageSubtitle | Sube tu archivo Excel para analizar datos | Upload your Excel file to analyze data |
| importData | Importar Datos | Import Data |
| uploadSubtitle | Selecciona o arrastra tu archivo Excel | Select or drag your Excel file |
| dropText | `<strong>Clic para subir</strong> o arrastra y suelta` | `<strong>Click to upload</strong> or drag and drop` |
| overview | Resumen de Datos | Data Overview |
| points | Puntos Medidos | Measurement Points |
| avgValue | Promedio Global | Global Average |
| minValue | Valor más bajo | Lowest Value |
| maxValue | Valor más alto | Highest Value |
| meetingTarget | Cumplen Objetivo | Meeting Target |
| skinThicknessLabel | Espesor de Skin (mm) | Skin Thickness (mm) |
| foamThicknessLabel | Espesor de Foam (mm) | Foam Thickness (mm) |
| compressionLabel | Compresión Buscada | Target Compression |
| chart | Gráfica de Datos | Data Chart |
| targets | Valores Objetivo | Target Values |
| targetMin | Objetivo Mínimo | Minimum Target |
| targetMax | Objetivo Máximo (opcional) | Maximum Target (optional) |
| updateBtn | Actualizar Comparación | Update Comparison |
| table | Tabla de Datos | Data Table |
| thPoint | Punto | Point |
| thIteration | Iteración | Iteration |
| thValue | Valor | Value |
| thTarget | Objetivo | Target |
| thStatus | Estado | Status |
| statusMet | ✅ Cumple | ✅ Met |
| statusWarning | ⚠️ Cerca | ⚠️ Close |
| statusNotMet | ❌ No cumple | ❌ Not Met |
| gapLayout | Gapcheck Layout | Gapcheck Layout |
| gapLayoutSubtitle | Carga una imagen del diagrama y posiciona cada punto de medición | Load a diagram image and position each measurement point |
| gapLayoutDrop | `Arrastra una imagen del diagrama o <strong>haz clic para seleccionar</strong>` | `Drag a diagram image or <strong>click to select</strong>` |
| gapLayoutInstructions | Arrastra los puntos de medición para ubicarlos en el diagrama | Drag measurement points to position them on the diagram |
| markerSizeLabel | Tamaño de Puntos: | Point Size: |
| toggleTheme | Tema Oscuro / Claro | Dark / Light Mode |
| changeLanguage | Cambiar Idioma | Change Language |
| filterPoints | Puntos | Points |
| filterIterations | Iteraciones | Iterations |
| exportPng | Exportar PNG | Export to PNG |
| themeTitle | Tema | Theme |
| languageTitle | Idioma | Language |
| footerCredit | Desarrollado por CJLB | Developed by CJLB |

Hard-coded, NOT in the dictionary (never translated): login title `Gapcheck Análisis` (1368), login subtitle `R&D Process Engineering`, password placeholder `Contraseña / Password`, login footer `© 2026`; kicker `R&D PROCESS ENGINEERING` (1389) and footer prefix `R&D PROCESS ENGINEERING • `; theme buttons `🌙 Dark` / `☀️ Light`; language buttons `Español` / `English`; `Tipo de Covering`, `Hard Covering`, `Soft Covering`, `GapCheck Objetivo`, `mm`, `%`; stat chips `PTS AVG MIN MAX OK`; `Iter n` (chips/legend); chart axis titles and export strings (language-conditional inline, sec. 5/9); annotation `GapCheck: X.XX mm`; export error alert (ES only). HTML initial texts are English but replaced by ES at 2855 (`updateTranslations()`).
`setLanguage` does not touch the login message. Language switch is only reachable after login, so login messages are always ES in practice.

---

## 11. Theme / language / settings menu / login / storage

Menu: hamburger `.icon-btn` (1407) toggles `#settingsMenu` dropdown (`toggleDropdown`): (1) action "🖼️ Exportar PNG"; divider; (2) Theme section (`themeTitle`, icon 🌗) with `#btnThemeDark` (`setTheme('dark')`, label `🌙 Dark`, initial class `active`) and `#btnThemeLight` (`☀️ Light`); divider; (3) Language section (`languageTitle`, icon 🌐) `#btnLangEs` (`setLanguage('es')`, initially active, label `Español`) and `#btnLangEn` (`English`). All call `closeDropdown()` after. Outside click closes (1827).
Theme: CSS variables on `:root` (light, 22-60) and `:root[data-theme="dark"]` (62-97). Light = no attribute. Initial state mismatch (observed): light theme applied, logo1.png, but `#btnThemeDark` has `.active`. Not persisted. `setTheme` swaps `#themeLogo` src (`logo1.png` light / `logo2.png` dark); login logo always `logo1.png` (`#loginThemeLogo`, fallback inline SVG icon via onerror). Chart rebuilt on theme change.
Duplicate `@keyframes fadeIn` (256, 1332): later wins (opacity only).
Login (HTML 1354-1379; JS 2826-2852): `<input type="password" id="passwordInput" placeholder="Contraseña / Password" required autocomplete="off">` + submit button (`loginEnter`). Handler: `e.preventDefault(); const password = passwordInput.value; if (password === 'CJLB')` (hard-coded plaintext, case-sensitive, exact, no trim): `loginMessage.textContent = translations[currentLang].loginSuccess; loginMessage.className = 'login-message success'`; `setTimeout(() => { loginScreen.style.display = 'none'; mainApp.style.display = 'block'; }, 1000)`. Else: `loginMessage.textContent = translations[currentLang].loginError; className = 'login-message error'; passwordInput.value = ''; passwordInput.focus()`. `#mainApp` is `display:none` inline until success. No lockout/persistence (reload = login again). Message colors: success `var(--green)`, error `var(--red)`.
localStorage / sessionStorage keys: NONE.
Init at end: `computeGapCheck()` (2607), `updateTranslations()` (2855).

---

## 12. Edge cases handled & observed bugs

Handled:
- No file/cancelled dialog ignored; empty sheet or no numeric columns: silent return.
- Ragged rows, null cells, numeric strings, text columns skipped; non-numeric-only columns dropped.
- Header auto-detect; blank header -> `P{col+1}`.
- Single iteration/point works (`_maxIter` 1; x axis 0..2).
- Different iteration counts per point: `iterDataset` skips undefined.
- Empty filter selection: stats '0','0','0','0','0 / 0', empty table/datasets.
- Division-by-zero guards in compression axis (`'0%'`).
- Annotation line suppressed if `gapCheckTarget <= 0`.
- Palette cycling modulo 15.
- Non-image upload alert; export with no chart alert; export drawing/toDataURL errors caught.
- Touch drag support for markers.

Observed bugs / quirks (not fixed):
1. Duplicate `toggleTheme` (1805 dead, refers to missing `#themeIcon`); `rawData`, `toggleLanguage` and keys `targetMin/targetMax/toggleTheme/changeLanguage` unused.
2. Initial theme button state mismatch (dark button `.active` while light theme).
3. Filter chips visually reset to all-active on any chart rebuild (theme, language, Update button) while `visiblePoints/visibleIters` persist.
4. MIN/MAX unformatted (float artifacts possible); AVG 2 decimals; OK card shows "k / n" despite initial `0%`.
5. Iteration numbering compacts blank cells (later values shift to earlier iteration numbers).
6. `parseFloat` leniency (`"12abc"`->12, `"1,5"`->1); numeric-only header row treated as data.
7. Silent import failure (file name + green loaded state still shown); same file cannot be re-selected consecutively; no try/catch.
8. Target line baked at chart creation; right-axis callback reads live DOM at draw time; typing target inputs updates only the result box until "Update Comparison".
9. Right axis `afterBuildTicks`/`min`/`max` reference `chart`/`scales.y` which may be stale on first build.
10. Default legend click hides datasets independent of chips.
11. Data table container clipped at 1500px (no scroll); point names inserted unescaped into innerHTML.
12. Layout: drag math ignores translate(-50%,-50%) centering (half-size jump); on-screen % relative to wrap vs export % relative to image; marker colors differ screen (POINT_COLORS) vs export (PALETTE_SOLID); on-screen markers ignore point filters; image cannot be replaced after load; positions reset whenever markers rebuilt.
13. Export: layout box stroke uses leftover context state; Spanish-only error alert; filename date is UTC; output size depends on devicePixelRatio; `Measured Pts` vs UI label.
14. Login uses a hard-coded client-side plaintext password `CJLB`.
15. `Math.max(...array)` / `Math.min(...array)` spreads on potentially large arrays.
16. Negative or >100% compression/negative thickness not clamped; `tolerance = target * 0.10` misbehaves for negative targets.

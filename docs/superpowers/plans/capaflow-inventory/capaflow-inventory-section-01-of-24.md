# CapaFlow inventory — section 01 of 24

**Original inventory lines:** 1–477 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory.
**Previous:** none (first section). **Next:** [capaflow-inventory-section-02-of-24.md](capaflow-inventory-section-02-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
# CapaFlow technical inventory

**Complete inventory — all ten requested sections.** The complete source was read before authoring. This document consolidates the initial header/state part and all remaining sections. The original application is not modified. References such as `L3406` refer to the original `index.html`, not this Markdown document. [L1–8617]

**Source:** `C:/Users/PC AERO R5 PRO/Desktop/Proyectos IA/cjlb-toolbox/.claude/worktrees/cjlb-toolbox-refactor-design-86b6a8/capaflow/index.html`. Snapshot: 8,617 lines; 391,842 bytes; SHA-256 `8493D79C282A801324AA7B725A3803B497F7CFFC6A2101C3E51D9FD69406EFF8`. This inventory describes static source behavior, not an executed browser test. [L1–8617]

**Header: libraries (CDN URLs and versions), file structure (CSS/HTML/script line ranges).**

| Library / resource | Exact URL | Version / configuration | Source lines |
|---|---|---|---|
| Google Fonts stylesheet | `https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap` | No pinned font release. Syne 400/600/700/800; DM Mono 300/400/500; DM Sans normal 300/400/500 and italic 300; `display=swap`. | L8–10 |
| JSZip | `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` | 3.10.1; classic script, no `async`, `defer`, integrity or crossorigin attribute. | L11 |
| SheetJS / XLSX | `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` | 0.18.5; classic script, no `async`, `defer`, integrity or crossorigin attribute. | L12 |
| Charting framework | None. No Chart.js CDN or Chart.js configuration exists. Rendering is custom Canvas 2D. | Screen plots, export plots and guide illustrations have separate drawing functions; they must not be assumed equivalent. | L1–8617; L4535–4795, L4829–5332, L6045–6846, L6959–7453, L7466–8321 |
| React / TypeScript / module loader | None in this file. | One classic inline application script; no imports or module build configuration. | L11–12, L2991–8614 |

**File structure.** [L1–8617]

| File region | Line range | Notes |
|---|---|---|
| Document preamble and root element | L1–2 | `<!DOCTYPE html>` and `<html lang="es" data-theme="dark" data-lang="es">`. |
| Head | L4–2620 | UTF-8, responsive viewport, title, font stylesheet, two CDN scripts and inline CSS. |
| Document metadata | L5–7 | `<meta charset="UTF-8">`; viewport `width=device-width, initial-scale=1.0`; title `CapaFlow — Análisis de Capacidad Six Sigma`. |
| Inline CSS, including `<style>` / `</style>` | L13–2619 | Theme tokens begin at L17; dark theme begins at L21; light theme begins at L47. |
| Body opening and static HTML | L2622–2990 | Password gate, application interface and converter modal precede the application script. |
| Inline application script, including tags | L2991–8614 | Script content is L2992–8613. |
| Closing body / HTML | L8615–8617 | Blank line at L8616. |

## 1. Global state variables

Types below describe runtime JavaScript values and possible later values; they are not TypeScript declarations present in the file. “Global” includes top-level lexical bindings in the classic script, not just properties of `window`. Function declarations are catalogued in section 2 rather than repeated here. DOM element references are not application data, but are included to avoid omitting top-level bindings. [L2991–8614]

| name | type | initial value | line | notes |
|---|---|---|---|---|
| `TRANSLATIONS` | Object with `es` and `en` string dictionaries | Full object literal, copied verbatim in section 8 | L2995–3404 | `const` binding, not a frozen object. Each language contains 202 property declarations but 200 unique keys; duplicate declarations must be retained in the verbatim copy. |
| `currentLang` | string | `'es'` | L3406 | Assigned by `setLang(lang)` at L3433; used by dictionary lookup, conditional text and locale selection. |
| `currentTheme` | string | `'dark'` | L3407 | Toggled between `'dark'` and `'light'` at L3448. Does not load a saved theme preference. |
| `LOGO_KEYS` | `{dark: string, light: string}` | `{ dark: 'capaflow_logo_dark', light: 'capaflow_logo_light' }` | L3466 | Maps current theme to a localStorage key; values are DataURL strings, not serialized JSON objects. Read L3475; write L3497. |
| `hamburgerBtn` | DOM element reference, or `null` if lookup fails | `document.getElementById('hamburgerBtn')` | L3512 | Click listener is registered without a null guard at L3516. |
| `sidePanel` | DOM element reference, or `null` | `document.getElementById('sidePanel')` | L3513 | Its `open` class is toggled at L3517 and removed at L3523. |
| `panelOverlay` | DOM element reference, or `null` | `document.getElementById('panelOverlay')` | L3514 | Its `open` class is synchronized at L3519; clicking calls `closePanel` at L3521. |
| `tooltip` | DOM element reference, or `null` | `document.getElementById('chartTooltip')` | L3531 | Shared chart-tooltip element; text/position/visibility controlled by L3533–3561. |
| `particles` | Array of particle objects | `[]` | L3566 | Replaced with a new empty array in `initParticles` at L3575, then populated at L3591–3601. |
| `animFrame` | `undefined`, later animation-frame request handle | `undefined` (declaration has no initializer) | L3567 | Existing handle is cancelled when truthy at L3604; animation loop is L3608–3656. |
| `CORRECT_PASSWORD` | string | **Hardcoded value intentionally not copied** | L3668 | Client-side constant compared using strict equality at L3692. This document must never reproduce its value. |
| `GATE_LOGO_KEYS` | `{dark: string, light: string}` | `{ dark: 'capaflow_logo_dark', light: 'capaflow_logo_light' }` | L3669 | Separate object with the same key strings as `LOGO_KEYS`; gate reads selected DataURL at L3676. |
| `originalToggleTheme` | function reference | `toggleTheme` | L3726 | Captures original L3447–3456 function; the replacement at L3727–3730 calls it and then `loadGateLogo()`. |
| `_photoOpen` | boolean | `false` | L4268 | Photo-widget expanded/collapsed state; not the same as widget visibility. See L4274–4286. |
| `_photoMarkers` | Object indexed by analysis index | `{}` | L4269 | Entries have `{ x, y, placed }`; marker-drop assignment is L4353. Coordinates are percentages clamped to 3–97 at L4350–4351. |
| `_photoImageSrc` | `null` or DataURL string | `null` | L4270 | Assigned `FileReader` result at L4308; no persisted photo-storage key exists. |
| `_draggedMarkerIdx` | `null` or analysis identifier | `null` | L4271 | Drag state set in L4329–4333; successful placement resets it to `null` at L4354. |
| `_photoDropX` | number | `0` | L4272 | Shares its declaration with `_photoDropY`; drop handler converts stored client coordinates to percentages at L4349–4351. |
| `_photoDropY` | number | `0` | L4272 | Same coordinate lifecycle as `_photoDropX`. |
| `_lastResult` | `null` or analysis-result object | `null` | L5347 | Active export result; `setActiveExport` assigns `_results[idx]` at L4164. |
| `_analysisCounter` | number | `0` | L5348 | Analysis identifier counter, distinct from position in `_analysisOrder`; creation/deletion behavior is in L3873–4263. |
| `_results` | Object indexed by analysis index | `{}` | L5349 | Stores analysis results; result payload is constructed at L3862–3867, then enriched/registered during rendering at L3873–4160. |
| `_ccTypes` | Object indexed by analysis index | `{}` | L5350 | Per-analysis control-chart selection; selector setter L6950–6957. A missing entry falls back to `'auto'` during language redraw at L3440. |
| `_analysisOrder` | Array of analysis identifiers | `[]` | L5353 | Source comment explicitly specifies creation order, oldest to newest. Used by carousel and project outputs. |
| `_carouselCurrent` | number | `0` | L5354 | Position within `_analysisOrder`, not an analysis identifier. Navigation/rendering L5362–5401. |
| `_folderOpen` | boolean | `false` | L5357 | Project-folder expanded/collapsed state; folder behavior L5406–5454. |
| `SPC_CONSTANTS` | Object keyed by subgroup size | Full literal for sizes `2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25` | L6872–6885 | Each entry contains `A2`, `D3`, `D4`, `A3`, `B3`, `B4`, `c4`, `d2`. Literal is copied in section 2A; lookup/interpolation/fallback L6887–6904. |
| `mwxFiles` | Array of browser `File` objects | `[]` | L8342 | Converter input queue, separate from process-measurement data. Appended on drop L8437 and picker change L8446. |
| `mwxProcessedCount` | number | `0` | L8343 | Converter processed-file counter; lifecycle in L8355–8364 and L8451–8479. |
| `dropzone` | DOM element reference, or `null` | `document.getElementById('mwxDropzone')` | L8415 | Converter drop target; listeners L8418–8442. |
| `fileInput` | DOM element reference, or `null` | `document.getElementById('mwxFileInput')` | L8416 | Converter file picker; change listener L8444–8448. |

**Explicit `window` properties and function replacements.** These are additional externally visible runtime state, not additional top-level `let` / `const` declarations. [L3658–3661, L3710, L3726–3730, L8323–8331, L8604–8609]

| name | type | initial value | line | notes |
|---|---|---|---|---|
| `window._resizeTimer` | Timeout handle after first resize | Not explicitly initialized | L3659–3660 | Previous handle cleared; next particle initialization scheduled after `250` ms. |
| `window.checkPassword` | function | `checkPassword` | L3710 | Explicit exposure for inline `onclick`; same function declared at L3687–3707. |
| `window._rz` | Timeout handle after a resize | Not explicitly initialized | L8324–8325 | Separate statistical-chart resize debounce; not the particle timer. |
| `toggleTheme` | function binding, reassigned | Initial declaration L3447–3456, then anonymous wrapper | L3727–3730 | Wrapper invokes captured original, then reloads the gate logo. |
| `setLang` | function binding, reassigned | Initial declaration L3432–3442, then anonymous wrapper | L8606–8609 | Wrapper invokes captured original, then updates header date. |

**Not a global:** `originalSetLang` is a block-scoped `const` inside `if (typeof setLang === 'function')`; it is captured by the reassigned `setLang` wrapper. Treating it as a top-level global would misdescribe its scope. [L8604–8609]

**Particle-record shape:** each record has `x`, `y`, `r`, `vx`, `vy`, `color`, `alpha`, `pulse`, `pulseSpeed`; the exact randomized initialization and color lists belong to section 5. The `color` field is an RGB-number array, not a hex string. [L3579–3601]

**Analysis payload before rendering:** exact source, including property order and shorthand syntax. Later UI mutations must be inventoried separately rather than assumed absent. [L3862–3867]

```javascript
      renderResults({
        data, xBar, sOverall, sWithin, N, minV, maxV, med, range,
        Cp, Cpk, Cpu, Cpl, Pp, Ppk, Ppu, Ppl, Cpm, Cmk,
        sigLvl, ppm, ppmOverall, adTest, isNormal, lsl, usl, targetVal, hasLSL, hasUSL, hasBoth,
        subgroupSize: n, pointName
      }, pointName);
```

**Storage boundary:** the only localStorage keys are `capaflow_logo_dark` and `capaflow_logo_light`, reused by both logo maps; no sessionStorage access exists. Theme/language defaults are the literal assignments above, not saved preferences. Section 9 enumerates read/write timing and the password-gate behavior. [L3406–3407, L3466–3504, L3669–3685; full-file search L1–8617]

**observed bug — duplicate translation keys:** `panel.guideTitle` and `panel.guideSub` are each declared twice in each language object. JavaScript retains the last value; a port must not silently choose the first declaration or count 202 effective keys per language. Both occurrences are retained in the verbatim dictionary copy. This is a source-level observation, not a repaired behavior. [ES L3025–3026 and L3141–3142; EN L3229–3230 and L3345–3346]

## 2. Functions

This section separates parameter-based calculations from DOM/state orchestration. Every source block is a literal contiguous slice of the attached file, without rewritten formulas or inserted line numbers. A function is not assumed pure merely because it computes values: `runAnalysis` reads the form, `classifyCpk` reads the active language, `_buildCCData` translates labels, and `_wrapText` reads/mutates a canvas context (lines 3797–3802, 3824–3868, 7279–7325, 8140–8150).

**Counting convention:** 103 top-level named function declarations (lines 3409–8601), plus eight nested named declarations (lines 6211–6240 and 7503–7528), gives **111 named declarations**. Anonymous function expressions assigned to existing names are additional implementations, not additional named declarations (lines 3727–3730 and 8606–8609). Arrow helpers and callbacks are catalogued individually below; object/array operations passed existing function references such as `map(Number)` do not declare another function (line 6890).

### 2A. PURE CALCULATION logic (port byte-identical)

**Core utility contracts (lines 3735–3807).** `parseData` splits whitespace/comma/semicolon tokens, uses `parseFloat`, and filters only NaN; `mean` divides by array length; `stddev` defaults to sample n−1 and optionally uses population n; `median` numeric-sorts a copy; `withinSigma` uses mean moving range/1.128 at n=1 or mean full-subgroup range/d2 otherwise. The d2 table is local, complete for n=1…25; unknown n falls back to2.326. `normCDF` uses the literal erf approximation, `normPDF` the normal density, `quartile` linear interpolation, and Anderson-Darling sorts a copy, uses sample deviation and the exact correction/p-value branches. `sigmaLevel` is3×Cpk with no1.5 shift. Classification thresholds are1.67/1.33/1.00; status colors use1.33/1.00. `classifyCpk` is included in the literal block but depends on `t()` (lines 3409, 3797–3802).

**Statistics, parsing, distributions, percentile, normality, sigma and classification utilities — source lines 3735–3807.**

```javascript
    function parseData(raw) {
      return raw.split(/[\s,;\n\t]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    }
    function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
    function stddev(arr, pop = false) {
      const m = mean(arr);
      const sq = arr.map(v => (v - m) ** 2);
      return Math.sqrt(sq.reduce((a, b) => a + b, 0) / (pop ? arr.length : arr.length - 1));
    }
    function median(arr) {
      const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    function withinSigma(data, n) {
      if (n === 1) {
        const mr = [];
        for (let i = 1; i < data.length; i++)mr.push(Math.abs(data[i] - data[i - 1]));
        return mean(mr) / 1.128;
      }
      const d2Map = { 1: 1, 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078, 11: 3.173, 12: 3.258, 13: 3.336, 14: 3.407, 15: 3.472, 16: 3.532, 17: 3.588, 18: 3.640, 19: 3.689, 20: 3.735, 21: 3.778, 22: 3.819, 23: 3.858, 24: 3.895, 25: 3.931 };
      const d2 = d2Map[n] || 2.326;
      const groups = [];
      for (let i = 0; i < data.length; i += n) {
        const group = data.slice(i, i + n);
        if (group.length === n) groups.push(group);
      }
      const ranges = groups.map(g => Math.max(...g) - Math.min(...g));
      return mean(ranges) / d2;
    }
    function normCDF(x) {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
      const sign = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2);
      const t2 = 1 / (1 + p * x);
      const y = 1 - (((((a5 * t2 + a4) * t2 + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-x * x));
      return 0.5 * (1 + sign * y);
    }
    function normPDF(x, mu, sigma) { return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2); }
    // Linear-interpolation percentile (same method as R default / Minitab)
    function quartile(sorted, q) {
      const pos = (sorted.length - 1) * q;
      const base = Math.floor(pos), rest = pos - base;
      return sorted[base + 1] !== undefined
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
    }
    function andersonDarlingTest(data) {
      const n = data.length, sorted = [...data].sort((a, b) => a - b), m = mean(sorted), s = stddev(sorted);
      let A2 = 0;
      for (let i = 0; i < n; i++) {
        const z1 = normCDF((sorted[i] - m) / s), z2 = normCDF((sorted[n - 1 - i] - m) / s);
        A2 += (2 * (i + 1) - 1) * (Math.log(Math.max(z1, 1e-10)) + Math.log(Math.max(1 - z2, 1e-10)));
      }
      A2 = (-n - A2 / n);
      const A2adj = A2 * (1 + 4 / n - 25 / n ** 2);
      let pv;
      if (A2adj >= 0.6) pv = Math.exp(1.2937 - 5.709 * A2adj + 0.0186 * A2adj ** 2);
      else if (A2adj >= 0.34) pv = Math.exp(0.9177 - 4.279 * A2adj - 1.38 * A2adj ** 2);
      else if (A2adj >= 0.2) pv = 1 - Math.exp(-8.318 + 42.796 * A2adj - 59.938 * A2adj ** 2);
      else pv = 1 - Math.exp(-13.436 + 101.14 * A2adj - 223.73 * A2adj ** 2);
      return { stat: A2adj, p: Math.min(1, Math.max(0, pv)) };
    }
    function sigmaLevel(cpk) { return cpk * 3; }
    function classifyCpk(v) {
      if (v >= 1.67) return { label: t('classify.worldClass'), cls: 'green' };
      if (v >= 1.33) return { label: t('classify.capable'), cls: 'green' };
      if (v >= 1.00) return { label: t('classify.marginal'), cls: 'yellow' };
      return { label: t('classify.notCapable'), cls: 'red' };
    }
    function colorForCpk(v) {
      if (v >= 1.33) return 'var(--accent-green)';
      if (v >= 1.00) return 'var(--accent-yellow)';
      return 'var(--accent-red)';
    }
```

**Analysis boundary (lines 3824–3868).** This function is not pure; its calculation subsection must preserve the original operation order. It reads DOM, accepts at least five parsed values and at least one limit, uses `parseInt(value) || 1` for subgroup size, then passes unrounded numbers and metadata to `renderResults`. Cp/Pp require both limits; Cpu/Cpl/Ppu/Ppl are one-sided; Cpk/Ppk select the minimum available side; Cpm uses overall σ and target; Cmk is exactly Cpk. Two-sided expected PPM uses symmetric tails of3×the selected index, not separate distances to actual limits. No confidence-field value is read here (lines 3824–3868).

**Complete calculation boundary, validation messages, capability/performance indices and nested ppmFromCpk — source lines 3824–3868.**

```javascript
    function runAnalysis() {
      const raw = document.getElementById('dataInput').value;
      const data = parseData(raw);
      if (data.length < 5) { alert(currentLang === 'es' ? 'Necesitas al menos 5 datos.' : 'Need at least 5 data points.'); return; }
      const lsl = parseFloat(document.getElementById('lsl').value);
      const usl = parseFloat(document.getElementById('usl').value);
      const targetVal = parseFloat(document.getElementById('target').value);
      const n = parseInt(document.getElementById('subgroupSize').value) || 1;
      const pointName = document.getElementById('pointName').value.trim();
      const hasLSL = !isNaN(lsl), hasUSL = !isNaN(usl), hasBoth = hasLSL && hasUSL;
      if (!hasLSL && !hasUSL) { alert(currentLang === 'es' ? 'Ingresa al menos un límite de especificación.' : 'Enter at least one specification limit.'); return; }

      const xBar = mean(data), sOverall = stddev(data), sWithin = withinSigma(data, n);
      const N = data.length, minV = Math.min(...data), maxV = Math.max(...data), med = median(data), range = maxV - minV;
      const adTest = andersonDarlingTest(data), isNormal = adTest.p >= 0.05;
      const tolerance = hasBoth ? usl - lsl : null;
      const Cp = hasBoth ? tolerance / (6 * sWithin) : null;
      const Pp = hasBoth ? tolerance / (6 * sOverall) : null;
      const Cpu = hasUSL ? (usl - xBar) / (3 * sWithin) : null;
      const Cpl = hasLSL ? (xBar - lsl) / (3 * sWithin) : null;
      const Ppu = hasUSL ? (usl - xBar) / (3 * sOverall) : null;
      const Ppl = hasLSL ? (xBar - lsl) / (3 * sOverall) : null;
      const Cpk = (Cpu !== null && Cpl !== null) ? Math.min(Cpu, Cpl) : (Cpu !== null ? Cpu : Cpl);
      const Ppk = (Ppu !== null && Ppl !== null) ? Math.min(Ppu, Ppl) : (Ppu !== null ? Ppu : Ppl);
      let Cpm = null;
      if (hasBoth && !isNaN(targetVal)) { const tau = Math.sqrt(sOverall ** 2 + (xBar - targetVal) ** 2); Cpm = tolerance / (6 * tau); }
      const Cmk = Cpk;
      const sigLvl = Cpk !== null ? sigmaLevel(Cpk) : null;
      // Two-sided spec: both tails; one-sided: only the failing tail
      const ppmFromCpk = (cpkV) => {
        if (cpkV === null) return null;
        const z = 3 * cpkV;
        return hasBoth
          ? (normCDF(-z) + (1 - normCDF(z))) * 1e6   // upper + lower tail
          : (1 - normCDF(z)) * 1e6;                   // one-sided: failing tail only
      };
      const ppm = ppmFromCpk(Cpk), ppmOverall = ppmFromCpk(Ppk);

      renderResults({
        data, xBar, sOverall, sWithin, N, minV, maxV, med, range,
        Cp, Cpk, Cpu, Cpl, Pp, Ppk, Ppu, Ppl, Cpm, Cmk,
        sigLvl, ppm, ppmOverall, adTest, isNormal, lsl, usl, targetVal, hasLSL, hasUSL, hasBoth,
        subgroupSize: n, pointName
      }, pointName);
    }
```

**SPC constants and rule contracts (lines 6872–6948).** The SPC table has entries2–10,15,20,25; missing interior sizes are linearly interpolated across every constant, and all other sizes fall back to entry25. `westernRule1` returns violating values, not indices, and has no call site elsewhere in this file. `weViolations` returns sorted unique indices for >3σ,2-of-3 >2σ on one side, six strictly trending values, and eight strictly same-side values. `makeSubgroups` returns singleton arrays for n≤1 and drops a final incomplete group otherwise. Literal behavior, including unconditional addition of the newest rule2 index, is retained rather than corrected (lines 6907–6948).

**Complete SPC table, interpolation helper, Western Electric logic and subgroup builder — source lines 6872–6948.**

```javascript
    const SPC_CONSTANTS = {
      2: { A2: 1.880, D3: 0, D4: 3.267, A3: 2.659, B3: 0, B4: 3.267, c4: 0.7979, d2: 1.128 },
      3: { A2: 1.023, D3: 0, D4: 2.574, A3: 1.954, B3: 0, B4: 2.568, c4: 0.8862, d2: 1.693 },
      4: { A2: 0.729, D3: 0, D4: 2.282, A3: 1.628, B3: 0, B4: 2.266, c4: 0.9213, d2: 2.059 },
      5: { A2: 0.577, D3: 0, D4: 2.114, A3: 1.427, B3: 0, B4: 2.089, c4: 0.9400, d2: 2.326 },
      6: { A2: 0.483, D3: 0, D4: 2.004, A3: 1.287, B3: 0.030, B4: 1.970, c4: 0.9515, d2: 2.534 },
      7: { A2: 0.419, D3: 0.076, D4: 1.924, A3: 1.182, B3: 0.118, B4: 1.882, c4: 0.9594, d2: 2.704 },
      8: { A2: 0.373, D3: 0.136, D4: 1.864, A3: 1.099, B3: 0.185, B4: 1.815, c4: 0.9650, d2: 2.847 },
      9: { A2: 0.337, D3: 0.184, D4: 1.816, A3: 1.032, B3: 0.239, B4: 1.761, c4: 0.9693, d2: 2.970 },
      10: { A2: 0.308, D3: 0.223, D4: 1.777, A3: 0.975, B3: 0.284, B4: 1.716, c4: 0.9727, d2: 3.078 },
      15: { A2: 0.223, D3: 0.347, D4: 1.653, A3: 0.789, B3: 0.428, B4: 1.572, c4: 0.9823, d2: 3.472 },
      20: { A2: 0.180, D3: 0.415, D4: 1.585, A3: 0.680, B3: 0.510, B4: 1.490, c4: 0.9869, d2: 3.735 },
      25: { A2: 0.153, D3: 0.459, D4: 1.541, A3: 0.606, B3: 0.565, B4: 1.435, c4: 0.9896, d2: 3.931 },
    };

    function getSPCConstants(n) {
      if (SPC_CONSTANTS[n]) return SPC_CONSTANTS[n];
      // interpolate for sizes not in table
      const keys = Object.keys(SPC_CONSTANTS).map(Number).sort((a, b) => a - b);
      for (let i = 0; i < keys.length - 1; i++) {
        if (n > keys[i] && n < keys[i + 1]) {
          const lo = SPC_CONSTANTS[keys[i]], hi = SPC_CONSTANTS[keys[i + 1]];
          const f = (n - keys[i]) / (keys[i + 1] - keys[i]);
          const lerp = (a, b) => a + (b - a) * f;
          return {
            A2: lerp(lo.A2, hi.A2), D3: lerp(lo.D3, hi.D3), D4: lerp(lo.D4, hi.D4),
            A3: lerp(lo.A3, hi.A3), B3: lerp(lo.B3, hi.B3), B4: lerp(lo.B4, hi.B4),
            c4: lerp(lo.c4, hi.c4), d2: lerp(lo.d2, hi.d2)
          };
        }
      }
      return SPC_CONSTANTS[25]; // fallback
    }

    // Western Electric Rule 1: point beyond 3σ
    function westernRule1(pts, ucl, lcl) { return pts.filter(p => p > ucl || p < lcl); }

    // All WE violations (returns array of indices)
    function weViolations(pts, cl, sigma) {
      const viol = new Set();
      const n = pts.length;
      // Rule 1: beyond 3σ
      pts.forEach((p, i) => { if (Math.abs(p - cl) > 3 * sigma) viol.add(i); });
      // Rule 2: 2 of 3 beyond 2σ same side
      for (let i = 2; i < n; i++) {
        const w = [pts[i], pts[i - 1], pts[i - 2]];
        const abv = w.filter(v => v > cl + 2 * sigma).length;
        const blw = w.filter(v => v < cl - 2 * sigma).length;
        if (abv >= 2 || blw >= 2) {
          viol.add(i); if (abv >= 2) { if (pts[i - 1] > cl + 2 * sigma) viol.add(i - 1); if (pts[i - 2] > cl + 2 * sigma) viol.add(i - 2); }
          if (blw >= 2) { if (pts[i - 1] < cl - 2 * sigma) viol.add(i - 1); if (pts[i - 2] < cl - 2 * sigma) viol.add(i - 2); }
        }
      }
      // Rule 3: 6 consecutive trending
      for (let i = 5; i < n; i++) {
        let up = true, dn = true;
        for (let j = i - 4; j <= i; j++) { if (pts[j] <= pts[j - 1]) up = false; if (pts[j] >= pts[j - 1]) dn = false; }
        if (up || dn) for (let j = i - 5; j <= i; j++) viol.add(j);
      }
      // Rule 4: 8 consecutive same side
      for (let i = 7; i < n; i++) {
        const seg = pts.slice(i - 7, i + 1);
        if (seg.every(v => v > cl) || seg.every(v => v < cl)) for (let j = i - 7; j <= i; j++) viol.add(j);
      }
      return [...viol].sort((a, b) => a - b);
    }

    // Build subgroups from flat data array
    function makeSubgroups(data, n) {
      if (n <= 1) return data.map(v => [v]);
      const groups = [];
      for (let i = 0; i < data.length; i += n) {
        const g = data.slice(i, i + n);
        if (g.length === n) groups.push(g); // drop partial final group (AIAG standard)
      }
      return groups;
    }
```

**DOM-free control-chart builder (lines 7279–7325).** This returns numerical arrays/limits/sigmas and translated labels; it is free of DOM access but depends on language/SPC globals and utility functions. It has a different bottom-sigma safeguard than the screen builder: compare line7320 with7058. I-MR retains a leading null in bottom points; the violation arrays are based on filtered points (lines 7295, 7318–7324).

**Exact export control-chart calculation builder — source lines 7279–7325.**

```javascript
    function _buildCCData(r, n, chartType) {
      const data = r.data;
      const es = currentLang === 'es';
      const groups = makeSubgroups(data, n <= 1 ? 1 : n);

      let topPts, topCL, topUCL, topLCL, topSigma, topLabel;
      let botPts, botCL, botUCL, botLCL, botSigma, botLabel;

      if (chartType === 'imr') {
        topPts = data;
        topCL = mean(data);
        const mr = data.map((v, i) => i === 0 ? null : Math.abs(v - data[i - 1])).filter(v => v !== null);
        const mrBar = mean(mr);
        const sigmaI = mrBar / 1.128;
        topUCL = topCL + 3 * sigmaI; topLCL = topCL - 3 * sigmaI; topSigma = sigmaI;
        topLabel = `I — ${t('cc.individuals')}`;
        botPts = [null, ...mr]; botCL = mrBar;
        botUCL = 3.267 * mrBar; botLCL = 0; botSigma = mrBar / 3.267;
        botLabel = `MR — ${t('cc.movingRange')}`;
      } else if (chartType === 'xr') {
        const C = getSPCConstants(Math.max(2, Math.min(25, n)));
        const xbars = groups.map(g => mean(g));
        const ranges = groups.map(g => Math.max(...g) - Math.min(...g));
        const xDblBar = mean(xbars), rBar = mean(ranges);
        topPts = xbars; topCL = xDblBar; topUCL = xDblBar + C.A2 * rBar; topLCL = xDblBar - C.A2 * rBar;
        topSigma = C.A2 * rBar / 3; topLabel = `X̄ — ${t('cc.means')} (n=${n})`;
        botPts = ranges; botCL = rBar; botUCL = C.D4 * rBar; botLCL = C.D3 * rBar;
        botSigma = (C.D4 - C.D3) * rBar / 6; botLabel = `R — ${t('cc.ranges')} (n=${n})`;
      } else {
        const C = getSPCConstants(Math.max(2, Math.min(25, n)));
        const xbars = groups.map(g => mean(g));
        const stdevs = groups.map(g => stddev(g));
        const xDblBar = mean(xbars), sBar = mean(stdevs);
        topPts = xbars; topCL = xDblBar; topUCL = xDblBar + C.A3 * sBar; topLCL = xDblBar - C.A3 * sBar;
        topSigma = C.A3 * sBar / 3; topLabel = `X̄ — ${t('cc.means')} (n=${n})`;
        botPts = stdevs; botCL = sBar; botUCL = C.B4 * sBar; botLCL = C.B3 * sBar;
        botSigma = (C.B4 - C.B3) * sBar / 6; botLabel = `S — ${t('cc.stddevBot')} (n=${n})`;
      }

      const topF = topPts.filter(v => v !== null), botF = botPts.filter(v => v !== null);
      const topViol = weViolations(topF, topCL, topSigma);
      const botViol = weViolations(botF, botCL, botSigma > 0 ? botSigma : botCL / 3 || 0.001);
      return {
        topPts, topCL, topUCL, topLCL, topSigma, topLabel, topViol, topOOC: topViol.length,
        botPts, botCL, botUCL, botLCL, botSigma, botLabel, botViol, botOOC: botViol.length
      };
    }
```

**Screen control-chart calculation counterpart (lines 6964–7058).** Automatic mode uses I-MR for n≤1, Xbar-R for2–9, Xbar-S for≥10. Forced chart mode does not rewrite stored subgroup size. These literal formulas and the different zero-sigma guard are part of the source contract, not substitutions for the export builder (lines 6964–7058).

**Screen chart mode, groups, limits, sigmas, note substitutions and rule calls — source lines 6964–7058.**

```javascript
      const n = r.subgroupSize || parseInt(document.getElementById('subgroupSize').value) || 1;
      const data = r.data;
      const es = currentLang === 'es';

      // Determine chart type
      let chartType = forceType || 'auto';
      if (chartType === 'auto') {
        if (n <= 1) chartType = 'imr';
        else if (n < 10) chartType = 'xr';
        else chartType = 'xs';
      }

      // Build subgroups
      const groups = makeSubgroups(data, n <= 1 ? 1 : n);
      const K = groups.length; // number of subgroups / points

      let topPts = [], topCL, topUCL, topLCL, topLabel, topSigma;
      let botPts = [], botCL, botUCL, botLCL, botLabel, botSigma;
      let noteText = '';
      if (chartType === 'imr') {
        // I chart: individual values
        topPts = data;
        topCL = mean(data);
        const mr = data.map((v, i) => i === 0 ? null : Math.abs(v - data[i - 1])).filter(v => v !== null);
        const mrBar = mean(mr);
        const sigmaI = mrBar / 1.128;
        topUCL = topCL + 3 * sigmaI;
        topLCL = topCL - 3 * sigmaI;
        topLabel = es ? `I — ${t('cc.individuals')}` : `I — ${t('cc.individuals')}`;
        topSigma = sigmaI;

        // MR chart
        botPts = [null, ...mr]; // align with data (first point null)
        botCL = mrBar;
        botUCL = 3.267 * mrBar;
        botLCL = 0;
        botLabel = `MR — ${t('cc.movingRange')}`;
        botSigma = mrBar / 3.267;

        noteText = t('cc.noteIMR');
      } else if (chartType === 'xr') {
        const C = getSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)));
        const xbars = groups.map(g => mean(g));
        const ranges = groups.map(g => Math.max(...g) - Math.min(...g));
        const xDblBar = mean(xbars);
        const rBar = mean(ranges);

        topPts = xbars;
        topCL = xDblBar;
        topUCL = xDblBar + C.A2 * rBar;
        topLCL = xDblBar - C.A2 * rBar;
        topLabel = `X̄ — ${t('cc.means')} (n=${n})`;
        topSigma = C.A2 * rBar / 3;

        botPts = ranges;
        botCL = rBar;
        botUCL = C.D4 * rBar;
        botLCL = C.D3 * rBar;
        botLabel = `R — ${t('cc.ranges')} (n=${n})`;
        botSigma = (C.D4 - C.D3) * rBar / 6;

        noteText = t('cc.noteXR')
          .replace('%s', n).replace('%.3f', C.A2.toFixed(3))
          .replace('%.3f', C.D3.toFixed(3)).replace('%.3f', C.D4.toFixed(3));
      } else { // xs
        const C = getSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)));
        const xbars = groups.map(g => mean(g));
        const stdevs = groups.map(g => stddev(g));
        const xDblBar = mean(xbars);
        const sBar = mean(stdevs);

        topPts = xbars;
        topCL = xDblBar;
        topUCL = xDblBar + C.A3 * sBar;
        topLCL = xDblBar - C.A3 * sBar;
        topLabel = `X̄ — ${t('cc.means')} (n=${n})`;
        topSigma = C.A3 * sBar / 3;

        botPts = stdevs;
        botCL = sBar;
        botUCL = C.B4 * sBar;
        botLCL = C.B3 * sBar;
        botLabel = `S — ${t('cc.stddevBot')} (n=${n})`;
        botSigma = (C.B4 - C.B3) * sBar / 6;

        noteText = t('cc.noteXS')
          .replace('%s', n).replace('%.3f', C.A3.toFixed(3))
          .replace('%.3f', C.B3.toFixed(3)).replace('%.3f', C.B4.toFixed(3));
      }

      // Violations
      const topFiltered = topPts.filter(v => v !== null);
      const topViol = weViolations(topFiltered, topCL, topSigma);
      const botFiltered = botPts.filter(v => v !== null);
      const botViol = weViolations(botFiltered, botCL, Math.max(botSigma, 1e-10));
```

**Numeric/text formatting helpers are context-specific, not interchangeable (lines 3884–3887, 5495–5496, 6076–6080).** Screen fmt calls `v.toFixed`; summary/export fmt additionally checks undefined and calls `Number(v).toFixed`; integer PPM uses `Math.round(...).toLocaleString()` with the runtime default locale. Screen time formatting has no explicit locale; export dates do specify locales (lines 3884–3887,5539–5542,6260–6263).

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 01/24. Continue: [capaflow-inventory-section-02-of-24.md](capaflow-inventory-section-02-of-24.md).

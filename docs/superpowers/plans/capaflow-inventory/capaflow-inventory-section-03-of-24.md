# CapaFlow inventory — section 03 of 24

**Original inventory lines:** 958–1170 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 2. Functions → 2A. PURE CALCULATION logic (port byte-identical).
**Previous:** [capaflow-inventory-section-02-of-24.md](capaflow-inventory-section-02-of-24.md). **Next:** [capaflow-inventory-section-04-of-24.md](capaflow-inventory-section-04-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Guide histogram constants/density-derived bars — source lines 8156–8178.**

```javascript
      const mu = 10, sig = 0.15;
      const lsl = 9.55, usl = 10.45;
      const bins = 12;
      const dMin = 9.2, dMax = 10.8, binW = (dMax - dMin) / bins;

      // out-of-spec zones
      const toLX = v => ox2 + pad.l + ((v - dMin) / (dMax - dMin)) * pW;
      const lslX = toLX(lsl), uslX = toLX(usl);
      c.fillStyle = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
      c.fillRect(ox2 + pad.l, oy2 + pad.t, lslX - ox2 - pad.l, pH);
      c.fillRect(uslX, oy2 + pad.t, ox2 + pad.l + pW - uslX, pH);

      // bars using normal dist
      const toY2 = h => oy2 + pad.t + pH - h;
      const heights = [];
      for (let i = 0; i < bins; i++) {
        const mid = dMin + (i + 0.5) * binW;
        heights.push(normPDF(mid, mu, sig));
      }
      const maxH = Math.max(...heights);
      heights.forEach((h, i) => {
        const bx = ox2 + pad.l + (i / bins) * pW, bw = pW / bins - 1.5, bh = (h / maxH) * pH * 0.85;
        const by = oy2 + pad.t + pH - bh;
```

**Guide control-chart fixed data/limits and transforms — source lines 8222–8227.**

```javascript
      const pts = [100, 102, 99, 103, 100.5, 101, 104.5, 99.5, 100, 101.5, 105, 100.2, 101, 99.8, 100.5];
      const cl = 101, ucl = 104.5, lcl = 97.5, sigma = 1.17;
      const n = pts.length;
      const yMin = 95, yMax = 107;
      const toX = i => ox2 + pad.l + (i / (n - 1)) * pW;
      const toY = v => oy2 + pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH;
```

**Guide centered/off-center distribution constants and curve — source lines 8270–8286.**

```javascript
      const lsl = 9.55, usl = 10.45;
      const mu = centered ? 10 : 10.3, sig = 0.12;
      const dMin = 9.2, dMax = 10.8;
      const pad = { t: 45, r: 20, b: 35, l: 20 }, pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b;
      const toX = v => ox2 + pad.l + ((v - dMin) / (dMax - dMin)) * pW;
      const lslX = toX(lsl), uslX = toX(usl);

      // out-of-spec
      c.fillStyle = isDark ? 'rgba(248,113,113,0.1)' : 'rgba(220,38,38,0.07)';
      c.fillRect(ox2 + pad.l, oy2 + pad.t, lslX - ox2 - pad.l, pH);
      c.fillRect(uslX, oy2 + pad.t, ox2 + pad.l + pW - uslX, pH);

      // normal curve (filled)
      const pts2 = [];
      for (let i = 0; i <= 100; i++) {
        const xv = dMin + (i / 100) * (dMax - dMin);
        pts2.push({ x: toX(xv), y: oy2 + pad.t + pH - (normPDF(xv, mu, sig) / normPDF(mu, mu, sig)) * pH * 0.85 });
```

**Guide hardcoded approximate-Cpk values and captions — source lines 8310–8311.**

```javascript
      const cpkApprox = centered ? 1.55 : 0.58;
      const lbl = centered ? (es ? '✓ Centrado — Cpk ≈ 1.55' : '✓ Centered — Cpk ≈ 1.55') : (es ? '⚠ Descentrado — Cpk ≈ 0.58' : '⚠ Off-center — Cpk ≈ 0.58');
```

**Excel column-width calculation and rounding cap — source lines 8550–8556.**

```javascript
      const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...columnData[i].slice(0, 100).map(v => String(v).length)
        );
        return { wch: Math.min(maxLen + 2, 30) };
      });
```

**Pure text interpretation generator (lines 6849–6865).** Its output is an array of plain strings and differs from the screen HTML interpretation in spelling, PPM text and the extra Cp>0 centering condition; these differences are not normalized (compare lines4808–4823).

**Complete plain-text interpretation rules and exact ES/EN concatenations — source lines 6849–6865.**

```javascript
    function _buildInterpretationPlain(r, es) {
      const lines = [];
      const cpk = r.Cpk;
      if (cpk !== null) {
        if (cpk >= 1.67) lines.push(es ? `Proceso World Class. Cpk=${cpk.toFixed(3)} supera 1.67 — variacion minima, perfectamente centrado. PPM esperados: ${Math.round(r.ppm || 0)}.` : `World Class Process. Cpk=${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Expected PPM: ${Math.round(r.ppm || 0)}.`);
        else if (cpk >= 1.33) lines.push(es ? `Proceso Capaz. Cpk=${cpk.toFixed(3)} cumple el estandar Six Sigma (>= 1.33). Proceso bajo control con buena capacidad. PPM: ${Math.round(r.ppm || 0)}.` : `Capable Process. Cpk=${cpk.toFixed(3)} meets Six Sigma standard (>= 1.33). Process under control with good capability. PPM: ${Math.round(r.ppm || 0)}.`);
        else if (cpk >= 1.00) lines.push(es ? `Proceso Marginal. Cpk=${cpk.toFixed(3)} entre 1.0 y 1.33 — produce defectos. Accion de mejora recomendada. PPM: ${Math.round(r.ppm || 0)}.` : `Marginal Process. Cpk=${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement action recommended. PPM: ${Math.round(r.ppm || 0)}.`);
        else lines.push(es ? `Proceso No Capaz. Cpk=${cpk.toFixed(3)} menor a 1.0. Produciendo defectos fuera de especificacion. Accion correctiva urgente requerida. PPM: ${Math.round(r.ppm || 0)}.` : `Not Capable. Cpk=${cpk.toFixed(3)} below 1.0. Producing out-of-spec defects. Urgent corrective action required. PPM: ${Math.round(r.ppm || 0)}.`);
      }
      if (r.Cp !== null && cpk !== null && r.Cp > 0 && r.Cp / cpk > 1.15)
        lines.push(es ? `Problema de centrado: Cp (${r.Cp.toFixed(3)}) es mayor que Cpk (${cpk.toFixed(3)}). El proceso tiene potencial pero no esta centrado en el target. Ajustar la media puede mejorar significativamente.` : `Centering issue: Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}). The process has potential but is off-center. Shifting the mean toward target may significantly improve capability.`);
      if (r.Ppk !== null && r.Cpk !== null && Math.abs(r.Cpk - r.Ppk) > 0.15)
        lines.push(es ? `Variacion entre subgrupos detectada: diferencia Cpk/Ppk = ${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}. Investiga causas asignables como turnos, cambios de material u operadores distintos.` : `Between-subgroup variation detected: Cpk/Ppk = ${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}. Investigate assignable causes such as shifts, material changes, or different operators.`);
      if (!r.isNormal)
        lines.push(es ? `Precaucion — no normalidad: Anderson-Darling p=${r.adTest.p.toFixed(4)}. Los indices Cpk asumen distribucion normal. Considera una transformacion de datos o analisis no-parametrico.` : `Non-normality warning: Anderson-Darling p=${r.adTest.p.toFixed(4)}. Cpk indices assume normal distribution. Consider a data transformation or non-parametric analysis.`);
      return lines;
    }
```

### 2B. UI / DOM functions

The table covers every remaining top-level named declaration, including DOM-free canvas renderers and calculation orchestrators. DOM ids are direct references or generated ids found within the function; indirect mutations occur through the called functions whose bodies follow. `document.documentElement`, selector matches, supplied canvas contexts and transient download anchors/canvases are called out where applicable; “no direct DOM-id access” does not imply purity (lines 3409–8601).

| function | lines | purpose | DOM ids read/written | side effects |
|---|---|---|---|---|
| `t` | 3409–3409 | Return selected-language value or the key itself; reads global currentLang/TRANSLATIONS; not independently pure. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 3409–3409) |
| `applyTranslations` | 3411–3430 | Translate tagged HTML, tooltips, and placeholders using currentLang. | selector-based elements (verbatim selectors below) | HTML replacement/insertion (lines 3411–3430) |
| `setLang` | 3432–3442 | Set language, active ES/EN pills, translate document, then schedule every result control chart redraw after 80 ms; final wrapper additionally updates date. | `'pillES'`; `'pillEN'` | timers (lines 3432–3442) |
| `toggleTheme` | 3447–3456 | Toggle root theme, switch/icon, regenerate particles and apply theme logo; final wrapper additionally reloads gate logo. | `'themeSwitch'`; `'themeIcon'` | state/DOM changes or pure return as described; see exact body (lines 3447–3456) |
| `applyLogo` | 3468–3488 | Read theme logo DataURL from localStorage; show image or C fallback and localized hover tip; swallow storage failures. | `'logoImg'`; `'logoLetter'`; `'logoUploadTip'` | localStorage read/write as shown; HTML replacement/insertion (lines 3468–3488) |
| `handleLogoUpload` | 3490–3504 | Read first file as DataURL asynchronously; store under theme key, applyLogo, show toast, reset input; swallow storage write failure. | No direct DOM-id access; see called functions for indirect access. | localStorage read/write as shown; file reading (lines 3490–3504) |
| `closePanel` | 3522–3526 | Remove open classes from side panel, hamburger and overlay. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 3522–3526) |
| `showTooltip` | 3533–3557 | Set text/initial fixed position, show tooltip, then after 10 ms correct right/bottom/top overflow. | No direct DOM-id access; see called functions for indirect access. | timers (lines 3533–3557) |
| `hideTooltip` | 3559–3561 | Remove tooltip visible class. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 3559–3561) |
| `initParticles` | 3569–3606 | Resize background canvas to viewport, generate capped randomized particles and cancel/restart animation. | `'bgCanvas'` | canvas drawing; randomness (lines 3569–3606) |
| `animateParticles` | 3608–3656 | Move/pulse/wrap particles, draw dark glows or light pearls, schedule next animation frame. | No direct DOM-id access; see called functions for indirect access. | animation-frame scheduling (lines 3608–3656) |
| `loadGateLogo` | 3671–3685 | Read current-theme stored logo and update lock-screen image; storage failures ignored. | `'gateLogo'` | localStorage read/write as shown (lines 3671–3685) |
| `checkPassword` | 3687–3707 | Exact equality against hardcoded constant (value intentionally not reproduced); show translated success/error, hide gate after 1200 ms on success; clear/focus input on failure. | `'passwordInput'`; `'passwordMessage'`; `'passwordGate'` | timers (lines 3687–3707) |
| `classifyCpk` | 3797–3802 | Return translated status label and green/yellow/red class using thresholds1.67/1.33/1.00; reads language through t; exact body is in2A. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 3797–3802) |
| `loadSampleData` | 3812–3819 | Replace specification/subgroup/data fields with literal fixed sample; does not calculate or alter confidence/pointName. | `'lsl'`; `'usl'`; `'target'`; `'subgroupSize'`; `'dataInput'` | state/DOM changes or pure return as described; see exact body (lines 3812–3819) |
| `runAnalysis` | 3824–3868 | Read and parse form; validate at least five parsed points and at least one limit; calculate all statistics and indices; append a new result via renderResults. | `'dataInput'`; `'lsl'`; `'usl'`; `'target'`; `'subgroupSize'`; `'pointName'` | state/DOM changes or pure return as described; see exact body (lines 3824–3868) |
| `renderResults` | 3873–4160 | Allocate result id/store, create complete result HTML, prepend block, update carousel/folder/photo state, bind sigma hover, draw charts and interpretation with delayed work. | `'emptyState'`; `'btnClearProject'`; `'analysesContainer'`; `'folderBadge'`; `'photoBadge'`; ``sigmaBarFill_${idx}``; ``sigmaTrack_${idx}``; `'carouselNav'`; `btnExportActive_${idx}`; `gaugeCanvas_${idx}`; `sigmaTrack_${idx}`; `sigmaBarFill_${idx}`; `histCanvas_${idx}`; `interpretationText_${idx}`; `ccSection_${idx}`; `ccPillAuto_${idx}`; `ccPillImr_${idx}`; `ccPillXr_${idx}`; `ccPillXs_${idx}`; `ccPair_${idx}`; `ccNote_${idx}`; `runChartCanvas_${idx}`; `runChartNote_${idx}`; `qqCanvas_${idx}`; `qqNote_${idx}`; `boxPlotCanvas_${idx}`; `boxPlotNote_${idx}`; selector-based elements (verbatim selectors below) | timers; HTML replacement/insertion; current clock; event-handler assignment (lines 3873–4160) |
| `setActiveExport` | 4162–4171 | Select _lastResult and active-export button styling, then toast; does not change carousel position. | ``btnExportActive_${idx}``; selector-based elements (verbatim selectors below) | state/DOM changes or pure return as described; see exact body (lines 4162–4171) |
| `deleteAnalysis` | 4173–4223 | Remove result DOM/state/order/photo marker; reset empty state or show another analysis; update folder/photo/carousel UI. Does not delete _ccTypes[idx]. | `'emptyState'`; `'btnClearProject'`; `'projectFolderWidget'`; `'photoWidget'`; `'folderBadge'`; `'photoBadge'`; selector-based elements (verbatim selectors below) | state/DOM changes or pure return as described; see exact body (lines 4173–4223) |
| `clearProject` | 4225–4263 | Reset analysis, carousel, folder and photo memory and relevant DOM; retains form fields, project name and stored logos. | `'analysesContainer'`; `'emptyState'`; `'btnClearProject'`; `'projectFolderWidget'`; `'photoWidget'`; `'photoUploadZone'`; `'photoContainer'`; `'photoMarkerTray'`; `'photoChangeLink'`; `'btnExportPhoto'`; `'photoMarkersLayer'`; `'photoImg'` | HTML replacement/insertion (lines 4225–4263) |
| `_showPhotoWidget` | 4274–4279 | Show photo widget once and update analysis-count badge. | `'photoWidget'`; `'photoBadge'` | state/DOM changes or pure return as described; see exact body (lines 4274–4279) |
| `togglePhotoWidget` | 4281–4286 | Toggle photo-open state/class; refresh marker tray when opened. | `'photoWidget'` | state/DOM changes or pure return as described; see exact body (lines 4281–4286) |
| `handlePhotoFileDragOver` | 4289–4292 | Prevent native drop and add photo upload drag-over class. | `'photoUploadZone'` | state/DOM changes or pure return as described; see exact body (lines 4289–4292) |
| `handlePhotoFileDrop` | 4293–4298 | Prevent drop, clear drag class, load first dropped file only when MIME begins image/. | `'photoUploadZone'` | state/DOM changes or pure return as described; see exact body (lines 4293–4298) |
| `handlePhotoUpload` | 4299–4303 | Load first selected file if any, then reset input. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 4299–4303) |
| `_loadPhotoFile` | 4305–4326 | Read file as DataURL, store photo, swap upload/photo/tray/change UI and refresh markers/export visibility; no image/decode/read error handler. | `'photoImg'`; `'photoUploadZone'`; `'photoContainer'`; `'photoMarkerTray'`; `'photoChangeLink'` | file reading (lines 4305–4326) |
| `startDragMarker` | 4329–4333 | Store dragged analysis id and populate HTML5 drag data with text/plain id, move effect. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 4329–4333) |
| `handlePhotoDragOver` | 4334–4340 | Prevent native drop, use move effect, cache last client coordinates, add highlight. | `'photoContainer'` | state/DOM changes or pure return as described; see exact body (lines 4334–4340) |
| `handlePhotoDragLeave` | 4341–4343 | Remove photo-container drop highlight. | `'photoContainer'` | state/DOM changes or pure return as described; see exact body (lines 4341–4343) |
| `handlePhotoMarkerDrop` | 4344–4359 | Use cached drag-over coordinates and photo bounds, clamp marker percentages to [3,97], store placed marker and refresh tray/layer/export button. | `'photoContainer'` | state/DOM changes or pure return as described; see exact body (lines 4344–4359) |
| `removePhotoMarker` | 4361–4366 | Mark existing marker unplaced (retain coordinates), refresh tray/layer/export visibility. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 4361–4366) |
| `_syncExportBtn` | 4368–4372 | Show export button only with at least one placed marker and a photo source. | `'btnExportPhoto'` | state/DOM changes or pure return as described; see exact body (lines 4368–4372) |
| `_refreshPhotoTray` | 4375–4420 | Rebuild localized unplaced/placed marker tray from analysis order, names/Cpk and status colors; assign raw generated HTML. | `'photoMarkerTray'`; `'photoBadge'` | HTML replacement/insertion (lines 4375–4420) |
| `_refreshPhotoMarkersLayer` | 4423–4441 | Rebuild percentage-positioned draggable marker HTML with sequence number/name and tooltip. | `'photoMarkersLayer'` | HTML replacement/insertion (lines 4423–4441) |
| `exportPhotoWithMarkers` | 4444–4502 | Load photo Image, draw natural-size canvas and placed marker circles/labels, download PNG, then toast. | No direct DOM-id access; see called functions for indirect access. | canvas drawing; download initiation; current clock (lines 4444–4502) |
| `toggleCard` | 4505–4530 | Toggle collapsed on supplied element; after expansion delay 480 ms redraw only charts found below it using enclosing analysis or _lastResult. | selector-based elements (verbatim selectors below) | timers (lines 4505–4530) |
| `drawGauge` | 4535–4607 | Draw fixed-size semicircular Cpk gauge, clamped needle and tick labels; replace canvas hover/leave handlers. | `idx !== undefined ? `gaugeCanvas_${idx}` : 'gaugeCanvas'` | canvas drawing; event-handler assignment (lines 4535–4607) |
| `drawHistogram` | 4611–4795 | Resize/draw histogram, normal overlay and specification/mean/target lines; replace tooltip handlers. | `idx !== undefined ? `histCanvas_${idx}` : 'histCanvas'` | canvas drawing; event-handler assignment (lines 4611–4795) |
| `buildInterpretation` | 4800–4824 | Build localized HTML interpretation strings for Cpk, Cp/Cpk ratio, Cpk/Ppk gap and normality; write with br/br separators. | `idx !== undefined ? `interpretationText_${idx}` : 'interpretationText'` | HTML replacement/insertion (lines 4800–4824) |
| `drawRunChart` | 4829–4952 | Draw last 25 observations, local median, side-colored line/points, run count/note and hover; resize canvas. | `idx !== undefined ? `runChartCanvas_${idx}` : 'runChartCanvas'`; `idx !== undefined ? `runChartNote_${idx}` : 'runChartNote'` | canvas drawing; event-handler assignment (lines 4829–4952) |
| `drawQQPlot` | 4957–5099 | Draw all sorted observations against theoretical normal quantiles, identity reference, fixed approximate band and hover; resize canvas. | `idx !== undefined ? `qqCanvas_${idx}` : 'qqCanvas'`; `idx !== undefined ? `qqNote_${idx}` : 'qqNote'` | canvas drawing; event-handler assignment (lines 4957–5099) |
| `drawBoxPlot` | 5104–5332 | Draw same quartile/whisker/outlier box in Overall, Within and Specs rows with differing statistics; replace note and disable tooltips. | `idx !== undefined ? `boxPlotCanvas_${idx}` : 'boxPlotCanvas'`; `idx !== undefined ? `boxPlotNote_${idx}` : 'boxPlotNote'` | canvas drawing; event-handler assignment (lines 5104–5332) |
| `showToast` | 5337–5341 | Set toast text/show class; schedule removal after supplied duration (default 2800 ms), without cancelling prior toast timers. | `'toast'` | timers (lines 5337–5341) |
| `showAnalysisAt` | 5362–5385 | Wrap carousel position modulo count, update hidden/animation classes, sync _lastResult and UI; no chart redraw here. | selector-based elements (verbatim selectors below) | state/DOM changes or pure return as described; see exact body (lines 5362–5385) |
| `prevAnalysis` | 5387–5387 | Show previous carousel entry with left animation (wraparound via showAnalysisAt). | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 5387–5387) |
| `nextAnalysis` | 5388–5388 | Show next carousel entry with right animation (wraparound via showAnalysisAt). | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 5388–5388) |
| `updateCarouselUI` | 5390–5401 | Show navigation only above one result; write localized fallback name and current/total counter. | `'carouselNav'`; `'carouselName'`; `'carouselCounter'` | state/DOM changes or pure return as described; see exact body (lines 5390–5401) |
| `_showProjectFolder` | 5406–5413 | Show project-folder widget once and update badge. | `'projectFolderWidget'`; `'folderBadge'` | state/DOM changes or pure return as described; see exact body (lines 5406–5413) |
| `toggleProjectFolder` | 5415–5420 | Toggle folder open state/class; refresh contents when opened. | `'projectFolderWidget'` | state/DOM changes or pure return as described; see exact body (lines 5415–5420) |
| `updateFolderTabName` | 5422–5424 | Intentional no-op: input is for ZIP folder name, tab remains fixed label. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 5422–5424) |
| `updateFolderContents` | 5426–5445 | Rebuild clickable ordered analysis list with active row, status dot/name and Cpk to three decimals. | `'folderAnalysisList'`; `'folderBadge'` | HTML replacement/insertion (lines 5426–5445) |
| `jumpToAnalysis` | 5447–5454 | Select direction based on position, navigate, then close project folder. | `'projectFolderWidget'` | state/DOM changes or pure return as described; see exact body (lines 5447–5454) |
| `generateComparativeSummary` | 5460–5646 | Asynchronously render balanced pages of up to 24 mini-histograms, repeated full photo/table, date/name/footer at 2400x1440; return PNG URLs or download each 600 ms apart. | `'btnGenerateSummary'`; `'folderNameInput'` | timers; canvas drawing; download initiation; current clock (lines 5460–5646) |
| `_summaryDrawPhoto` | 5649–5722 | Draw summary photo card/placeholder, aspect-fit image and placed markers; use supplied canvas/palette/formatter/color helper. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 5649–5722) |
| `_summaryDrawTable` | 5725–5838 | Draw capped/clipped full-project comparison table with alternating rows and omitted-row label; use supplied canvas helpers. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 5725–5838) |
| `_summaryDrawMiniHist` | 5841–5969 | Draw mini histogram with truncated name/Cpk badge, bins/normal curve/spec/mean lines and axes; early-return when plot too small. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 5841–5969) |
| `generateProjectZip` | 5971–6032 | Sequentially create per-analysis executive PNGs plus comparative summary PNGs in JSZip folder; generate DEFLATE Blob, download ZIP/revoke URL; catch per-image/summary/outer failures separately. | `'btnDownloadZip'`; `'folderNameInput'` | timers; download initiation (lines 5971–6032) |
| `generateExecutivePNG` | 6034–6043 | Reject missing result with toast; disable export button, delay 80 ms then generate active result PNG with error toast and re-enable. | `'btnExportPNG'` | timers (lines 6034–6043) |
| `_drawPNG` | 6045–6499 | Generate standalone executive-report canvas with theme palette, dynamic height, KPI/sigma/charts/tables/interpretation/footer; return DataURL or download PNG. | `'subgroupSize'` | canvas drawing; download initiation; current clock; randomness (lines 6045–6499) |
| `_pngRunChart` | 6502–6554 | Draw all observations/global median run chart into executive PNG; unlike screen renderer, does not truncate to last 25. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 6502–6554) |
| `_pngQQPlot` | 6557–6625 | Draw executive Q-Q with X theoretical/Y observed (opposite screen axes), fixed band, colored points and AD footer. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 6557–6625) |
| `_pngBoxPlot` | 6627–6686 | Draw export Overall/Within/Specs box rows, source quartiles/inliers/outliers, per-row indices and limits. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 6627–6686) |
| `_pngGauge2` | 6689–6751 | Draw export gauge arcs/needle/ticks/Cpk/verdict using supplied formatter/palette. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 6689–6751) |
| `_pngHistogram2` | 6754–6846 | Draw export histogram using 0.55 overall-sigma extent, normal curve, dashed spec/target/mean lines and legend. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 6754–6846) |
| `setCCType` | 6950–6957 | Store forced chart mode, change active mode pill classes, redraw selected result control charts. | ``ccPill${id.charAt(0` | state/DOM changes or pure return as described; see exact body (lines 6950–6957) |
| `drawControlCharts` | 6959–7123 | Select automatic/forced I-MR/Xbar-R/Xbar-S; compute groups/limits/rules; rebuild two chart cards/legends/note and draw in requestAnimationFrame. | `idx !== undefined ? `ccPair_${idx}` : 'ccPair'`; `idx !== undefined ? `ccNote_${idx}` : 'ccNote'`; `'subgroupSize'`; `ccTopCanvas_${idx}`; `ccBotCanvas_${idx}` | animation-frame scheduling; HTML replacement/insertion (lines 6959–7123) |
| `_drawCCChart` | 7126–7276 | Draw screen control chart grid, bounds/zones/limits, flagged points and hover; skip fewer than two valid non-null points. | `canvasId` | canvas drawing; event-handler assignment (lines 7126–7276) |
| `_buildCCData` | 7279–7325 | Return control-chart arrays, labels, limits, sigma estimates, violations and counts without DOM; reads language through t and SPC constants, so not strictly parameter-only pure. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 7279–7325) |
| `_pngCCChart` | 7328–7453 | Draw export control chart with finite-limit/scale fallbacks, warning zones, badges, colored points and legend; skip fewer than two valid points. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 7328–7453) |
| `generateReadingGuide` | 7459–7464 | Toast and defer guide drawing 80 ms; catch errors to console only. | No direct DOM-id access; see called functions for indirect access. | timers (lines 7459–7464) |
| `_drawGuide` | 7466–7970 | Draw 1600x6000 educational canvas with ten bilingual sections, demos and formulas; crop to actual height capped at6000, download PNG. | No direct DOM-id access; see called functions for indirect access. | canvas drawing; download initiation; current clock; randomness (lines 7466–7970) |
| `_drawGuideRunChart` | 7973–8014 | Draw fixed educational run-data demo with hardcoded median and trend annotation. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 7973–8014) |
| `_drawGuideQQPlot` | 8017–8080 | Create deterministic synthetic demo quantiles with tail shifts, draw observed/theoretical axes and deviation-coded points. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 8017–8080) |
| `_drawGuideBoxPlot` | 8083–8137 | Draw fixed sample box in three repeated labeled rows with interpolated quartiles/outliers/specifications. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 8083–8137) |
| `_wrapText` | 8140–8150 | Set canvas font and greedily wrap space-delimited text using measureText; return lines; mutates canvas font. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 8140–8150) |
| `_drawGuideHistogram` | 8153–8216 | Draw fixed theoretical histogram, normal curve, shaded out-of-spec zones and spec badges. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 8153–8216) |
| `_drawGuideCCChart` | 8219–8266 | Draw hardcoded control-chart demo and two explicitly selected red points. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 8219–8266) |
| `_drawGuideDistComp` | 8269–8321 | Draw fixed centered/off-center distributions and hardcoded approximate-Cpk labels. | No direct DOM-id access; see called functions for indirect access. | canvas drawing (lines 8269–8321) |
| `openMwxConverter` | 8345–8348 | Open converter overlay and close side panel. | `'mwxModalOverlay'` | state/DOM changes or pure return as described; see exact body (lines 8345–8348) |
| `closeMwxConverter` | 8350–8353 | Close overlay and clear file/log/conversion state. | `'mwxModalOverlay'` | state/DOM changes or pure return as described; see exact body (lines 8350–8353) |
| `clearMwxFiles` | 8355–8364 | Reset files/count, file list/log/input and disable convert button. | `'mwxFileList'`; `'mwxConvertBtn'`; `'mwxLog'`; `'mwxFileInput'` | HTML replacement/insertion (lines 8355–8364) |
| `addMwxLog` | 8366–8374 | Append timestamped text log entry with type class, show log and scroll to bottom. | `'mwxLog'` | current clock (lines 8366–8374) |
| `removeMwxFile` | 8376–8382 | Splice file by index, rerender list, clear full converter when empty. | No direct DOM-id access; see called functions for indirect access. | state/DOM changes or pure return as described; see exact body (lines 8376–8382) |
| `renderMwxFileList` | 8384–8412 | Rebuild file-name/icon/size/remove-button HTML, show/hide list and enable/disable convert button. | `'mwxFileList'`; `'mwxConvertBtn'` | HTML replacement/insertion (lines 8384–8412) |
| `convertMwxFiles` | 8451–8479 | Disable button, clear log/count, process current files sequentially with per-file error handling/logging, restore button. | `'mwxConvertBtn'`; `'mwxLog'` | HTML replacement/insertion (lines 8451–8479) |
| `convertSingleMwxFile` | 8481–8583 | Open file ZIP, select first sheet.json, parse supported column arrays, construct padded rows/header/widths/sheet, warn on dropped charts/analysis, download XLSX and log. | No direct DOM-id access; see called functions for indirect access. | file reading; download initiation (lines 8481–8583) |
| `updateHeaderDate` | 8593–8601 | Format current date according to language and replace header badge HTML. | `'headerBadge'` | HTML replacement/insertion; current clock (lines 8593–8601) |

**Nested named helpers (all eight; lines6211–6240,7503–7528).** These close over an export canvas/palette/layout and are not standalone pure utilities.

| function | lines | purpose | DOM ids read/written | side effects |
|---|---|---|---|---|
| `rRect` | 6211–6215 | Draw rounded rectangle, optional fill/stroke and stroke width. | None directly; enclosing canvas/context. | Canvas state/drawing (lines6211–6215). |
| `hline` | 6216–6219 | Draw horizontal canvas line. | None directly; enclosing canvas/context. | Canvas state/drawing (lines6216–6219). |
| `label` | 6220–6223 | Set font/fill/alignment and draw text; ignores any seventh argument supplied by callers. | None directly; enclosing canvas/context. | Canvas state/drawing (lines6220–6223). |
| `sectionHeader` | 6224–6229 | Draw accent strip/title and measureText-based divider. | None directly; enclosing canvas/context. | Canvas state/drawing (lines6224–6229). |
| `drawTable` | 6232–6240 | Draw table rows and return final y; showIndex parameter unused. | None directly; enclosing canvas/context. | Canvas state/drawing (lines6232–6240). |
| `sectionTitle` | 7503–7508 | Draw guide section header/subtitle and accent styling. | None directly; enclosing canvas/context. | Canvas state/drawing (lines7503–7508). |
| `badge` | 7510–7516 | Measure/draw guide badge and return width; no call site in file. | None directly; enclosing canvas/context. | Canvas state/drawing (lines7510–7516). |
| `callout` | 7518–7528 | Wrap/draw guide callout and return consumed height. | None directly; enclosing canvas/context. | Canvas state/drawing (lines7518–7528). |

**Arrow-function/callback occurrence catalog (265 arrow sites; lines3413–8586).** One row corresponds to one literal `=>` occurrence in executable script, in source order; multiple arrows on one line receive occurrence numbers. An assigned helper and a callback nested on its same line are separate sites. Assigned-expression binding names identify the surrounding const/let and do not necessarily name the arrow itself. The locator identifies each arrow expression in the source; multi-line callback bodies belong to the enclosing function range in the preceding table, with complete chart/export bodies organized in sections5/7. Calculation bodies are reproduced in2A; top-level wiring is reproduced below. This is a syntactic occurrence count, not a count of runtime closures/instances. Including111 named declarations,265 arrows and2 assigned ordinary-function wrappers gives **378 syntactic JavaScript function definitions**; HTML inline event-handler attributes are separately inventoried under inputs/UI and are not additional explicit JavaScript declarations (lines2625–2984,3413–8609).

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 03/24. Continue: [capaflow-inventory-section-04-of-24.md](capaflow-inventory-section-04-of-24.md).

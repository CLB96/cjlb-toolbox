# CapaFlow inventory — section 05 of 24

**Original inventory lines:** 1616–2064 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 2. Functions → 2B. UI / DOM functions.
**Previous:** [capaflow-inventory-section-04-of-24.md](capaflow-inventory-section-04-of-24.md). **Next:** [capaflow-inventory-section-06-of-24.md](capaflow-inventory-section-06-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Active export selection and deletion — verbatim source [L4162–4223].**

```javascript
    function setActiveExport(idx) {
      if (_results[idx]) {
        _lastResult = _results[idx];
        // Update button styles
        document.querySelectorAll('[id^="btnExportActive_"]').forEach(b => b.classList.remove('active-export'));
        const btn = document.getElementById(`btnExportActive_${idx}`);
        if (btn) btn.classList.add('active-export');
        showToast(currentLang === 'es' ? 'Análisis activo para exportar PNG' : 'Analysis set active for PNG export');
      }
    }

    function deleteAnalysis(idx) {
      const wrapper = document.querySelector(`[data-analysis-idx="${idx}"]`);
      if (wrapper) wrapper.remove();
      delete _results[idx];

      // Remove from order + clean up photo marker for this point
      const orderPos = _analysisOrder.indexOf(idx);
      if (orderPos !== -1) _analysisOrder.splice(orderPos, 1);
      delete _photoMarkers[idx];

      const remaining = _analysisOrder.length;

      if (remaining === 0) {
        _lastResult = null;
        _analysisCounter = 0;
        _carouselCurrent = 0;
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = '';
        const clearBtn = document.getElementById('btnClearProject');
        if (clearBtn) clearBtn.classList.remove('visible');
        // Hide folder + photo widgets
        const fw = document.getElementById('projectFolderWidget');
        if (fw) fw.classList.remove('pf-visible', 'pf-open');
        _folderOpen = false;
        const pw = document.getElementById('photoWidget');
        if (pw) pw.classList.remove('pw-visible', 'pw-open');
        _photoOpen = false;
      } else {
        _carouselCurrent = Math.min(_carouselCurrent, remaining - 1);
        showAnalysisAt(_carouselCurrent, null);
        if (remaining === 1) {
          // Hide both widgets when back to single analysis
          const fw = document.getElementById('projectFolderWidget');
          if (fw) fw.classList.remove('pf-visible', 'pf-open');
          _folderOpen = false;
          const pw = document.getElementById('photoWidget');
          if (pw) pw.classList.remove('pw-visible', 'pw-open');
          _photoOpen = false;
        } else {
          // Update badges + refresh open panels
          const fb = document.getElementById('folderBadge');
          if (fb) fb.textContent = remaining;
          if (_folderOpen) updateFolderContents();
          const pb = document.getElementById('photoBadge');
          if (pb) pb.textContent = remaining;
          if (_photoOpen) { _refreshPhotoTray(); _refreshPhotoMarkersLayer(); }
          _syncExportBtn();
        }
      }
      updateCarouselUI();
    }
```

**Photo-widget visibility and expansion — verbatim source [L4274–4286].**

```javascript
    function _showPhotoWidget() {
      const w = document.getElementById('photoWidget');
      if (w && !w.classList.contains('pw-visible')) w.classList.add('pw-visible');
      const b = document.getElementById('photoBadge');
      if (b) b.textContent = _analysisOrder.length;
    }

    function togglePhotoWidget() {
      const w = document.getElementById('photoWidget');
      _photoOpen = !_photoOpen;
      w.classList.toggle('pw-open', _photoOpen);
      if (_photoOpen) _refreshPhotoTray();
    }
```

**Marker drag, percentage placement, removal and export-button state — verbatim source [L4329–4372].**

```javascript
    function startDragMarker(e, idx) {
      _draggedMarkerIdx = idx;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    }
    function handlePhotoDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      _photoDropX = e.clientX;
      _photoDropY = e.clientY;
      document.getElementById('photoContainer').classList.add('drag-over-photo');
    }
    function handlePhotoDragLeave(e) {
      document.getElementById('photoContainer').classList.remove('drag-over-photo');
    }
    function handlePhotoMarkerDrop(e) {
      e.preventDefault();
      document.getElementById('photoContainer').classList.remove('drag-over-photo');
      if (_draggedMarkerIdx === null) return;

      const rect = document.getElementById('photoContainer').getBoundingClientRect();
      const x = Math.max(3, Math.min(97, (_photoDropX - rect.left)  / rect.width  * 100));
      const y = Math.max(3, Math.min(97, (_photoDropY - rect.top)   / rect.height * 100));

      _photoMarkers[_draggedMarkerIdx] = { x, y, placed: true };
      _draggedMarkerIdx = null;

      _refreshPhotoTray();
      _refreshPhotoMarkersLayer();
      _syncExportBtn();
    }

    function removePhotoMarker(idx) {
      if (_photoMarkers[idx]) _photoMarkers[idx].placed = false;
      _refreshPhotoTray();
      _refreshPhotoMarkersLayer();
      _syncExportBtn();
    }

    function _syncExportBtn() {
      const hasPlaced = Object.values(_photoMarkers).some(m => m?.placed);
      const btn = document.getElementById('btnExportPhoto');
      if (btn) btn.classList.toggle('visible', hasPlaced && !!_photoImageSrc);
    }
```

**Collapse state and delayed redraw dispatch — verbatim source [L4505–4530].**

```javascript
    function toggleCard(cardEl) {
      if (!cardEl) return;
      const isCollapsed = cardEl.classList.toggle('collapsed');
      if (!isCollapsed) {
        setTimeout(() => {
          const wrapper = cardEl.closest('[data-analysis-idx]');
          const idx = wrapper ? parseInt(wrapper.dataset.analysisIdx) : null;
          const res = idx !== null ? _results[idx] : _lastResult;
          if (res) {
            const hist = cardEl.querySelector('[id^="histCanvas_"]');
            if (hist) drawHistogram(res, idx);
            const gauge = cardEl.querySelector('[id^="gaugeCanvas_"]');
            if (gauge) drawGauge(res.Cpk, res.Cpk !== null ? colorForCpk(res.Cpk) : 'var(--accent)', idx);
            const ccTop = cardEl.querySelector('[id^="ccTopCanvas"]');
            const ccBot = cardEl.querySelector('[id^="ccBotCanvas"]');
            if (ccTop || ccBot) drawControlCharts(res, _ccTypes[idx] || 'auto', idx);
            const rc = cardEl.querySelector('[id^="runChartCanvas_"]');
            if (rc) drawRunChart(res, idx);
            const qq = cardEl.querySelector('[id^="qqCanvas_"]');
            if (qq) drawQQPlot(res, idx);
            const bp = cardEl.querySelector('[id^="boxPlotCanvas_"]');
            if (bp) drawBoxPlot(res, idx);
          }
        }, 480);
      }
    }
```

**Toast text, class and timeout — verbatim source [L5337–5341].**

```javascript
    function showToast(msg, duration = 2800) {
      const el = document.getElementById('toast');
      el.textContent = msg; el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), duration);
    }
```

**Carousel selection and previous/next wrapping — verbatim source [L5362–5388].**

```javascript
    function showAnalysisAt(pos, direction) {
      const total = _analysisOrder.length;
      if (total === 0) return;
      _carouselCurrent = ((pos % total) + total) % total;
      const targetIdx = _analysisOrder[_carouselCurrent];

      document.querySelectorAll('.analysis-block').forEach(block => {
        const bIdx = parseInt(block.dataset.analysisIdx);
        if (bIdx === targetIdx) {
          block.classList.remove('carousel-hidden', 'barrel-enter-right', 'barrel-enter-left');
          void block.offsetWidth; // force reflow for animation restart
          if (direction === 'right') block.classList.add('barrel-enter-right');
          else if (direction === 'left')  block.classList.add('barrel-enter-left');
        } else {
          block.classList.add('carousel-hidden');
          block.classList.remove('barrel-enter-right', 'barrel-enter-left');
        }
      });

      // Keep _lastResult in sync with visible analysis
      if (_results[targetIdx]) _lastResult = _results[targetIdx];
      updateCarouselUI();
      if (_folderOpen) updateFolderContents();
    }

    function prevAnalysis() { showAnalysisAt(_carouselCurrent - 1, 'left'); }
    function nextAnalysis() { showAnalysisAt(_carouselCurrent + 1, 'right'); }
```

**Folder visibility, expansion and project-name no-op callback — verbatim source [L5406–5424].**

```javascript
    function _showProjectFolder() {
      const widget = document.getElementById('projectFolderWidget');
      if (!widget.classList.contains('pf-visible')) {
        widget.classList.add('pf-visible');
      }
      const badge = document.getElementById('folderBadge');
      if (badge) badge.textContent = _analysisOrder.length;
    }

    function toggleProjectFolder() {
      const widget = document.getElementById('projectFolderWidget');
      _folderOpen = !_folderOpen;
      widget.classList.toggle('pf-open', _folderOpen);
      if (_folderOpen) updateFolderContents();
    }

    function updateFolderTabName(val) {
      // Tab label stays "PROYECTO" — input is just for the ZIP folder name
    }
```

**Folder jump into carousel — verbatim source [L5447–5454].**

```javascript
    function jumpToAnalysis(pos) {
      const dir = pos > _carouselCurrent ? 'right' : 'left';
      showAnalysisAt(pos, dir);
      // Close folder after jump
      const widget = document.getElementById('projectFolderWidget');
      _folderOpen = false;
      widget.classList.remove('pf-open');
    }
```

**Converter log rendering and queue removal — verbatim source [L8366–8382].**

```javascript
    function addMwxLog(message, type = 'info') {
      const log = document.getElementById('mwxLog');
      log.classList.add('visible');
      const entry = document.createElement('div');
      entry.className = `mwx-log-entry ${type}`;
      entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
    }

    function removeMwxFile(index) {
      mwxFiles.splice(index, 1);
      renderMwxFileList();
      if (mwxFiles.length === 0) {
        clearMwxFiles();
      }
    }
```

## 3. Data import / input

### Process measurements: manual text, not spreadsheet-file import

- Measurements enter through the `dataInput` textarea; the sample button replaces its value and the calculate button calls `runAnalysis()`. There is no Excel/CSV/JSON file reader, sheet chooser, column selector, header-row switch, or process-data import wizard. The Excel-paste placeholder describes pasting text into this same textarea, not opening an Excel workbook. The separate MWX/MWP/MPX converter downloads a workbook and never forwards cells into `dataInput`. [L2847–2855, L3136, L3340, L3735–3737, L3812–3868, L8481–8583; full-file inspection L1–8617]
- Splitting accepts whitespace, comma, semicolon, newline and tab. `parseFloat(v.trim())` parses each token and only `NaN` tokens are removed. There is no row/column preservation, quoted-CSV parser, locale decimal conversion, header detection, or date conversion. A nonnumeric header disappears only because it parses as `NaN`; a header beginning with a number is accepted as a numeric prefix. [L3735–3737]
- **observed bug:** a decimal comma is a delimiter, not a decimal separator; numeric-prefix strings and `Infinity` survive parsing. Invalid tokens disappear silently rather than generating a validation error. These are source behaviors to preserve, not corrected parsing rules. [L3736]

**Complete process-data parser — verbatim source [L3735–3737].**

```javascript
    function parseData(raw) {
      return raw.split(/[\s,;\n\t]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    }
```

### Manual specification and subgroup handling

| Field / rule | Exact behavior | Source lines |
|---|---|---|
| `lsl`, `usl`, `target` | Each read using `parseFloat(...value)`; empty/nonnumeric produces `NaN`. Target optional. | L3828–3830 |
| `subgroupSize` | `parseInt(...value) \|\| 1`; HTML `min="1" max="25"` is not programmatically enforced. Zero/empty/NaN becomes1; negative/out-of-range integer is not rejected here. | L2872, L3831 |
| `pointName` | `.value.trim()`; empty allowed, presentation fallback only. | L3832, L3886 |
| Minimum count | Parsed numeric-token count checked; fewer than5 triggers alert and returns. | L3827 |
| Limit presence | `!isNaN`, not finiteness. At least one required. | L3833–3834 |
| Limit ordering / variance | No `usl > lsl`, equal-limit, finite-number, positive-sigma, or target-within-limits check exists in entry point. | L3824–3868 |
| Incomplete subgroup | `withinSigma` keeps only groups of length exactly `n`; trailing remainder discarded for within sigma, not from original data/overall statistics. | L3756–3762, L3836–3837 |
| Confidence | Displayed default95, never read; normality fixed at `adTest.p >= 0.05`. **observed bug:** control has no computational effect. | L2876, L3838; full script L2991–8614 |

### Every process-validation alert (not dictionary keys)

| Condition | ES literal | EN literal | Source lines |
|---|---|---|---|
| Fewer than5 parsed observations | `Necesitas al menos 5 datos.` | `Need at least 5 data points.` | L3827 |
| Neither limit parses numerically | `Ingresa al menos un límite de especificación.` | `Enter at least one specification limit.` | L3834 |

Complete entry point below preserves exact validation order, parse calls, object shape, calculations and alert text; section2A explains calculation semantics. [L3824–3868]

**Complete analysis entry point — verbatim source [L3824–3868].**

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

### Sample data (complete, verbatim)

Sample writes LSL `'73.95'`, USL `'74.05'`, target `'74'`, subgroup `'5'` and exact125-observation string below. It does not calculate, change confidence, or fill point name. [L3812–3819]

**Complete loadSampleData function and complete sample string — verbatim source [L3812–3819].**

```javascript
    function loadSampleData() {
      document.getElementById('lsl').value = '73.95';
      document.getElementById('usl').value = '74.05';
      document.getElementById('target').value = '74';
      document.getElementById('subgroupSize').value = '5';
      const data = `74.03, 74.002, 74.019, 73.992, 74.008, 73.995, 73.992, 74.001, 74.011, 74.004, 73.988, 74.024, 74.021, 74.005, 74.002, 74.002, 73.996, 73.993, 74.015, 74.009, 73.992, 74.007, 74.015, 73.989, 74.014, 74.009, 73.994, 73.997, 73.985, 73.993, 73.995, 74.006, 73.994, 74.0, 74.005, 73.985, 74.003, 73.993, 74.015, 73.988, 74.008, 73.995, 74.009, 74.005, 74.004, 73.998, 74.0, 73.99, 74.007, 73.995, 73.994, 73.998, 73.994, 73.995, 73.99, 74.004, 74.0, 74.007, 74.0, 73.996, 73.983, 74.002, 73.998, 73.997, 74.012, 74.006, 73.967, 73.994, 74.0, 73.984, 74.012, 74.014, 73.998, 73.999, 74.007, 74.0, 73.984, 74.005, 73.998, 73.996, 73.994, 74.012, 73.986, 74.005, 74.007, 74.006, 74.01, 74.018, 74.003, 74.0, 73.984, 74.002, 74.003, 74.005, 73.997, 74.0, 74.01, 74.013, 74.02, 74.003, 73.982, 74.001, 74.015, 74.005, 73.996, 74.004, 73.999, 73.99, 74.006, 74.009, 74.01, 73.989, 73.99, 74.009, 74.014, 74.015, 74.008, 73.993, 74.0, 74.01, 73.982, 73.984, 73.995, 74.017, 74.013`;
      document.getElementById('dataInput').value = data;
    }
```

### Photo and logo files

| Input channel | Acceptance / parsing / state effects | Source lines |
|---|---|---|
| Logo picker `logoFileInput` | `accept="image/*"`; first file only, `FileReader.readAsDataURL`. On load stores string for theme current at callback time, reapplies header logo, shows localized saved toast. Picker reset after starting read. No size/content/decode/FileReader.onerror validation. | L2792, L3490–3504 |
| Photo picker `photoFileInput` | `accept="image/*"`; first file only; no explicit MIME check in picker handler. Picker reset for same-file reselection. | L2930–2931, L4299–4303 |
| Photo drop | Optional-chain `dataTransfer`, first file only; requires MIME `.startsWith('image/')`; invalid/no file silently ignored. | L2923–2931, L4289–4298 |
| Photo reader | DataURL assigned `_photoImageSrc`/image src; hide upload zone, show image/tray/change link, refresh marker/export UI. No resize/compression/persistence/read-error UI. | L4305–4326 |
| Marker placement | Not measurements: stores `{x,y,placed:true}` by existing analysis index, percentage coordinates clamped3–97. | L4329–4359 |

**Complete photo import handlers — verbatim source [L4289–4326].**

```javascript
    function handlePhotoFileDragOver(e) {
      e.preventDefault();
      document.getElementById('photoUploadZone').classList.add('drag-over');
    }
    function handlePhotoFileDrop(e) {
      e.preventDefault();
      document.getElementById('photoUploadZone').classList.remove('drag-over');
      const f = e.dataTransfer?.files[0];
      if (f && f.type.startsWith('image/')) _loadPhotoFile(f);
    }
    function handlePhotoUpload(e) {
      const f = e.target.files[0];
      if (f) _loadPhotoFile(f);
      e.target.value = '';   // allow re-selecting same file
    }

    function _loadPhotoFile(file) {
      const reader = new FileReader();
      reader.onload = ev => {
        _photoImageSrc = ev.target.result;
        const img        = document.getElementById('photoImg');
        const zone       = document.getElementById('photoUploadZone');
        const container  = document.getElementById('photoContainer');
        const tray       = document.getElementById('photoMarkerTray');
        const changeLink = document.getElementById('photoChangeLink');

        img.src = _photoImageSrc;
        zone.style.display      = 'none';
        container.style.display = 'block';
        tray.style.display      = 'flex';
        changeLink.style.display = 'block';

        _refreshPhotoTray();
        _refreshPhotoMarkersLayer();
        _syncExportBtn();
      };
      reader.readAsDataURL(file);
    }
```

### MWX/MWP/MPX converter: separate import-to-export utility

- Picker accepts `.mwx,.MWX,.mwp,.MWP,.mpx,.MPX` and multiple files. Drop lowercases names and filters three suffixes, appending accepted files; mixed drops silently omit invalid files. No qualifying file logs Spanish warning below. Picker change appends all selected files without repeating extension filter. Queue has no duplicate/size/count/content prevalidation. [L2762, L8429–8448]
- Sequential `await` conversion reads each file as ArrayBuffer and `JSZip.loadAsync`. First ZIP member matching `/sheets\/.*\/sheet\.json$/i` is chosen (`[0]`); no sheet chooser or multi-sheet iteration. Text is `JSON.parse`d; columns=`data.Data?.Columns || []`. Malformed ZIP/JSON/library failure propagates to per-file catch/log. [L8464–8472, L8481–8503]
- Header=`col.WorksheetVarBody?.Name || 'Sin nombre'`. Numeric data takes precedence whenever nonempty; otherwise text data is used. No numeric parsing, row filtering, date parsing or missing-value conversion. Always output header row first; pad shorter columns with `''` to `maxRows`. [L8515–8544]
- Sheet name=`data.Data?.PrivateTitle || 'Hoja 1'`, truncated31characters. Width inspects header+first100values, cap `wch`30. Charts/analysis not converted; warning logged. Exact XLSX output/filename in section7. Converted cells never automatically enter analysis. [L8512, L8546–8583]
- **observed bug:** converter progress/errors/fallback names and some modal text remain hardcoded Spanish in English mode. No English variants exist for listed converter messages. [L2752, L8408, L8440, L8457–8582]

| Converter message / exception | Exact literal or template expression | Source lines |
|---|---|---|
| Wrong dropped extensions | `'⚠ Solo archivos .MWX, .MWP o .MPX son permitidos'` | L8440 |
| Busy button | `'⏳ Procesando...'` | L8457 |
| Start | `` `📂 Iniciando conversión de ${mwxFiles.length} archivo(s)...` `` | L8462 |
| Current file | `` `🔄 Procesando: ${file.name}` `` | L8467 |
| Per-file error | `` `❌ Error en ${file.name}: ${error.message}` `` | L8471 |
| Completion | `` `✅ Conversión completada: ${mwxProcessedCount}/${mwxFiles.length} exitosos` `` | L8475 |
| No matching sheet | `'No se encontró sheet.json en el archivo (verifica que sea un MWX/MWP/MPX válido)'` | L8492 |
| No columns | `'No se encontraron columnas de datos'` | L8503 |
| Columns found | `` `  └─ Encontradas ${columns.length} columna(s) de datos` `` | L8506 |
| Rows found | `` `  └─ Total de ${maxRows} filas de datos` `` | L8533 |
| Nonconvertible objects | `` `  ⚠ Archivo contiene gráficas/análisis no convertibles` `` | L8567 |
| Download created | `` `  ✓ Guardado como: ${a.download}` `` | L8582 |

Complete literal below preserves leading log spaces, ZIP regex, optional-chain paths, numeric/text preference, blank padding, headers and download construction. [L8414–8583]

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 05/24. Continue: [capaflow-inventory-section-06-of-24.md](capaflow-inventory-section-06-of-24.md).

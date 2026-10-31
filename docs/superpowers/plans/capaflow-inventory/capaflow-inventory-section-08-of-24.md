# CapaFlow inventory — section 08 of 24

**Original inventory lines:** 2930–3385 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 4. Displayed results → Chart-associated result boxes and control-chart cards.
**Previous:** [capaflow-inventory-section-07-of-24.md](capaflow-inventory-section-07-of-24.md). **Next:** [capaflow-inventory-section-09-of-24.md](capaflow-inventory-section-09-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Control-chart status badge CSS — verbatim source [L2110–2139].**

```css
    .cc-ooc-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.65rem;
      border-radius: 50px;
      font-size: 0.68rem;
      font-family: 'DM Mono', monospace;
      font-weight: 500;
    }

    .cc-ooc-badge.ooc {
      background: rgba(255, 82, 82, 0.1);
      border: 1px solid rgba(255, 82, 82, 0.25);
      color: var(--accent-red);
    }

    .cc-ooc-badge.ok {
      background: rgba(105, 240, 174, 0.1);
      border: 1px solid rgba(105, 240, 174, 0.25);
      color: var(--accent-green);
    }

    [data-theme="light"] .cc-ooc-badge.ok {
      color: var(--accent-green);
    }

    [data-theme="light"] .cc-ooc-badge.ooc {
      color: var(--accent-red);
    }
```

### Photo tray, marker layer, carousel, project list and converter displays

| Display | Exact text/value behavior | Class/color | Source lines |
|---|---|---|---|
| Photo badge | `_analysisOrder.length` | `.photo-badge` | L4277–4278, L4378 |
| Unplaced tray title | ES `Arrastra al plano:`; EN `Drag onto photo:` | `.photo-tray-label` | L4386–4387 |
| Unplaced item | Position=`indexOf(idx)+1`; name pointName or `Punto ${pos}`/`Point ${pos}` | Draggable; Cpk-colored numbered dot; name max110px | L4388–4398 |
| Placed tray title | ES `Colocados — click para quitar:`; EN `Placed — click to remove:` | `.photo-tray-label` | L4401–4402 |
| Placed item | Name/position; Cpk suffix `` ` · Cpk ${r.Cpk.toFixed(3)}` `` if non-null; `✕`; title `Quitar`/`Remove` | Name max80px; border `${col}33` | L4403–4416 |
| Photo marker | Position/name, title movement hint | `.photo-marker`, percentage left/top and Cpk background | L4423–4441 |
| Carousel name/counter | Name or `Punto ${current+1}`/`Point ${current+1}`; `${current+1} / ${total}` when >1 | Nav flex only when >1 | L5390–5401 |
| Folder list | Position `. ` name; `Cpk ${r.Cpk.toFixed(3)}` or empty | `.fai-active` current; Cpk dot | L5426–5445 |
| Toast | Provided text, default2800ms | `.toast.show`, textContent | L5337–5341 |
| Converter file list | MWP/MPX else MWX; raw filename; `(file.size / 1024).toFixed(1)` + ` KB` | `.mwx-file-item`, `.mwx-file-status` | L8397–8410 |
| Converter log | `[${new Date().toLocaleTimeString()}] ${message}` | `.mwx-log-entry ${type}`; green/red/yellow status tokens | L1098–1108, L8366–8374 |

Complete implementations retain titles, truncation CSS, fallbacks and text concatenations. [L4375–4441, L5390–5445, L8384–8412]

**Complete photo tray and marker-layer composition — verbatim source [L4375–4441].**

```javascript
    function _refreshPhotoTray() {
      const tray = document.getElementById('photoMarkerTray');
      if (!tray) return;
      document.getElementById('photoBadge').textContent = _analysisOrder.length;

      const es = currentLang === 'es';
      const unplaced = _analysisOrder.filter(i => !(_photoMarkers[i]?.placed));
      const placed   = _analysisOrder.filter(i =>  _photoMarkers[i]?.placed);

      let html = '';

      if (unplaced.length) {
        html += `<div class="photo-tray-label">${es ? 'Arrastra al plano:' : 'Drag onto photo:'}</div>`;
        html += unplaced.map(idx => {
          const r   = _results[idx];
          const pos = _analysisOrder.indexOf(idx) + 1;
          const nm  = r?.pointName || (es ? `Punto ${pos}` : `Point ${pos}`);
          const col = (r?.Cpk != null) ? colorForCpk(r.Cpk) : 'var(--accent)';
          return `<div class="photo-tray-item" draggable="true"
                       ondragstart="startDragMarker(event,${idx})" title="${nm}">
            <div class="photo-tray-dot" style="background:${col}">${pos}</div>
            <span style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nm}</span>
          </div>`;
        }).join('');
      }

      if (placed.length && _photoImageSrc) {
        html += `<div class="photo-tray-label" style="margin-top:.3rem">${es ? 'Colocados — click para quitar:' : 'Placed — click to remove:'}</div>`;
        html += placed.map(idx => {
          const r   = _results[idx];
          const pos = _analysisOrder.indexOf(idx) + 1;
          const nm  = r?.pointName || (es ? `Punto ${pos}` : `Point ${pos}`);
          const col = (r?.Cpk != null) ? colorForCpk(r.Cpk) : 'var(--accent)';
          const cpk = (r?.Cpk != null) ? ` · Cpk ${r.Cpk.toFixed(3)}` : '';
          return `<div class="photo-tray-item" onclick="removePhotoMarker(${idx})"
                       style="border-color:${col}33;cursor:pointer" title="${es?'Quitar':'Remove'}">
            <div class="photo-tray-dot" style="background:${col}">${pos}</div>
            <span style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nm}</span>
            <span style="color:var(--text-tertiary);font-size:.62rem;flex-shrink:0">${cpk}</span>
            <span style="margin-left:auto;opacity:.55;font-size:.7rem">✕</span>
          </div>`;
        }).join('');
      }

      tray.innerHTML = html;
    }

    /* ── Render: markers layer on photo ── */
    function _refreshPhotoMarkersLayer() {
      const layer = document.getElementById('photoMarkersLayer');
      if (!layer) return;
      layer.innerHTML = _analysisOrder
        .filter(idx => _photoMarkers[idx]?.placed)
        .map(idx => {
          const m   = _photoMarkers[idx];
          const r   = _results[idx];
          const pos = _analysisOrder.indexOf(idx) + 1;
          const nm  = r?.pointName || `${pos}`;
          const col = (r?.Cpk != null) ? colorForCpk(r.Cpk) : 'var(--accent)';
          return `<div class="photo-marker" style="left:${m.x}%;top:${m.y}%;background:${col}"
                       draggable="true" ondragstart="startDragMarker(event,${idx})"
                       title="${nm} — ${currentLang==='es'?'arrastra para mover, click en tray para quitar':'drag to move, click tray to remove'}">
            ${pos}
            <div class="photo-marker-label">${nm}</div>
          </div>`;
        }).join('');
    }
```


**Complete carousel labels — verbatim source [L5390–5401].**

```javascript
    function updateCarouselUI() {
      const total = _analysisOrder.length;
      const navEl = document.getElementById('carouselNav');
      if (navEl) navEl.style.display = total > 1 ? 'flex' : 'none';

      const targetIdx = _analysisOrder[_carouselCurrent];
      const r = _results[targetIdx];
      const nameEl = document.getElementById('carouselName');
      if (nameEl) nameEl.textContent = r ? (r.pointName || (currentLang === 'es' ? `Punto ${_carouselCurrent + 1}` : `Point ${_carouselCurrent + 1}`)) : '';
      const counterEl = document.getElementById('carouselCounter');
      if (counterEl) counterEl.textContent = total > 1 ? `${_carouselCurrent + 1} / ${total}` : '';
    }
```


**Complete folder list — verbatim source [L5426–5445].**

```javascript
    function updateFolderContents() {
      const list = document.getElementById('folderAnalysisList');
      if (!list) return;
      const badge = document.getElementById('folderBadge');
      if (badge) badge.textContent = _analysisOrder.length;

      const es = currentLang === 'es';
      list.innerHTML = _analysisOrder.map((idx, pos) => {
        const r = _results[idx];
        const name = r ? (r.pointName || (es ? `Punto ${pos + 1}` : `Point ${pos + 1}`)) : `${pos + 1}`;
        const cpkStr = r && r.Cpk !== null ? `Cpk ${r.Cpk.toFixed(3)}` : '';
        const dotColor = r && r.Cpk !== null ? colorForCpk(r.Cpk) : 'var(--accent)';
        const isCurrent = pos === _carouselCurrent;
        return `<div class="folder-analysis-item ${isCurrent ? 'fai-active' : ''}" onclick="jumpToAnalysis(${pos})">
          <div class="folder-analysis-dot" style="background:${dotColor}"></div>
          <span class="folder-analysis-name">${pos + 1}. ${name}</span>
          <span class="folder-analysis-cpk">${cpkStr}</span>
        </div>`;
      }).join('');
    }
```


**Complete converter file list — verbatim source [L8384–8412].**

```javascript
    function renderMwxFileList() {
      const list = document.getElementById('mwxFileList');
      list.innerHTML = '';

      if (mwxFiles.length === 0) {
        list.style.display = 'none';
        document.getElementById('mwxConvertBtn').disabled = true;
        return;
      }

      list.style.display = 'flex';
      document.getElementById('mwxConvertBtn').disabled = false;

      mwxFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'mwx-file-item';
        const fname = file.name.toLowerCase();
        const ext = fname.endsWith('.mwp') ? 'MWP' : fname.endsWith('.mpx') ? 'MPX' : 'MWX';
        item.innerHTML = `
      <div class="mwx-file-icon">${ext}</div>
      <div class="mwx-file-info">
        <div class="mwx-file-name">${file.name}</div>
        <div class="mwx-file-status">${(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <button class="mwx-remove-file" onclick="removeMwxFile(${index})" title="Eliminar">×</button>
    `;
        list.appendChild(item);
      });
    }
```

### Export-only tables and summaries

- Comparative summary has project/date/page headers, photo/no-photo placeholder, comparative table and per-point mini-histograms. Exact output layout/pagination/palette is section7. Table columns: `#`, `summary.colPoint`, `N`, `summary.colMean`, `σ Wit`, `σ Ovr`, `Cp`, `Cpk`, `Pp`, `Ppk`, `σ Lvl`. [L5460–5969]
- Rows display String(position), point name truncated24characters, String(N), mean/within/overall at4decimals, indices at3decimals, sigma at2decimals+`σ`. Missing rows summarized by localized clipped-count string. Full exact table renderer below; export context section7. [L5725–5838]
- Executive PNG repeats capability/performance/stats/PPM/normality/verdict/interpretation using separate palette/formatters, plus plots. Reading-guide figures are illustrative, not extra measured results. Full composition section7, plots section5. [L6045–6499, L6849–6865, L7466–7970]

**Complete comparative table with all cell expressions and clipped-row text — verbatim source [L5725–5838].**

```javascript
    function _summaryDrawTable(ctx, x, y, w, h, order, P, isDark, fmt, cpkColor) {
      // Card background
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10);
      ctx.fillStyle = P.surface; ctx.fill();
      ctx.strokeStyle = P.border; ctx.lineWidth = 1.5; ctx.stroke();

      // Accent bar
      ctx.fillStyle = P.accent2;
      ctx.beginPath(); ctx.roundRect(x, y, 3, h, [2, 0, 0, 2]); ctx.fill();

      // Column definitions — total usable = w - 16 = 804px
      const COLS = [
        { label: '#',      w: 32,  align: 'center' },
        { label: t('summary.colPoint'), w: 170, align: 'left'   },
        { label: 'N',      w: 38,  align: 'center' },
        { label: t('summary.colMean'),  w: 80,  align: 'right'  },
        { label: 'σ Wit',  w: 80,  align: 'right'  },
        { label: 'σ Ovr',  w: 80,  align: 'right'  },
        { label: 'Cp',     w: 60,  align: 'center' },
        { label: 'Cpk',    w: 72,  align: 'center' },
        { label: 'Pp',     w: 60,  align: 'center' },
        { label: 'Ppk',    w: 72,  align: 'center' },
        { label: 'σ Lvl',  w: 60,  align: 'center' },
      ];

      const PAD_X = 8;
      const LBL_H = 22;
      const HDR_H = 32;
      const TABLE_START = y + LBL_H + 4;
      const AVAIL_H = h - LBL_H - 4;
      const MAX_ROW_H = 30, MIN_ROW_H = 16;
      const ROW_H = Math.max(MIN_ROW_H, Math.min(MAX_ROW_H, Math.floor((AVAIL_H - HDR_H) / order.length)));
      const maxRows = Math.floor((AVAIL_H - HDR_H) / ROW_H);
      const visibleOrder = order.slice(0, maxRows);
      const clipped = order.length - visibleOrder.length;

      // Label
      ctx.font = '600 12px ui-monospace,monospace';
      ctx.fillStyle = P.textDim; ctx.textAlign = 'left';
      ctx.fillText(t('summary.tableTitle'), x + 10, y + 16);

      // Clip to card body
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x + 2, TABLE_START, w - 4, h - LBL_H - 6, 8); ctx.clip();

      // Header background
      ctx.fillStyle = P.headerBg; ctx.fillRect(x, TABLE_START, w, HDR_H);

      // Header text
      ctx.font = '700 11px ui-monospace,monospace'; ctx.fillStyle = P.accent;
      let colX = x + PAD_X;
      COLS.forEach(col => {
        ctx.textAlign = col.align;
        const tx = col.align === 'right' ? colX + col.w - 2
                 : col.align === 'center' ? colX + col.w / 2 : colX + 2;
        ctx.fillText(col.label, tx, TABLE_START + 22);
        colX += col.w;
      });

      // Header separator
      ctx.beginPath(); ctx.moveTo(x, TABLE_START + HDR_H); ctx.lineTo(x + w, TABLE_START + HDR_H);
      ctx.strokeStyle = P.border; ctx.lineWidth = 1; ctx.stroke();

      // Data rows
      const FONT_ROW = `${ROW_H > 22 ? '500' : '400'} ${Math.min(11, ROW_H - 6)}px ui-monospace,monospace`;
      visibleOrder.forEach((idx, i) => {
        const r = _results[idx];
        if (!r) return;
        const ry = TABLE_START + HDR_H + i * ROW_H;

        if (i % 2 === 1) {
          ctx.fillStyle = P.rowAlt; ctx.fillRect(x, ry, w, ROW_H);
        }

        const cells = [
          { val: String(i + 1),                                  col: P.textDim },
          { val: (r.pointName || (currentLang === 'es' ? `Punto ${i+1}` : `Point ${i+1}`)).slice(0, 24), col: P.text },
          { val: String(r.N),                                    col: P.textSub },
          { val: fmt(r.xBar, 4),                                 col: P.textSub },
          { val: fmt(r.sWithin, 4),                              col: P.textSub },
          { val: fmt(r.sOverall, 4),                             col: P.textSub },
          { val: fmt(r.Cp),                                      col: cpkColor(r.Cp)  },
          { val: fmt(r.Cpk),                                     col: cpkColor(r.Cpk) },
          { val: fmt(r.Pp),                                      col: cpkColor(r.Pp)  },
          { val: fmt(r.Ppk),                                     col: cpkColor(r.Ppk) },
          { val: r.sigLvl !== null ? fmt(r.sigLvl, 2) + 'σ' : '—', col: cpkColor(r.Cpk) },
        ];

        const textY = ry + ROW_H * 0.68;
        ctx.font = FONT_ROW;
        let cx = x + PAD_X;
        cells.forEach((cell, ci) => {
          const col = COLS[ci];
          ctx.fillStyle = cell.col;
          ctx.textAlign = col.align;
          const tx = col.align === 'right' ? cx + col.w - 2
                   : col.align === 'center' ? cx + col.w / 2 : cx + 2;
          ctx.fillText(cell.val, tx, textY);
          cx += col.w;
        });
      });

      if (clipped > 0) {
        const clipY = TABLE_START + HDR_H + visibleOrder.length * ROW_H + 4;
        ctx.font = '400 11px ui-monospace,monospace';
        ctx.fillStyle = P.textDim; ctx.textAlign = 'left';
        const _moreLabel = currentLang === 'es'
          ? `… y ${clipped} punto${clipped > 1 ? 's' : ''} más`
          : `… and ${clipped} more point${clipped > 1 ? 's' : ''}`;
        ctx.fillText(_moreLabel, x + PAD_X, clipY + 12);
      }

      ctx.restore();
    }
```

### Observed output inconsistencies (not corrected)

1. **observed bug:** metadata says `datos` in English; sigma hover classifications remain Spanish. [L3904, L4140–4144]
2. **observed bug:** generated collapse button toggles `collapsed` on itself; because it does not stop propagation, header handler also toggles actual card. This is an extra button-class side effect, **not proof that card collapse fails**. Static form button instead stops propagation and passes its closest card. [L2815, L3896, L3934–3936, L4505–4507]
3. **observed bug:** names/filenames interpolate into `innerHTML` without escaping; user markup is interpreted, not displayed literally. Names also appear in attributes. [L3901–3904, L4393–4397, L4434–4438, L5439–5443, L8402–8409]
4. **observed bug:** marker border appends `33` to CSS-variable expression, yielding invalid color such as `var(--accent-green)33`. [L3803–3806, L4407–4410]
5. **observed bug:** language switch updates tagged elements plus control charts; untagged generated headings/classifications/interpretations/photo/folder texts and other canvases can retain old language until independently redrawn. [L3411–3442, L3896–4102, L4800–4824]

## 5. Charts / visual timeline

All statistical graphics are imperative Canvas 2D drawing functions, not Chart.js configuration objects. There is no event-date timeline, calendar chart, Chart.js `datasets` array, annotation plugin or chart export plugin. The run chart uses observation sequence order; the control charts use individuals/subgroups. Screen, PNG-report, comparative-summary and educational-guide renderers are distinct implementations. The following full verbatim blocks are the definitive configurations: every coordinate transform, dataset, color, line dash, tick, text concatenation, hover handler and annotation is retained. [L3569–3656, L4535–4795, L4829–5332, L5460–5969, L6045–6846, L6950–7453, L7466–8321]

**Screen-renderer inventory.** CSS dimensions and canvas bitmap dimensions are separate; no device-pixel-ratio scaling is applied by these functions. [L4535–4795, L4829–5332, L7126–7276]

| Graphic / target | Dataset and size | Axes, ranges, guides, formatting and interaction | Source lines |
|---|---|---|---|
| Background `bgCanvas` | Random particle records; viewport-sized bitmap. Count is capped at 180. | No data axes, legend or tooltip; animation wraps at ±10px and uses requestAnimationFrame, sine pulsation, radial gradients, dark/light palettes. Not deterministic. | L3569–3656 |
| Cpk gauge `gaugeCanvas_${idx}` / `gaugeCanvas` | Single `cpk`; generated canvas is 280 × 158. | Semicircle 0–2; needle clamps to [0,2], null/undefined maps to zero. Zone boundaries 0, 1, 1.33, 1.67, 2; tick list `[0, 0.5, 1.0, 1.33, 1.67, 2.0]`. Integer ticks toFixed(0), other ticks toFixed(2). Tooltip reports hovered position, not actual Cpk, toFixed(3), with status; excludes pivot dead zone. | L3940, L4535–4607 |
| Histogram `histCanvas_${idx}` / `histCanvas` | All `r.data`; width offsetWidth or400, height220. Bins: max8/min20/ceil(sqrt(N)). | Data min/max extended by0.7 overall sigma, not enlarged to include specifications. Bars scaled to maximum count; normal PDF scaled independently to90% plot height,181 samples. Five horizontal grid lines, six X ticks toFixed(2); no numeric Y tick labels. Clipped magenta outside-spec fills, subtle green in-spec zone, solid red LSL/USL, dashed mean and target. Bin tooltip prints limits3 decimals, count, percentage1 decimal. | L4611–4795 |
| Run chart `runChartCanvas_${idx}` / `runChartCanvas` | Last25 observations only; width offsetWidth or700, height200. | Median is recomputed from displayed subset. Y min/max extend by0.5 population SD of displayed subset. Five Y labels2 decimals; X labels retain global 1-based observation index with step ceil(N/12). Green/red segments by previous point side of median; dashed median, tinted upper/lower bands. Nearest-point tooltip within20px shows4 decimals. Adjacent runs/expected-runs note is also written. | L4829–4952 |
| Normal Q-Q `qqCanvas_${idx}` / `qqCanvas` | All sorted data paired to fitted-normal quantiles at `(i+0.5)/N`; width offsetWidth or700, height200. | **X=observed, Y=theoretical**. Rational probit approximation. Axis ranges padded8%, fallback0.01. Five ticks per axis2 decimals. Dashed identity line; fixed band uses1.36 times a common SE. Deviations change point colors via rounded RGB interpolation; radius3.5. Nearest-point tooltip20px is hardcoded Spanish; note appends AD p4 decimals. | L4957–5099 |
| Horizontal capability/box plot `boxPlotCanvas_${idx}` / `boxPlotCanvas` | All sorted data, interpolated quartiles,1.5×IQR outliers/inlier whiskers; width offsetWidth or700, height340. | Three panels `Overall`, `Within`, `Specs`, all draw the same box/whiskers/outliers and mean. X range includes lower/upper spec with0.5 overall sigma padding. Five X ticks3 decimals, red spec labels. Purple boxes, yellow median, cyan mean, red outliers. Right statistics use4-decimal SD /2-decimal indices and PPM; tooltips explicitly disabled. | L5104–5332 |
| Control-chart pair `ccTopCanvas_${idx}` / `ccBotCanvas_${idx}` | I/MR, Xbar/R or Xbar/S. Auto selects I/MR for n≤1, Xbar/R for1<n<10, Xbar/S for n≥10. Bitmap width offsetWidth or900; top HTML height180, bottom160. | Source formulas and subgroup construction are distinct from `_buildCCData` used in exports (section2A). Nulls filtered, needs≥2 valid points. Y padding15% or abs(CL)×0.1 or0.01. Six Y ticks3 decimals; X step ceil(validN/12), last always labeled. UCL/LCL red dashed[7,5]; ±2sigma amber dashed[4,4] and shaded2–3sigma zones; solid CL cyan/blue. Violation points red5.5 radius plus8 ring; normal points3.5. Tooltip within20px,4-decimal values/distances/status. DOM legends/badges included in verbatim builder. | L6950–7276 |
| Sigma progress bar `sigmaBarFill_${idx}` | `sigLvl`; DOM/CSS rather than canvas. | Six labels1σ–6σ; width/status styling comes from renderResults, which is copied in section4. | L3945–3947, L4124–4140 |

**Cross-renderer behavior that a port must preserve, not unify.** Screen run chart uses last25/local median while PNG report uses all observations/global median; screen Q-Q X/Y orientation is the reverse of PNG Q-Q. The box plot's three screen panels repeat the same sample box; its exported box renderer is separate. These mismatches are **observed bug** items, not corrections proposed by this inventory. [L4840–4845, L6507–6511, L4990–5005, L6575–6580, L5287–5290, L6627–6686]

**Canvas colors are literal renderer values.** The lists below preserve case, alpha and dynamic interpolation text; they are not a replacement for the draw-order/context shown in the full blocks. Theme CSS custom properties are separate from hardcoded Canvas colors. [L3569–3656, L4535–4795, L4829–5332, L6950–7276]

**Background particles palette [L3569–3656]:** `rgba(${r},${g},${b},${p.alpha})` [L3629]; `rgba(${r},${g},${b},${p.alpha * 0.5})` [L3630]; `rgba(${r},${g},${b},0)` [L3631]; `rgba(255,255,255,${p.alpha * 1.2})` [L3642]; `rgba(${r - 30},${g - 30},${b - 30},${p.alpha * 0.6})` [L3644]; `rgba(${r},${g},${b},0.2)` [L3648]

**Gauge palette [L4535–4607]:** `rgba(128,128,128,0.12)` [L4545]; `rgba(255,82,82,0.65)` [L4549]; `rgba(255,215,64,0.65)` [L4550]; `rgba(105,240,174,0.65)` [L4551]; `rgba(0,229,255,0.65)` [L4552]; `rgba(128,128,150,0.65)` [L4574]

**Histogram palette [L4611–4795]:** `rgba(255,255,255,0.05)` [L4637]; `rgba(30,60,120,0.06)` [L4637]; `rgba(217,70,239,0.13)` [L4649]; `rgba(162,28,175,0.09)` [L4649]; `rgba(217,70,239,0.22)` [L4650]; `rgba(162,28,175,0.16)` [L4650]; `rgba(74,222,128,0.04)` [L4670]; `rgba(22,163,74,0.03)` [L4670]; `rgba(79,195,247,0.82)` [L4681]; `rgba(0,229,255,0.14)` [L4681]; `rgba(33,150,243,0.72)` [L4682]; `rgba(100,160,240,0.12)` [L4682]; `rgba(79,195,247,0.28)` [L4685]; `rgba(33,150,243,0.22)` [L4685]; `rgba(105,240,174,0.95)` [L4698]; `rgba(22,163,74,0.90)` [L4698]; `#ef4444` [L4709]; `#dc2626` [L4709]; `rgba(239,68,68,0.8)` [L4711]; `rgba(220,38,38,0.7)` [L4711]; `rgba(239,68,68,0.25)` [L4722]; `rgba(220,38,38,0.2)` [L4722]; `#fca5a5` [L4727]; `rgba(79,195,247,0.75)` [L4741]; `rgba(33,150,243,0.75)` [L4741]; `rgba(79,195,247,0.20)` [L4745]; `rgba(33,150,243,0.18)` [L4745]; `rgba(79,195,247,1)` [L4747]; `rgba(33,150,243,1)` [L4747]; `rgba(251,191,36,0.85)` [L4757]; `rgba(180,83,9,0.85)` [L4757]; `rgba(161,98,7,0.88)` [L4760]; `#fff` [L4762]; `rgba(200,210,255,0.40)` [L4768]; `rgba(30,60,120,0.40)` [L4768]

**Run chart palette [L4829–4952]:** `rgba(255,255,255,0.04)` [L4865]; `rgba(30,60,120,0.06)` [L4865]; `rgba(74,222,128,0.04)` [L4871]; `rgba(22,163,74,0.03)` [L4871]; `rgba(248,113,113,0.04)` [L4873]; `rgba(220,38,38,0.03)` [L4873]; `rgba(251,191,36,0.85)` [L4879]; `rgba(180,83,9,0.85)` [L4879]; `rgba(251,191,36,0.9)` [L4882]; `rgba(180,83,9,0.9)` [L4882]; `rgba(74,222,128,0.7)` [L4890]; `rgba(22,163,74,0.75)` [L4890]; `rgba(248,113,113,0.7)` [L4890]; `rgba(220,38,38,0.75)` [L4890]; `#4ade80` [L4899]; `rgba(22,163,74,0.9)` [L4899]; `#f87171` [L4899]; `rgba(220,38,38,0.9)` [L4899]; `rgba(255,255,255,0.28)` [L4904]; `rgba(30,60,120,0.40)` [L4904]; `rgba(255,255,255,0.25)` [L4909]; `rgba(30,60,120,0.35)` [L4909]

**Q-Q plot palette [L4957–5099]:** `rgba(255,255,255,0.04)` [L5008]; `rgba(30,60,120,0.06)` [L5008]; `rgba(74,222,128,0.65)` [L5020]; `rgba(22,163,74,0.70)` [L5020]; `rgba(74,222,128,0.06)` [L5030]; `rgba(22,163,74,0.05)` [L5030]; `rgba(${Math.round(74 + 177 * u)},${Math.round(222 - 27 * u)},${Math.round(128 - 128 * u)},0.85)` [L5044]; `rgba(${Math.round(22 + 198 * u)},${Math.round(163 - 107 * u)},${Math.round(74 - 74 * u)},0.85)` [L5044]; `rgba(${Math.round(251)},${Math.round(191 - 130 * u)},${Math.round(36 - 36 * u)},0.85)` [L5045]; `rgba(${Math.round(220)},${Math.round(56 - 18 * u)},${Math.round(38 - 12 * u)},0.85)` [L5045]; `rgba(255,255,255,0.28)` [L5052]; `rgba(30,60,120,0.40)` [L5052]; `rgba(74,222,128,0.7)` [L5061]; `rgba(22,163,74,0.7)` [L5061]; `rgba(251,191,36,0.7)` [L5063]; `rgba(180,83,9,0.7)` [L5063]

**Box plot palette [L5104–5332]:** `rgba(255,255,255,0.85)` [L5149]; `rgba(30,60,120,0.9)` [L5149]; `rgba(255,255,255,0.04)` [L5154]; `rgba(30,60,120,0.05)` [L5154]; `#ef4444` [L5170]; `#dc2626` [L5170]; `rgba(139,92,246,0.7)` [L5192]; `rgba(109,40,217,0.7)` [L5192]; `rgba(139,92,246,0.45)` [L5218]; `rgba(139,92,246,0.15)` [L5219]; `rgba(109,40,217,0.38)` [L5221]; `rgba(109,40,217,0.12)` [L5222]; `rgba(139,92,246,0.9)` [L5226]; `rgba(109,40,217,0.9)` [L5226]; `#fbbf24` [L5234]; `#f59e0b` [L5234]; `#06b6d4` [L5242]; `#0891b2` [L5242]; `rgba(255,255,255,0.7)` [L5258]; `rgba(30,60,120,0.7)` [L5258]; `rgba(255,255,255,0.2)` [L5294]; `rgba(30,60,120,0.3)` [L5294]; `rgba(255,255,255,0.5)` [L5303]; `rgba(30,60,120,0.5)` [L5303]

**Control chart builder and renderer palette [L6950–7276]:** `rgba(255,255,255,0.04)` [L7155]; `rgba(30,60,120,0.05)` [L7155]; `rgba(255,255,255,0.3)` [L7163]; `rgba(30,60,120,0.45)` [L7163]; `rgba(255,215,64,0.04)` [L7172]; `rgba(180,83,9,0.04)` [L7172]; `rgba(255,82,82,0.85)` [L7187]; `rgba(211,47,47,0.85)` [L7187]; `rgba(255,215,64,0.5)` [L7189]; `rgba(180,83,9,0.5)` [L7189]; `rgba(0,229,255,0.7)` [L7193]; `rgba(0,103,187,0.7)` [L7193]; `rgba(79,195,247,0.7)` [L7193]; `rgba(33,150,243,0.7)` [L7193]; `rgba(255,82,82,0.75)` [L7196]; `rgba(211,47,47,0.75)` [L7196]; `rgba(0,229,255,0.85)` [L7205]; `rgba(0,103,187,0.85)` [L7205]; `rgba(79,195,247,0.85)` [L7206]; `rgba(33,150,243,0.85)` [L7206]; `#FF5252` [L7223]; `#d32f2f` [L7223]; `rgba(255,82,82,0.4)` [L7227]; `rgba(211,47,47,0.4)` [L7227]; `rgba(30,60,120,0.4)` [L7235]


**Dictionary-backed chart/export labels used by the following source blocks.** Raw string literals are shown rather than translated or normalized; full objects, including duplicates, are in section 8. [L2995–3404]

| Key | ES literal | EN literal | Call-site line |
|---|---|---|---|
| `tooltip.binRange` | `"Rango:"` [L3146] | `"Range:"` [L3350] | L4788 |
| `tooltip.freq` | `"Frecuencia:"` [L3147] | `"Frequency:"` [L3351] | L4788 |
| `rc.runCount` | `"Total de rachas"` [L3162] | `"Total runs"` [L3366] | L4918 |
| `rc.expected` | `"Esperado"` [L3163] | `"Expected"` [L3367] | L4918 |
| `tooltip.aboveMedian` | `"🟢 Arriba mediana"` [L3148] | `"🟢 Above median"` [L3352] | L4944 |
| `tooltip.belowMedian` | `"🔴 Abajo mediana"` [L3149] | `"🔴 Below median"` [L3353] | L4944 |
| `tooltip.observation` | `"Observación"` [L3150] | `"Observation"` [L3354] | L4946 |
| `tooltip.value` | `"Valor"` [L3151] | `"Value"` [L3355] | L4946 |
| `tooltip.median` | `"Mediana"` [L3152] | `"Median"` [L3356] | L4946 |
| `qq.qqNote` | `"Si los puntos siguen la línea diagonal, los datos son aproximadamente normales. Desviaciones en los extremos indican colas pesadas."` [L3168] | `"If points follow the diagonal line, data is approximately normal. Deviations at extremes indicate heavy tails."` [L3372] | L5068 |
| `cc.individuals` | `"Individuales"` [L3083] | `"Individuals"` [L3287] | L6992 |
| `cc.movingRange` | `"Rango Móvil"` [L3087] | `"Moving Range"` [L3291] | L7000 |
| `cc.noteIMR` | `"Datos individuales (subgrupo=1). Se usa gráfica I-MR con rango móvil entre observaciones consecutivas."` [L3064] | `"Individual data (subgroup=1). I-MR chart using moving range between consecutive observations."` [L3268] | L7003 |
| `cc.means` | `"Medias"` [L3084] | `"Means"` [L3288] | L7015 |
| `cc.ranges` | `"Rangos"` [L3085] | `"Ranges"` [L3289] | L7022 |
| `cc.noteXR` | `"Subgrupos de tamaño n=%s. Constantes: A₂=%.3f, D₃=%.3f, D₄=%.3f"` [L3065] | `"Subgroup size n=%s. Constants: A₂=%.3f, D₃=%.3f, D₄=%.3f"` [L3269] | L7025 |
| `cc.stddevBot` | `"Desv. Est."` [L3086] | `"Std Dev"` [L3290] | L7046 |
| `cc.noteXS` | `"Subgrupos de tamaño n=%s. Constantes: A₃=%.3f, B₃=%.3f, B₄=%.3f"` [L3066] | `"Subgroup size n=%s. Constants: A₃=%.3f, B₃=%.3f, B₄=%.3f"` [L3270] | L7049 |
| `cc.subgroups` | `"subgrupos"` [L3061] | `"subgroups"` [L3265] | L7074 |
| `cc.ooc` | `"Fuera de control"` [L3062] | `"Out of control"` [L3266] | L7076 |
| `cc.inControl` | `"Bajo control"` [L3063] | `"In control"` [L3267] | L7076 |

**Canvas/CSS styling and event geometry.** Tooltip placement reads viewport/element rectangles; tooltip uses `textContent` and CSS `white-space: pre-line`. Histogram-size-slider CSS exists, but the generated histogram markup at L3953–3967 does not instantiate a slider. The CSS alone does not prove a working histogram zoom setting. [L530–567, L1157–1218, L3533–3561, L3953–3967]

**Background canvas CSS — verbatim source [L293–299].**

```css
    #bgCanvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
    }
```

**Tooltip CSS — verbatim source [L530–567].**

```css
    .chart-tooltip {
      position: fixed;
      background: var(--bg-surface2);
      border: 1px solid var(--glass-border);
      backdrop-filter: var(--blur-amount);
      -webkit-backdrop-filter: var(--blur-amount);
      border-radius: 10px;
      padding: 0.6rem 0.85rem;
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      line-height: 1.5;
      color: var(--text-primary);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 10000;
      white-space: pre-line;
      max-width: 280px;
    }

    .chart-tooltip.visible {
      opacity: 1;
    }

    .chart-tooltip-label {
      color: var(--text-secondary);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.2rem;
    }

    .chart-tooltip-value {
      color: var(--accent);
      font-weight: 600;
      font-size: 0.8rem;
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 08/24. Continue: [capaflow-inventory-section-09-of-24.md](capaflow-inventory-section-09-of-24.md).

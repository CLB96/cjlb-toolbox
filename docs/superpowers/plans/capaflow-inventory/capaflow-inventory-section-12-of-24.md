# CapaFlow inventory — section 12 of 24

**Original inventory lines:** 4591–5052 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 5. Charts / visual timeline.
**Previous:** [capaflow-inventory-section-11-of-24.md](capaflow-inventory-section-11-of-24.md). **Next:** [capaflow-inventory-section-13-of-24.md](capaflow-inventory-section-13-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Control-chart data/HTML builder — verbatim source [L6959–7123].**

```javascript
    function drawControlCharts(r, forceType, idx) {
      const pair = document.getElementById(idx !== undefined ? `ccPair_${idx}` : 'ccPair');
      const noteEl = document.getElementById(idx !== undefined ? `ccNote_${idx}` : 'ccNote');
      if (!pair || !r) return;

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

      // Build HTML
      const topOOC = topViol.length;
      const botOOC = botViol.length;
      const totalPts = topFiltered.length + botFiltered.length;
      const totalOOC = topOOC + botOOC;

      const CCB = `<button class="collapse-btn" onclick="toggleCard(this.closest('.cc-card'))" title="${currentLang === 'es' ? 'Minimizar/Maximizar' : 'Collapse/Expand'}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 3L5 7L9 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;

      pair.innerHTML = `
    <div class="cc-card">
      <div class="card-header" onclick="toggleCard(this.closest('.cc-card'))">
        <div class="cc-card-title" style="margin:0;flex:1">
          <span>${topLabel}</span>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="cc-card-subtitle">${topFiltered.length} ${t('cc.subgroups')}</span>
            <span class="cc-ooc-badge ${topOOC > 0 ? 'ooc' : 'ok'}">
              ${topOOC > 0 ? '⚠ ' + topOOC + ' ' + t('cc.ooc') : '✓ ' + t('cc.inControl')}
            </span>
          </div>
        </div>
        ${CCB}
      </div>
      <div class="card-body"><div class="card-body-inner" style="padding-top:0.6rem">
        <canvas class="cc-canvas" id="ccTopCanvas_${idx}" height="180"></canvas>
        <div class="cc-legend">
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent)"></div><span>X̄ / CL</span></div>
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent-red);border-top:2px dashed var(--accent-red);height:0"></div><span>UCL / LCL</span></div>
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:rgba(255,215,64,0.7);border-top:2px dashed;height:0"></div><span>±2σ</span></div>
          <div class="cc-legend-item"><div class="cc-legend-dot" style="background:var(--accent-red)"></div><span>${t('cc.ooc')}</span></div>
        </div>
      </div></div>
    </div>
    <div class="cc-card">
      <div class="card-header" onclick="toggleCard(this.closest('.cc-card'))">
        <div class="cc-card-title" style="margin:0;flex:1">
          <span>${botLabel}</span>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="cc-card-subtitle">${botFiltered.length} ${t('cc.subgroups')}</span>
            <span class="cc-ooc-badge ${botOOC > 0 ? 'ooc' : 'ok'}">
              ${botOOC > 0 ? '⚠ ' + botOOC + ' ' + t('cc.ooc') : '✓ ' + t('cc.inControl')}
            </span>
          </div>
        </div>
        ${CCB}
      </div>
      <div class="card-body"><div class="card-body-inner" style="padding-top:0.6rem">
        <canvas class="cc-canvas" id="ccBotCanvas_${idx}" height="160"></canvas>
        <div class="cc-legend">
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent2)"></div><span>R̄ / S̄ / MR̄</span></div>
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent-red);border-top:2px dashed;height:0"></div><span>UCL</span></div>
          <div class="cc-legend-item"><div class="cc-legend-dot" style="background:var(--accent-red)"></div><span>${t('cc.ooc')}</span></div>
        </div>
      </div></div>
    </div>`;

      if (noteEl) noteEl.textContent = noteText;

      // Draw after DOM settles
      const sfx = idx !== undefined ? `_${idx}` : '';
      requestAnimationFrame(() => {
        _drawCCChart(`ccTopCanvas${sfx}`, topPts, topCL, topUCL, topLCL, topSigma, topViol, true);
        _drawCCChart(`ccBotCanvas${sfx}`, botPts, botCL, botUCL, botLCL, botSigma, botViol, false);
      });
    }
```

**Single control-chart renderer — verbatim source [L7126–7276].**

```javascript
    function _drawCCChart(canvasId, pts, cl, ucl, lcl, sigma, violIdx, isXbar) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || 900;
      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      const isDark = currentTheme === 'dark';
      const PAD = { t: 16, r: 20, b: 30, l: 62 };
      const pW = W - PAD.l - PAD.r, pH = H - PAD.t - PAD.b;

      // Filter nulls, keep index mapping
      const validPts = pts.map((v, i) => ({ v, i })).filter(p => p.v !== null);
      if (validPts.length < 2) return;
      const vals = validPts.map(p => p.v);

      // Y range: tight around data + limits, with padding
      const allVals = [...vals, ucl, lcl > 0 ? lcl : 0];
      let yMin = Math.min(...allVals);
      let yMax = Math.max(...allVals);
      const yPad = (yMax - yMin) * 0.15 || Math.abs(cl) * 0.1 || 0.01;
      yMin -= yPad; yMax += yPad;

      const toY = v => PAD.t + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const toX = i => PAD.l + (i / (Math.max(validPts.length - 1, 1))) * pW;

      // ── Grid lines ──
      const nGrids = 5;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.05)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= nGrids; g++) {
        const y = PAD.t + (g / nGrids) * pH;
        ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
      }

      // ── Y-axis labels ──
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(30,60,120,0.45)';
      ctx.font = '11px ui-monospace,monospace'; ctx.textAlign = 'right';
      for (let g = 0; g <= nGrids; g++) {
        const v = yMin + (g / nGrids) * (yMax - yMin);
        ctx.fillText(v.toFixed(3), PAD.l - 6, PAD.t + (nGrids - g) / nGrids * pH + 4);
      }

      // ── ±2σ zones (shaded bands) ──
      const ucl2 = cl + 2 * sigma, lcl2 = cl - 2 * sigma;
      ctx.fillStyle = isDark ? 'rgba(255,215,64,0.04)' : 'rgba(180,83,9,0.04)';
      // between 2σ and 3σ top
      const y2top = toY(ucl2), y3top = toY(ucl);
      ctx.fillRect(PAD.l, Math.min(y2top, y3top), pW, Math.abs(y2top - y3top));
      // between 2σ and 3σ bottom
      const y2bot = toY(lcl2), y3bot = toY(lcl);
      ctx.fillRect(PAD.l, Math.min(y2bot, y3bot), pW, Math.abs(y2bot - y3bot));

      // ── UCL / LCL dashed lines ──
      const drawHLine = (y, color, dash, lw = 1.8) => {
        if (y < PAD.t - 5 || y > PAD.t + pH + 5) return;
        ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
        ctx.setLineDash([]);
      };
      drawHLine(toY(ucl), isDark ? 'rgba(255,82,82,0.85)' : 'rgba(211,47,47,0.85)', [7, 5], 2);
      if (lcl > yMin) drawHLine(toY(lcl), isDark ? 'rgba(255,82,82,0.85)' : 'rgba(211,47,47,0.85)', [7, 5], 2);
      drawHLine(toY(ucl2), isDark ? 'rgba(255,215,64,0.5)' : 'rgba(180,83,9,0.5)', [4, 4], 1.5);
      if (lcl2 > yMin) drawHLine(toY(lcl2), isDark ? 'rgba(255,215,64,0.5)' : 'rgba(180,83,9,0.5)', [4, 4], 1.5);

      // ── Centerline (solid) ──
      drawHLine(toY(cl), isXbar ? (isDark ? 'rgba(0,229,255,0.7)' : 'rgba(0,103,187,0.7)') : (isDark ? 'rgba(79,195,247,0.7)' : 'rgba(33,150,243,0.7)'), [], 2);

      // ── Limit labels on right ──
      ctx.fillStyle = isDark ? 'rgba(255,82,82,0.75)' : 'rgba(211,47,47,0.75)';
      ctx.font = 'bold 10px ui-monospace,monospace'; ctx.textAlign = 'left';
      const uclY = toY(ucl); if (uclY > PAD.t && uclY < PAD.t + pH) { ctx.fillText('UCL', W - PAD.r + 3, uclY + 4); }
      if (lcl > yMin) { const lclY = toY(lcl); if (lclY > PAD.t && lclY < PAD.t + pH) ctx.fillText('LCL', W - PAD.r + 3, lclY + 4); }
      ctx.fillStyle = isDark ? 'rgba(0,229,255,0.7)' : 'rgba(0,103,187,0.7)';
      const clY = toY(cl); if (clY > PAD.t && clY < PAD.t + pH) ctx.fillText('CL', W - PAD.r + 3, clY + 4);

      // ── Data line ──
      const lineColor = isXbar
        ? (isDark ? 'rgba(0,229,255,0.85)' : 'rgba(0,103,187,0.85)')
        : (isDark ? 'rgba(79,195,247,0.85)' : 'rgba(33,150,243,0.85)');

      ctx.beginPath();
      validPts.forEach((p, idx) => {
        const x = toX(idx), y = toY(p.v);
        idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

      // ── Data points ──
      const violSet = new Set(violIdx);
      validPts.forEach((p, idx) => {
        const x = toX(idx), y = toY(p.v);
        const isViol = violSet.has(idx);
        ctx.beginPath(); ctx.arc(x, y, isViol ? 5.5 : 3.5, 0, Math.PI * 2);

        if (isViol) {
          ctx.fillStyle = isDark ? '#FF5252' : '#d32f2f';
          ctx.shadowColor = '#FF5252'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
          // Ring
          ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? 'rgba(255,82,82,0.4)' : 'rgba(211,47,47,0.4)';
          ctx.lineWidth = 1.5; ctx.stroke();
        } else {
          ctx.fillStyle = lineColor; ctx.fill();
        }
      });

      // ── X-axis labels (subgroup numbers) ──
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(30,60,120,0.4)';
      ctx.font = '10px ui-monospace,monospace'; ctx.textAlign = 'center';
      const step = Math.ceil(validPts.length / 12);
      validPts.forEach((p, idx) => {
        if (idx % step === 0 || idx === validPts.length - 1) {
          ctx.fillText(String(idx + 1), toX(idx), H - 6);
        }
      });

      // ── TOOLTIP INTERACTIVITY ──
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        let closestPt = null;
        let minDist = Infinity;
        const vSet = new Set(violIdx);
        
        validPts.forEach((p, idx) => {
          const px = toX(idx);
          const py = toY(p.v);
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          
          if (dist < minDist && dist < 20) {
            minDist = dist;
            closestPt = { index: idx, value: p.v, origIndex: p.i };
          }
        });
        
        if (closestPt) {
          const isViolation = vSet.has(closestPt.index);
          const distFromUCL = (ucl - closestPt.value).toFixed(4);
          const distFromLCL = (closestPt.value - lcl).toFixed(4);
          const status = isViolation ? `🔴 ${t('cc.ooc')}` : `✅ ${t('cc.inControl')}`;
          showTooltip(`${t('tooltip.observation')} #${closestPt.index + 1}\n${t('tooltip.value')}: ${closestPt.value.toFixed(4)}\nUCL: ${ucl.toFixed(4)} (↓${distFromUCL})\nCL: ${cl.toFixed(4)}\nLCL: ${lcl.toFixed(4)} (↑${distFromLCL})\n${status}`, e.clientX, e.clientY);
        } else {
          hideTooltip();
        }
      };
      canvas.onmouseleave = hideTooltip;
    }
```

**Visible-analysis resize redraw listener — verbatim source [L8323–8337].**

```javascript
    window.addEventListener('resize', () => {
      clearTimeout(window._rz);
      window._rz = setTimeout(() => {
        // Only redraw the currently visible analysis — hidden carousel ones redraw when shown
        const visibleIdx = _analysisOrder[_carouselCurrent];
        const r = _results[visibleIdx];
        if (!r) return;
        drawHistogram(r, visibleIdx);
        drawGauge(r.Cpk, r.Cpk !== null ? colorForCpk(r.Cpk) : 'var(--accent)', visibleIdx);
        drawControlCharts(r, _ccTypes[visibleIdx] || 'auto', visibleIdx);
        drawRunChart(r, visibleIdx);
        drawQQPlot(r, visibleIdx);
        drawBoxPlot(r, visibleIdx);
      }, 300);
    });
```

**Export-only and guide-only chart configurations** are copied in section7 under their own function names, including miniature summary histograms and synthetic guide demonstrations. No guide example should be mistaken for the current analyzed dataset. [L5841–5969, L6502–6846, L7328–7453, L7973–8321]

## 6. Inputs / settings

### Static fields and file controls

No `<form>` submit/checkValidity workflow exists. Main actions are onclick calls; HTML numeric bounds are attributes rather than the programmatic validations in `runAnalysis()`. Fields are empty unless value explicitly given. [L2622–2990, L3824–3868]

| element id | type/attrs | default | behavior | Source lines |
|---|---|---|---|---|
| `passwordInput` | Password, `.password-input`, autocomplete off, translated placeholder | Empty; `Contraseña de acceso` | Submit button/Enter calls checkPassword; no trim | L2634–2636, L3687–3720 |
| `lsl` | Number, step any, translated placeholder | Empty; `Ej. 9.5` | parseFloat; sample `'73.95'` | L2829–2830, L3813, L3828 |
| `usl` | Number, step any, translated placeholder | Empty; `Ej. 10.5` | parseFloat; sample `'74.05'` | L2835–2836, L3814, L3829 |
| `target` | Number, step any, translated placeholder | Empty; `Ej. 10.0 (opcional)` | parseFloat; sample `'74'`; optional Cpm target | L2841–2842, L3815, L3830, L3849 |
| `dataInput` | Textarea `.form-input`, translated placeholder | Empty; static `Ej: 9.8, 10.1, 9.95, 10.2, 9.7...` | Delimited parser; language-applied placeholder adds Excel-paste newline | L2851–2852, L3136, L3340, L3735–3737 |
| `pointName` | Text, `.point-name-input`, translated placeholder | Empty; `Ej: Diámetro eje A, Espesor lámina 3…` | Trimmed on calculate; presentation only | L2861–2863, L3832 |
| `subgroupSize` | Number, min1/max25, no explicit step | `value="1"` | parseInt or1; sample5; auto charts <=1 I-MR,2–9 X̄-R,>=10 X̄-S | L2872, L3816, L3831, L6964–6974 |
| `confidence` | Number, min80/max99.9/step0.1 | `value="95"` | Never read (**observed bug**) | L2876; full script L2991–8614 |
| `mwxFileInput` | File, accept `.mwx,.MWX,.mwp,.MWP,.mpx,.MPX`, multiple, hidden | None | Appends queue; clear resets; dropzone click opens | L2762, L8363, L8418, L8444–8448 |
| `logoFileInput` | File, accept image/*, hidden, handleLogoUpload onchange | None | First-file DataURL persisted for callback-time theme | L2785–2792, L3490–3504 |
| `photoFileInput` | File, accept image/*, hidden, handlePhotoUpload onchange | None | Load/change controls open; resets after starting read | L2923–2931, L2944–2947, L4299–4303 |
| `folderNameInput` | No explicit type (HTML default text), `.folder-name-input`, translated placeholder, oninput updateFolderTabName | Empty; `Nombre del proyecto…` | Callback intentionally empty; name used by summary/project export | L2976–2979, L5422–5424, L5543, L5971–5981 |

No select/checkbox/radio/range/date-picker/sheet-selector exists. Chart choice uses buttons, not select. [Full static/dynamic markup L2622–2990, L3901–4102, L7068–7113]

### Complete control-tag ledger (including anonymous controls)

Every input/textarea/button/select opening tag in source is listed, including dynamic templates. Attributes are literal except whitespace collapsed in this ledger; missing IDs explicitly marked. Exact static multiline input snippets follow. [L2622–8617]

| element id | type/attrs (source opening tag) | default | behavior | Source lines |
|---|---|---|---|---|
| `passwordInput` | `<input type="password" class="password-input" id="passwordInput" placeholder="Contraseña de acceso" data-i18n-placeholder="gate.placeholder" autocomplete="off">` | No value attribute | `See explicit control behavior table above` | L2634–2635 |
| `(no id; button L2636)` | `<button class="password-btn" onclick="checkPassword()" data-i18n="gate.enter">` | No value attribute | `onclick="checkPassword()"` | L2636 |
| `btnExportPNG` | `<button class="btn-export" id="btnExportPNG" onclick="generateExecutivePNG()">` | No value attribute | `onclick="generateExecutivePNG()"` | L2708 |
| `btnExportGuide` | `<button class="btn-export" id="btnExportGuide" onclick="generateReadingGuide()" style="margin-top:0.5rem;background:linear-gradient(135deg,rgba(105,240,174,0.1),rgba(74,222,128,0.06));border-color:rgba(105,240,174,0.22)">` | No value attribute | `onclick="generateReadingGuide()"` | L2715–2716 |
| `btnMwxConverter` | `<button class="btn-export" id="btnMwxConverter" onclick="openMwxConverter()" style="margin-top:0.5rem;background:linear-gradient(135deg,rgba(255,215,64,0.1),rgba(255,152,0,0.06));border-color:rgba(255,215,64,0.22)">` | No value attribute | `onclick="openMwxConverter()"` | L2723–2724 |
| `(no id; button L2754)` | `<button class="mwx-close-btn" onclick="closeMwxConverter()">` | No value attribute | `onclick="closeMwxConverter()"` | L2754 |
| `mwxFileInput` | `<input type="file" id="mwxFileInput" accept=".mwx,.MWX,.mwp,.MWP,.mpx,.MPX" multiple style="display:none">` | No value attribute | `See explicit control behavior table above` | L2762 |
| `(no id; button L2768)` | `<button class="mwx-btn mwx-btn-secondary" onclick="clearMwxFiles()" data-i18n="mwx.clear">` | No value attribute | `onclick="clearMwxFiles()"` | L2768 |
| `mwxConvertBtn` | `<button class="mwx-btn mwx-btn-primary" id="mwxConvertBtn" onclick="convertMwxFiles()" disabled data-i18n="mwx.convert">` | disabled | `onclick="convertMwxFiles()"` | L2769–2770 |
| `logoFileInput` | `<input type="file" id="logoFileInput" accept="image/*" style="display:none" onchange="handleLogoUpload(event)">` | No value attribute | `onchange="handleLogoUpload(event)"` | L2792 |
| `hamburgerBtn` | `<button class="hamburger-btn" id="hamburgerBtn" aria-label="Menu">` | No value attribute | `See explicit control behavior table above` | L2799 |
| `(no id; button L2815)` | `<button class="collapse-btn" onclick="event.stopPropagation();toggleCard(this.closest('.card'))" title="Minimizar">` | No value attribute | `onclick="event.stopPropagation();toggleCard(this.closest('.card'))"` | L2815–2816 |
| `lsl` | `<input class="form-input" id="lsl" type="number" data-i18n-placeholder="form.placeholder.lsl" placeholder="Ej. 9.5" step="any">` | No value attribute | `See explicit control behavior table above` | L2829–2830 |
| `usl` | `<input class="form-input" id="usl" type="number" data-i18n-placeholder="form.placeholder.usl" placeholder="Ej. 10.5" step="any">` | No value attribute | `See explicit control behavior table above` | L2835–2836 |
| `target` | `<input class="form-input" id="target" type="number" data-i18n-placeholder="form.placeholder.target" placeholder="Ej. 10.0 (opcional)" step="any">` | No value attribute | `See explicit control behavior table above` | L2841–2842 |
| `dataInput` | `<textarea class="form-input" id="dataInput" data-i18n-placeholder="form.placeholder.data" placeholder="Ej: 9.8, 10.1, 9.95, 10.2, 9.7...">` | No value attribute | `See explicit control behavior table above` | L2851–2852 |
| `(no id; button L2854)` | `<button class="btn-secondary" onclick="loadSampleData()" data-i18n="form.sample">` | No value attribute | `onclick="loadSampleData()"` | L2854 |
| `pointName` | `<input class="point-name-input" id="pointName" type="text" data-i18n-placeholder="form.placeholder.pointName" placeholder="Ej: Diámetro eje A, Espesor lámina 3…">` | No value attribute | `See explicit control behavior table above` | L2861–2863 |
| `subgroupSize` | `<input class="form-input" id="subgroupSize" type="number" value="1" min="1" max="25">` | 1 | `See explicit control behavior table above` | L2872 |
| `confidence` | `<input class="form-input" id="confidence" type="number" value="95" min="80" max="99.9" step="0.1">` | 95 | `See explicit control behavior table above` | L2876 |
| `(no id; button L2880)` | `<button class="btn-primary" onclick="runAnalysis()">` | No value attribute | `onclick="runAnalysis()"` | L2880 |
| `btnClearProject` | `<button class="btn-clear-project" id="btnClearProject" onclick="clearProject()" data-i18n="form.clearProject">` | No value attribute | `onclick="clearProject()"` | L2883 |
| `(no id; button L2901)` | `<button class="carousel-arrow" onclick="prevAnalysis()" title="Análisis anterior">` | No value attribute | `onclick="prevAnalysis()"` | L2901 |
| `(no id; button L2906)` | `<button class="carousel-arrow" onclick="nextAnalysis()" title="Análisis siguiente">` | No value attribute | `onclick="nextAnalysis()"` | L2906 |
| `photoFileInput` | `<input type="file" id="photoFileInput" accept="image/*" style="display:none" onchange="handlePhotoUpload(event)">` | No value attribute | `onchange="handlePhotoUpload(event)"` | L2930–2931 |
| `btnExportPhoto` | `<button class="btn-export-photo" id="btnExportPhoto" onclick="exportPhotoWithMarkers()" data-i18n="photo.exportBtn">` | No value attribute | `onclick="exportPhotoWithMarkers()"` | L2955 |
| `folderNameInput` | `<input class="folder-name-input" id="folderNameInput" data-i18n-placeholder="folder.namePlaceholder" placeholder="Nombre del proyecto…" oninput="updateFolderTabName(this.value)">` | No value attribute | `oninput="updateFolderTabName(this.value)"` | L2976–2979 |
| `btnGenerateSummary` | `<button class="btn-summary" id="btnGenerateSummary" onclick="generateComparativeSummary()" data-i18n="summary.genBtn">` | No value attribute | `onclick="generateComparativeSummary()"` | L2981 |
| `btnDownloadZip` | `<button class="btn-download-zip" id="btnDownloadZip" onclick="generateProjectZip()" data-i18n="folder.downloadZip">` | No value attribute | `onclick="generateProjectZip()"` | L2984 |
| `(no id; button L3896)` | `<button class="collapse-btn" onclick="toggleCard(this)" title="${currentLang === 'es' ? 'Minimizar/Maximizar' : 'Collapse/Expand'}">` | No value attribute | `onclick="toggleCard(this)"` | L3896 |
| `btnExportActive_${idx}` | `<button class="btn-analysis-action active-export" id="btnExportActive_${idx}" onclick="setActiveExport(${idx})" title="${currentLang === 'es' ? 'Usar para exportar PNG' : 'Use for PNG export'}">` | No value attribute | `onclick="setActiveExport(${idx})"` | L3906 |
| `(no id; button L3907)` | `<button class="btn-analysis-action danger" onclick="deleteAnalysis(${idx})" title="${currentLang === 'es' ? 'Eliminar análisis' : 'Delete analysis'}">` | No value attribute | `onclick="deleteAnalysis(${idx})"` | L3907 |
| `ccPillAuto_${idx}` | `<button class="cc-pill active" id="ccPillAuto_${idx}" onclick="setCCType('auto',${idx})">` | No value attribute | `onclick="setCCType('auto',${idx})"` | L4045 |
| `ccPillImr_${idx}` | `<button class="cc-pill" id="ccPillImr_${idx}" onclick="setCCType('imr',${idx})">` | No value attribute | `onclick="setCCType('imr',${idx})"` | L4046 |
| `ccPillXr_${idx}` | `<button class="cc-pill" id="ccPillXr_${idx}" onclick="setCCType('xr',${idx})">` | No value attribute | `onclick="setCCType('xr',${idx})"` | L4047 |
| `ccPillXs_${idx}` | `<button class="cc-pill" id="ccPillXs_${idx}" onclick="setCCType('xs',${idx})">` | No value attribute | `onclick="setCCType('xs',${idx})"` | L4048 |
| `(no id; button L7066)` | `<button class="collapse-btn" onclick="toggleCard(this.closest('.cc-card'))" title="${currentLang === 'es' ? 'Minimizar/Maximizar' : 'Collapse/Expand'}">` | No value attribute | `onclick="toggleCard(this.closest('.cc-card'))"` | L7066 |
| `(no id; button L8408)` | `<button class="mwx-remove-file" onclick="removeMwxFile(${index})" title="Eliminar">` | No value attribute | `onclick="removeMwxFile(${index})"` | L8408 |

### Non-form interactive settings

| element id / selector | type/attrs | default | behavior | Source lines |
|---|---|---|---|---|
| `themeSwitch` / `.toggle-row` | Div switch; enclosing toggleTheme onclick | Script adds on; root dark | Toggle data-theme, moon/sun, particles, logos | L2669–2672, L3447–3459, L3725–3730 |
| `pillES`, `pillEN` | Divs inline setLang('es'/'en') | ES active | Tagged translations, CC redraw, date update | L2679–2680, L3432–3442, L8604–8609 |
| `hamburgerBtn`, `sidePanel`, `panelOverlay` | Button/divs class toggles | No open classes | Button syncs open; overlay closes | L2663–2666, L2799–2803, L3512–3526 |
| `.card-header`, `.collapse-btn` | Clickable header/button | Expanded | Toggle class on passed element; on expansion chart redraw after480ms | L2812–2819, L3896, L4505–4530 |
| `ccPillAuto_${idx}` | `.cc-pill.active`, inline setCCType auto | Auto | Saves per-analysis chart choice/redraw | L4045, L6950–6957 |
| `ccPillImr_${idx}`, `ccPillXr_${idx}`, `ccPillXs_${idx}` | cc-pill buttons force imr/xr/xs | Inactive | Display family only; capability not recalculated | L4046–4048, L6950–6974 |
| `.carousel-arrow` | Prev/next buttons | Nav hidden until >1 | Wraparound modulo; updates _lastResult | L2901–2906, L5362–5401 |
| `.photo-tab`, `photoWidget` | Clickable div/widget | No pw-visible/pw-open | Shown on second analysis; toggles open/tray refresh | L2916, L2961–2964, L4126–4128, L4274–4286 |
| `photoUploadZone`, `photoContainer` | File-drop / marker-drop targets | Upload visible, container hidden | Image load then coordinate marker placement | L2923–2940, L4289–4359 |
| `.folder-tab`, `projectFolderWidget` | Clickable div/widget | No pf-visible/pf-open | Second-analysis visibility, toggles list | L2968–2972, L4122–4123, L5406–5420 |
| `.folder-analysis-item` | Generated clickable div | fai-active for current | jumpToAnalysis(pos), closes folder | L5433–5454 |
| `.photo-tray-item`, `.photo-marker` | Generated draggable/clickable divs | Unplaced | Drag stores index, drop percentages; placed tray click unplaces | L4329–4366, L4386–4441 |
| `mwxDropzone` | Click/drop div | No drag-over | Picker click, drag style, extension filtering | L2757–2763, L8418–8442 |
| `mwxModalOverlay` | Overlay div | No open | Exact-target click closes and clears queue/log | L2747, L8345–8364, L8585–8590 |

### Exact static input markup

These contiguous source slices preserve attribute spelling, spacing, defaults and placeholders. [L2634–2636, L2762, L2792, L2824–2885, L2930–2931, L2976–2979]

**Password field and submit — verbatim source [L2634–2636].**

```html
      <input type="password" class="password-input" id="passwordInput" placeholder="Contraseña de acceso"
        data-i18n-placeholder="gate.placeholder" autocomplete="off">
      <button class="password-btn" onclick="checkPassword()" data-i18n="gate.enter">Entrar</button>
```


**Converter picker — verbatim source [L2762–2762].**

```html
        <input type="file" id="mwxFileInput" accept=".mwx,.MWX,.mwp,.MWP,.mpx,.MPX" multiple style="display:none">
```


**Logo picker — verbatim source [L2792–2792].**

```html
        <input type="file" id="logoFileInput" accept="image/*" style="display:none" onchange="handleLogoUpload(event)">
```


<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 12/24. Continue: [capaflow-inventory-section-13-of-24.md](capaflow-inventory-section-13-of-24.md).

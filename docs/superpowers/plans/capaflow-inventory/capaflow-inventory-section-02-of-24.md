# CapaFlow inventory — section 02 of 24

**Original inventory lines:** 478–957 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 2. Functions → 2A. PURE CALCULATION logic (port byte-identical).
**Previous:** [capaflow-inventory-section-01-of-24.md](capaflow-inventory-section-01-of-24.md). **Next:** [capaflow-inventory-section-03-of-24.md](capaflow-inventory-section-03-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Screen sigma-bar percentage, numeric formatters, fallback title and creation time — source lines 3883–3887.**

```javascript
      const sigmaBarW = r.sigLvl !== null ? Math.min(100, (r.sigLvl / 6) * 100) : 0;
      const fmt = (v, d = 3) => v !== null && !isNaN(v) ? v.toFixed(d) : '—';
      const fmtN = (v) => v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—';
      const blockTitle = name || (currentLang === 'es' ? `Punto de Medición ${idx + 1}` : `Measurement Point ${idx + 1}`);
      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
```

**Summary formatter and index color helper — source lines 5495–5496.**

```javascript
      const fmt = (v, d = 3) => v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(d) : '—';
      const cpkColor = v => v === null ? P.accent : v >= 1.33 ? P.green : v >= 1.0 ? P.yellow : P.red;
```

**Comparative summary date format — source lines 5539–5542.**

```javascript
      const dateStr = new Date().toLocaleDateString(
        currentLang === 'es' ? 'es-MX' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
```

**Executive PNG formatters and status palette helpers — source lines 6076–6080.**

```javascript
      const fmt = (v, d = 3) => v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(d) : '—';
      const fmtN = v => v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—';
      const cpkColorOf = v => v === null ? P.accent : v >= 1.33 ? P.green : v >= 1.0 ? P.yellow : P.red;
      const cpkBgOf = v => v === null ? 'transparent' : v >= 1.33 ? P.greenBg : v >= 1.0 ? P.yellowBg : P.redBg;
      const cpkBdOf = v => v === null ? P.border : v >= 1.33 ? P.greenBorder : v >= 1.0 ? P.yellowBorder : P.redBorder;
```

**Executive report date format — source lines 6260–6263.**

```javascript
      const dateStr = new Date().toLocaleDateString(
        currentLang === 'es' ? 'es-MX' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
```

**Header date formatter and exact badge concatenation — source lines 8593–8601.**

```javascript
    function updateHeaderDate() {
      const badge = document.getElementById('headerBadge');
      if (badge) {
        const today = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        const dateStr = today.toLocaleDateString(typeof currentLang !== 'undefined' && currentLang === 'en' ? 'en-US' : 'es-ES', options);
        badge.innerHTML = `V1.0 &middot; ${dateStr}`;
      }
    }
```

**Inline sorting, binning, run statistics, quantiles and plot transforms (cited in each block below).** These execute inside renderers rather than separately callable pure functions. Preserve their literal values independently for screen, executive PNG, summary and educational demos. Complete chart bodies and exact labels/tooltips are retained in2B and further organized in sections5 and7; those sections do not authorize formula changes. Sorting callbacks, mapping/filtering/reduction operations and assigned transform helpers are also indexed under2B (lines 3736–8589).

**Screen histogram bins, extension, counts and x transform — source lines 4620–4634.**

```javascript
      const data = r.data;
      const bins = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(data.length))));
      const pad = { t: 38, r: 4, b: 38, l: 28 };
      const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
      const ext = r.sOverall * 0.7;
      const minV = r.minV - ext, maxV = r.maxV + ext;
      const binW = (maxV - minV) / bins;
      const counts = new Array(bins).fill(0);
      data.forEach(v => {
        let i = Math.min(Math.max(Math.floor((v - minV) / binW), 0), bins - 1);
        counts[i]++;
      });
      const maxC = Math.max(...counts);
      const isDark = currentTheme === 'dark';
      const toX = v => pad.l + ((v - minV) / (maxV - minV)) * plotW;
```

**Screen run-chart last25 slicing, local median, run counting/rounding and transforms — source lines 4840–4862.**

```javascript
      const maxPoints = 25;
      const fullData = r.data;
      const data = fullData.slice(-maxPoints);
      const startIndex = fullData.length - data.length;
      const N = data.length;
      const med = median(data);
      
      const pad = { t: 30, r: 28, b: 32, l: 52 };
      const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;

      // Compute run stats
      let runs = 1, currentSide = data[0] > med ? 1 : data[0] < med ? -1 : 0;
      for (let i = 1; i < N; i++) {
        const side = data[i] > med ? 1 : data[i] < med ? -1 : 0;
        if (side !== 0 && side !== currentSide) { runs++; currentSide = side; }
      }
      const expectedRuns = Math.round((2 * N - 1) / 3);

      // Y range
      const ext = stddev(data, true) * 0.5;
      const yMin = Math.min(...data) - ext, yMax = Math.max(...data) + ext;
      const toX = i => pad.l + (i / (N - 1)) * pW;
      const toY = v => pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH;
```

**Screen Q-Q sorting, full probit constants/branches, rank positions and transforms — source lines 4966–5005.**

```javascript
      const sorted = [...r.data].sort((a, b) => a - b);
      const N = sorted.length;
      const mu = r.xBar, sigma = r.sOverall;
      const pad = { t: 24, r: 24, b: 36, l: 60 };
      const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;

      // Theoretical quantiles (probit)
      const probit = p => {
        // Rational approximation for Phi^{-1}(p) (Beasley-Springer-Moro)
        const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
        const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
        const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
          0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
          0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
        const q = p - 0.5;
        if (Math.abs(q) < 0.42) {
          const r2 = q * q;
          return q * (((a[3] * r2 + a[2]) * r2 + a[1]) * r2 + a[0]) / ((((b[3] * r2 + b[2]) * r2 + b[1]) * r2 + b[0]) * r2 + 1);
        }
        let r2 = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p));
        let x = c[0]; for (let i = 1; i < 9; i++)x += c[i] * Math.pow(r2, i);
        return p < 0.5 ? -x : x;
      };

      // Build (observed, theoretical) pairs — INTERCAMBIADOS
      const pts = sorted.map((v, i) => {
        const pi = (i + 0.5) / N;
        const th = mu + sigma * probit(pi);
        return { obs: v, th };
      });

      // Axis ranges — INTERCAMBIADOS: X=observed, Y=theoretical
      const obsVals = pts.map(p => p.obs);
      const thVals = pts.map(p => p.th);
      const xMin = Math.min(...obsVals), xMax = Math.max(...obsVals);
      const yMin = Math.min(...thVals), yMax = Math.max(...thVals);
      const xPad = (xMax - xMin) * 0.08 || 0.01;
      const yPad = (yMax - yMin) * 0.08 || 0.01;
      const toX = v => pad.l + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * pW;
      const toY = v => pad.t + pH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * pH;
```

**Screen Q-Q fixed band calculation — source lines 5024–5029.**

```javascript
      // 95% confidence band (Lilliefors approx) — INTERCAMBIADO
      const se = sigma * Math.sqrt((Math.PI / 2) / N);
      pts.forEach((p, i) => {
        const x = toX(p.obs);
        const y0 = toY(p.th - 1.36 * se), y1 = toY(p.th + 1.36 * se);
        if (x >= pad.l && x <= pad.l + pW) {
```

**Screen Q-Q deviation-to-color rounding — source lines 5035–5047.**

```javascript
      // Data points — colored by deviation from line — INTERCAMBIADO
      pts.forEach(p => {
        const x = toX(p.obs), y = toY(p.th);
        const yIdeal = toY(p.obs);
        const dev = Math.abs(y - yIdeal);
        const maxDev = pH * 0.25;
        const t2 = Math.min(dev / maxDev, 1);
        // Interpolate: green → yellow → red
        let col;
        if (t2 < 0.5) { const u = t2 * 2; col = isDark ? `rgba(${Math.round(74 + 177 * u)},${Math.round(222 - 27 * u)},${Math.round(128 - 128 * u)},0.85)` : `rgba(${Math.round(22 + 198 * u)},${Math.round(163 - 107 * u)},${Math.round(74 - 74 * u)},0.85)`; }
        else { const u = (t2 - 0.5) * 2; col = isDark ? `rgba(${Math.round(251)},${Math.round(191 - 130 * u)},${Math.round(36 - 36 * u)},0.85)` : `rgba(${Math.round(220)},${Math.round(56 - 18 * u)},${Math.round(38 - 12 * u)},0.85)`; }
        if (x < pad.l - 4 || x > pad.l + pW + 4 || y < pad.t - 4 || y > pad.t + pH + 4) return;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
```

**Screen box quartiles, fences, inliers/outliers, whiskers and x range — source lines 5115–5140.**

```javascript
      const sorted = [...r.data].sort((a, b) => a - b);
      const N = sorted.length;
      
      // Calcular estadísticos (linear-interpolation percentiles, same as Minitab)
      const Q1 = quartile(sorted, 0.25);
      const Q2 = r.med;
      const Q3 = quartile(sorted, 0.75);
      const IQR = Q3 - Q1;
      const lowerFence = Q1 - 1.5 * IQR;
      const upperFence = Q3 + 1.5 * IQR;
      
      const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
      const inliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
      const minWhisker = inliers.length > 0 ? Math.min(...inliers) : sorted[0];
      const maxWhisker = inliers.length > 0 ? Math.max(...inliers) : sorted[N - 1];
      
      // Layout: 3 secciones horizontales
      const pad = { t: 15, r: 120, b: 35, l: 100 };
      const gap = 15;
      const sectionH = (H - pad.t - pad.b - gap * 2) / 3;
      const plotW = W - pad.l - pad.r;
      
      // Rango X (horizontal ahora)
      const xMin = Math.min(r.minV, !isNaN(r.lsl) ? r.lsl : r.minV) - r.sOverall * 0.5;
      const xMax = Math.max(r.maxV, !isNaN(r.usl) ? r.usl : r.maxV) + r.sOverall * 0.5;
      const toX = v => pad.l + ((v - xMin) / (xMax - xMin)) * plotW;
```

**Summary dimension rounding and balanced pagination — source lines 5506–5526.**

```javascript
      const PHOTO_H = Math.round(CONTENT_H * 0.47);
      const TABLE_Y = CONTENT_Y + PHOTO_H + GAP;
      const TABLE_H = H - TABLE_Y - FOOTER_H - PAD;

      const HIST_COLS = 4;
      const CELL_W = Math.floor(R_W / HIST_COLS);

      // Balanced distribution across pages
      const MAX_PER_PAGE = 24;
      const pages = Math.ceil(order.length / MAX_PER_PAGE);
      const perPage = [];
      {
        const base = Math.floor(order.length / pages);
        const extra = order.length % pages;
        let start = 0;
        for (let p = 0; p < pages; p++) {
          const cnt = base + (p < extra ? 1 : 0);
          perPage.push(order.slice(start, start + cnt));
          start += cnt;
        }
      }
```

**Summary row-height rounding and visible row clipping — source lines 5750–5759.**

```javascript
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
```

**Summary mini-histogram bins and counts — source lines 5885–5895.**

```javascript
      // Histogram bins
      const bins = Math.max(6, Math.min(14, Math.ceil(Math.sqrt(r.data.length))));
      const ext = r.sOverall * 0.55;
      const dMin = r.minV - ext, dMax = r.maxV + ext;
      const bwBin = (dMax - dMin) / bins;
      const counts = new Array(bins).fill(0);
      r.data.forEach(v => {
        const i = Math.max(0, Math.min(bins - 1, Math.floor((v - dMin) / bwBin)));
        counts[i]++;
      });
      const maxC = Math.max(...counts, 1);
```

**Executive chart subgroup/mode selection — source lines 6138–6141.**

```javascript
      const pngN = r.subgroupSize || parseInt(document.getElementById('subgroupSize').value) || 1;
      const _activeCCType = Object.entries(_results).find(([,v]) => v === r) ? (_ccTypes[Object.keys(_results).find(k => _results[k] === r)] || 'auto') : 'auto';
      let pngCCType = _activeCCType === 'auto' ? (pngN <= 1 ? 'imr' : pngN < 10 ? 'xr' : 'xs') : _activeCCType;
      const pngCCData = _buildCCData(r, pngN, pngCCType);
```

**Executive run-chart full-data/global-median transforms — source lines 6507–6512.**

```javascript
      const data = r.data, N = data.length, med = r.med;
      const ext = r.sOverall * 0.5;
      const yMin = r.minV - ext, yMax = r.maxV + ext;
      const toX = i => ox + (i / (N - 1)) * pW;
      const toY = v => oy + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const medY = toY(med);
```

**Executive run count and exact rounded expected-run caption — source lines 6548–6553.**

```javascript
      // Runs counter
      let runs = 1, cSide = data[0] > med ? 1 : data[0] < med ? -1 : 0;
      for (let i = 1; i < N; i++) { const s = data[i] > med ? 1 : data[i] < med ? -1 : 0; if (s !== 0 && s !== cSide) { runs++; cSide = s; } }
      const es = currentLang === 'es';
      c.font = '500 15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left';
      c.fillText(`${es ? 'Rachas' : 'Runs'}: ${runs}  |  ${es ? 'Esperado' : 'Expected'}: ~${Math.round((2 * N - 1) / 3)}  |  n=${N}`, ox, oy + pH + 46);
```

**Executive Q-Q sorting/probit/rank positions and reversed transforms — source lines 6562–6580.**

```javascript
      const sorted = [...r.data].sort((a, b) => a - b);
      const N = sorted.length, mu = r.xBar, sigma = r.sOverall;

      // Probit function (reuse)
      const probit = p => {
        const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
        const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
        const cc2 = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863, 0.0038405729373609, 0.0003951896511349, 0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
        const q = p - 0.5;
        if (Math.abs(q) < 0.42) { const r2 = q * q; return q * (((a[3] * r2 + a[2]) * r2 + a[1]) * r2 + a[0]) / ((((b[3] * r2 + b[2]) * r2 + b[1]) * r2 + b[0]) * r2 + 1); }
        let r2 = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p)); let x = cc2[0]; for (let i = 1; i < 9; i++)x += cc2[i] * Math.pow(r2, i); return p < 0.5 ? -x : x;
      };

      const pts = sorted.map((v, i) => ({ th: mu + sigma * probit((i + 0.5) / N), obs: v }));
      const xMin = Math.min(...pts.map(p => p.th)), xMax = Math.max(...pts.map(p => p.th));
      const yMin = Math.min(...pts.map(p => p.obs)), yMax = Math.max(...pts.map(p => p.obs));
      const xPad = (xMax - xMin) * 0.08 || 0.01, yPad = (yMax - yMin) * 0.08 || 0.01;
      const toX2 = v => ox + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * pW;
      const toY2 = v => oy + pH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * pH;
```

**Executive Q-Q fixed band — source lines 6588–6593.**

```javascript
      // 95% CI band
      const se = sigma * Math.sqrt((Math.PI / 2) / N);
      c.fillStyle = isDark ? 'rgba(74,222,128,0.07)' : 'rgba(22,163,74,0.06)';
      pts.forEach(p => {
        const x = toX2(p.th), y0 = toY2(p.obs - 1.36 * se), y1 = toY2(p.obs + 1.36 * se);
        if (x >= ox && x <= ox + pW) c.fillRect(x - 1, Math.min(y0, y1), 2, Math.abs(y1 - y0));
```

**Executive Q-Q color interpolation and rounding — source lines 6603–6609.**

```javascript
      pts.forEach(p => {
        const x = toX2(p.th), y = toY2(p.obs);
        const yIdeal = toY2(p.th), dev = Math.abs(y - yIdeal), maxDev = pH * 0.25, t2 = Math.min(dev / maxDev, 1);
        let col; if (t2 < 0.5) { const u = t2 * 2; col = isDark ? `rgba(${Math.round(74 + 177 * u)},${Math.round(222 - 27 * u)},${Math.round(128 - 128 * u)},0.9)` : `rgba(${Math.round(22 + 198 * u)},${Math.round(163 - 107 * u)},74,0.9)`; }
        else { const u = (t2 - 0.5) * 2; col = isDark ? `rgba(251,${Math.round(191 - 130 * u)},${Math.round(36 - 36 * u)},0.9)` : `rgba(220,${Math.round(56 - 18 * u)},38,0.9)`; }
        if (x < ox - 4 || x > ox + pW + 4 || y < oy - 4 || y > oy + pH + 4) return;
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 4; c.fill(); c.shadowBlur = 0;
```

**Executive box statistics and transform — source lines 6630–6645.**

```javascript
      const sorted = [...r.data].sort((a, b) => a - b);
      const N = sorted.length;
      const Q1 = quartile(sorted, 0.25), Q2 = r.med, Q3 = quartile(sorted, 0.75);
      const IQR = Q3 - Q1, lowerFence = Q1 - 1.5 * IQR, upperFence = Q3 + 1.5 * IQR;
      const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
      const inliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
      const minWhisker = inliers.length > 0 ? Math.min(...inliers) : sorted[0];
      const maxWhisker = inliers.length > 0 ? Math.max(...inliers) : sorted[N - 1];
      
      const pad = { t: HEADER_OFFSET + 15, r: 180, b: 35, l: 120 };
      const gap = 15;
      const sectionH = (cardH - pad.t - pad.b - gap * 2) / 3;
      const plotW = cardW - pad.l - pad.r;
      const xMin = Math.min(r.minV, !isNaN(r.lsl) ? r.lsl : r.minV) - r.sOverall * 0.5;
      const xMax = Math.max(r.maxV, !isNaN(r.usl) ? r.usl : r.maxV) + r.sOverall * 0.5;
      const toX = v => cardX + pad.l + ((v - xMin) / (xMax - xMin)) * plotW;
```

**Executive histogram bins/counts — source lines 6762–6772.**

```javascript
      const bins = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(r.data.length))));
      const ext = r.sOverall * 0.55;
      const dMin = r.minV - ext, dMax = r.maxV + ext;
      const bw = (dMax - dMin) / bins;
      const counts = new Array(bins).fill(0);
      r.data.forEach(v => {
        let i = Math.floor((v - dMin) / bw);
        i = Math.max(0, Math.min(bins - 1, i));
        counts[i]++;
      });
      const maxC = Math.max(...counts);
```

**Screen control-chart axis bounds/padding/transforms — source lines 7143–7151.**

```javascript
      // Y range: tight around data + limits, with padding
      const allVals = [...vals, ucl, lcl > 0 ? lcl : 0];
      let yMin = Math.min(...allVals);
      let yMax = Math.max(...allVals);
      const yPad = (yMax - yMin) * 0.15 || Math.abs(cl) * 0.1 || 0.01;
      yMin -= yPad; yMax += yPad;

      const toY = v => PAD.t + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const toX = i => PAD.l + (i / (Math.max(validPts.length - 1, 1))) * pW;
```

**Executive control-chart finite-limit bounds/padding/transforms — source lines 7344–7353.**

```javascript
      // Y range with safe fallbacks
      const safeUCL = isFinite(ucl) ? ucl : cl * 2;
      const safeLCL = isFinite(lcl) ? lcl : 0;
      const allV = [...vals, safeUCL, safeLCL > 0 ? safeLCL : 0];
      let yMin = Math.min(...allV), yMax = Math.max(...allV);
      const yPad = (yMax - yMin) * 0.18 || Math.abs(cl) * 0.1 || 0.001;
      yMin -= yPad; yMax += yPad;

      const toY = v => oy + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const toX = i => ox + (i / (Math.max(validPts.length - 1, 1))) * pW;
```

**Executive control-chart dynamic tick decimal precision — source lines 7405–7410.**

```javascript
      // Y axis labels
      c.font = '13px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'right';
      for (let g = 0; g <= 4; g++) {
        const v = yMin + (g / 4) * (yMax - yMin);
        const dp = Math.abs(v) < 1 ? 4 : v < 100 ? 3 : 1;
        c.fillText(v.toFixed(dp), ox - 10, oy + pH - (g / 4) * pH + 5);
```

**Guide fixed run sample/median and transforms — source lines 7977–7981.**

```javascript
      const pts = [10.0, 10.1, 9.95, 10.15, 10.3, 10.4, 10.25, 10.5, 10.35, 10.6, 10.55, 10.7, 10.4, 10.65, 10.8, 10.6, 10.75, 10.9, 10.8, 11.0];
      const N = pts.length, med = 10.475;
      const yMin = 9.7, yMax = 11.2;
      const toX = i => ox2 + pad.l + (i / (N - 1)) * pW;
      const toY = v => oy2 + pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH;
```

**Guide Q-Q synthetic data, full probit and transforms — source lines 8021–8040.**

```javascript
      const mu = 10, sig = 0.18;
      // Build theoretical for N=20
      const probitDemo = p => {
        const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
        const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
        const cc2 = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863, 0.0038405729373609, 0.0003951896511349, 0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
        const q = p - 0.5;
        if (Math.abs(q) < 0.42) { const r2 = q * q; return q * (((a[3] * r2 + a[2]) * r2 + a[1]) * r2 + a[0]) / ((((b[3] * r2 + b[2]) * r2 + b[1]) * r2 + b[0]) * r2 + 1); }
        let r2 = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p)); let x = cc2[0]; for (let i = 1; i < 9; i++)x += cc2[i] * Math.pow(r2, i); return p < 0.5 ? -x : x;
      };
      const demoN = 22;
      const demoData = [];
      for (let i = 0; i < demoN; i++) { const p = (i + 0.5) / demoN; let obs = mu + sig * probitDemo(p); if (i < 2) obs -= 0.22; if (i > demoN - 3) obs += 0.25; demoData.push({ th: mu + sig * probitDemo(p), obs }); }
      
      // INTERCAMBIADO: X=observed, Y=theoretical
      const xMin = Math.min(...demoData.map(p => p.obs)), xMax = Math.max(...demoData.map(p => p.obs));
      const yMin = Math.min(...demoData.map(p => p.th)), yMax = Math.max(...demoData.map(p => p.th));
      const xPad = (xMax - xMin) * 0.1, yPad = (yMax - yMin) * 0.1;
      const toX = v => ox2 + pad.l + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * pW;
      const toY = v => oy2 + pad.t + pH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * pH;
```

**Guide box fixed data/statistics/limits and transforms — source lines 8084–8097.**

```javascript
      const demoData = [9.5, 9.7, 9.75, 9.8, 9.85, 9.9, 9.92, 9.95, 9.98, 10.0, 10.02, 10.05, 10.08, 10.1, 10.12, 10.15, 10.2, 10.25, 10.3, 10.5, 11.2];
      const sorted = [...demoData].sort((a, b) => a - b), N = sorted.length;
      const Q1 = quartile(sorted, 0.25), Q2 = quartile(sorted, 0.5), Q3 = quartile(sorted, 0.75);
      const IQR = Q3 - Q1, lowerFence = Q1 - 1.5 * IQR, upperFence = Q3 + 1.5 * IQR;
      const mean = demoData.reduce((a, b) => a + b, 0) / N;
      const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
      const inliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
      const minWhisker = Math.min(...inliers), maxWhisker = Math.max(...inliers);
      
      const pad = { t: 15, r: 130, b: 35, l: 100 }, gap = 12;
      const sectionH = (H2 - pad.t - pad.b - gap * 2) / 3, plotW = W2 - pad.l - pad.r;
      const xMin = 9.2, xMax = 11.5;
      const toX = v => ox2 + pad.l + ((v - xMin) / (xMax - xMin)) * plotW;
      const lsl = 9.55, usl = 10.45;
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 02/24. Continue: [capaflow-inventory-section-03-of-24.md](capaflow-inventory-section-03-of-24.md).

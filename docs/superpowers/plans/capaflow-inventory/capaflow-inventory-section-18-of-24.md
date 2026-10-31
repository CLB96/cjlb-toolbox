# CapaFlow inventory — section 18 of 24

**Original inventory lines:** 6799–7161 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-17-of-24.md](capaflow-inventory-section-17-of-24.md). **Next:** [capaflow-inventory-section-19-of-24.md](capaflow-inventory-section-19-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**PNG report run chart — verbatim source [L6502–6554].**

```javascript
    function _pngRunChart(c, cardX, cardY, cardW, cardH, r, P, isDark) {
      const HEADER_OFFSET = 56;
      const PAD_L = 70, PAD_R = 28, PAD_T = HEADER_OFFSET + 12, PAD_B = 52;
      const pW = cardW - PAD_L - PAD_R, pH = cardH - PAD_T - PAD_B;
      const ox = cardX + PAD_L, oy = cardY + PAD_T;
      const data = r.data, N = data.length, med = r.med;
      const ext = r.sOverall * 0.5;
      const yMin = r.minV - ext, yMax = r.maxV + ext;
      const toX = i => ox + (i / (N - 1)) * pW;
      const toY = v => oy + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const medY = toY(med);

      // Grid
      for (let g = 0; g <= 4; g++) { const y = oy + (g / 4) * pH; c.beginPath(); c.moveTo(ox, y); c.lineTo(ox + pW, y); c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke(); }

      // Bands
      c.fillStyle = isDark ? 'rgba(74,222,128,0.05)' : 'rgba(22,163,74,0.04)'; c.fillRect(ox, oy, pW, Math.max(0, medY - oy));
      c.fillStyle = isDark ? 'rgba(248,113,113,0.05)' : 'rgba(220,38,38,0.04)'; c.fillRect(ox, medY, pW, Math.max(0, oy + pH - medY));

      // Median
      c.beginPath(); c.setLineDash([8, 5]); c.moveTo(ox, medY); c.lineTo(ox + pW, medY);
      c.strokeStyle = P.yellow; c.lineWidth = 2.5; c.shadowColor = P.yellow; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0; c.setLineDash([]);
      c.font = '600 16px ui-monospace,monospace'; c.fillStyle = P.yellow; c.textAlign = 'right';
      c.fillText('Md=' + med.toFixed(3), ox - 10, medY + 6);

      // Data line (colored per side)
      for (let i = 1; i < N; i++) {
        c.beginPath(); c.moveTo(toX(i - 1), toY(data[i - 1])); c.lineTo(toX(i), toY(data[i]));
        c.strokeStyle = data[i - 1] >= med ? (isDark ? 'rgba(74,222,128,0.8)' : 'rgba(22,163,74,0.75)') : (isDark ? 'rgba(248,113,113,0.8)' : 'rgba(220,38,38,0.75)');
        c.lineWidth = 2; c.stroke();
      }

      // Points
      data.forEach((v, i) => {
        c.beginPath(); c.arc(toX(i), toY(v), 4, 0, Math.PI * 2);
        c.fillStyle = v >= med ? (isDark ? '#4ade80' : 'rgba(22,163,74,0.9)') : (isDark ? '#f87171' : 'rgba(220,38,38,0.9)');
        c.fill();
      });

      // Y-axis & X-axis labels
      c.font = '14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'right';
      for (let g = 0; g <= 4; g++) { const v = yMin + (g / 4) * (yMax - yMin); c.fillText(v.toFixed(2), ox - 8, toY(v) + 5); }
      c.textAlign = 'center';
      const stepX = Math.max(1, Math.ceil(N / 14));
      for (let i = 0; i < N; i += stepX)c.fillText(String(i + 1), toX(i), oy + pH + 28);

      // Runs counter
      let runs = 1, cSide = data[0] > med ? 1 : data[0] < med ? -1 : 0;
      for (let i = 1; i < N; i++) { const s = data[i] > med ? 1 : data[i] < med ? -1 : 0; if (s !== 0 && s !== cSide) { runs++; cSide = s; } }
      const es = currentLang === 'es';
      c.font = '500 15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left';
      c.fillText(`${es ? 'Rachas' : 'Runs'}: ${runs}  |  ${es ? 'Esperado' : 'Expected'}: ~${Math.round((2 * N - 1) / 3)}  |  n=${N}`, ox, oy + pH + 46);
    }
```

**PNG report Q-Q plot — verbatim source [L6557–6625].**

```javascript
    function _pngQQPlot(c, cardX, cardY, cardW, cardH, r, P, isDark) {
      const HEADER_OFFSET = 56;
      const PAD_L = 72, PAD_R = 28, PAD_T = HEADER_OFFSET + 12, PAD_B = 52;
      const pW = cardW - PAD_L - PAD_R, pH = cardH - PAD_T - PAD_B;
      const ox = cardX + PAD_L, oy = cardY + PAD_T;
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

      // Grid
      for (let g = 0; g <= 4; g++) {
        const gy = oy + (g / 4) * pH; c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy); c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke();
        const gx = ox + (g / 4) * pW; c.beginPath(); c.moveTo(gx, oy); c.lineTo(gx, oy + pH); c.stroke();
      }

      // 95% CI band
      const se = sigma * Math.sqrt((Math.PI / 2) / N);
      c.fillStyle = isDark ? 'rgba(74,222,128,0.07)' : 'rgba(22,163,74,0.06)';
      pts.forEach(p => {
        const x = toX2(p.th), y0 = toY2(p.obs - 1.36 * se), y1 = toY2(p.obs + 1.36 * se);
        if (x >= ox && x <= ox + pW) c.fillRect(x - 1, Math.min(y0, y1), 2, Math.abs(y1 - y0));
      });

      // Reference line
      c.beginPath(); c.setLineDash([8, 5]);
      c.moveTo(toX2(xMin - xPad), toY2(xMin - xPad)); c.lineTo(toX2(xMax + xPad), toY2(xMax + xPad));
      c.strokeStyle = isDark ? 'rgba(74,222,128,0.75)' : 'rgba(22,163,74,0.75)'; c.lineWidth = 2.5;
      c.shadowColor = c.strokeStyle; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0; c.setLineDash([]);

      // Points
      pts.forEach(p => {
        const x = toX2(p.th), y = toY2(p.obs);
        const yIdeal = toY2(p.th), dev = Math.abs(y - yIdeal), maxDev = pH * 0.25, t2 = Math.min(dev / maxDev, 1);
        let col; if (t2 < 0.5) { const u = t2 * 2; col = isDark ? `rgba(${Math.round(74 + 177 * u)},${Math.round(222 - 27 * u)},${Math.round(128 - 128 * u)},0.9)` : `rgba(${Math.round(22 + 198 * u)},${Math.round(163 - 107 * u)},74,0.9)`; }
        else { const u = (t2 - 0.5) * 2; col = isDark ? `rgba(251,${Math.round(191 - 130 * u)},${Math.round(36 - 36 * u)},0.9)` : `rgba(220,${Math.round(56 - 18 * u)},38,0.9)`; }
        if (x < ox - 4 || x > ox + pW + 4 || y < oy - 4 || y > oy + pH + 4) return;
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 4; c.fill(); c.shadowBlur = 0;
      });

      // Axis labels
      c.font = '14px ui-monospace,monospace'; c.fillStyle = P.textDim;
      c.textAlign = 'right';
      for (let g = 0; g <= 4; g++) { const v = yMin - yPad + (g / 4) * (yMax + yPad - (yMin - yPad)); c.fillText(v.toFixed(2), ox - 8, toY2(v) + 5); }
      c.textAlign = 'center';
      for (let g = 0; g <= 4; g++) { const v = xMin - xPad + (g / 4) * (xMax + xPad - (xMin - xPad)); c.fillText(v.toFixed(2), toX2(v), oy + pH + 26); }

      // Axis name
      const es = currentLang === 'es';
      c.font = '500 15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left';
      const normOk = r.adTest.p >= 0.05;
      const adText = `Anderson-Darling p=${r.adTest.p.toFixed(4)} · ${normOk ? (es ? 'Normal ✓' : 'Normal ✓') : (es ? 'No Normal ⚠' : 'Non-Normal ⚠')}`;
      c.fillText(adText, ox, oy + pH + 46);
    }
```

**PNG report box plot — verbatim source [L6627–6686].**

```javascript
    function _pngBoxPlot(c, cardX, cardY, cardW, cardH, r, P, isDark) {
      const es = currentLang === 'es';
      const HEADER_OFFSET = 52;
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
      
      const drawSection = (yTop, label, statsType) => {
        const centerY = yTop + sectionH / 2, boxH = sectionH * 0.4;
        c.font = 'bold 18px ui-monospace,monospace'; c.fillStyle = P.text; c.textAlign = 'center';
        c.fillText(label, cardX + pad.l / 2, centerY + 6);
        c.strokeStyle = P.grid; c.lineWidth = 1;
        for (let g = 0; g <= 4; g++) { const x = cardX + pad.l + (g / 4) * plotW; c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, yTop + sectionH); c.stroke(); }
        if (!isNaN(r.lsl)) { const lslX = toX(r.lsl); c.beginPath(); c.moveTo(lslX, yTop + 5); c.lineTo(lslX, yTop + sectionH - 5); c.strokeStyle = P.red; c.lineWidth = 2.5; c.stroke(); }
        if (!isNaN(r.usl)) { const uslX = toX(r.usl); c.beginPath(); c.moveTo(uslX, yTop + 5); c.lineTo(uslX, yTop + sectionH - 5); c.strokeStyle = P.red; c.lineWidth = 2.5; c.stroke(); }
        const q1X = toX(Q1), q2X = toX(Q2), q3X = toX(Q3), minX = toX(minWhisker), maxX = toX(maxWhisker);
        c.beginPath(); c.moveTo(minX, centerY); c.lineTo(q1X, centerY); c.strokeStyle = isDark ? 'rgba(139,92,246,0.75)' : 'rgba(109,40,217,0.75)'; c.lineWidth = 2.5; c.stroke();
        c.beginPath(); c.moveTo(minX, centerY - boxH / 6); c.lineTo(minX, centerY + boxH / 6); c.stroke();
        c.beginPath(); c.moveTo(q3X, centerY); c.lineTo(maxX, centerY); c.stroke();
        c.beginPath(); c.moveTo(maxX, centerY - boxH / 6); c.lineTo(maxX, centerY + boxH / 6); c.stroke();
        const boxWidth = q3X - q1X, gradient = c.createLinearGradient(q1X, 0, q3X, 0);
        if (isDark) { gradient.addColorStop(0, 'rgba(139,92,246,0.45)'); gradient.addColorStop(1, 'rgba(139,92,246,0.15)'); }
        else { gradient.addColorStop(0, 'rgba(109,40,217,0.38)'); gradient.addColorStop(1, 'rgba(109,40,217,0.12)'); }
        c.fillStyle = gradient; c.fillRect(q1X, centerY - boxH / 2, boxWidth, boxH);
        c.strokeStyle = isDark ? 'rgba(139,92,246,0.9)' : 'rgba(109,40,217,0.9)'; c.lineWidth = 2.5; c.strokeRect(q1X, centerY - boxH / 2, boxWidth, boxH);
        c.beginPath(); c.moveTo(q2X, centerY - boxH / 2); c.lineTo(q2X, centerY + boxH / 2); c.strokeStyle = isDark ? '#fbbf24' : '#f59e0b'; c.lineWidth = 3; c.stroke();
        const meanX = toX(r.xBar); c.beginPath(); c.arc(meanX, centerY, 5, 0, Math.PI * 2); c.fillStyle = isDark ? '#06b6d4' : '#0891b2'; c.fill();
        outliers.forEach(v => { const ox = toX(v); c.beginPath(); c.arc(ox, centerY, 6, 0, Math.PI * 2); c.fillStyle = P.red; c.fill(); });
        if (statsType) {
          const statsX = cardX + pad.l + plotW + 15; c.font = '15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left';
          let stats = [];
          if (statsType === 'overall') stats = [`StDev ${r.sOverall !== null && r.sOverall !== undefined ? r.sOverall.toFixed(4) : '*'}`, `Pp    ${r.Pp !== null ? r.Pp.toFixed(2) : '*'}`, `Ppk   ${r.Ppk !== null ? r.Ppk.toFixed(2) : '*'}`, `Cpm   ${r.Cpm !== null && r.Cpm !== undefined ? r.Cpm.toFixed(2) : '*'}`, `PPM   ${r.ppmOverall !== null && r.ppmOverall !== undefined ? r.ppmOverall.toFixed(2) : '0.00'}`];
          else if (statsType === 'within') stats = [`StDev ${r.sWithin !== null && r.sWithin !== undefined ? r.sWithin.toFixed(4) : '*'}`, `Cp    ${r.Cp !== null ? r.Cp.toFixed(2) : '*'}`, `Cpk   ${r.Cpk !== null ? r.Cpk.toFixed(2) : '*'}`, `PPM   ${r.ppm !== null && r.ppm !== undefined ? r.ppm.toFixed(2) : '0.00'}`];
          stats.forEach((s, i) => c.fillText(s, statsX, yTop + 20 + i * 20));
        }
      };
      
      drawSection(cardY + pad.t, 'Overall', 'overall');
      drawSection(cardY + pad.t + sectionH + gap, 'Within', 'within');
      drawSection(cardY + pad.t + (sectionH + gap) * 2, 'Specs', null);
      
      c.strokeStyle = P.textDim; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cardX + pad.l, cardY + cardH - pad.b); c.lineTo(cardX + cardW - pad.r, cardY + cardH - pad.b); c.stroke();
      c.font = '14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center';
      for (let g = 0; g <= 4; g++) { const v = xMin + (g / 4) * (xMax - xMin); c.fillText(v.toFixed(3), cardX + pad.l + (g / 4) * plotW, cardY + cardH - pad.b + 18); }
      if (!isNaN(r.lsl)) { c.fillStyle = P.red; c.font = 'bold 14px ui-monospace,monospace'; c.fillText('LSL', toX(r.lsl), cardY + cardH - pad.b + 32); }
      if (!isNaN(r.usl)) { c.fillStyle = P.red; c.font = 'bold 14px ui-monospace,monospace'; c.fillText('USL', toX(r.usl), cardY + cardH - pad.b + 32); }
    }
```

**PNG report gauge — verbatim source [L6689–6751].**

```javascript
    function _pngGauge2(c, cardX, cardY, cardW, cardH, cpk, color, P, fmt) {
      const HEADER_OFFSET = 52;
      const cx = cardX + cardW / 2;
      const cy = cardY + HEADER_OFFSET + (cardH - HEADER_OFFSET) * 0.52;
      const R = Math.min(cardW * 0.36, (cardH - HEADER_OFFSET) * 0.50);

      // Track
      c.beginPath(); c.arc(cx, cy, R, Math.PI, 2 * Math.PI);
      c.lineWidth = 20; c.strokeStyle = 'rgba(128,128,148,0.1)'; c.lineCap = 'round'; c.stroke();

      // Colored zone arcs
      const zones = [
        { from: 0, to: 1.00, col: 'rgba(248,113,113,0.75)' },
        { from: 1.00, to: 1.33, col: 'rgba(251,191,36,0.75)' },
        { from: 1.33, to: 1.67, col: 'rgba(74,222,128,0.75)' },
        { from: 1.67, to: 2.00, col: 'rgba(0,229,255,0.75)' },
      ];
      zones.forEach(z => {
        c.beginPath();
        c.arc(cx, cy, R, Math.PI + (z.from / 2) * Math.PI, Math.PI + (z.to / 2) * Math.PI);
        c.lineWidth = 14; c.strokeStyle = z.col; c.lineCap = 'butt'; c.stroke();
      });

      // Needle
      const cl = Math.max(0, Math.min(cpk !== null && cpk !== undefined ? cpk : 0, 2));
      const ang = Math.PI + (cl / 2) * Math.PI;
      const nx = cx + (R - 4) * Math.cos(ang);
      const ny = cy + (R - 4) * Math.sin(ang);
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(nx, ny);
      c.lineWidth = 4; c.strokeStyle = color; c.lineCap = 'round';
      c.shadowColor = color; c.shadowBlur = 18; c.stroke(); c.shadowBlur = 0;

      // Center dot
      c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2);
      c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 14; c.fill(); c.shadowBlur = 0;

      // Scale labels
      c.font = '500 15px ui-monospace,monospace'; c.fillStyle = 'rgba(160,170,200,0.7)'; c.textAlign = 'center';
      [0, 0.5, 1.0, 1.33, 1.67, 2.0].forEach(v => {
        const a = Math.PI + (v / 2) * Math.PI;
        c.fillText(v % 1 === 0 ? v.toFixed(0) : v.toFixed(2),
          cx + (R + 22) * Math.cos(a), cy + (R + 22) * Math.sin(a) + 5);
      });

      // Big value + label below gauge center
      c.font = '800 54px system-ui,sans-serif'; c.fillStyle = color; c.textAlign = 'center';
      c.shadowColor = color; c.shadowBlur = 12;
      c.fillText(fmt(cpk), cx, cy + 62);
      c.shadowBlur = 0;
      c.font = '500 20px ui-monospace,monospace'; c.fillStyle = P.textSub;
      c.fillText('Cpk', cx, cy + 86);

      // Verdict badge
      const verdict = cpk !== null ? classifyCpk(cpk).label : '—';
      const vBg = cpk !== null ? (cpk >= 1.33 ? P.greenBg : cpk >= 1.0 ? P.yellowBg : P.redBg) : 'transparent';
      const vBd = cpk !== null ? (cpk >= 1.33 ? P.greenBorder : cpk >= 1.0 ? P.yellowBorder : P.redBorder) : P.border;
      c.font = '600 18px ui-monospace,monospace';
      const vw = c.measureText(verdict).width + 32;
      const vx = cx - vw / 2; const vy = cy + 96;
      c.beginPath(); c.roundRect(vx, vy, vw, 28, 14); c.fillStyle = vBg; c.fill();
      c.strokeStyle = vBd; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = color; c.textAlign = 'center'; c.fillText(verdict, cx, vy + 20);
    }
```

**PNG report histogram — verbatim source [L6754–6846].**

```javascript
    function _pngHistogram2(c, cardX, cardY, cardW, cardH, r, P, isDark) {
      const HEADER_OFFSET = 52;
      const PAD_L = 52, PAD_R = 28, PAD_T = HEADER_OFFSET + 14, PAD_B = 58;
      const pW = cardW - PAD_L - PAD_R;
      const pH = cardH - PAD_T - PAD_B;
      const ox = cardX + PAD_L;
      const oy = cardY + PAD_T;

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

      // Grid lines
      for (let g = 1; g <= 4; g++) {
        const gy = oy + pH - (g / 4) * pH;
        c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy);
        c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke();
      }

      // Bars
      counts.forEach((cnt, i) => {
        if (!cnt) return;
        const bx = ox + (i / bins) * pW;
        const bww = pW / bins - 1.5;
        const bh = (cnt / maxC) * pH;
        const by = oy + pH - bh;
        const g = c.createLinearGradient(0, by, 0, by + bh);
        g.addColorStop(0, P.barA); g.addColorStop(1, P.barB);
        c.fillStyle = g;
        c.beginPath(); c.roundRect(bx, by, bww, bh, [3, 3, 0, 0]); c.fill();
      });

      // Baseline
      c.beginPath(); c.moveTo(ox, oy + pH); c.lineTo(ox + pW, oy + pH);
      c.strokeStyle = P.borderLight; c.lineWidth = 1.5; c.stroke();

      // Normal curve
      const maxPDF = normPDF(r.xBar, r.xBar, r.sOverall);
      c.beginPath();
      for (let i = 0; i <= 200; i++) {
        const xv = dMin + (i / 200) * (dMax - dMin);
        const px = ox + ((xv - dMin) / (dMax - dMin)) * pW;
        const py = oy + pH - (normPDF(xv, r.xBar, r.sOverall) / maxPDF) * pH * 0.92;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.strokeStyle = P.curve; c.lineWidth = 3;
      c.shadowColor = P.curve; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;

      // Spec / target lines
      const drawVline = (val, col, lbl) => {
        if (isNaN(val)) return;
        const px = ox + ((val - dMin) / (dMax - dMin)) * pW;
        if (px < ox - 2 || px > ox + pW + 2) return;
        c.beginPath(); c.setLineDash([6, 5]);
        c.moveTo(px, oy); c.lineTo(px, oy + pH);
        c.strokeStyle = col; c.lineWidth = 2.5;
        c.shadowColor = col; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0; c.setLineDash([]);
        c.font = 'bold 14px ui-monospace,monospace'; c.fillStyle = col; c.textAlign = 'center';
        c.fillText(lbl, px, oy + 14);
      };
      drawVline(r.lsl, P.specLine, 'LSL');
      drawVline(r.usl, P.specLine, 'USL');
      if (!isNaN(r.targetVal)) drawVline(r.targetVal, P.targetLine, 'T');

      // Mean dashed
      const mpx = ox + ((r.xBar - dMin) / (dMax - dMin)) * pW;
      c.beginPath(); c.setLineDash([3, 4]);
      c.moveTo(mpx, oy); c.lineTo(mpx, oy + pH);
      c.strokeStyle = P.meanLine; c.lineWidth = 1.8; c.stroke(); c.setLineDash([]);

      // X-axis labels
      c.font = '400 14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const xv = dMin + (i / 5) * (dMax - dMin);
        c.fillText(xv.toFixed(2), ox + (i / 5) * pW, oy + pH + 22);
      }

      // Legend
      const legY = oy + pH + 38;
      const dot = (x, y, col) => { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.fill(); };
      c.font = '400 14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'left';
      dot(ox + 8, legY, P.barA); c.fillText('Freq.', ox + 19, legY + 5);
      dot(ox + 90, legY, P.curve); c.fillText('Normal', ox + 101, legY + 5);
      dot(ox + 190, legY, P.specLine); c.fillText('LSL/USL', ox + 201, legY + 5);
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 18/24. Continue: [capaflow-inventory-section-19-of-24.md](capaflow-inventory-section-19-of-24.md).

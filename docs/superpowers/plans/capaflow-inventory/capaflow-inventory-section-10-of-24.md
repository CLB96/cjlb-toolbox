# CapaFlow inventory — section 10 of 24

**Original inventory lines:** 3799–4195 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 5. Charts / visual timeline.
**Previous:** [capaflow-inventory-section-09-of-24.md](capaflow-inventory-section-09-of-24.md). **Next:** [capaflow-inventory-section-11-of-24.md](capaflow-inventory-section-11-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Gauge renderer — verbatim source [L4535–4607].**

```javascript
    function drawGauge(cpk, color, idx) {
      const canvas = document.getElementById(idx !== undefined ? `gaugeCanvas_${idx}` : 'gaugeCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height, cx = W / 2, cy = H - 18, R = Math.min(W * 0.44, H * 0.88);

      ctx.clearRect(0, 0, W, H);

      // Track
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI);
      ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(128,128,128,0.12)'; ctx.lineCap = 'round'; ctx.stroke();

      // Zone arcs
      const zones = [
        { from: 0, to: 1.0, color: 'rgba(255,82,82,0.65)' },
        { from: 1.0, to: 1.33, color: 'rgba(255,215,64,0.65)' },
        { from: 1.33, to: 1.67, color: 'rgba(105,240,174,0.65)' },
        { from: 1.67, to: 2.0, color: 'rgba(0,229,255,0.65)' },
      ];
      const maxV = 2;
      zones.forEach(z => {
        ctx.beginPath();
        ctx.arc(cx, cy, R, Math.PI + (z.from / maxV) * Math.PI, Math.PI + (z.to / maxV) * Math.PI);
        ctx.lineWidth = 12; ctx.strokeStyle = z.color; ctx.lineCap = 'butt'; ctx.stroke();
      });

      // Needle
      const clamped = Math.max(0, Math.min(cpk !== null && cpk !== undefined ? cpk : 0, maxV));
      const ang = Math.PI + (clamped / maxV) * Math.PI;
      const nx = cx + (R - 4) * Math.cos(ang), ny = cy + (R - 4) * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
      ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.lineCap = 'round';
      ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;

      // Center dot
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;

      // Labels
      ctx.fillStyle = 'rgba(128,128,150,0.65)'; ctx.font = '10px DM Mono, monospace'; ctx.textAlign = 'center';
      [0, 0.5, 1.0, 1.33, 1.67, 2.0].forEach(v => {
        const a = Math.PI + (v / maxV) * Math.PI;
        ctx.fillText(v % 1 === 0 ? v.toFixed(0) : v.toFixed(2), cx + (R + 15) * Math.cos(a), cy + (R + 15) * Math.sin(a));
      });

      // ── TOOLTIP INTERACTIVITY ──
      const innerR = R * 0.18; // dead zone around needle pivot
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dx = mx - cx, dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= innerR && dist <= R) {
          let angle = Math.atan2(dy, dx);
          if (angle < -Math.PI / 2) angle += 2 * Math.PI;
          const normAngle = (angle - Math.PI) / Math.PI;
          if (normAngle >= 0 && normAngle <= 1) {
            const hoveredCpk = normAngle * maxV;
            const _es = currentLang === 'es';
            let label = _es ? 'No Capaz' : 'Not Capable';
            if (hoveredCpk >= 1.67) label = 'World Class';
            else if (hoveredCpk >= 1.33) label = _es ? 'Capaz' : 'Capable';
            else if (hoveredCpk >= 1.0) label = 'Marginal';
            showTooltip(`Cpk: ${hoveredCpk.toFixed(3)}\n${label}`, e.clientX, e.clientY);
          }
        } else {
          hideTooltip();
        }
      };
      canvas.onmouseleave = hideTooltip;
    }
```

**Histogram renderer — verbatim source [L4611–4795].**

```javascript
    function drawHistogram(r, idx) {
      const canvas = document.getElementById(idx !== undefined ? `histCanvas_${idx}` : 'histCanvas');
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || 400;
      canvas.height = 220; // v8 fixed height
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

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

      // ── GRID ──
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(30,60,120,0.06)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const y = pad.t + (g / 4) * plotH;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
      }

      // ── OUT-OF-SPEC ZONES — colored fills behind bars ──
      if (!isNaN(r.lsl)) {
        const lslX = Math.max(pad.l, Math.min(pad.l + plotW, toX(r.lsl)));
        if (lslX > pad.l) {
          const zg = ctx.createLinearGradient(pad.l, 0, lslX, 0);
          zg.addColorStop(0, isDark ? 'rgba(217,70,239,0.13)' : 'rgba(162,28,175,0.09)');
          zg.addColorStop(1, isDark ? 'rgba(217,70,239,0.22)' : 'rgba(162,28,175,0.16)');
          ctx.fillStyle = zg;
          ctx.fillRect(pad.l, pad.t, lslX - pad.l, plotH);
        }
      }
      if (!isNaN(r.usl)) {
        const uslX = Math.max(pad.l, Math.min(pad.l + plotW, toX(r.usl)));
        if (uslX < pad.l + plotW) {
          const zg = ctx.createLinearGradient(uslX, 0, pad.l + plotW, 0);
          zg.addColorStop(0, isDark ? 'rgba(217,70,239,0.22)' : 'rgba(162,28,175,0.16)');
          zg.addColorStop(1, isDark ? 'rgba(217,70,239,0.13)' : 'rgba(162,28,175,0.09)');
          ctx.fillStyle = zg;
          ctx.fillRect(uslX, pad.t, pad.l + plotW - uslX, plotH);
        }
      }
      // "IN SPEC" green zone between LSL and USL (very subtle)
      if (!isNaN(r.lsl) && !isNaN(r.usl)) {
        const lslX = Math.max(pad.l, toX(r.lsl));
        const uslX = Math.min(pad.l + plotW, toX(r.usl));
        if (uslX > lslX) {
          ctx.fillStyle = isDark ? 'rgba(74,222,128,0.04)' : 'rgba(22,163,74,0.03)';
          ctx.fillRect(lslX, pad.t, uslX - lslX, plotH);
        }
      }

      // ── BARS ──
      counts.forEach((cnt, i) => {
        if (!cnt) return;
        const x = pad.l + (i / bins) * plotW, bw = plotW / bins - 1.5;
        const bh = (cnt / maxC) * plotH, y = pad.t + plotH - bh;
        const grad = ctx.createLinearGradient(0, y, 0, y + bh);
        if (isDark) { grad.addColorStop(0, 'rgba(79,195,247,0.82)'); grad.addColorStop(1, 'rgba(0,229,255,0.14)'); }
        else { grad.addColorStop(0, 'rgba(33,150,243,0.72)'); grad.addColorStop(1, 'rgba(100,160,240,0.12)'); }
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(x + 0.5, y, bw, bh, [3, 3, 0, 0]); ctx.fill();
        ctx.strokeStyle = isDark ? 'rgba(79,195,247,0.28)' : 'rgba(33,150,243,0.22)';
        ctx.lineWidth = 1; ctx.stroke();
      });

      // ── NORMAL CURVE ──
      const maxPDF = normPDF(r.xBar, r.xBar, r.sOverall);
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const xv = minV + (i / 180) * (maxV - minV);
        const px = toX(xv);
        const py = pad.t + plotH - (normPDF(xv, r.xBar, r.sOverall) / maxPDF) * plotH * 0.90;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = isDark ? 'rgba(105,240,174,0.95)' : 'rgba(22,163,74,0.90)';
      ctx.lineWidth = 2.5; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;

      // ── LSL / USL — LÍNEAS ROJAS VERTICALES VISIBLES (DIBUJADAS AL FINAL) ──
      const drawSpecLine = (val, lbl) => {
        if (isNaN(val)) return;
        const px = toX(val);
        if (px < pad.l || px > pad.l + plotW) return;

        // Línea roja vertical gruesa
        ctx.beginPath(); ctx.moveTo(px, pad.t - 5); ctx.lineTo(px, pad.t + plotH + 5);
        ctx.strokeStyle = isDark ? '#ef4444' : '#dc2626';
        ctx.lineWidth = 4;
        ctx.shadowColor = isDark ? 'rgba(239,68,68,0.8)' : 'rgba(220,38,38,0.7)';
        ctx.shadowBlur = 16; ctx.stroke(); ctx.shadowBlur = 0;

        // Etiqueta vertical
        ctx.save();
        ctx.translate(px, pad.t + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 16px DM Mono,monospace';
        const labelWidth = ctx.measureText(lbl).width;
        const padding = 12;
        
        ctx.fillStyle = isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)';
        ctx.beginPath(); 
        ctx.roundRect(-labelWidth/2 - padding, -11, labelWidth + padding*2, 22, 5); 
        ctx.fill();
        
        ctx.fillStyle = isDark ? '#fca5a5' : '#dc2626';
        ctx.textAlign = 'center'; 
        ctx.fillText(lbl, 0, 6);
        ctx.restore();
      };

      drawSpecLine(r.lsl, 'LSL');
      drawSpecLine(r.usl, 'USL');

      // ── MEAN LINE ──
      const mpx = toX(r.xBar);
      if (mpx >= pad.l && mpx <= pad.l + plotW) {
        ctx.beginPath(); ctx.setLineDash([4, 3]);
        ctx.moveTo(mpx, pad.t); ctx.lineTo(mpx, pad.t + plotH);
        ctx.strokeStyle = isDark ? 'rgba(79,195,247,0.75)' : 'rgba(33,150,243,0.75)';
        ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
        ctx.font = 'bold 11px DM Mono,monospace';
        const mlw = ctx.measureText('x̄').width + 10;
        ctx.fillStyle = isDark ? 'rgba(79,195,247,0.20)' : 'rgba(33,150,243,0.18)';
        ctx.beginPath(); ctx.roundRect(mpx - mlw / 2, pad.t + plotH + 3, mlw, 14, 3); ctx.fill();
        ctx.fillStyle = isDark ? 'rgba(79,195,247,1)' : 'rgba(33,150,243,1)';
        ctx.textAlign = 'center'; ctx.fillText('x̄', mpx, pad.t + plotH + 13);
      }

      // ── TARGET LINE ──
      if (!isNaN(r.targetVal)) {
        const tpx = toX(r.targetVal);
        if (tpx >= pad.l && tpx <= pad.l + plotW) {
          ctx.beginPath(); ctx.setLineDash([6, 3]);
          ctx.moveTo(tpx, pad.t); ctx.lineTo(tpx, pad.t + plotH);
          ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.85)' : 'rgba(180,83,9,0.85)';
          ctx.lineWidth = 2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0; ctx.setLineDash([]);
          const tbw = 22;
          ctx.fillStyle = isDark ? 'rgba(251,191,36,0.85)' : 'rgba(161,98,7,0.88)';
          ctx.beginPath(); ctx.roundRect(tpx - tbw / 2, pad.t - 2, tbw, 17, 4); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 11px DM Mono,monospace'; ctx.textAlign = 'center';
          ctx.fillText('T', tpx, pad.t + 12);
        }
      }

      // ── X-AXIS LABELS ──
      ctx.fillStyle = isDark ? 'rgba(200,210,255,0.40)' : 'rgba(30,60,120,0.40)';
      ctx.font = '9px DM Mono,monospace'; ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const xv = minV + (i / 5) * (maxV - minV);
        ctx.fillText(xv.toFixed(2), pad.l + (i / 5) * plotW, H - 5);
      }

      // ── TOOLTIP INTERACTIVITY ──
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        if (mx >= pad.l && mx <= pad.l + plotW && my >= pad.t && my <= pad.t + plotH) {
          const binIdx = Math.floor((mx - pad.l) / (plotW / bins));
          if (binIdx >= 0 && binIdx < bins) {
            const binStart = minV + binIdx * binW;
            const binEnd = binStart + binW;
            const freq = counts[binIdx];
            const pct = ((freq / data.length) * 100).toFixed(1);
            showTooltip(`${t('tooltip.binRange')} ${binStart.toFixed(3)} – ${binEnd.toFixed(3)}\n${t('tooltip.freq')} ${freq} (${pct}%)`, e.clientX, e.clientY);
          }
        } else {
          hideTooltip();
        }
      };
      canvas.onmouseleave = hideTooltip;
    }
```

**Run-chart renderer — verbatim source [L4829–4952].**

```javascript
    function drawRunChart(r, idx) {
      const canvas = document.getElementById(idx !== undefined ? `runChartCanvas_${idx}` : 'runChartCanvas');
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || 700;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const isDark = currentTheme === 'dark';
      
      // Mostrar últimos 25 subgrupos (configurable)
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

      // Grid
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.06)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) { const y = pad.t + (g / 4) * pH; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pW, y); ctx.stroke(); }

      // Colored above/below bands
      const medY = toY(med);
      ctx.fillStyle = isDark ? 'rgba(74,222,128,0.04)' : 'rgba(22,163,74,0.03)';
      ctx.fillRect(pad.l, pad.t, pW, Math.max(0, medY - pad.t));
      ctx.fillStyle = isDark ? 'rgba(248,113,113,0.04)' : 'rgba(220,38,38,0.03)';
      ctx.fillRect(pad.l, medY, pW, Math.max(0, pad.t + pH - medY));

      // Median line
      ctx.beginPath(); ctx.setLineDash([5, 4]);
      ctx.moveTo(pad.l, medY); ctx.lineTo(pad.l + pW, medY);
      ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.85)' : 'rgba(180,83,9,0.85)';
      ctx.lineWidth = 2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0; ctx.setLineDash([]);
      // Median label
      ctx.font = 'bold 11px DM Mono,monospace'; ctx.fillStyle = isDark ? 'rgba(251,191,36,0.9)' : 'rgba(180,83,9,0.9)'; ctx.textAlign = 'right';
      ctx.fillText('M̃=' + med.toFixed(3), pad.l - 4, medY + 4);

      // Data line (colored segments by side)
      for (let i = 1; i < N; i++) {
        const x0 = toX(i - 1), y0 = toY(data[i - 1]), x1 = toX(i), y1 = toY(data[i]);
        const above = data[i - 1] >= med;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.strokeStyle = above ? (isDark ? 'rgba(74,222,128,0.7)' : 'rgba(22,163,74,0.75)') : (isDark ? 'rgba(248,113,113,0.7)' : 'rgba(220,38,38,0.75)');
        ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();
      }

      // Data points
      data.forEach((v, i) => {
        const x = toX(i), y = toY(v);
        const above = v >= med;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = above ? (isDark ? '#4ade80' : 'rgba(22,163,74,0.9)') : (isDark ? '#f87171' : 'rgba(220,38,38,0.9)');
        ctx.fill();
      });

      // Y-axis
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(30,60,120,0.40)';
      ctx.font = '10px DM Mono,monospace'; ctx.textAlign = 'right';
      for (let g = 0; g <= 4; g++) { const v = yMin + (g / 4) * (yMax - yMin); ctx.fillText(v.toFixed(2), pad.l - 5, pad.t + (4 - g) / 4 * pH + 4); }

      // X-axis
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(30,60,120,0.35)';
      ctx.font = '10px DM Mono,monospace'; ctx.textAlign = 'center';
      const step = Math.max(1, Math.ceil(N / 12));
      for (let i = 0; i < N; i += step) ctx.fillText(String(startIndex + i + 1), toX(i), H - 5);

      // Stats note
      const noteEl = document.getElementById(idx !== undefined ? `runChartNote_${idx}` : 'runChartNote');
      if (noteEl) {
        const es = currentLang === 'es';
        noteEl.textContent = `${t('rc.runCount')}: ${runs} | ${t('rc.expected')}: ~${expectedRuns} | ` +
          (es ? `Variación aleatoria esperada si los datos son independientes (aprox. (2n-1)/3).` : `Random variation expected when data is independent (approx. (2n-1)/3).`);
      }

      // ── TOOLTIP INTERACTIVITY ──
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        let closestPt = null;
        let minDist = Infinity;
        
        data.forEach((v, i) => {
          const px = toX(i);
          const py = toY(v);
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          
          if (dist < minDist && dist < 20) {
            minDist = dist;
            closestPt = { index: i, value: v, globalIndex: startIndex + i };
          }
        });
        
        if (closestPt) {
          const above = closestPt.value >= med;
          const status = above ? t('tooltip.aboveMedian') : t('tooltip.belowMedian');
          const diff = (closestPt.value - med).toFixed(4);
          showTooltip(`${t('tooltip.observation')} #${closestPt.globalIndex + 1}\n${t('tooltip.value')}: ${closestPt.value.toFixed(4)}\n${t('tooltip.median')}: ${med.toFixed(4)}\nΔ: ${diff}\n${status}`, e.clientX, e.clientY);
        } else {
          hideTooltip();
        }
      };
      canvas.onmouseleave = hideTooltip;
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 10/24. Continue: [capaflow-inventory-section-11-of-24.md](capaflow-inventory-section-11-of-24.md).

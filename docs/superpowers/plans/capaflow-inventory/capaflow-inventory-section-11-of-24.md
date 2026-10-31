# CapaFlow inventory — section 11 of 24

**Original inventory lines:** 4196–4590 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 5. Charts / visual timeline.
**Previous:** [capaflow-inventory-section-10-of-24.md](capaflow-inventory-section-10-of-24.md). **Next:** [capaflow-inventory-section-12-of-24.md](capaflow-inventory-section-12-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Q-Q renderer — verbatim source [L4957–5099].**

```javascript
    function drawQQPlot(r, idx) {
      const canvas = document.getElementById(idx !== undefined ? `qqCanvas_${idx}` : 'qqCanvas');
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || 700;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const isDark = currentTheme === 'dark';
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

      // Grid
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.06)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const y = pad.t + (g / 4) * pH; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pW, y); ctx.stroke();
        const x = pad.l + (g / 4) * pW; ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + pH); ctx.stroke();
      }

      // Reference / identity line (obs = theoretical for a perfect normal)
      const refX0 = toX(xMin - xPad), refY0 = toY(xMin - xPad);
      const refX1 = toX(xMax + xPad), refY1 = toY(xMax + xPad);
      ctx.beginPath();
      ctx.moveTo(refX0, refY0); ctx.lineTo(refX1, refY1);
      ctx.strokeStyle = isDark ? 'rgba(74,222,128,0.65)' : 'rgba(22,163,74,0.70)';
      ctx.lineWidth = 2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6; ctx.setLineDash([6, 4]); ctx.stroke();
      ctx.shadowBlur = 0; ctx.setLineDash([]);

      // 95% confidence band (Lilliefors approx) — INTERCAMBIADO
      const se = sigma * Math.sqrt((Math.PI / 2) / N);
      pts.forEach((p, i) => {
        const x = toX(p.obs);
        const y0 = toY(p.th - 1.36 * se), y1 = toY(p.th + 1.36 * se);
        if (x >= pad.l && x <= pad.l + pW) {
          ctx.fillStyle = isDark ? 'rgba(74,222,128,0.06)' : 'rgba(22,163,74,0.05)';
          ctx.fillRect(x - 1, Math.min(y0, y1), 2, Math.abs(y1 - y0));
        }
      });

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
        ctx.fillStyle = col; ctx.fill();
      });

      // Axes labels — INTERCAMBIADOS
      const axisColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(30,60,120,0.40)';
      ctx.fillStyle = axisColor; ctx.font = '10px DM Mono,monospace';
      ctx.textAlign = 'right';
      for (let g = 0; g <= 4; g++) { const v = yMin - yPad + (g / 4) * (yMax - yMin + yPad * 2); ctx.fillText(v.toFixed(2), pad.l - 5, toY(v) + 4); }
      ctx.textAlign = 'center';
      for (let g = 0; g <= 4; g++) { const v = xMin - xPad + (g / 4) * (xMax - xMin + xPad * 2); ctx.fillText(v.toFixed(2), toX(v), H - 4); }

      // Axis line labels — INTERCAMBIADOS
      ctx.save(); ctx.translate(14, pad.t + pH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = isDark ? 'rgba(74,222,128,0.7)' : 'rgba(22,163,74,0.7)'; ctx.font = '10px DM Mono,monospace'; ctx.textAlign = 'center';
      ctx.fillText(currentLang === 'es' ? 'Cuantiles Teóricos' : 'Theoretical Quantiles', 0, 0); ctx.restore();
      ctx.fillStyle = isDark ? 'rgba(251,191,36,0.7)' : 'rgba(180,83,9,0.7)'; ctx.font = '10px DM Mono,monospace'; ctx.textAlign = 'center';
      ctx.fillText(currentLang === 'es' ? 'Datos Obs.' : 'Observed', pad.l + pW / 2, H - 8);

      // AD result note
      const noteEl = document.getElementById(idx !== undefined ? `qqNote_${idx}` : 'qqNote');
      if (noteEl) noteEl.textContent = t('qq.qqNote') + ` Anderson-Darling: p=${r.adTest.p.toFixed(4)}`;

      // ── TOOLTIP INTERACTIVITY ── INTERCAMBIADO
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        let closestPt = null;
        let minDist = Infinity;
        
        pts.forEach((p, i) => {
          const px = toX(p.obs);
          const py = toY(p.th);
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          
          if (dist < minDist && dist < 20) {
            minDist = dist;
            closestPt = { index: i, theoretical: p.th, observed: p.obs };
          }
        });
        
        if (closestPt) {
          const deviation = (closestPt.theoretical - closestPt.observed).toFixed(4);
          const percentile = ((closestPt.index + 0.5) / N * 100).toFixed(1);
          showTooltip(`Punto #${closestPt.index + 1} (${percentile}%)\nObservado: ${closestPt.observed.toFixed(4)}\nTeórico: ${closestPt.theoretical.toFixed(4)}\nDesviación: ${deviation}`, e.clientX, e.clientY);
        } else {
          hideTooltip();
        }
      };
      canvas.onmouseleave = hideTooltip;
    }
```

**Capability-style box renderer — verbatim source [L5104–5332].**

```javascript
    function drawBoxPlot(r, idx) {
      const canvas = document.getElementById(idx !== undefined ? `boxPlotCanvas_${idx}` : 'boxPlotCanvas');
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || 700;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const isDark = currentTheme === 'dark';
      const es = currentLang === 'es';
      
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
      
      // Función helper para dibujar una sección horizontal
      const drawSection = (yTop, label, statsType) => {
        const centerY = yTop + sectionH / 2;
        const boxH = sectionH * 0.4;
        
        // Título de sección
        ctx.font = 'bold 13px system-ui,sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(30,60,120,0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(label, pad.l / 2, centerY + 4);
        
        // Grid vertical sutil
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.05)';
        ctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
          const x = pad.l + (g / 4) * plotW;
          ctx.beginPath();
          ctx.moveTo(x, yTop);
          ctx.lineTo(x, yTop + sectionH);
          ctx.stroke();
        }
        
        // LSL/USL verticales
        if (!isNaN(r.lsl)) {
          const lslX = toX(r.lsl);
          ctx.beginPath();
          ctx.moveTo(lslX, yTop + 5);
          ctx.lineTo(lslX, yTop + sectionH - 5);
          ctx.strokeStyle = isDark ? '#ef4444' : '#dc2626';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (!isNaN(r.usl)) {
          const uslX = toX(r.usl);
          ctx.beginPath();
          ctx.moveTo(uslX, yTop + 5);
          ctx.lineTo(uslX, yTop + sectionH - 5);
          ctx.strokeStyle = isDark ? '#ef4444' : '#dc2626';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Box plot horizontal
        const q1X = toX(Q1), q2X = toX(Q2), q3X = toX(Q3);
        const minX = toX(minWhisker), maxX = toX(maxWhisker);
        
        // Whisker inferior (izquierda)
        ctx.beginPath();
        ctx.moveTo(minX, centerY);
        ctx.lineTo(q1X, centerY);
        ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.7)' : 'rgba(109,40,217,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cap inferior
        ctx.beginPath();
        ctx.moveTo(minX, centerY - boxH / 6);
        ctx.lineTo(minX, centerY + boxH / 6);
        ctx.stroke();
        
        // Whisker superior (derecha)
        ctx.beginPath();
        ctx.moveTo(q3X, centerY);
        ctx.lineTo(maxX, centerY);
        ctx.stroke();
        
        // Cap superior
        ctx.beginPath();
        ctx.moveTo(maxX, centerY - boxH / 6);
        ctx.lineTo(maxX, centerY + boxH / 6);
        ctx.stroke();
        
        // Box (rectángulo)
        const boxWidth = q3X - q1X;
        const gradient = ctx.createLinearGradient(q1X, 0, q3X, 0);
        if (isDark) {
          gradient.addColorStop(0, 'rgba(139,92,246,0.45)');
          gradient.addColorStop(1, 'rgba(139,92,246,0.15)');
        } else {
          gradient.addColorStop(0, 'rgba(109,40,217,0.38)');
          gradient.addColorStop(1, 'rgba(109,40,217,0.12)');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(q1X, centerY - boxH / 2, boxWidth, boxH);
        ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.9)' : 'rgba(109,40,217,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(q1X, centerY - boxH / 2, boxWidth, boxH);
        
        // Mediana (línea vertical en el centro del box)
        ctx.beginPath();
        ctx.moveTo(q2X, centerY - boxH / 2);
        ctx.lineTo(q2X, centerY + boxH / 2);
        ctx.strokeStyle = isDark ? '#fbbf24' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Media (punto)
        const meanX = toX(r.xBar);
        ctx.beginPath();
        ctx.arc(meanX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#06b6d4' : '#0891b2';
        ctx.fill();
        
        // Outliers
        outliers.forEach(v => {
          const ox = toX(v);
          ctx.beginPath();
          ctx.arc(ox, centerY, 5, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
          ctx.fill();
        });
        
        // Stats a la derecha (según statsType)
        if (statsType) {
          const statsX = pad.l + plotW + 10; // 10px después del área de plot
          ctx.font = '11px DM Mono,monospace';
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,60,120,0.7)';
          ctx.textAlign = 'left';
          
          let stats = [];
          if (statsType === 'overall') {
            // Overall: StDev, Pp, Ppk, Cpm, PPM
            stats = [
              `StDev ${r.sOverall !== null && r.sOverall !== undefined ? r.sOverall.toFixed(4) : '*'}`,
              `Pp    ${r.Pp !== null ? r.Pp.toFixed(2) : '*'}`,
              `Ppk   ${r.Ppk !== null ? r.Ppk.toFixed(2) : '*'}`,
              `Cpm   ${r.Cpm !== null && r.Cpm !== undefined ? r.Cpm.toFixed(2) : '*'}`,
              `PPM   ${r.ppmOverall !== null && r.ppmOverall !== undefined ? r.ppmOverall.toFixed(2) : '0.00'}`
            ];
          } else if (statsType === 'within') {
            // Within: StDev, Cp, Cpk, PPM
            stats = [
              `StDev ${r.sWithin !== null && r.sWithin !== undefined ? r.sWithin.toFixed(4) : '*'}`,
              `Cp    ${r.Cp !== null ? r.Cp.toFixed(2) : '*'}`,
              `Cpk   ${r.Cpk !== null ? r.Cpk.toFixed(2) : '*'}`,
              `PPM   ${r.ppm !== null && r.ppm !== undefined ? r.ppm.toFixed(2) : '0.00'}`
            ];
          }
          
          stats.forEach((s, i) => {
            ctx.fillText(s, statsX, yTop + 15 + i * 15);
          });
        }
      };
      
      // Dibujar las 3 secciones
      drawSection(pad.t, es ? 'Overall' : 'Overall', 'overall');
      drawSection(pad.t + sectionH + gap, es ? 'Within' : 'Within', 'within');
      drawSection(pad.t + (sectionH + gap) * 2, es ? 'Specs' : 'Specs', null);
      
      
      // Eje X inferior
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(30,60,120,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, H - pad.b);
      ctx.lineTo(W - pad.r, H - pad.b);
      ctx.stroke();
      
      // Labels del eje X
      ctx.font = '10px DM Mono,monospace';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,60,120,0.5)';
      ctx.textAlign = 'center';
      for (let g = 0; g <= 4; g++) {
        const v = xMin + (g / 4) * (xMax - xMin);
        const x = pad.l + (g / 4) * plotW;
        ctx.fillText(v.toFixed(3), x, H - pad.b + 12);
      }
      
      // Labels LSL/USL en eje X
      if (!isNaN(r.lsl)) {
        ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
        ctx.font = 'bold 10px DM Mono,monospace';
        ctx.fillText('LSL', toX(r.lsl), H - pad.b + 25);
      }
      if (!isNaN(r.usl)) {
        ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
        ctx.font = 'bold 10px DM Mono,monospace';
        ctx.fillText('USL', toX(r.usl), H - pad.b + 25);
      }
      
      // Nota
      const noteEl = document.getElementById(idx !== undefined ? `boxPlotNote_${idx}` : 'boxPlotNote');
      if (noteEl) noteEl.textContent = es
        ? `Q1=${Q1.toFixed(3)}, Q2=${Q2.toFixed(3)}, Q3=${Q3.toFixed(3)}, Outliers=${outliers.length}`
        : `Q1=${Q1.toFixed(3)}, Q2=${Q2.toFixed(3)}, Q3=${Q3.toFixed(3)}, Outliers=${outliers.length}`;
      
      // Tooltips deshabilitados por simplicidad en versión horizontal
      canvas.onmousemove = null;
      canvas.onmouseleave = null;
    }
```

**Control-chart selector setter — verbatim source [L6950–6957].**

```javascript
    function setCCType(type, idx) {
      _ccTypes[idx] = type;
      ['auto', 'imr', 'xr', 'xs'].forEach(id => {
        const el = document.getElementById(`ccPill${id.charAt(0).toUpperCase() + id.slice(1)}_${idx}`);
        if (el) el.classList.toggle('active', id === type);
      });
      if (_results[idx]) drawControlCharts(_results[idx], type, idx);
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 11/24. Continue: [capaflow-inventory-section-12-of-24.md](capaflow-inventory-section-12-of-24.md).

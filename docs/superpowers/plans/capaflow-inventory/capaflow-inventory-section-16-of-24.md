# CapaFlow inventory — section 16 of 24

**Original inventory lines:** 6123–6338 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-15-of-24.md](capaflow-inventory-section-15-of-24.md). **Next:** [capaflow-inventory-section-17-of-24.md](capaflow-inventory-section-17-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Summary miniature histogram renderer — verbatim source [L5841–5969].**

```javascript
    function _summaryDrawMiniHist(ctx, bx, by, bw, bh, r, posNum, P, isDark, fmt, cpkColor) {
      const HDR = 32;
      const PAD_L = 40, PAD_R = 6, PAD_T = HDR + 6, PAD_B = 22;
      const pW = bw - PAD_L - PAD_R;
      const pH = bh - PAD_T - PAD_B;
      const ox = bx + PAD_L, oy = by + PAD_T;

      if (pH < 20 || pW < 30) return;

      // Cell bg + accent strip
      ctx.fillStyle = P.surface; ctx.fillRect(bx, by, bw, bh);
      const cpkCol = cpkColor(r.Cpk);
      ctx.fillStyle = cpkCol; ctx.fillRect(bx, by, 3, bh);

      // Cell border
      ctx.beginPath(); ctx.rect(bx, by, bw, bh);
      ctx.strokeStyle = P.border; ctx.lineWidth = 0.8; ctx.stroke();

      // Header bg
      ctx.fillStyle = P.headerBg; ctx.fillRect(bx, by, bw, HDR);

      // Point number
      ctx.font = '700 11px system-ui,sans-serif'; ctx.fillStyle = cpkCol;
      ctx.textAlign = 'left'; ctx.fillText(`#${posNum}`, bx + 6, by + 21);

      // Point name (truncate)
      const maxNameW = bw - 90;
      let displayName = r.pointName || (currentLang === 'es' ? `Punto ${posNum}` : `Point ${posNum}`);
      ctx.font = '600 10px ui-monospace,monospace'; ctx.fillStyle = P.textSub;
      while (ctx.measureText(displayName).width > maxNameW && displayName.length > 3) {
        displayName = displayName.slice(0, -1);
      }
      if (displayName !== (r.pointName || `Punto ${posNum}`)) displayName += '…';
      ctx.textAlign = 'left'; ctx.fillText(displayName, bx + 26, by + 21);

      // Cpk badge top-right
      ctx.font = '700 10px ui-monospace,monospace'; ctx.fillStyle = cpkCol;
      ctx.textAlign = 'right'; ctx.fillText(`Cpk ${fmt(r.Cpk)}`, bx + bw - 5, by + 21);

      if (!r.data || r.data.length < 2) {
        ctx.font = '400 11px system-ui,sans-serif'; ctx.fillStyle = P.textDim;
        ctx.textAlign = 'center'; ctx.fillText('Sin datos', bx + bw / 2, by + bh / 2); return;
      }

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

      // Grid
      for (let g = 1; g <= 3; g++) {
        const gy = oy + pH - (g / 3) * pH;
        ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + pW, gy);
        ctx.strokeStyle = P.grid; ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Bars
      counts.forEach((cnt, i) => {
        if (!cnt) return;
        const barX = ox + (i / bins) * pW;
        const barW = Math.max(1, pW / bins - 1);
        const barH = (cnt / maxC) * pH;
        const barY = oy + pH - barH;
        const g = ctx.createLinearGradient(0, barY, 0, barY + barH);
        g.addColorStop(0, P.barA); g.addColorStop(1, P.barB);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, [2, 2, 0, 0]); ctx.fill();
      });

      // Baseline
      ctx.beginPath(); ctx.moveTo(ox, oy + pH); ctx.lineTo(ox + pW, oy + pH);
      ctx.strokeStyle = P.borderLight; ctx.lineWidth = 1; ctx.stroke();

      // Normal curve
      const maxPDF = normPDF(r.xBar, r.xBar, r.sOverall);
      if (maxPDF > 0) {
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const xv = dMin + (i / 100) * (dMax - dMin);
          const px = ox + ((xv - dMin) / (dMax - dMin)) * pW;
          const py = oy + pH - (normPDF(xv, r.xBar, r.sOverall) / maxPDF) * pH * 0.88;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = P.curve; ctx.lineWidth = 1.5;
        ctx.shadowColor = P.curve; ctx.shadowBlur = 3; ctx.stroke(); ctx.shadowBlur = 0;
      }

      // LSL / USL lines
      const drawV = (val, col, lbl) => {
        if (isNaN(val)) return;
        const px = ox + ((val - dMin) / (dMax - dMin)) * pW;
        if (px < ox - 2 || px > ox + pW + 2) return;
        ctx.save(); ctx.beginPath(); ctx.setLineDash([4, 3]);
        ctx.moveTo(px, oy); ctx.lineTo(px, oy + pH);
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        ctx.font = 'bold 8px ui-monospace,monospace'; ctx.fillStyle = col; ctx.textAlign = 'center';
        ctx.fillText(lbl, px, oy + 9);
      };
      if (r.hasLSL) drawV(r.lsl, P.specLine, 'L');
      if (r.hasUSL) drawV(r.usl, P.specLine, 'U');

      // Mean line
      const mpx = ox + ((r.xBar - dMin) / (dMax - dMin)) * pW;
      if (mpx >= ox && mpx <= ox + pW) {
        ctx.save(); ctx.beginPath(); ctx.setLineDash([3, 3]);
        ctx.moveTo(mpx, oy); ctx.lineTo(mpx, oy + pH);
        ctx.strokeStyle = P.meanLine; ctx.lineWidth = 1; ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }

      // X-axis: 3 ticks
      ctx.font = '400 8px ui-monospace,monospace'; ctx.fillStyle = P.textDim; ctx.textAlign = 'center';
      for (let i = 0; i <= 2; i++) {
        const xv = dMin + (i / 2) * (dMax - dMin);
        ctx.fillText(xv.toFixed(2), ox + (i / 2) * pW, oy + pH + 14);
      }

      // Y-axis label
      ctx.font = '400 8px ui-monospace,monospace'; ctx.fillStyle = P.textDim; ctx.textAlign = 'right';
      ctx.fillText(String(maxC), ox - 2, oy + 8);
    }
```

**Project ZIP generation — verbatim source [L5971–6032].**

```javascript
    async function generateProjectZip() {
      const btn = document.getElementById('btnDownloadZip');
      if (!btn || _analysisOrder.length === 0) return;
      btn.disabled = true;
      const es = currentLang === 'es';
      btn.textContent = es ? '⏳ Generando PNGs…' : '⏳ Generating PNGs…';
      showToast(es ? 'Generando proyecto ZIP…' : 'Generating project ZIP…', 8000);

      const rawName = document.getElementById('folderNameInput')?.value.trim() || 'CapaFlow_Proyecto';
      const folderName = rawName.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
      const zip = new JSZip();
      const folder = zip.folder(folderName);

      try {
        for (let pos = 0; pos < _analysisOrder.length; pos++) {
          const idx = _analysisOrder[pos];
          const r = _results[idx];
          if (!r) continue;
          const rawPointName = r.pointName ? r.pointName.replace(/[^a-zA-Z0-9_\- ]/g, '_') : (es ? `Analisis_${pos + 1}` : `Analysis_${pos + 1}`);
          const fileName = `${String(pos + 1).padStart(2, '0')}_${rawPointName}.png`;
          await new Promise(resolve => {
            setTimeout(() => {
              try {
                const dataURL = _drawPNG(r, true);
                if (dataURL) {
                  const b64 = dataURL.replace(/^data:image\/png;base64,/, '');
                  folder.file(fileName, b64, { base64: true });
                }
              } catch(e) { console.error('PNG error idx', idx, e); }
              resolve();
            }, 0);
          });
          btn.textContent = `⏳ ${pos + 1} / ${_analysisOrder.length}`;
        }

        // Generate comparative summary and include in ZIP
        btn.textContent = es ? '⏳ Generando resumen…' : '⏳ Generating summary…';
        try {
          const summaryURLs = await generateComparativeSummary(true);
          summaryURLs.forEach((url, i) => {
            const sName = summaryURLs.length > 1
              ? `00_Resumen_Comparativo_Pag${i + 1}.png`
              : '00_Resumen_Comparativo.png';
            const b64 = url.replace(/^data:image\/png;base64,/, '');
            folder.file(sName, b64, { base64: true });
          });
        } catch(e) { console.error('Summary error', e); }

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${folderName}.zip`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        showToast(es ? `✓ Proyecto "${folderName}" descargado` : `✓ Project "${folderName}" downloaded`);
      } catch(e) {
        console.error(e);
        showToast('Error: ' + e.message);
      }

      btn.disabled = false;
      btn.textContent = t('folder.downloadZip');
    }
```

**Executive PNG entry point — verbatim source [L6034–6043].**

```javascript
    function generateExecutivePNG() {
      if (!_lastResult) { showToast(t('toast.noData')); return; }
      showToast(t('toast.generating'), 4000);
      const btn = document.getElementById('btnExportPNG');
      btn.disabled = true;
      setTimeout(() => {
        try { _drawPNG(_lastResult); } catch (e) { console.error(e); showToast('Error: ' + e.message); }
        btn.disabled = false;
      }, 80);
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 16/24. Continue: [capaflow-inventory-section-17-of-24.md](capaflow-inventory-section-17-of-24.md).

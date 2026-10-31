# CapaFlow inventory — section 21 of 24

**Original inventory lines:** 8006–8333 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-20-of-24.md](capaflow-inventory-section-20-of-24.md). **Next:** [capaflow-inventory-section-22-of-24.md](capaflow-inventory-section-22-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Reading-guide histogram demonstration — verbatim source [L8153–8216].**

```javascript
    function _drawGuideHistogram(c, ox2, oy2, W2, H2, P, isDark, es) {
      const pad = { t: 30, r: 20, b: 30, l: 40 };
      const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b;
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
        const g = c.createLinearGradient(0, by, 0, by + bh);
        if (isDark) { g.addColorStop(0, 'rgba(79,195,247,0.75)'); g.addColorStop(1, 'rgba(0,229,255,0.15)'); }
        else { g.addColorStop(0, 'rgba(33,150,243,0.65)'); g.addColorStop(1, 'rgba(100,160,240,0.12)'); }
        c.fillStyle = g; c.beginPath(); c.roundRect(bx, by, bw, bh, [2, 2, 0, 0]); c.fill();
      });

      // normal curve
      c.beginPath();
      for (let i = 0; i <= 100; i++) {
        const xv = dMin + (i / 100) * (dMax - dMin);
        const px = ox2 + pad.l + ((xv - dMin) / (dMax - dMin)) * pW;
        const py = oy2 + pad.t + pH - (normPDF(xv, mu, sig) / maxH) * pH * 0.85;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.strokeStyle = isDark ? 'rgba(105,240,174,0.9)' : 'rgba(22,163,74,0.9)';
      c.lineWidth = 3; c.shadowColor = c.strokeStyle; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;

      // LSL/USL lines with badges
      const drawSpecLine = (val, lbl) => {
        const px = toLX(val);
        c.beginPath(); c.moveTo(px, oy2 + pad.t); c.lineTo(px, oy2 + pad.t + pH);
        c.strokeStyle = isDark ? 'rgba(239,68,68,0.9)' : 'rgba(185,28,28,0.85)'; c.lineWidth = 2.5;
        c.shadowColor = c.strokeStyle; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;
        c.font = 'bold 13px ui-monospace,monospace';
        const bw = c.measureText(lbl).width + 10;
        c.fillStyle = isDark ? 'rgba(239,68,68,0.75)' : 'rgba(185,28,28,0.80)';
        c.beginPath(); c.roundRect(px - bw / 2, oy2 + 4, bw, 18, 4); c.fill();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(lbl, px, oy2 + 16);
      };
      drawSpecLine(lsl, 'LSL'); drawSpecLine(usl, 'USL');

      // mean
      const mpx = toLX(mu);
      c.beginPath(); c.setLineDash([4, 3]); c.moveTo(mpx, oy2 + pad.t); c.lineTo(mpx, oy2 + pad.t + pH);
      c.strokeStyle = isDark ? 'rgba(79,195,247,0.8)' : 'rgba(33,150,243,0.8)'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
      c.font = 'bold 12px monospace'; c.fillStyle = isDark ? 'rgba(79,195,247,0.9)' : 'rgba(33,150,243,0.9)'; c.textAlign = 'center';
      c.fillText('x̄', mpx, oy2 + pad.t + pH + 18);
    }
```

**Reading-guide control-chart demonstration — verbatim source [L8219–8266].**

```javascript
    function _drawGuideCCChart(c, ox2, oy2, W2, H2, P, isDark, es) {
      const pad = { t: 20, r: 20, b: 24, l: 50 };
      const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b;
      const pts = [100, 102, 99, 103, 100.5, 101, 104.5, 99.5, 100, 101.5, 105, 100.2, 101, 99.8, 100.5];
      const cl = 101, ucl = 104.5, lcl = 97.5, sigma = 1.17;
      const n = pts.length;
      const yMin = 95, yMax = 107;
      const toX = i => ox2 + pad.l + (i / (n - 1)) * pW;
      const toY = v => oy2 + pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH;

      // warning zone
      c.fillStyle = isDark ? 'rgba(251,191,36,0.05)' : 'rgba(180,83,9,0.04)';
      c.fillRect(ox2 + pad.l, toY(cl + 2 * sigma), pW, toY(cl + sigma) - toY(cl + 2 * sigma));
      c.fillRect(ox2 + pad.l, toY(cl - sigma), pW, toY(cl - 2 * sigma) - toY(cl - sigma));

      // lines
      const hl2 = (y, col, dash, lw) => {
        c.beginPath(); c.setLineDash(dash); c.moveTo(ox2 + pad.l, y); c.lineTo(ox2 + pad.l + pW, y);
        c.strokeStyle = col; c.lineWidth = lw; c.stroke(); c.setLineDash([]);
      };
      hl2(toY(ucl), isDark ? 'rgba(248,113,113,0.85)' : 'rgba(185,28,28,0.85)', [8, 5], 2.5);
      hl2(toY(lcl), isDark ? 'rgba(248,113,113,0.85)' : 'rgba(185,28,28,0.85)', [8, 5], 2.5);
      hl2(toY(cl + 2 * sigma), isDark ? 'rgba(251,191,36,0.5)' : 'rgba(180,83,9,0.5)', [4, 4], 1.5);
      hl2(toY(cl - 2 * sigma), isDark ? 'rgba(251,191,36,0.5)' : 'rgba(180,83,9,0.5)', [4, 4], 1.5);
      hl2(toY(cl), isDark ? 'rgba(0,229,255,0.75)' : 'rgba(0,103,187,0.75)', [], 2.5);

      c.font = 'bold 12px ui-monospace,monospace'; c.fillStyle = isDark ? 'rgba(248,113,113,0.8)' : 'rgba(185,28,28,0.8)'; c.textAlign = 'left';
      c.fillText('UCL', ox2 + pad.l + pW + 4, toY(ucl) + 4);
      c.fillText('LCL', ox2 + pad.l + pW + 4, toY(lcl) + 4);
      c.fillStyle = isDark ? 'rgba(0,229,255,0.8)' : 'rgba(0,103,187,0.8)';
      c.fillText('CL', ox2 + pad.l + pW + 4, toY(cl) + 4);

      // data line
      const lineCol = isDark ? 'rgba(79,195,247,0.85)' : 'rgba(33,150,243,0.85)';
      c.beginPath(); pts.forEach((p, i) => { i === 0 ? c.moveTo(toX(i), toY(p)) : c.lineTo(toX(i), toY(p)); });
      c.strokeStyle = lineCol; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();

      // points
      const ooc = [6, 10]; // violating points
      pts.forEach((p, i) => {
        const x = toX(i), y = toY(p), isV = ooc.includes(i);
        c.beginPath(); c.arc(x, y, isV ? 7 : 4, 0, Math.PI * 2);
        if (isV) {
          c.fillStyle = P.red; c.shadowColor = P.red; c.shadowBlur = 12; c.fill(); c.shadowBlur = 0;
          c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.strokeStyle = 'rgba(248,113,113,0.3)'; c.lineWidth = 2; c.stroke();
        } else { c.fillStyle = lineCol; c.fill(); }
      });
    }
```

**Reading-guide distribution comparison demonstration — verbatim source [L8269–8321].**

```javascript
    function _drawGuideDistComp(c, ox2, oy2, W2, H2, P, isDark, centered, es) {
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
      }
      c.beginPath(); c.moveTo(pts2[0].x, oy2 + pad.t + pH);
      pts2.forEach(p => c.lineTo(p.x, p.y));
      c.lineTo(pts2[pts2.length - 1].x, oy2 + pad.t + pH); c.closePath();
      const g = c.createLinearGradient(0, oy2 + pad.t, 0, oy2 + pad.t + pH);
      g.addColorStop(0, centered ? (isDark ? 'rgba(74,222,128,0.45)' : 'rgba(22,163,74,0.35)') : (isDark ? 'rgba(251,191,36,0.35)' : 'rgba(180,83,9,0.30)'));
      g.addColorStop(1, 'transparent');
      c.fillStyle = g; c.fill();
      c.beginPath(); pts2.forEach((p, i) => i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y));
      c.strokeStyle = centered ? (isDark ? P.green : 'rgba(22,163,74,0.9)') : (isDark ? P.yellow : 'rgba(180,83,9,0.9)');
      c.lineWidth = 2.5; c.stroke();

      // spec lines
      [lsl, usl].forEach((v, i) => {
        const px = toX(v);
        c.beginPath(); c.moveTo(px, oy2 + pad.t); c.lineTo(px, oy2 + pad.t + pH);
        c.strokeStyle = isDark ? 'rgba(248,113,113,0.85)' : 'rgba(185,28,28,0.85)'; c.lineWidth = 2;
        c.shadowColor = c.strokeStyle; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0;
        c.font = 'bold 12px monospace'; c.fillStyle = 'rgba(248,113,113,0.9)'; c.textAlign = 'center';
        c.fillText(i === 0 ? 'LSL' : 'USL', px, oy2 + pad.t - 6);
      });

      // label
      const cpkApprox = centered ? 1.55 : 0.58;
      const lbl = centered ? (es ? '✓ Centrado — Cpk ≈ 1.55' : '✓ Centered — Cpk ≈ 1.55') : (es ? '⚠ Descentrado — Cpk ≈ 0.58' : '⚠ Off-center — Cpk ≈ 0.58');
      const lblCol = centered ? P.green : P.yellow;
      const lblBg = centered ? P.greenBg : P.yellowBg;
      const lblBd = centered ? P.greenBd : P.yellowBd;
      c.font = '600 15px ui-monospace,monospace';
      const lw = c.measureText(lbl).width + 20;
      const lx = ox2 + W2 / 2 - lw / 2;
      c.beginPath(); c.roundRect(lx, oy2 + 8, lw, 24, 12); c.fillStyle = lblBg; c.fill();
      c.strokeStyle = lblBd; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = lblCol; c.textAlign = 'center'; c.fillText(lbl, ox2 + W2 / 2, oy2 + 24);
    }
```

**Batch MWX/MWP/MPX conversion — verbatim source [L8451–8479].**

```javascript
    async function convertMwxFiles() {
      if (mwxFiles.length === 0) return;

      const btn = document.getElementById('mwxConvertBtn');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '⏳ Procesando...';

      document.getElementById('mwxLog').innerHTML = '';
      mwxProcessedCount = 0;

      addMwxLog(`📂 Iniciando conversión de ${mwxFiles.length} archivo(s)...`, 'info');

      for (let i = 0; i < mwxFiles.length; i++) {
        const file = mwxFiles[i];
        try {
          addMwxLog(`🔄 Procesando: ${file.name}`, 'info');
          await convertSingleMwxFile(file);
          mwxProcessedCount++;
        } catch (error) {
          addMwxLog(`❌ Error en ${file.name}: ${error.message}`, 'error');
        }
      }

      addMwxLog(`✅ Conversión completada: ${mwxProcessedCount}/${mwxFiles.length} exitosos`, 'success');

      btn.disabled = false;
      btn.innerHTML = originalText;
    }
```

**Single MWX/MWP/MPX to XLSX conversion — verbatim source [L8481–8583].**

```javascript
    async function convertSingleMwxFile(file) {
      // Leer archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Descomprimir ZIP
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Buscar archivo sheet.json
      const sheetJsonFile = zip.file(/sheets\/.*\/sheet\.json$/i)[0];

      if (!sheetJsonFile) {
        throw new Error('No se encontró sheet.json en el archivo (verifica que sea un MWX/MWP/MPX válido)');
      }

      // Leer y parsear JSON
      const jsonText = await sheetJsonFile.async('text');
      const data = JSON.parse(jsonText);

      // Extraer columnas
      const columns = data.Data?.Columns || [];

      if (columns.length === 0) {
        throw new Error('No se encontraron columnas de datos');
      }

      addMwxLog(`  └─ Encontradas ${columns.length} columna(s) de datos`, 'info');

      // Crear workbook de Excel
      const wb = XLSX.utils.book_new();

      // Extraer nombre de la hoja o usar default
      const sheetName = data.Data?.PrivateTitle || 'Hoja 1';

      // Preparar datos para Excel
      const headers = [];
      const columnData = [];
      let maxRows = 0;

      columns.forEach(col => {
        const colName = col.WorksheetVarBody?.Name || 'Sin nombre';
        headers.push(colName);

        const numericData = col.WorksheetVarBody?.VarData?.VarDataBody?.NumericData || [];
        const textData = col.WorksheetVarBody?.VarData?.VarDataBody?.TextData || [];

        // Usar datos numéricos o de texto
        const colValues = numericData.length > 0 ? numericData : textData;
        columnData.push(colValues);

        maxRows = Math.max(maxRows, colValues.length);
      });

      addMwxLog(`  └─ Total de ${maxRows} filas de datos`, 'info');

      // Construir array de filas para Excel
      const excelData = [headers];

      for (let row = 0; row < maxRows; row++) {
        const rowData = [];
        columnData.forEach(colValues => {
          rowData.push(row < colValues.length ? colValues[row] : '');
        });
        excelData.push(rowData);
      }

      // Crear worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Ajustar anchos de columna
      const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...columnData[i].slice(0, 100).map(v => String(v).length)
        );
        return { wch: Math.min(maxLen + 2, 30) };
      });
      ws['!cols'] = colWidths;

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Max 31 chars en Excel

      // Detectar si hay gráficas o análisis
      const hasCharts = data.Data?.Charts?.length > 0;
      const hasAnalysis = data.Data?.Analysis?.length > 0;

      if (hasCharts || hasAnalysis) {
        addMwxLog(`  ⚠ Archivo contiene gráficas/análisis no convertibles`, 'warning');
      }

      // Generar archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Descargar archivo
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.(mwx|mwp|mpx)$/i, '.xlsx');
      a.click();
      URL.revokeObjectURL(url);

      addMwxLog(`  ✓ Guardado como: ${a.download}`, 'success');
    }
```

**Dependencies intentionally defined elsewhere in this inventory:** `_buildInterpretationPlain(r, es)` is copied under displayed results (section4, L6849–6865); `_buildCCData(r, n, chartType)` and its statistical dependencies are copied under section2A (L7279–7325). These functions are part of PNG output and must be called with the same result/current-language/subgroup/control-chart inputs. [L6134–6141, L6849–6865, L7279–7325]

## 8. i18n (verbatim)

The following is the **complete, unedited `TRANSLATIONS` declaration**, including both language objects, comments, HTML fragments, punctuation, spacing and duplicate properties. ES occupies L2996–3199; EN occupies L3200–3403; the containing declaration occupies L2995–3404. No password constant is included in this range. [L2995–3404]

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 21/24. Continue: [capaflow-inventory-section-22-of-24.md](capaflow-inventory-section-22-of-24.md).

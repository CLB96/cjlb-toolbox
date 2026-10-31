# CapaFlow inventory — section 06 of 24

**Original inventory lines:** 2065–2473 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 3. Data import / input → MWX/MWP/MPX converter: separate import-to-export utility.
**Previous:** [capaflow-inventory-section-05-of-24.md](capaflow-inventory-section-05-of-24.md). **Next:** [capaflow-inventory-section-07-of-24.md](capaflow-inventory-section-07-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Converter selection, validation and complete conversion pipeline — verbatim source [L8414–8583].**

```javascript
    // Setup dropzone
    const dropzone = document.getElementById('mwxDropzone');
    const fileInput = document.getElementById('mwxFileInput');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files).filter(f => {
        const ext = f.name.toLowerCase();
        return ext.endsWith('.mwx') || ext.endsWith('.mwp') || ext.endsWith('.mpx');
      });
      if (files.length > 0) {
        mwxFiles.push(...files);
        renderMwxFileList();
      } else {
        addMwxLog('⚠ Solo archivos .MWX, .MWP o .MPX son permitidos', 'warning');
      }
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      mwxFiles.push(...files);
      renderMwxFileList();
    });

    // Conversión MWX → Excel
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

### Other input-adjacent feedback and silent failures

- Password errors are separate: `gate.error` ES=`Contraseña incorrecta, por favor ingresa la contraseña correcta`; EN=`Incorrect password, please enter the correct password`. Section9 gives gate behavior; password value deliberately omitted. [L3003, L3207, L3687–3707]
- Storage failures are swallowed; logo success toast still appears after failed write. No localized storage/read-file failure message. **observed bug:** app may report saved logo although persistence failed. [L3474–3487, L3494–3499, L3675–3684]
- `showToast` uses one toast element with default2800ms; converter log prefixes browser-default `toLocaleTimeString()` and uses text nodes, not HTML. [L5337–5341, L8366–8374]

## 4. Displayed results

### Lifecycle, naming and format

- Analysis increments `_analysisCounter`, stores `_results[idx]`, becomes `_lastResult`, receives chart type `'auto'`. Markup prepended while order appended oldest-to-newest; newest visible, previous blocks `carousel-hidden`. Second analysis reveals photo/folder widgets. [L3873–3877, L4104–4128]
- Title is supplied name or `` `Punto de Medición ${idx + 1}` `` / `` `Measurement Point ${idx + 1}` ``. Metadata is always `` `${r.N} datos · ${timestamp}` `` (Spanish `datos` even in English). Time=`new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})`. [L3886–3887, L3903–3904]
- Fixed formatter uses `.toFixed(d)`, default3; null/NaN becomes em dash `—`. PPM=`Math.round(v).toLocaleString()` with no locale argument. Browser locale, not selected language, controls separators/time; Infinity is not excluded. [L3884–3887]

**Exact result-formatting/title/time expressions — verbatim source [L3879–3887].**

```javascript
      const cpkColor = r.Cpk !== null ? colorForCpk(r.Cpk) : 'var(--accent)';
      const cpkClass = r.Cpk !== null ? classifyCpk(r.Cpk) : { label: '—', cls: '' };
      const ppkClass = r.Ppk !== null ? classifyCpk(r.Ppk) : { label: '—', cls: '' };
      const cpClass = r.Cp !== null ? classifyCpk(r.Cp) : { label: t('classify.potential'), cls: '' };
      const sigmaBarW = r.sigLvl !== null ? Math.min(100, (r.sigLvl / 6) * 100) : 0;
      const fmt = (v, d = 3) => v !== null && !isNaN(v) ? v.toFixed(d) : '—';
      const fmtN = (v) => v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—';
      const blockTitle = name || (currentLang === 'es' ? `Punto de Medición ${idx + 1}` : `Measurement Point ${idx + 1}`);
      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
```

### Every on-screen result card, table and box

Calculation definitions are in section2A; table identifies exact result property, formatting and status. Index abbreviations below are literals, not translation keys. [L3912–4098]

| Display | Exact label key / literal | Value / formatting | Status / class / target | Source lines |
|---|---|---|---|---|
| KPI Cpk | `Cpk`; `tip.cpk` tooltip | `fmt(r.Cpk)` (3decimals) | Cpk color/classification, `.kpi-card`, `.kpi-badge` | L3914–3917 |
| KPI Cp | `Cp`; `tip.cp` tooltip | `fmt(r.Cp)` | Color/class from Cp but badge text **always** `classify.potential` | L3882, L3919–3922 |
| KPI Ppk | `Ppk`; `tip.ppk` tooltip | `fmt(r.Ppk)` | Same status thresholds using Ppk | L3924–3927 |
| Gauge | `results.cpkTitle` | `fmt(r.Cpk)`; `Cpk · ` + `gauge.sigmaLevel` + `: ` + `fmt(r.sigLvl, 2)` | `gaugeCanvas_${idx}`, Cpk color | L3933–3944 |
| Sigma bar | `1σ` through `6σ` | `Math.min(100, (r.sigLvl / 6) * 100)` percent, 0 for null | Initial0%; assigned after120ms; no minimum clamp | L3883, L3945–3947, L4130–4148; CSS L1845–1851 |
| Histogram | `results.histTitle` | Custom plot, section5 | `histCanvas_${idx}`, initial height220 | L3953–3959 |
| Normality pill | `Anderson-Darling: p=` + `fmt(r.adTest.p, 4)` + ` · ` + `png.normal`/`png.notNormal` | Normal=`p >= 0.05` | Green/yellow inline background/border/dot/text, exact template below | L3838, L3960–3964 |
| Statistics | `results.statsTitle` | Rows below | `.stats-table` | L3972–3990 |
| All indices | `results.indicesTitle` | Within/overall tables and PPM | Yellow title dot; title lacks `data-i18n` | L3994–4020 |
| Within table | `results.capacity` | Cp/Cpk/Cpu/Cpl/Cpm/Cmk at3decimals | Missing values `—`; Cpm/Cmk labels dictionary keys | L4000–4007 |
| Overall table | `results.performance` | Pp/Ppk/Ppu/Ppl at3decimals | Missing values `—` | L4010–4015 |
| PPM via Cpk | `results.ppmCpk` | `fmtN(r.ppm)` | Cpk color | L4018 |
| PPM via Ppk | `results.ppmPpk` | `fmtN(r.ppmOverall)` | Ppk color, accent if null | L4019 |
| Interpretation | `results.interpretation` | Complete text builder below | `interpretationText_${idx}`; paragraphs joined `<br><br>` | L4024–4032, L4800–4824 |
| Control charts | `cc.title` | Auto/I-MR/X̄-R/X̄-S pills, two plot cards, note | `ccSection_${idx}`, `ccPair_${idx}`, `ccNote_${idx}` | L4035–4056 |
| Run chart | `results.runChartTitle` | Plot and runs note | `runChartCanvas_${idx}` height200; `runChartNote_${idx}`; dot `#a78bfa` | L4060–4070 |
| Q-Q | `results.qqTitle` | Plot and AD explanation | `qqCanvas_${idx}` height200; `qqNote_${idx}`; dot `#fb923c` | L4074–4084 |
| Box plot | `results.boxPlotTitle` | Plot and quartile/outlier note | `boxPlotCanvas_${idx}` height340; `boxPlotNote_${idx}`; dot `#8b5cf6` | L4088–4098 |
| Empty state | `empty.hint` | No calculated values | Initially shown; hidden by successful analysis, restored when all removed | L2892–2897, L3889–3893, L4185–4192, L4238–4242 |

| Statistics key | ES label | EN label | Displayed expression | Source lines |
|---|---|---|---|---|
| `stats.n` | n (datos) | n (data points) | `r.N` | L3979; labels L3068/L3272 |
| `stats.mean` | Media (x̄) | Mean (x̄) | `fmt(r.xBar, 4)` | L3980; labels L3069/L3273 |
| `stats.median` | Mediana | Median | `fmt(r.med, 4)` | L3981; labels L3070/L3274 |
| `stats.stdOverall` | StdDev Overall (s) | StdDev Overall (s) | `fmt(r.sOverall, 4)` | L3982; labels L3071/L3275 |
| `stats.stdWithin` | StdDev Within (σ̂) | StdDev Within (σ̂) | `fmt(r.sWithin, 4)` | L3983; labels L3072/L3276 |
| `stats.min` | Mínimo | Minimum | `fmt(r.minV, 4)` | L3984; labels L3073/L3277 |
| `stats.max` | Máximo | Maximum | `fmt(r.maxV, 4)` | L3985; labels L3074/L3278 |
| `stats.range` | Rango | Range | `fmt(r.range, 4)` | L3986; labels L3075/L3279 |
| `stats.lsl` | LSL | LSL | `r.hasLSL ? fmt(r.lsl, 3) : '—'` | L3987; labels L3076/L3280 |
| `stats.usl` | USL | USL | `r.hasUSL ? fmt(r.usl, 3) : '—'` | L3988; labels L3077/L3281 |
| `stats.target` | Target | Target | `fmt(r.targetVal, 3); entire row only if !isNaN(r.targetVal)` | L3989; labels L3078/L3282 |

`stats.subgroup` exists in both dictionaries, but on-screen statistics table has no subgroup-size row. Do not invent one. [L3079, L3283, L3978–3990]

### Exact bilingual result labels

Values shown for lookup convenience; section8 preserves full literal dictionaries and escapes. Literal strings inside renderer below remain authoritative for spacing/concatenation. [L2995–3404, L3873–4160]

| Key | ES string | EN string | Definition lines |
|---|---|---|---|
| `cc.imr_full` | I-MR | I-MR | L3059/L3263 |
| `cc.inControl` | Bajo control | In control | L3063/L3267 |
| `cc.individuals` | Individuales | Individuals | L3083/L3287 |
| `cc.means` | Medias | Means | L3084/L3288 |
| `cc.movingRange` | Rango Móvil | Moving Range | L3087/L3291 |
| `cc.noteIMR` | Datos individuales (subgrupo=1). Se usa gráfica I-MR con rango móvil entre observaciones consecutivas. | Individual data (subgroup=1). I-MR chart using moving range between consecutive observations. | L3064/L3268 |
| `cc.noteXR` | Subgrupos de tamaño n=%s. Constantes: A₂=%.3f, D₃=%.3f, D₄=%.3f | Subgroup size n=%s. Constants: A₂=%.3f, D₃=%.3f, D₄=%.3f | L3065/L3269 |
| `cc.noteXS` | Subgrupos de tamaño n=%s. Constantes: A₃=%.3f, B₃=%.3f, B₄=%.3f | Subgroup size n=%s. Constants: A₃=%.3f, B₃=%.3f, B₄=%.3f | L3066/L3270 |
| `cc.ooc` | Fuera de control | Out of control | L3062/L3266 |
| `cc.ranges` | Rangos | Ranges | L3085/L3289 |
| `cc.stddevBot` | Desv. Est. | Std Dev | L3086/L3290 |
| `cc.subgroups` | subgrupos | subgroups | L3061/L3265 |
| `cc.title` | Gráficas de Control | Control Charts | L3048/L3252 |
| `cc.xbar_r` | X̄-R | X̄-R | L3057/L3261 |
| `cc.xbar_s` | X̄-S | X̄-S | L3058/L3262 |
| `classify.potential` | Potencial | Potential | L3047/L3251 |
| `gauge.sigmaLevel` | Nivel σ | σ Level | L3082/L3286 |
| `idx.cmkLabel` | Cmk (Máquina) | Cmk (Machine) | L3081/L3285 |
| `idx.cpmLabel` | Cpm (Taguchi) | Cpm (Taguchi) | L3080/L3284 |
| `png.normal` | Distribución Normal ✓ | Normal Distribution ✓ | L3117/L3321 |
| `png.notNormal` | Posible No-Normalidad | Possible Non-Normality | L3118/L3322 |
| `qq.qqNote` | Si los puntos siguen la línea diagonal, los datos son aproximadamente normales. Desviaciones en los extremos indican colas pesadas. | If points follow the diagonal line, data is approximately normal. Deviations at extremes indicate heavy tails. | L3168/L3372 |
| `rc.expected` | Esperado | Expected | L3163/L3367 |
| `rc.runCount` | Total de rachas | Total runs | L3162/L3366 |
| `results.boxPlotTitle` | Diagrama de Caja (Box Plot) | Box Plot | L3155/L3359 |
| `results.capacity` | Capacidad (Within σ) | Capability (Within σ) | L3038/L3242 |
| `results.cpkTitle` | Índice Cpk | Cpk Index | L3034/L3238 |
| `results.histTitle` | Histograma + Distribución | Histogram + Distribution | L3035/L3239 |
| `results.indicesTitle` | Todos los Índices | All Indices | L3037/L3241 |
| `results.interpretation` | Interpretación Automática | Auto Interpretation | L3042/L3246 |
| `results.performance` | Desempeño (Overall σ) | Performance (Overall σ) | L3039/L3243 |
| `results.ppmCpk` | PPM Esperado (Cpk) | Expected PPM (Cpk) | L3040/L3244 |
| `results.ppmPpk` | PPM Esperado (Ppk) | Expected PPM (Ppk) | L3041/L3245 |
| `results.qqTitle` | Probabilidad Normal (Q-Q Plot) | Normal Probability Plot (Q-Q) | L3154/L3358 |
| `results.runChartTitle` | Gráfica de Corrida (Run Chart) | Run Chart | L3153/L3357 |
| `results.statsTitle` | Estadísticas del Proceso | Process Statistics | L3036/L3240 |
| `stats.lsl` | LSL | LSL | L3076/L3280 |
| `stats.max` | Máximo | Maximum | L3074/L3278 |
| `stats.mean` | Media (x̄) | Mean (x̄) | L3069/L3273 |
| `stats.median` | Mediana | Median | L3070/L3274 |
| `stats.min` | Mínimo | Minimum | L3073/L3277 |
| `stats.n` | n (datos) | n (data points) | L3068/L3272 |
| `stats.range` | Rango | Range | L3075/L3279 |
| `stats.stdOverall` | StdDev Overall (s) | StdDev Overall (s) | L3071/L3275 |
| `stats.stdWithin` | StdDev Within (σ̂) | StdDev Within (σ̂) | L3072/L3276 |
| `stats.target` | Target | Target | L3078/L3282 |
| `stats.usl` | USL | USL | L3077/L3281 |
| `tip.cp` | Capacidad potencial. Solo requiere ambos límites. | Potential capability. Requires both spec limits. | L3089/L3293 |
| `tip.cpk` | Capacidad real considerando centrado. Meta ≥ 1.33 | Real capability considering centering. Target ≥ 1.33 | L3088/L3292 |
| `tip.ppk` | Desempeño real usando σ global (largo plazo). | Real performance using overall σ (long-term). | L3090/L3294 |
| `tooltip.aboveMedian` | 🟢 Arriba mediana | 🟢 Above median | L3148/L3352 |
| `tooltip.belowMedian` | 🔴 Abajo mediana | 🔴 Below median | L3149/L3353 |
| `tooltip.median` | Mediana | Median | L3152/L3356 |
| `tooltip.observation` | Observación | Observation | L3150/L3354 |
| `tooltip.value` | Valor | Value | L3151/L3355 |
| `classify.worldClass` | World Class | World Class | L3043/L3247 |
| `classify.capable` | Capaz | Capable | L3044/L3248 |
| `classify.marginal` | Marginal | Marginal | L3045/L3249 |
| `classify.notCapable` | No Capaz | Not Capable | L3046/L3250 |

### Status thresholds and exact CSS

| Condition | `classifyCpk` label key and class | `colorForCpk` | Source lines |
|---|---|---|---|
| `v >= 1.67` | `classify.worldClass`, `green` | `var(--accent-green)` | L3798, L3804 |
| Else `v >= 1.33` | `classify.capable`, `green` | `var(--accent-green)` | L3799, L3804 |
| Else `v >= 1.00` | `classify.marginal`, `yellow` | `var(--accent-yellow)` | L3800, L3805 |
| Else | `classify.notCapable`, `red` | `var(--accent-red)` | L3801, L3806 |
| Null Cpk/Ppk | `—`, empty class | `var(--accent)` | L3879–3881 |

Dark tokens: green `#69F0AE`, yellow `#FFD740`, red `#FF5252`; light: green `#1b8a52`, yellow `#c17f00`, red `#d32f2f`. Background/border RGBA declarations are separate from token hex values. [L32–34, L58–60, L1768–1799]

**KPI badge classes including light overrides — verbatim source [L1754–1799].**

```css
    .kpi-badge {
      display: inline-block;
      padding: 0.18rem 0.65rem;
      border-radius: 50px;
      font-size: 0.67rem;
      font-family: 'DM Mono', monospace;
      letter-spacing: 0.05em;
      font-weight: 500;
      background: var(--tag-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      transition: all var(--transition-theme);
    }

    .kpi-badge.green {
      background: rgba(105, 240, 174, 0.1);
      border-color: rgba(105, 240, 174, 0.25);
      color: var(--accent-green);
    }

    .kpi-badge.yellow {
      background: rgba(255, 215, 64, 0.1);
      border-color: rgba(255, 215, 64, 0.25);
      color: var(--accent-yellow);
    }

    .kpi-badge.red {
      background: rgba(255, 82, 82, 0.1);
      border-color: rgba(255, 82, 82, 0.25);
      color: var(--accent-red);
    }

    [data-theme="light"] .kpi-badge.green {
      background: rgba(27, 138, 82, 0.08);
      color: var(--accent-green);
    }

    [data-theme="light"] .kpi-badge.yellow {
      background: rgba(193, 127, 0, 0.08);
      color: var(--accent-yellow);
    }

    [data-theme="light"] .kpi-badge.red {
      background: rgba(211, 47, 47, 0.08);
      color: var(--accent-red);
    }
```


**Sigma bar fill and label styling — verbatim source [L1837–1861].**

```css
      height: 8px;
      border-radius: 50px;
      background: var(--input-border);
      overflow: hidden;
      position: relative;
      margin-bottom: 0.4rem;
    }

    .sigma-bar-fill {
      height: 100%;
      border-radius: 50px;
      transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(90deg, var(--accent-red), var(--accent-yellow), var(--accent-green));
      width: 0%;
    }

    .sigma-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.63rem;
      color: var(--text-tertiary);
      font-family: 'DM Mono', monospace;
    }

    /* ══════════════════════════════════════════════
```

### Complete result-card composition

Authoritative literal includes every label, whitespace, HTML structure, dynamic ID, control, inline style, insertion and delayed drawing call, including Spanish-only sigma-hover classifications/metadata. [L3873–4160]

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 06/24. Continue: [capaflow-inventory-section-07-of-24.md](capaflow-inventory-section-07-of-24.md).

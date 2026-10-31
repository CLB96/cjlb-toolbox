# CapaFlow inventory — section 20 of 24

**Original inventory lines:** 7547–8005 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-19-of-24.md](capaflow-inventory-section-19-of-24.md). **Next:** [capaflow-inventory-section-21-of-24.md](capaflow-inventory-section-21-of-24.md).

**CODE CONTINUATION B/2 — `_drawGuide()`**: continues the same function from [capaflow-inventory-section-19-of-24.md](capaflow-inventory-section-19-of-24.md); this excerpt starts at the CONTROL CHARTS section, not at a new function. The Markdown fence is reopened only for readable presentation; no original line is missing.

<!-- ORIGINAL-CONTENT-BEGIN -->
```javascript
      // ══════════════════════════════
      //  SECTION 4 — CONTROL CHARTS
      // ══════════════════════════════
      sectionTitle(es ? '④ GRÁFICAS DE CONTROL (X̄-R / I-MR)' : '④ CONTROL CHARTS (X̄-R / I-MR)',
        es ? '¿El proceso es estable en el tiempo?' : 'Is the process stable over time?', PAD, Y, W - PAD * 2, '167,139,250');
      Y += 56 + 16;

      // Demo control chart annotated
      const ccW = 760, ccH = 200;
      rr(PAD, Y, ccW, ccH, 12, P.surface, P.border, 1.5);
      _drawGuideCCChart(c, PAD, Y, ccW, ccH, P, isDark, es);
      const ccAnnX = PAD + ccW + 28, ccAnnW = W - PAD * 2 - ccW - 28;
      let ccAnnY = Y;
      const ccItems = [
        { color: P.red, text: es ? 'PUNTO ROJO = Fuera de control. Algo inusual pasó en ese momento (cambio de material, operador, máquina). ¡Investiga!' : 'RED POINT = Out of control. Something unusual happened at that moment (material change, operator, machine). Investigate!' },
        { color: isDark ? P.accent : P.accent2, text: es ? 'LÍNEA CENTRAL (CL) = El promedio del proceso. Los puntos deberían oscilar aleatoriamente alrededor de esta línea.' : 'CENTER LINE (CL) = Process average. Points should randomly fluctuate around this line.' },
        { color: P.red, text: es ? 'UCL / LCL = Límites de control estadístico (±3σ). Son calculados, NO son las especificaciones del cliente.' : 'UCL / LCL = Statistical control limits (±3σ). These are CALCULATED, NOT customer specifications.' },
        { color: P.yellow, text: es ? 'ZONA ±2σ = Señal de advertencia. 2 de 3 puntos consecutivos aquí indican una tendencia preocupante.' : '±2σ ZONE = Warning signal. 2 of 3 consecutive points here indicate a concerning trend.' },
      ];
      ccItems.forEach(item => {
        rr(ccAnnX, ccAnnY, ccAnnW, 62, 10, P.surface, P.borderLight, 1);
        rr(ccAnnX, ccAnnY, 4, 62, [2, 0, 0, 2], item.color, null);
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const ls = _wrapText(c, item.text, ccAnnW - 20, '400 16px system-ui,sans-serif');
        ls.forEach((l, i) => c.fillText(l, ccAnnX + 16, ccAnnY + 18 + i * 20));
        ccAnnY += 70;
      });
      Y += Math.max(ccH, ccAnnY - Y) + VGAP;

      // ══════════════════════════════
      //  SECTION 5 — WESTERN ELECTRIC RULES
      // ══════════════════════════════
      sectionTitle(es ? '⑤ REGLAS WESTERN ELECTRIC — ¿Cuándo actuar?' : '⑤ WESTERN ELECTRIC RULES — When to act?',
        es ? '4 señales que indican que tu proceso necesita atención' : '4 signals indicating your process needs attention', PAD, Y, W - PAD * 2, '251,146,60');
      Y += 56 + 16;

      const weRules = [
        {
          num: '1', color: P.red,
          title: es ? 'Regla 1 — Un punto más allá de 3σ' : 'Rule 1 — One point beyond 3σ',
          desc: es ? 'Si cualquier punto individual cae fuera de los límites UCL o LCL, hay una causa especial de variación. Requiere investigación inmediata.' : 'If any individual point falls outside UCL or LCL, there is a special cause of variation. Requires immediate investigation.'
        },
        {
          num: '2', color: P.yellow,
          title: es ? 'Regla 2 — 2 de 3 puntos más allá de 2σ (mismo lado)' : 'Rule 2 — 2 of 3 points beyond 2σ (same side)',
          desc: es ? 'Cuando 2 de 3 puntos consecutivos están en la zona de advertencia del mismo lado de la línea central, indica una tendencia emergente.' : 'When 2 of 3 consecutive points are in the warning zone on the same side of the center line, it indicates an emerging trend.'
        },
        {
          num: '3', color: P.orange,
          title: es ? 'Regla 3 — 6 puntos consecutivos en tendencia' : 'Rule 3 — 6 consecutive points trending',
          desc: es ? 'Seis puntos seguidos subiendo o bajando indican que el proceso está a la deriva (drift). Busca desgaste de herramienta, temperatura, etc.' : 'Six consecutive points going up or down indicate process drift. Look for tool wear, temperature changes, etc.'
        },
        {
          num: '4', color: P.purple,
          title: es ? 'Regla 4 — 8 puntos consecutivos en el mismo lado' : 'Rule 4 — 8 consecutive points on the same side',
          desc: es ? 'Ocho puntos seguidos al mismo lado de la línea central indican un cambio sostenido en el nivel del proceso (shift). El proceso se desplazó.' : 'Eight consecutive points on the same side of the center line indicate a sustained shift in process level. The process has shifted.'
        },
      ];
      const weW = (W - PAD * 2 - 48) / 2;
      weRules.forEach((rule, i) => {
        const wx = PAD + (i % 2) * (weW + 16), wy = Y + Math.floor(i / 2) * 120;
        rr(wx, wy, weW, 110, 12, isDark ? `rgba(255,255,255,0.04)` : 'rgba(255,255,255,0.7)', rule.color, 1.5);
        rr(wx, wy, 4, 110, [2, 0, 0, 2], rule.color, null);
        // Number badge
        rr(wx + 14, wy + 14, 30, 30, 15, rule.color, null);
        txt(rule.num, wx + 29, wy + 34, '800 17px system-ui,sans-serif', isDark ? '#050d2a' : '#fff', 'center');
        txt(rule.title, wx + 54, wy + 32, '700 18px system-ui,sans-serif', P.text, 'left', weW - 70);
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const ls = _wrapText(c, rule.desc, weW - 60, '400 16px system-ui,sans-serif');
        ls.forEach((l, j) => c.fillText(l, wx + 54, wy + 56 + j * 20, weW - 70));
      });
      Y += 240 + VGAP;

      // ══════════════════════════════
      //  SECTION 6 — Cp vs Cpk VISUAL
      // ══════════════════════════════
      sectionTitle(es ? '⑥ DIFERENCIA ENTRE Cp y Cpk' : '⑥ DIFFERENCE BETWEEN Cp and Cpk',
        es ? 'Por qué ambos importan' : 'Why both matter', PAD, Y, W - PAD * 2, '79,195,247');
      Y += 56 + 16;

      const diffW = (W - PAD * 2 - 24) / 2;
      // LEFT: Cp=Cpk (centered)
      rr(PAD, Y, diffW, 200, 12, P.surface, P.border, 1.5);
      _drawGuideDistComp(c, PAD, Y, diffW, 200, P, isDark, true, es);
      // RIGHT: Cp>Cpk (off-center)
      rr(PAD + diffW + 24, Y, diffW, 200, 12, P.surface, P.border, 1.5);
      _drawGuideDistComp(c, PAD + diffW + 24, Y, diffW, 200, P, isDark, false, es);
      Y += 200 + VGAP;

      // ══════════════════════════════
      //  SECTION 7 — QUICK REFERENCE TABLE
      // ══════════════════════════════
      sectionTitle(es ? '⑦ TABLA DE REFERENCIA RÁPIDA' : '⑦ QUICK REFERENCE TABLE',
        es ? 'Todos los índices de un vistazo' : 'All indices at a glance', PAD, Y, W - PAD * 2, '0,229,255');
      Y += 56 + 16;

      const refRows = es ? [
        ['Índice', 'Fórmula base', 'Usa σ', '¿Qué mide?', 'Meta mínima'],
        ['Cp', '(USL-LSL) / 6σ_within', 'Within', 'Capacidad potencial (espacio disponible)', '≥ 1.33'],
        ['Cpk', 'min(Cpu,Cpl)', 'Within', 'Capacidad real (centrado + variación)', '≥ 1.33'],
        ['Cpu', '(USL-x̄) / 3σ_within', 'Within', 'Capacidad hacia el límite superior', '≥ 1.00'],
        ['Cpl', '(x̄-LSL) / 3σ_within', 'Within', 'Capacidad hacia el límite inferior', '≥ 1.00'],
        ['Cpm', '(USL-LSL) / 6τ', 'Overall', 'Centrado respecto al Target (Taguchi)', '≥ 1.33'],
        ['Pp', '(USL-LSL) / 6σ_overall', 'Overall', 'Desempeño potencial (largo plazo)', '≥ 1.33'],
        ['Ppk', 'min(Ppu,Ppl)', 'Overall', 'Desempeño real (largo plazo)', '≥ 1.33'],
      ] : [
        ['Index', 'Base Formula', 'Uses σ', 'What it measures', 'Min. target'],
        ['Cp', '(USL-LSL) / 6σ_within', 'Within', 'Potential capability (available space)', '≥ 1.33'],
        ['Cpk', 'min(Cpu,Cpl)', 'Within', 'Real capability (centering + variation)', '≥ 1.33'],
        ['Cpu', '(USL-x̄) / 3σ_within', 'Within', 'Capability toward upper limit', '≥ 1.00'],
        ['Cpl', '(x̄-LSL) / 3σ_within', 'Within', 'Capability toward lower limit', '≥ 1.00'],
        ['Cpm', '(USL-LSL) / 6τ', 'Overall', 'Centering vs Target (Taguchi)', '≥ 1.33'],
        ['Pp', '(USL-LSL) / 6σ_overall', 'Overall', 'Potential performance (long term)', '≥ 1.33'],
        ['Ppk', 'min(Ppu,Ppl)', 'Overall', 'Real performance (long term)', '≥ 1.33'],
      ];

      const tW = W - PAD * 2, rowH = 44;
      const cols = [120, 320, 120, 700, 160];
      refRows.forEach((row, ri) => {
        const ry = Y + ri * rowH;
        if (ri % 2 === 1) rr(PAD, ry, tW, rowH, 0, isDark ? 'rgba(255,255,255,0.025)' : 'rgba(30,60,120,0.03)', null);
        if (ri === 0) {
          rr(PAD, ry, tW, rowH, 0, isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,103,187,0.06)', null);
          hl(PAD, PAD + tW, ry + rowH, P.border, 1.5);
        }
        let cx2 = PAD + 12;
        row.forEach((cell, ci) => {
          const font = ri === 0 ? '700 17px ui-monospace,monospace' : '400 17px ui-monospace,monospace';
          const color2 = ri === 0 ? P.accent : ci === 0 ? P.accent : ci === 4 ? P.green : P.textSub;
          txt(cell, cx2, ry + rowH / 2 + 6, font, color2, 'left', cols[ci] - 8);
          cx2 += cols[ci];
        });
        hl(PAD, PAD + tW, ry + rowH, P.borderLight, 1);
      });
      Y += refRows.length * rowH + VGAP;

      // ══════════════════════════════
      //  SECTION 8 — RUN CHART
      // ══════════════════════════════
      sectionTitle(es ? '⑧ GRÁFICA DE CORRIDA (RUN CHART)' : '⑧ RUN CHART',
        es ? '¿Los datos muestran tendencias o patrones en el tiempo?' : 'Do the data show trends or patterns over time?', PAD, Y, W - PAD * 2, '167,139,250');
      Y += 56 + 16;

      const rcW = 760, rcH = 220;
      rr(PAD, Y, rcW, rcH, 12, P.surface, P.border, 1.5);
      _drawGuideRunChart(c, PAD, Y, rcW, rcH, P, isDark, es);
      const rcAnnX = PAD + rcW + 28, rcAnnW = W - PAD * 2 - rcW - 28;
      let rcAnnY = Y;
      const rcItems = [
        { color: P.green, text: es ? 'PUNTOS VERDES = Por encima de la mediana. Valores superiores al valor central del proceso.' : 'GREEN POINTS = Above median. Values higher than the process center.' },
        { color: P.red, text: es ? 'PUNTOS ROJOS = Por debajo de la mediana. Valores inferiores al valor central del proceso.' : 'RED POINTS = Below median. Values below the process center.' },
        { color: P.yellow, text: es ? 'LÍNEA AMARILLA = Mediana (Md). Separa la mitad superior de la inferior. Más robusta que la media ante outliers.' : 'YELLOW LINE = Median (Md). Splits the upper half from the lower. More robust than the mean against outliers.' },
        { color: P.purple || P.accent2, text: es ? 'RACHAS = Secuencias de puntos en el mismo lado. Pocas rachas indican tendencia o patrón. Muchas indican alta variabilidad.' : 'RUNS = Sequences of points on the same side. Few runs indicate a trend or pattern. Many indicate high variability.' },
      ];
      rcItems.forEach(item => {
        rr(rcAnnX, rcAnnY, rcAnnW, 62, 10, P.surface, P.borderLight, 1);
        rr(rcAnnX, rcAnnY, 4, 62, [2, 0, 0, 2], item.color, null);
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const ls = _wrapText(c, item.text, rcAnnW - 20, '400 16px system-ui,sans-serif');
        ls.forEach((l, i) => c.fillText(l, rcAnnX + 16, rcAnnY + 18 + i * 20));
        rcAnnY += 70;
      });
      Y += Math.max(rcH, rcAnnY - Y) + VGAP;

      // Runs test callout box
      Y += callout('📊', es ? '¿Cuántas rachas son "normales"?' : 'How many runs are "normal"?',
        es ? 'Para n datos, el número esperado de rachas aleatorias es aproximadamente (2n−1)/3. Si hay muy pocas rachas (tendencias largas), el proceso puede tener drift. Si hay demasiadas, puede haber sobre-ajuste o alternancia sistemática.'
          : 'For n data points, the expected number of random runs is approximately (2n−1)/3. Too few runs (long trends) may indicate process drift. Too many may indicate over-adjustment or systematic alternation.',
        PAD, Y, W - PAD * 2, P.purple || P.accent2, isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.06)', isDark ? 'rgba(167,139,250,0.25)' : 'rgba(124,58,237,0.22)');

      // ══════════════════════════════
      //  SECTION 9 — NORMAL PROBABILITY PLOT
      // ══════════════════════════════
      sectionTitle(es ? '⑨ PROBABILIDAD NORMAL (Q-Q PLOT)' : '⑨ NORMAL PROBABILITY PLOT (Q-Q)',
        es ? '¿Siguen tus datos una distribución normal?' : 'Do your data follow a normal distribution?', PAD, Y, W - PAD * 2, '251,146,60');
      Y += 56 + 16;

      const qqW = 760, qqH = 260;
      rr(PAD, Y, qqW, qqH, 12, P.surface, P.border, 1.5);
      _drawGuideQQPlot(c, PAD, Y, qqW, qqH, P, isDark, es);
      const qqAnnX = PAD + qqW + 28, qqAnnW = W - PAD * 2 - qqW - 28;
      let qqAnnY = Y;
      const qqItems = [
        { color: P.green, text: es ? 'LÍNEA VERDE = Distribución normal teórica. Si tus datos la siguen, el proceso es normal.' : 'GREEN LINE = Theoretical normal distribution. If your data follow it, the process is normal.' },
        { color: P.green, text: es ? 'PUNTOS VERDES = Datos con comportamiento normal. Idealmente todos deben caer sobre la línea.' : 'GREEN POINTS = Normally behaving data. Ideally all points should land on the line.' },
        { color: P.yellow, text: es ? 'PUNTOS AMARILLOS = Leve desviación de la normalidad. Monitorear.' : 'YELLOW POINTS = Slight deviation from normality. Monitor.' },
        { color: P.red, text: es ? 'PUNTOS ROJOS = Desviación significativa. Colas pesadas o outliers. Cpk puede no ser válido.' : 'RED POINTS = Significant deviation. Heavy tails or outliers. Cpk may not be valid.' },
      ];
      qqItems.forEach(item => {
        rr(qqAnnX, qqAnnY, qqAnnW, 62, 10, P.surface, P.borderLight, 1);
        rr(qqAnnX, qqAnnY, 4, 62, [2, 0, 0, 2], item.color, null);
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const ls = _wrapText(c, item.text, qqAnnW - 20, '400 16px system-ui,sans-serif');
        ls.forEach((l, i) => c.fillText(l, qqAnnX + 16, qqAnnY + 18 + i * 20));
        qqAnnY += 70;
      });
      Y += Math.max(qqH, qqAnnY - Y) + VGAP;

      Y += callout('🔔', es ? 'Anderson-Darling — ¿cómo interpretar la p-value?' : 'Anderson-Darling — how to interpret the p-value?',
        es ? 'El test Anderson-Darling verifica si tus datos provienen de una distribución normal. Si p ≥ 0.05: sin evidencia de no-normalidad (Cpk válido). Si p < 0.05: posible no-normalidad — considera transformación Box-Cox o análisis no-paramétrico.'
          : 'The Anderson-Darling test checks whether your data come from a normal distribution. If p ≥ 0.05: no evidence of non-normality (Cpk is valid). If p < 0.05: possible non-normality — consider Box-Cox transformation or non-parametric analysis.',
        PAD, Y, W - PAD * 2, P.orange || P.yellow, isDark ? 'rgba(251,146,60,0.08)' : 'rgba(194,65,12,0.06)', isDark ? 'rgba(251,146,60,0.25)' : 'rgba(194,65,12,0.22)');

      // ══════════════════════════════
      //  SECTION 10 — BOX PLOT
      // ══════════════════════════════
      sectionTitle(es ? '⑩ DIAGRAMA DE CAJA (BOX PLOT)' : '⑩ BOX PLOT',
        es ? 'Detecta outliers y visualiza la distribución de tus datos' : 'Detect outliers and visualize your data distribution', PAD, Y, W - PAD * 2, '139,92,246');
      Y += 56 + 16;

      const boxW = 760, boxH = 280;
      rr(PAD, Y, boxW, boxH, 12, P.surface, P.border, 1.5);
      _drawGuideBoxPlot(c, PAD, Y, boxW, boxH, P, isDark, es);
      const boxAnnX = PAD + boxW + 28, boxAnnW = W - PAD * 2 - boxW - 28;
      let boxAnnY = Y;
      const boxItems = [
        { color: isDark ? '#8b5cf6' : '#6d28d9', text: es ? 'CAJA (BOX) = Rango intercuartílico (IQR = Q3 - Q1). Contiene el 50% central de los datos.' : 'BOX = Interquartile range (IQR = Q3 - Q1). Contains the middle 50% of data.' },
        { color: isDark ? '#fbbf24' : '#f59e0b', text: es ? 'LÍNEA AMARILLA = Mediana (Q2). Divide los datos en dos mitades iguales.' : 'YELLOW LINE = Median (Q2). Divides data into two equal halves.' },
        { color: isDark ? '#06b6d4' : '#0891b2', text: es ? 'PUNTO CYAN = Media (x̄). Compara con mediana para detectar asimetría.' : 'CYAN POINT = Mean (x̄). Compare with median to detect skewness.' },
        { color: P.red, text: es ? 'PUNTOS ROJOS = Outliers (valores >1.5×IQR fuera de Q1/Q3). Investigar causas especiales.' : 'RED POINTS = Outliers (values >1.5×IQR outside Q1/Q3). Investigate special causes.' },
      ];
      boxItems.forEach(item => {
        rr(boxAnnX, boxAnnY, boxAnnW, 68, 10, P.surface, P.borderLight, 1);
        rr(boxAnnX, boxAnnY, 4, 68, [2, 0, 0, 2], item.color, null);
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const ls = _wrapText(c, item.text, boxAnnW - 20, '400 16px system-ui,sans-serif');
        ls.forEach((l, i) => c.fillText(l, boxAnnX + 16, boxAnnY + 18 + i * 20));
        boxAnnY += 76;
      });
      Y += Math.max(boxH, boxAnnY - Y) + VGAP;

      Y += callout('⚠️', es ? 'Outliers — ¿removerlos o investigarlos?' : 'Outliers — remove or investigate?',
        es ? 'NUNCA remuevas outliers sin investigar. Pueden indicar: (1) Errores de medición → corregir; (2) Causas especiales del proceso → eliminar la causa raíz; (3) Variación natural extrema → aceptar si no hay causa asignable. Documentar siempre la decisión.'
          : 'NEVER remove outliers without investigation. They may indicate: (1) Measurement errors → correct; (2) Process special causes → eliminate root cause; (3) Natural extreme variation → accept if no assignable cause. Always document the decision.',
        PAD, Y, W - PAD * 2, P.red, isDark ? 'rgba(239,68,68,0.08)' : 'rgba(220,38,38,0.06)', isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.22)');

      // ══════════════════════════════
      //  FOOTER
      // ══════════════════════════════
      Y += 16;
      hl(PAD, W - PAD, Y, P.borderLight, 1);
      Y += 20;
      txt('CapaFlow — capaflow.app', PAD, Y + 20, '700 18px ui-monospace,monospace', P.textDim, 'left');
      txt(es ? 'Esta guía es un resumen educativo basado en la metodología Six Sigma. Para análisis críticos consulta a un Black Belt certificado.' : 'This guide is an educational summary based on Six Sigma methodology. For critical analyses, consult a certified Black Belt.',
        W / 2, Y + 20, '400 16px ui-monospace,monospace', P.textDim, 'center', W - PAD * 2 - 200);
      const now = new Date().toLocaleDateString(es ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      txt(now, W - PAD, Y + 20, '400 16px ui-monospace,monospace', P.textDim, 'right');

      // ── RECORTAR CANVAS A ALTURA REAL ──
      Y += 60; // Padding final
      const finalHeight = Math.min(Y, H);
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = W;
      finalCanvas.height = finalHeight;
      const finalCtx = finalCanvas.getContext('2d');
      // Copiar área específica del canvas original (de 0,0 hasta W,finalHeight)
      finalCtx.drawImage(cv, 0, 0, W, finalHeight, 0, 0, W, finalHeight);

      // ── DOWNLOAD ──
      const link = document.createElement('a');
      link.download = `CapaFlow_${es ? 'Guia_Lectura' : 'Reading_Guide'}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = finalCanvas.toDataURL('image/png', 1.0);
      link.click();
      showToast(es ? '¡Guía descargada!' : 'Guide downloaded!');
    }
```

**Reading-guide run-chart demonstration — verbatim source [L7973–8014].**

```javascript
    function _drawGuideRunChart(c, ox2, oy2, W2, H2, P, isDark, es) {
      const pad = { t: 28, r: 20, b: 32, l: 50 };
      const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b;
      // Demo data with a drift trend
      const pts = [10.0, 10.1, 9.95, 10.15, 10.3, 10.4, 10.25, 10.5, 10.35, 10.6, 10.55, 10.7, 10.4, 10.65, 10.8, 10.6, 10.75, 10.9, 10.8, 11.0];
      const N = pts.length, med = 10.475;
      const yMin = 9.7, yMax = 11.2;
      const toX = i => ox2 + pad.l + (i / (N - 1)) * pW;
      const toY = v => oy2 + pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const medY = toY(med);

      // Bands
      c.fillStyle = isDark ? 'rgba(74,222,128,0.05)' : 'rgba(22,163,74,0.04)'; c.fillRect(ox2 + pad.l, oy2 + pad.t, pW, Math.max(0, medY - oy2 - pad.t));
      c.fillStyle = isDark ? 'rgba(248,113,113,0.05)' : 'rgba(220,38,38,0.04)'; c.fillRect(ox2 + pad.l, medY, pW, Math.max(0, oy2 + pad.t + pH - medY));

      // Median
      c.beginPath(); c.setLineDash([6, 4]); c.moveTo(ox2 + pad.l, medY); c.lineTo(ox2 + pad.l + pW, medY);
      c.strokeStyle = P.yellow; c.lineWidth = 2.5; c.shadowColor = P.yellow; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0; c.setLineDash([]);
      c.font = 'bold 13px ui-monospace,monospace'; c.fillStyle = P.yellow; c.textAlign = 'right';
      c.fillText('Md=' + med.toFixed(2), ox2 + pad.l - 5, medY + 4);

      // Data line
      for (let i = 1; i < N; i++) {
        c.beginPath(); c.moveTo(toX(i - 1), toY(pts[i - 1])); c.lineTo(toX(i), toY(pts[i]));
        c.strokeStyle = pts[i - 1] >= med ? (isDark ? 'rgba(74,222,128,0.7)' : 'rgba(22,163,74,0.75)') : (isDark ? 'rgba(248,113,113,0.7)' : 'rgba(220,38,38,0.75)');
        c.lineWidth = 2; c.stroke();
      }

      // Points
      pts.forEach((p, i) => {
        c.beginPath(); c.arc(toX(i), toY(p), 4.5, 0, Math.PI * 2);
        c.fillStyle = p >= med ? (isDark ? '#4ade80' : 'rgba(22,163,74,0.9)') : (isDark ? '#f87171' : 'rgba(220,38,38,0.9)'); c.fill();
      });

      // Trend arrow
      const ax0 = toX(2), ax1 = toX(N - 2), ay = oy2 + pad.t + 12;
      c.beginPath(); c.moveTo(ax0, ay); c.lineTo(ax1, ay);
      c.strokeStyle = P.red; c.lineWidth = 2; c.setLineDash([4, 3]); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.moveTo(ax1 - 10, ay - 5); c.lineTo(ax1, ay); c.lineTo(ax1 - 10, ay + 5); c.strokeStyle = P.red; c.lineWidth = 2; c.stroke();
      c.font = 'bold 13px system-ui,sans-serif'; c.fillStyle = P.red; c.textAlign = 'center';
      c.fillText(es ? 'TENDENCIA (DRIFT) ⚠' : 'DRIFT TREND ⚠', (ax0 + ax1) / 2, ay - 6);
    }
```

**Reading-guide Q-Q demonstration — verbatim source [L8017–8080].**

```javascript
    function _drawGuideQQPlot(c, ox2, oy2, W2, H2, P, isDark, es) {
      const pad = { t: 30, r: 20, b: 40, l: 55 };
      const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b;
      // 3 groups of points: normal (on line), slight deviation, strong outliers
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

      // Grid
      for (let g = 1; g < 5; g++) {
        const gy = oy2 + pad.t + (g / 5) * pH; c.beginPath(); c.moveTo(ox2 + pad.l, gy); c.lineTo(ox2 + pad.l + pW, gy); c.strokeStyle = P.borderLight; c.lineWidth = 1; c.stroke();
        const gx = ox2 + pad.l + (g / 5) * pW; c.beginPath(); c.moveTo(gx, oy2 + pad.t); c.lineTo(gx, oy2 + pad.t + pH); c.stroke();
      }

      // Reference line — INTERCAMBIADO
      c.beginPath(); c.setLineDash([7, 5]);
      c.moveTo(toX(xMin - xPad), toY(xMin - xPad)); c.lineTo(toX(xMax + xPad), toY(xMax + xPad));
      c.strokeStyle = isDark ? 'rgba(74,222,128,0.8)' : 'rgba(22,163,74,0.8)'; c.lineWidth = 2.5;
      c.shadowColor = c.strokeStyle; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0; c.setLineDash([]);
      // Label line
      c.font = 'bold 13px ui-monospace,monospace'; c.fillStyle = isDark ? 'rgba(74,222,128,0.8)' : 'rgba(22,163,74,0.8)'; c.textAlign = 'left';
      c.fillText(es ? 'Línea Normal' : 'Normal Line', ox2 + pad.l + pW * 0.4, oy2 + pad.t + 22);

      // Points with color coding — INTERCAMBIADO
      demoData.forEach((p, i) => {
        const x = toX(p.obs), y = toY(p.th), yId = toY(p.obs);
        const dev = Math.abs(y - yId), maxDev = pH * 0.22, t2 = Math.min(dev / maxDev, 1);
        let col;
        if (t2 < 0.4) col = isDark ? 'rgba(74,222,128,0.9)' : 'rgba(22,163,74,0.85)';
        else if (t2 < 0.75) col = isDark ? 'rgba(251,191,36,0.9)' : 'rgba(180,83,9,0.85)';
        else col = isDark ? 'rgba(248,113,113,0.9)' : 'rgba(220,38,38,0.85)';
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 5; c.fill(); c.shadowBlur = 0;
      });

      // Axis labels — INTERCAMBIADOS
      c.font = '12px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center';
      c.fillText(es ? 'Datos Obs. →' : 'Observed →', ox2 + pad.l + pW / 2, oy2 + pad.t + pH + 28);
      c.save(); c.translate(ox2 + pad.l - 38, oy2 + pad.t + pH / 2); c.rotate(-Math.PI / 2);
      c.fillText(es ? 'Cuantiles Teóricos' : 'Theoretical Quantiles', 0, 0); c.restore();

      // Annotation: tail deviation callout — INTERCAMBIADO
      const outlierX = toX(demoData[demoN - 1].obs), outlierY = toY(demoData[demoN - 1].th);
      c.beginPath(); c.moveTo(outlierX, outlierY); c.lineTo(outlierX + 40, outlierY - 30);
      c.strokeStyle = P.red; c.lineWidth = 1.5; c.stroke();
      c.font = 'bold 13px system-ui,sans-serif'; c.fillStyle = P.red; c.textAlign = 'left';
      c.fillText(es ? 'Cola pesada' : 'Heavy tail', outlierX + 44, outlierY - 26);
    }
```

**Reading-guide box-plot demonstration — verbatim source [L8083–8137].**

```javascript
    function _drawGuideBoxPlot(c, ox2, oy2, W2, H2, P, isDark, es) {
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
      
      const drawSection = (yTop, label) => {
        const centerY = yTop + sectionH / 2, boxH = sectionH * 0.35;
        c.font = 'bold 14px ui-monospace,monospace'; c.fillStyle = P.text; c.textAlign = 'center';
        c.fillText(label, ox2 + pad.l / 2, centerY + 5);
        c.strokeStyle = P.borderLight; c.lineWidth = 0.8;
        for (let g = 0; g <= 4; g++) { const x = ox2 + pad.l + (g / 4) * plotW; c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, yTop + sectionH); c.stroke(); }
        [{ v: lsl, lbl: 'LSL' }, { v: usl, lbl: 'USL' }].forEach(sp => {
          const sx = toX(sp.v); c.beginPath(); c.moveTo(sx, yTop + 4); c.lineTo(sx, yTop + sectionH - 4);
          c.strokeStyle = P.red; c.lineWidth = 2; c.stroke();
        });
        const q1X = toX(Q1), q2X = toX(Q2), q3X = toX(Q3), minX = toX(minWhisker), maxX = toX(maxWhisker);
        c.beginPath(); c.moveTo(minX, centerY); c.lineTo(q1X, centerY);
        c.strokeStyle = isDark ? 'rgba(139,92,246,0.75)' : 'rgba(109,40,217,0.75)'; c.lineWidth = 2; c.stroke();
        c.beginPath(); c.moveTo(minX, centerY - boxH / 6); c.lineTo(minX, centerY + boxH / 6); c.stroke();
        c.beginPath(); c.moveTo(q3X, centerY); c.lineTo(maxX, centerY); c.stroke();
        c.beginPath(); c.moveTo(maxX, centerY - boxH / 6); c.lineTo(maxX, centerY + boxH / 6); c.stroke();
        const boxWidth = q3X - q1X, gradient = c.createLinearGradient(q1X, 0, q3X, 0);
        if (isDark) { gradient.addColorStop(0, 'rgba(139,92,246,0.5)'); gradient.addColorStop(1, 'rgba(139,92,246,0.2)'); }
        else { gradient.addColorStop(0, 'rgba(109,40,217,0.4)'); gradient.addColorStop(1, 'rgba(109,40,217,0.15)'); }
        c.fillStyle = gradient; c.fillRect(q1X, centerY - boxH / 2, boxWidth, boxH);
        c.strokeStyle = isDark ? 'rgba(139,92,246,0.95)' : 'rgba(109,40,217,0.95)'; c.lineWidth = 2; c.strokeRect(q1X, centerY - boxH / 2, boxWidth, boxH);
        c.beginPath(); c.moveTo(q2X, centerY - boxH / 2); c.lineTo(q2X, centerY + boxH / 2);
        c.strokeStyle = isDark ? '#fbbf24' : '#f59e0b'; c.lineWidth = 2.5; c.stroke();
        const meanX = toX(mean); c.beginPath(); c.arc(meanX, centerY, 4, 0, Math.PI * 2);
        c.fillStyle = isDark ? '#06b6d4' : '#0891b2'; c.fill();
        outliers.forEach(v => { const ox = toX(v); c.beginPath(); c.arc(ox, centerY, 5, 0, Math.PI * 2); c.fillStyle = P.red; c.fill(); });
      };
      
      drawSection(oy2 + pad.t, 'Overall');
      drawSection(oy2 + pad.t + sectionH + gap, 'Within');
      drawSection(oy2 + pad.t + (sectionH + gap) * 2, 'Specs');
      
      c.strokeStyle = P.textDim; c.lineWidth = 1; c.beginPath(); c.moveTo(ox2 + pad.l, oy2 + H2 - pad.b); c.lineTo(ox2 + W2 - pad.r, oy2 + H2 - pad.b); c.stroke();
      c.font = '11px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center';
      for (let g = 0; g <= 4; g++) { const v = xMin + (g / 4) * (xMax - xMin); c.fillText(v.toFixed(1), ox2 + pad.l + (g / 4) * plotW, oy2 + H2 - pad.b + 14); }
      c.fillStyle = P.red; c.font = 'bold 11px ui-monospace,monospace';
      c.fillText('LSL', toX(lsl), oy2 + H2 - pad.b + 26);
      c.fillText('USL', toX(usl), oy2 + H2 - pad.b + 26);
    }
```

**Text-wrapping helper — verbatim source [L8140–8150].**

```javascript
    function _wrapText(ctx, text, maxW, font) {
      ctx.font = font;
      const words = text.split(' '); const lines = []; let cur = '';
      words.forEach(w => {
        const test = cur + (cur ? ' ' : '') + w;
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
        else cur = test;
      });
      if (cur) lines.push(cur);
      return lines;
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 20/24. Continue: [capaflow-inventory-section-21-of-24.md](capaflow-inventory-section-21-of-24.md).

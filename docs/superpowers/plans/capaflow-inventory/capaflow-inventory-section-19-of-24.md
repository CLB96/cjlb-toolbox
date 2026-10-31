# CapaFlow inventory — section 19 of 24

**Original inventory lines:** 7162–7546 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-18-of-24.md](capaflow-inventory-section-18-of-24.md). **Next:** [capaflow-inventory-section-20-of-24.md](capaflow-inventory-section-20-of-24.md).

**CODE CONTINUATION A/2 — `_drawGuide()`**: this function alone exceeds the 500-line file limit; this excerpt ends after the complete PPM section and continues in [capaflow-inventory-section-20-of-24.md](capaflow-inventory-section-20-of-24.md). The Markdown fence is closed only for readable presentation; the function is not complete here.

<!-- ORIGINAL-CONTENT-BEGIN -->
**PNG report control chart — verbatim source [L7328–7453].**

```javascript
    function _pngCCChart(c, cardX, cardY, cardW, cardH, pts, cl, ucl, lcl, sigma, violIdx, chartLabel, oocCount, P, isDark, isTop) {
      const PAD_L = 72, PAD_R = 100, PAD_T = 46, PAD_B = 44;
      const pW = cardW - PAD_L - PAD_R, pH = cardH - PAD_T - PAD_B;
      const ox = cardX + PAD_L, oy = cardY + PAD_T;

      // Self-contained helpers
      const _rr = (x, y, w, h, r, fill, stroke, sw = 1.5) => {
        c.beginPath(); c.roundRect(x, y, w, h, r);
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); }
      };

      const validPts = pts.map((v, i) => ({ v, i })).filter(p => p.v !== null);
      if (validPts.length < 2) return;
      const vals = validPts.map(p => p.v);

      // Y range with safe fallbacks
      const safeUCL = isFinite(ucl) ? ucl : cl * 2;
      const safeLCL = isFinite(lcl) ? lcl : 0;
      const allV = [...vals, safeUCL, safeLCL > 0 ? safeLCL : 0];
      let yMin = Math.min(...allV), yMax = Math.max(...allV);
      const yPad = (yMax - yMin) * 0.18 || Math.abs(cl) * 0.1 || 0.001;
      yMin -= yPad; yMax += yPad;

      const toY = v => oy + pH - ((v - yMin) / (yMax - yMin)) * pH;
      const toX = i => ox + (i / (Math.max(validPts.length - 1, 1))) * pW;

      // Chart title + OOC badge
      c.font = '600 20px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left';
      c.fillText(chartLabel, cardX + PAD_L, cardY + 28);
      const badgeText = oocCount > 0 ? `⚠ ${oocCount} ${t('png.ccOOC')}` : `✓ ${t('png.ccInControl')}`;
      const badgeColor = oocCount > 0 ? P.red : P.green;
      const badgeBg = oocCount > 0 ? P.redBg : P.greenBg;
      const badgeBd = oocCount > 0 ? P.redBorder : P.greenBorder;
      c.font = '500 17px ui-monospace,monospace';
      const labelW = c.measureText(chartLabel).width;
      const bw = c.measureText(badgeText).width + 28;
      _rr(cardX + PAD_L + labelW + 16, cardY + 12, bw, 24, 12, badgeBg, badgeBd, 1.5);
      c.fillStyle = badgeColor; c.textAlign = 'left';
      c.fillText(badgeText, cardX + PAD_L + labelW + 30, cardY + 28);

      // Grid lines
      for (let g = 0; g <= 4; g++) {
        const gy = oy + (g / 4) * pH;
        c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy);
        c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke();
      }

      // ±2σ warning zones
      const sigmaForZone = sigma > 0 ? sigma : (yMax - yMin) / 6;
      const u2 = toY(cl + 2 * sigmaForZone), u3 = toY(safeUCL);
      const l2 = toY(cl - 2 * sigmaForZone), l3 = toY(safeLCL > yMin ? safeLCL : yMin + 0.001);
      c.fillStyle = isDark ? 'rgba(251,191,36,0.06)' : 'rgba(180,83,9,0.04)';
      if (u3 < u2) c.fillRect(ox, u3, pW, Math.max(0, u2 - u3));
      if (l2 < l3) c.fillRect(ox, l2, pW, Math.max(0, l3 - l2));

      // Control limit lines
      const hLn = (y, col, dash, lw) => {
        if (!isFinite(y) || y < oy - 10 || y > oy + pH + 10) return;
        c.beginPath(); c.setLineDash(dash); c.moveTo(ox, y); c.lineTo(ox + pW, y);
        c.strokeStyle = col; c.lineWidth = lw; c.stroke(); c.setLineDash([]);
      };
      hLn(toY(safeUCL), P.red, [8, 6], 2.5);
      if (safeLCL > yMin) hLn(toY(safeLCL), P.red, [8, 6], 2.5);
      hLn(toY(cl + 2 * sigmaForZone), isDark ? 'rgba(251,191,36,0.5)' : 'rgba(180,83,9,0.45)', [4, 5], 1.5);
      if (cl - 2 * sigmaForZone > yMin) hLn(toY(cl - 2 * sigmaForZone), isDark ? 'rgba(251,191,36,0.5)' : 'rgba(180,83,9,0.45)', [4, 5], 1.5);
      const clColor = isTop ? (isDark ? 'rgba(0,229,255,0.75)' : 'rgba(0,103,187,0.75)') : (isDark ? 'rgba(79,195,247,0.75)' : 'rgba(33,150,243,0.75)');
      hLn(toY(cl), clColor, [], 2.5);

      // Right-side limit labels
      c.font = 'bold 14px ui-monospace,monospace'; c.textAlign = 'left';
      const uclY2 = toY(safeUCL);
      if (uclY2 > oy && uclY2 < oy + pH) { c.fillStyle = P.red; c.fillText('UCL', ox + pW + 8, uclY2 + 5); }
      const clY2 = toY(cl);
      if (clY2 > oy && clY2 < oy + pH) { c.fillStyle = isTop ? P.accent : P.accent2; c.fillText('CL', ox + pW + 8, clY2 + 5); }
      if (safeLCL > yMin) { const lclY2 = toY(safeLCL); if (lclY2 > oy && lclY2 < oy + pH) { c.fillStyle = P.red; c.fillText('LCL', ox + pW + 8, lclY2 + 5); } }

      // Y axis labels
      c.font = '13px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'right';
      for (let g = 0; g <= 4; g++) {
        const v = yMin + (g / 4) * (yMax - yMin);
        const dp = Math.abs(v) < 1 ? 4 : v < 100 ? 3 : 1;
        c.fillText(v.toFixed(dp), ox - 10, oy + pH - (g / 4) * pH + 5);
      }

      // Data line
      const lineCol = isTop ? clColor : (isDark ? 'rgba(79,195,247,0.85)' : 'rgba(33,150,243,0.85)');
      c.beginPath();
      validPts.forEach((p, i) => { i === 0 ? c.moveTo(toX(i), toY(p.v)) : c.lineTo(toX(i), toY(p.v)); });
      c.strokeStyle = lineCol; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();

      // Data points — violations in red with glow ring
      const vSet = new Set(violIdx);
      validPts.forEach((p, i) => {
        const x = toX(i), y = toY(p.v), isV = vSet.has(i);
        c.beginPath(); c.arc(x, y, isV ? 6 : 4, 0, Math.PI * 2);
        if (isV) {
          c.fillStyle = P.red; c.shadowColor = P.red; c.shadowBlur = 14; c.fill(); c.shadowBlur = 0;
          c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2);
          c.strokeStyle = isDark ? 'rgba(248,113,113,0.4)' : 'rgba(220,38,38,0.4)'; c.lineWidth = 1.5; c.stroke();
        } else {
          c.fillStyle = lineCol; c.fill();
        }
      });

      // X axis subgroup numbers
      c.font = '13px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center';
      const step = Math.max(1, Math.ceil(validPts.length / 16));
      validPts.forEach((p, i) => {
        if (i % step === 0 || i === validPts.length - 1) c.fillText(String(i + 1), toX(i), oy + pH + 28);
      });

      // Legend row at bottom
      const legY = oy + pH + 40;
      const dot = (x, y, col) => { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.fill(); };
      const dash2 = (x, y, col, dd) => {
        c.beginPath(); c.setLineDash(dd); c.moveTo(x, y); c.lineTo(x + 22, y);
        c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
      };
      c.font = '13px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'left';
      dot(ox + 10, legY, lineCol); c.fillText(t('cc.cl'), ox + 20, legY + 5);
      dash2(ox + 70, legY, P.red, [6, 4]); c.fillText('UCL/LCL', ox + 98, legY + 5);
      dash2(ox + 185, legY, isDark ? 'rgba(251,191,36,0.65)' : 'rgba(180,83,9,0.65)', [4, 3]);
      c.fillText('±2σ', ox + 213, legY + 5);
      dot(ox + 270, legY, P.red); c.fillText(t('png.ccOOC'), ox + 280, legY + 5);
    }
```

**Reading-guide entry point — verbatim source [L7459–7464].**

```javascript
    function generateReadingGuide() {
      showToast(currentLang === 'es' ? 'Generando guía...' : 'Generating guide...', 4000);
      setTimeout(() => {
        try { _drawGuide(); } catch (e) { console.error(e); }
      }, 80);
    }
```

**Reading-guide full composition/prose/layout/export — verbatim source [L7466–7970].**

```javascript
    function _drawGuide() {
      const es = currentLang === 'es';
      const isDark = currentTheme === 'dark';

      const W = 1600, H = 6000;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');

      // ── PALETTE ──
      const P = isDark ? {
        bg: '#050d2a', bg2: '#0b1840', surface: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.11)', borderLight: 'rgba(255,255,255,0.06)',
        text: '#eef2ff', textSub: 'rgba(220,228,255,0.70)', textDim: 'rgba(180,195,255,0.38)',
        accent: '#00E5FF', accent2: '#4FC3F7', green: '#4ade80', yellow: '#fbbf24', red: '#f87171',
        orange: '#fb923c', purple: '#a78bfa',
        greenBg: 'rgba(74,222,128,0.12)', yellowBg: 'rgba(251,191,36,0.12)', redBg: 'rgba(248,113,113,0.12)',
        greenBd: 'rgba(74,222,128,0.35)', yellowBd: 'rgba(251,191,36,0.35)', redBd: 'rgba(248,113,113,0.35)',
      } : {
        bg: '#eef1f7', bg2: '#e4e8f2', surface: 'rgba(255,255,255,0.80)',
        border: 'rgba(30,60,120,0.12)', borderLight: 'rgba(30,60,120,0.06)',
        text: '#1a2340', textSub: '#4a5580', textDim: '#9aa5c0',
        accent: '#0067bb', accent2: '#2196F3', green: '#16a34a', yellow: '#b45309', red: '#dc2626',
        orange: '#c2410c', purple: '#7c3aed',
        greenBg: 'rgba(22,163,74,0.09)', yellowBg: 'rgba(180,83,9,0.09)', redBg: 'rgba(220,38,38,0.09)',
        greenBd: 'rgba(22,163,74,0.30)', yellowBd: 'rgba(180,83,9,0.30)', redBd: 'rgba(220,38,38,0.30)',
      };

      // ── HELPERS ──
      const rr = (x, y, w, h, r2, fill, stroke, sw = 1.5) => {
        c.beginPath(); c.roundRect(x, y, w, h, r2);
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); }
      };
      const hl = (x1, x2, y, col, w = 1) => { c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
      const txt = (s, x, y, font, col, align = 'left', mw = 0) => { c.font = font; c.fillStyle = col; c.textAlign = align; mw ? c.fillText(s, x, y, mw) : c.fillText(s, x, y); };

      function sectionTitle(title, sub, x, y, W2, accent) {
        rr(x, y, W2, 56, 12, isDark ? `rgba(${accent || '0,229,255'},0.06)` : 'rgba(255,255,255,0.7)', isDark ? `rgba(${accent || '0,229,255'},0.15)` : P.border, 1.5);
        rr(x, y, 4, 56, [2, 0, 0, 2], isDark ? `rgba(${accent || '0,229,255'},0.9)` : `rgba(${accent || '0,103,187'},0.9)`, null);
        txt(title, x + 20, y + 26, '700 24px ui-monospace,monospace', P.text, 'left');
        if (sub) txt(sub, x + 20, y + 44, '400 16px ui-monospace,monospace', P.textSub, 'left');
      }

      function badge(lbl, x, y, bgCol, bdCol, txtCol) {
        c.font = '600 15px ui-monospace,monospace';
        const bw = c.measureText(lbl).width + 20;
        rr(x, y, bw, 26, 13, bgCol, bdCol, 1.5);
        txt(lbl, x + bw / 2, y + 18, '600 15px ui-monospace,monospace', txtCol, 'center');
        return bw;
      }

      function callout(icon, headline, body, x, y, w, accentCol, bgCol, bdCol) {
        const lineH = 22, bodyLines = _wrapText(c, body, w - 80, '400 18px system-ui,sans-serif');
        const totalH = 20 + 24 + 8 + bodyLines.length * lineH + 20;
        rr(x, y, w, totalH, 12, bgCol, bdCol, 1.5);
        rr(x, y, 4, totalH, [2, 0, 0, 2], accentCol, null);
        txt(icon, x + 20, y + 32, '26px system-ui,sans-serif', accentCol, 'left');
        txt(headline, x + 50, y + 32, '700 20px system-ui,sans-serif', P.text, 'left');
        c.font = '400 18px system-ui,sans-serif'; c.fillStyle = P.textSub;
        bodyLines.forEach((line, i) => { c.fillText(line, x + 50, y + 58 + i * lineH); });
        return totalH + 12;
      }

      // ── BACKGROUND ──
      c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
      const m1 = c.createRadialGradient(200, 300, 0, 200, 300, 800);
      m1.addColorStop(0, isDark ? 'rgba(0,80,200,0.16)' : 'rgba(100,160,255,0.10)'); m1.addColorStop(1, 'transparent');
      c.fillStyle = m1; c.fillRect(0, 0, W, H);
      const m2 = c.createRadialGradient(W, H * 0.5, 0, W, H * 0.5, 900);
      m2.addColorStop(0, isDark ? 'rgba(0,200,150,0.08)' : 'rgba(60,120,200,0.06)'); m2.addColorStop(1, 'transparent');
      c.fillStyle = m2; c.fillRect(0, 0, W, H);
      // grain
      c.save(); c.globalAlpha = isDark ? 0.02 : 0.01;
      for (let i = 0; i < 6000; i++) { const v = 100 + Math.random() * 155 | 0; c.fillStyle = `rgb(${v},${v},${v + 15})`; c.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1); }
      c.restore();

      const PAD = 56, VGAP = 28;
      let Y = 0;

      // ══════════════════════════════
      //  HEADER
      // ══════════════════════════════
      const hg = c.createLinearGradient(0, 0, W, 120);
      hg.addColorStop(0, isDark ? 'rgba(0,229,255,0.10)' : 'rgba(0,103,187,0.08)'); hg.addColorStop(1, 'transparent');
      c.fillStyle = hg; c.fillRect(0, 0, W, 120);
      hl(0, W, 120, P.border, 1.5);

      // Logo mark
      const lmg = c.createLinearGradient(PAD, 20, PAD + 60, 80);
      lmg.addColorStop(0, P.accent); lmg.addColorStop(1, P.accent2);
      rr(PAD, 20, 60, 60, 14, lmg, null);
      txt('C', PAD + 30, 64, '800 36px system-ui,sans-serif', isDark ? '#050d2a' : '#fff', 'center');
      txt('CapaFlow', PAD + 76, 54, '800 38px system-ui,sans-serif', P.text, 'left');
      txt(es ? 'Análisis de Capacidad de Proceso · Six Sigma' : 'Process Capability Analysis · Six Sigma', PAD + 76, 80, '400 19px ui-monospace,monospace', P.textSub, 'left');

      const guideTitle = es ? 'GUÍA RÁPIDA DE LECTURA' : 'QUICK READING GUIDE';
      txt(guideTitle, W - PAD, 52, '800 28px ui-monospace,monospace', P.accent, 'right');
      txt(es ? 'Cómo interpretar tu análisis Six Sigma' : 'How to interpret your Six Sigma analysis', W - PAD, 78, '400 18px ui-monospace,monospace', P.textSub, 'right');
      Y = 120 + VGAP;

      // ══════════════════════════════
      //  INTRO STRIP
      // ══════════════════════════════
      rr(PAD, Y, W - PAD * 2, 72, 14, isDark ? 'rgba(0,229,255,0.07)' : 'rgba(0,103,187,0.06)', P.border, 1.5);
      txt(es ? 'Este reporte te dice si tu proceso de producción está bajo control y cumple los estándares de calidad. Aquí aprenderás a leer cada sección.' : 'This report tells you whether your production process is in control and meets quality standards. Here you will learn to read each section.',
        PAD + 24, Y + 28, '400 20px system-ui,sans-serif', P.text, 'left', W - PAD * 2 - 48);
      txt(es ? 'No necesitas ser experto — sigue esta guía de arriba a abajo.' : 'No expertise needed — follow this guide from top to bottom.',
        PAD + 24, Y + 52, '400 17px ui-monospace,monospace', P.textSub, 'left');
      Y += 72 + VGAP;

      // ══════════════════════════════
      //  SECTION 1 — THE BIG 3 KPIs
      // ══════════════════════════════
      sectionTitle(es ? '① LOS 3 NÚMEROS CLAVE' : '① THE 3 KEY NUMBERS',
        es ? 'Lo primero que debes mirar' : 'The first thing to look at', PAD, Y, W - PAD * 2, '0,229,255');
      Y += 56 + 16;

      const k3W = (W - PAD * 2 - 32) / 3;
      const kpiDefs = [
        {
          key: 'Cpk', color: '0,229,255',
          name: es ? 'Capacidad Real' : 'Real Capability',
          what: es ? 'Mide qué tan bien CABE la distribución dentro de los límites, considerando si está centrada o no.' : 'Measures how well the distribution FITS within the limits, considering whether it is centered or not.',
          rule: es ? 'Meta mínima: Cpk ≥ 1.33' : 'Minimum target: Cpk ≥ 1.33'
        },
        {
          key: 'Cp', color: '79,195,247',
          name: es ? 'Capacidad Potencial' : 'Potential Capability',
          what: es ? 'Mide el espacio disponible vs el tamaño de la distribución. No considera si está centrada.' : 'Measures available space vs distribution size. Does NOT consider centering.',
          rule: es ? 'Si Cp >> Cpk: el proceso no está centrado' : 'If Cp >> Cpk: process is off-center'
        },
        {
          key: 'Ppk', color: '105,240,174',
          name: es ? 'Desempeño Real' : 'Real Performance',
          what: es ? 'Como Cpk pero usa la variación TOTAL histórica (largo plazo). Incluye todas las fuentes de variación.' : 'Like Cpk but uses TOTAL historical variation (long term). Includes all sources of variation.',
          rule: es ? 'Si Ppk << Cpk: hay variación entre turnos/lotes' : 'If Ppk << Cpk: variation between shifts/batches'
        },
      ];

      kpiDefs.forEach((k, i) => {
        const kx = PAD + i * (k3W + 16), ky = Y;
        rr(kx, ky, k3W, 220, 16, P.surface, `rgba(${k.color},0.20)`, 2);
        // top stripe
        rr(kx, ky, k3W, 5, [2, 2, 0, 0], `rgba(${k.color},0.9)`, null);
        txt(k.key, kx + k3W / 2, ky + 52, '800 48px system-ui,sans-serif', `rgba(${k.color},0.95)`, 'center');
        txt(k.name, kx + k3W / 2, ky + 76, '600 18px ui-monospace,monospace', P.textSub, 'center');
        hl(kx + 20, kx + k3W - 20, ky + 88, P.borderLight, 1);
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const lines = _wrapText(c, k.what, k3W - 32, '400 16px system-ui,sans-serif');
        lines.forEach((ln, j) => c.fillText(ln, kx + 16, ky + 108 + j * 21));
        rr(kx + 16, ky + 188, k3W - 32, 24, 8, `rgba(${k.color},0.10)`, `rgba(${k.color},0.25)`, 1);
        txt(k.rule, kx + k3W / 2, ky + 204, '500 14px ui-monospace,monospace', `rgba(${k.color},0.9)`, 'center');
      });
      Y += 220 + VGAP;

      // ── Cpk scale visual ──
      rr(PAD, Y, W - PAD * 2, 100, 12, P.surface, P.border, 1.5);
      const scaleW = W - PAD * 2 - 120;
      const scaleX = PAD + 60, scaleY2 = Y + 38, scaleH = 22;

      const zones2 = [
        { from: 0, to: 1.0, label: es ? 'No Capaz' : 'Not Capable', color: P.red, bg: P.redBg },
        { from: 1.0, to: 1.33, label: 'Marginal', color: P.yellow, bg: P.yellowBg },
        { from: 1.33, to: 1.67, label: es ? 'Capaz' : 'Capable', color: P.green, bg: P.greenBg },
        { from: 1.67, to: 2.0, label: 'World Class', color: P.accent, bg: isDark ? 'rgba(0,229,255,0.1)' : 'rgba(0,103,187,0.1)' },
      ];
      const maxCpk = 2.0;
      txt(es ? 'Escala Cpk:' : 'Cpk Scale:', PAD + 12, scaleY2 + scaleH / 2 + 6, '600 16px ui-monospace,monospace', P.textDim, 'left');
      zones2.forEach(z => {
        const zx = scaleX + (z.from / maxCpk) * scaleW, zw = (z.to - z.from) / maxCpk * scaleW;
        rr(zx, scaleY2, zw, scaleH, 0, z.bg, z.color, 1.5);
        c.font = '600 14px ui-monospace,monospace'; c.fillStyle = z.color; c.textAlign = 'center';
        c.fillText(z.label, zx + zw / 2, scaleY2 + scaleH / 2 + 5);
      });
      // tick marks
      [0, 1.0, 1.33, 1.67, 2.0].forEach(v => {
        const tx = scaleX + (v / maxCpk) * scaleW;
        txt(v.toFixed(v % 1 === 0 ? 0 : 2), tx, scaleY2 + scaleH + 18, '500 14px ui-monospace,monospace', P.textDim, 'center');
      });
      Y += 100 + VGAP;

      // ══════════════════════════════
      //  SECTION 2 — THE HISTOGRAM
      // ══════════════════════════════
      sectionTitle(es ? '② EL HISTOGRAMA + CURVA NORMAL' : '② HISTOGRAM + NORMAL CURVE',
        es ? 'La foto de tu proceso' : 'The picture of your process', PAD, Y, W - PAD * 2, '105,240,174');
      Y += 56 + 16;

      // Draw annotated demo histogram
      const hW = 760, hH = 280;
      rr(PAD, Y, hW, hH, 14, P.surface, P.border, 1.5);
      _drawGuideHistogram(c, PAD, Y, hW, hH, P, isDark, es);
      // Annotations right side
      const annX = PAD + hW + 28, annW = W - PAD * 2 - hW - 28;
      let annY = Y;
      const annotationItems = [
        { color: P.accent2, icon: '▬', text: es ? 'BARRAS — Frecuencia de cada valor. La altura = cuántas veces ocurrió ese valor en tu proceso.' : 'BARS — Frequency of each value. Height = how many times that value occurred in your process.' },
        { color: P.green, icon: '~', text: es ? 'CURVA NORMAL — La distribución teórica. Si las barras siguen la curva, tu proceso es estable y predecible.' : 'NORMAL CURVE — Theoretical distribution. If bars follow the curve, your process is stable and predictable.' },
        { color: P.red, icon: '|', text: es ? 'LSL / USL — Límites de especificación. Barras fuera de estas líneas = DEFECTOS. Quieres que TODO esté entre ellas.' : 'LSL / USL — Specification limits. Bars outside these lines = DEFECTS. You want EVERYTHING between them.' },
        { color: isDark ? P.accent : P.accent2, icon: '--', text: es ? 'MEDIA (x̄) — El valor promedio de tu proceso. Idealmente debería estar centrada entre LSL y USL.' : 'MEAN (x̄) — Average value of your process. Ideally should be centered between LSL and USL.' },
      ];
      annotationItems.forEach(item => {
        rr(annX, annY, annW, 64, 10, P.surface, P.borderLight, 1);
        rr(annX, annY, 4, 64, [2, 0, 0, 2], item.color, null);
        txt(item.icon, annX + 14, annY + 22, 'bold 18px monospace', item.color, 'left');
        c.font = '400 16px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
        const ls = _wrapText(c, item.text, annW - 36, '400 16px system-ui,sans-serif');
        ls.forEach((l, i) => c.fillText(l, annX + 36, annY + 20 + i * 20));
        annY += 72;
      });
      Y += Math.max(hH, annY - Y) + VGAP;

      // ══════════════════════════════
      //  SECTION 3 — PPM
      // ══════════════════════════════
      sectionTitle(es ? '③ PPM — DEFECTOS ESPERADOS' : '③ PPM — EXPECTED DEFECTS',
        es ? 'Cuántas piezas defectuosas esperas por millón' : 'How many defective parts to expect per million', PAD, Y, W - PAD * 2, '251,191,36');
      Y += 56 + 16;

      const ppmCards = [
        { cpk: '< 1.00', ppm: es ? '> 2,700 PPM' : '> 2,700 PPM', icon: '❌', desc: es ? 'Más de 2,700 defectos por millón de piezas. Proceso fuera de control.' : 'More than 2,700 defects per million parts. Out-of-control process.', col: P.red, bg: P.redBg, bd: P.redBd },
        { cpk: '1.00–1.33', ppm: '64–2,700 PPM', icon: '⚠️', desc: es ? 'Proceso marginal. Mejoras necesarias para alcanzar Six Sigma.' : 'Marginal process. Improvements needed to reach Six Sigma.', col: P.yellow, bg: P.yellowBg, bd: P.yellowBd },
        { cpk: '1.33–1.67', ppm: '< 64 PPM', icon: '✅', desc: es ? 'Proceso capaz. Estándar de la industria. Menos de 64 defectos por millón.' : 'Capable process. Industry standard. Less than 64 defects per million.', col: P.green, bg: P.greenBg, bd: P.greenBd },
        { cpk: '≥ 1.67', ppm: '< 0.6 PPM', icon: '⭐', desc: es ? 'World Class / Six Sigma. Virtualmente cero defectos.' : 'World Class / Six Sigma. Virtually zero defects.', col: P.accent, bg: isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,103,187,0.07)', bd: isDark ? 'rgba(0,229,255,0.25)' : 'rgba(0,103,187,0.25)' },
      ];
      const pW4 = (W - PAD * 2 - 48) / 4;
      ppmCards.forEach((p, i) => {
        const px = PAD + i * (pW4 + 16), py = Y;
        rr(px, py, pW4, 160, 14, p.bg, p.bd, 2);
        txt(p.icon, px + pW4 / 2, py + 38, '32px system-ui,sans-serif', p.col, 'center');
        txt('Cpk ' + p.cpk, px + pW4 / 2, py + 66, '700 17px ui-monospace,monospace', p.col, 'center');
        txt(p.ppm, px + pW4 / 2, py + 90, '800 22px system-ui,sans-serif', p.col, 'center');
        hl(px + 16, px + pW4 - 16, py + 102, P.borderLight, 1);
        c.font = '400 14px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'center';
        const ls = _wrapText(c, p.desc, pW4 - 24, '400 14px system-ui,sans-serif');
        ls.forEach((l, j) => c.fillText(l, px + pW4 / 2, py + 120 + j * 18));
      });
      Y += 160 + VGAP;

```
<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 19/24. Continue: [capaflow-inventory-section-20-of-24.md](capaflow-inventory-section-20-of-24.md).

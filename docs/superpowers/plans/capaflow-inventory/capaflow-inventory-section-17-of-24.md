# CapaFlow inventory — section 17 of 24

**Original inventory lines:** 6339–6798 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-16-of-24.md](capaflow-inventory-section-16-of-24.md). **Next:** [capaflow-inventory-section-18-of-24.md](capaflow-inventory-section-18-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Executive PNG full layout/palettes/content/export — verbatim source [L6045–6499].**

```javascript
    function _drawPNG(r, returnURL = false) {
      const isDark = currentTheme === 'dark';

      // ── PALETTE ──────────────────────────────
      const P = isDark ? {
        bg: '#050d2a', surface: '#0c1a3e', surface2: '#0f2050',
        border: 'rgba(255,255,255,0.11)', borderLight: 'rgba(255,255,255,0.06)',
        text: '#eef2ff', textSub: 'rgba(230,235,255,0.65)', textDim: 'rgba(200,210,255,0.35)',
        accent: '#00E5FF', accent2: '#4FC3F7',
        green: '#4ade80', greenBg: 'rgba(74,222,128,0.1)', greenBorder: 'rgba(74,222,128,0.3)',
        yellow: '#fbbf24', yellowBg: 'rgba(251,191,36,0.1)', yellowBorder: 'rgba(251,191,36,0.3)',
        red: '#f87171', redBg: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.3)',
        barA: 'rgba(79,195,247,0.8)', barB: 'rgba(0,229,255,0.15)',
        curve: '#4ade80', specLine: '#f87171', meanLine: 'rgba(79,195,247,0.75)', targetLine: '#fbbf24',
        grid: 'rgba(255,255,255,0.04)', rowAlt: 'rgba(255,255,255,0.025)',
        headerBg: 'rgba(0,229,255,0.07)',
      } : {
        bg: '#f0f3f8', surface: '#ffffff', surface2: '#f7f9fc',
        border: 'rgba(30,60,120,0.13)', borderLight: 'rgba(30,60,120,0.07)',
        text: '#1a2340', textSub: '#4a5580', textDim: '#9aa5c0',
        accent: '#0067bb', accent2: '#2196F3',
        green: '#16a34a', greenBg: 'rgba(22,163,74,0.08)', greenBorder: 'rgba(22,163,74,0.3)',
        yellow: '#b45309', yellowBg: 'rgba(180,83,9,0.08)', yellowBorder: 'rgba(180,83,9,0.3)',
        red: '#dc2626', redBg: 'rgba(220,38,38,0.08)', redBorder: 'rgba(220,38,38,0.3)',
        barA: 'rgba(33,150,243,0.75)', barB: 'rgba(100,160,240,0.1)',
        curve: '#16a34a', specLine: '#dc2626', meanLine: 'rgba(33,150,243,0.7)', targetLine: '#b45309',
        grid: 'rgba(30,60,120,0.05)', rowAlt: 'rgba(30,60,120,0.03)',
        headerBg: 'rgba(0,103,187,0.06)',
      };

      // ── HELPERS ──────────────────────────────
      const fmt = (v, d = 3) => v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(d) : '—';
      const fmtN = v => v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—';
      const cpkColorOf = v => v === null ? P.accent : v >= 1.33 ? P.green : v >= 1.0 ? P.yellow : P.red;
      const cpkBgOf = v => v === null ? 'transparent' : v >= 1.33 ? P.greenBg : v >= 1.0 ? P.yellowBg : P.redBg;
      const cpkBdOf = v => v === null ? P.border : v >= 1.33 ? P.greenBorder : v >= 1.0 ? P.yellowBorder : P.redBorder;

      // Pre-compute layout constants
      const W = 1600;
      const PAD = 48;          // outer horizontal padding
      const GAP = 20;          // gap between columns
      const COL2 = (W - PAD * 2 - GAP) / 2;  // half-width column
      const COL3 = (W - PAD * 2 - GAP * 2) / 3; // third-width column
      const ROW_H = 38;         // table row height
      const FONT_LABEL = '400 21px ui-monospace,monospace';
      const FONT_VALUE = '600 21px ui-monospace,monospace';
      const FONT_HEAD = '600 19px ui-monospace,monospace';
      const FONT_TITLE = '700 24px ui-monospace,monospace';
      const FONT_KPI = '800 56px system-ui,sans-serif';
      const FONT_BADGE = '600 19px ui-monospace,monospace';

      // -- Layout engine: sections as data --
      const SECTION_HEADER_H = 44; // section header row height
      const CARD_PAD_X = 20;
      const CARD_PAD_Y = 16;

      // Offscreen canvas context used for measuring
      const cv = document.createElement('canvas');
      const c = cv.getContext('2d');

      // -- Capability rows data --
      const capRows = [
        { label: 'Cp', val: fmt(r.Cp), color: cpkColorOf(r.Cp) },
        { label: 'Cpk', val: fmt(r.Cpk), color: cpkColorOf(r.Cpk) },
        { label: 'Cpu', val: fmt(r.Cpu), color: cpkColorOf(r.Cpu) },
        { label: 'Cpl', val: fmt(r.Cpl), color: cpkColorOf(r.Cpl) },
        { label: 'Cpm (Taguchi)', val: fmt(r.Cpm), color: P.accent2 },
        { label: 'Cmk (Machine)', val: fmt(r.Cmk), color: cpkColorOf(r.Cmk) },
      ];
      const perfRows = [
        { label: 'Pp', val: fmt(r.Pp), color: cpkColorOf(r.Pp) },
        { label: 'Ppk', val: fmt(r.Ppk), color: cpkColorOf(r.Ppk) },
        { label: 'Ppu', val: fmt(r.Ppu), color: cpkColorOf(r.Ppu) },
        { label: 'Ppl', val: fmt(r.Ppl), color: cpkColorOf(r.Ppl) },
      ];
      const statsRows = [
        { label: t('png.n'), val: String(r.N) },
        { label: t('png.mean'), val: fmt(r.xBar, 4) },
        { label: t('png.median'), val: fmt(r.med, 4) },
        { label: t('png.stdOverall'), val: fmt(r.sOverall, 5) },
        { label: t('png.stdWithin'), val: fmt(r.sWithin, 5) },
        { label: t('png.min'), val: fmt(r.minV, 4) },
        { label: t('png.max'), val: fmt(r.maxV, 4) },
        { label: t('png.range'), val: fmt(r.range, 4) },
        { label: t('png.lsl'), val: r.hasLSL ? fmt(r.lsl, 3) : '—' },
        { label: t('png.usl'), val: r.hasUSL ? fmt(r.usl, 3) : '—' },
      ];
      if (!isNaN(r.targetVal)) statsRows.push({ label: t('png.target'), val: fmt(r.targetVal, 3) });

      // -- Interpretation lines --
      const interpPlain = _buildInterpretationPlain(r, currentLang === 'es');

      // -- Control chart data for PNG --
      const pngN = r.subgroupSize || parseInt(document.getElementById('subgroupSize').value) || 1;
      const _activeCCType = Object.entries(_results).find(([,v]) => v === r) ? (_ccTypes[Object.keys(_results).find(k => _results[k] === r)] || 'auto') : 'auto';
      let pngCCType = _activeCCType === 'auto' ? (pngN <= 1 ? 'imr' : pngN < 10 ? 'xr' : 'xs') : _activeCCType;
      const pngCCData = _buildCCData(r, pngN, pngCCType);

      // ── COMPUTE DYNAMIC HEIGHT ──────────────
      const WRAP_W = W - PAD * 2 - CARD_PAD_X * 2 - 10;
      c.font = '400 20px system-ui,sans-serif';
      let interpLineCount = 0;
      interpPlain.forEach(line => {
        const words = line.split(' '); let row = '';
        words.forEach(word => {
          const test = row + (row ? ' ' : '') + word;
          if (c.measureText(test).width > WRAP_W && row) { row = word; interpLineCount++; }
          else row = test;
        });
        interpLineCount += 2;
      });
      const INTERP_H = Math.max(120, interpLineCount * 28 + SECTION_HEADER_H + CARD_PAD_Y * 2 + 20);

      // Fixed section heights
      const H_HEADER = 108;
      const H_BANNER = 72;
      const H_KPI = 170;
      const H_SIGMA = 84;
      const H_CHARTS = 360; // histogram section height in PNG
      const H_TBL_CAP = SECTION_HEADER_H + capRows.length * ROW_H + 14 + 32 + perfRows.length * ROW_H + CARD_PAD_Y * 2 + 60;
      const H_TBL_STAT = SECTION_HEADER_H + statsRows.length * ROW_H + CARD_PAD_Y * 2 + 60;
      const H_TABLES = Math.max(H_TBL_CAP, H_TBL_STAT);
      const H_INTERP = INTERP_H;
      const H_CC = 560;   // two control chart panels
      const H_RC_QQ = 340;   // run chart + Q-Q plot side by side
      const H_BOXPLOT = 340; // box plot section
      const H_FOOTER = 80;
      const VGAP = 20;

      const H = H_HEADER + H_BANNER + VGAP
        + H_KPI + VGAP
        + H_SIGMA + VGAP
        + H_CHARTS + VGAP
        + H_TABLES + VGAP
        + H_INTERP + VGAP
        + H_CC + VGAP
        + H_RC_QQ + VGAP
        + H_BOXPLOT + VGAP
        + H_FOOTER + 20;

      cv.width = W; cv.height = H;

      // ── BACKGROUND ──────────────────────────
      c.fillStyle = P.bg;
      c.fillRect(0, 0, W, H);

      // Mesh blobs
      const m1 = c.createRadialGradient(180, 180, 0, 180, 180, 700);
      m1.addColorStop(0, isDark ? 'rgba(0,80,180,0.16)' : 'rgba(100,160,255,0.10)');
      m1.addColorStop(1, 'transparent');
      c.fillStyle = m1; c.fillRect(0, 0, W, H);
      const m2 = c.createRadialGradient(W, H * 0.7, 0, W, H * 0.7, 800);
      m2.addColorStop(0, isDark ? 'rgba(0,160,140,0.08)' : 'rgba(60,120,200,0.06)');
      m2.addColorStop(1, 'transparent');
      c.fillStyle = m2; c.fillRect(0, 0, W, H);

      // Noise grain
      c.save(); c.globalAlpha = isDark ? 0.022 : 0.012;
      for (let i = 0; i < 5000; i++) {
        const v = 100 + Math.random() * 155 | 0;
        c.fillStyle = `rgb(${v},${v},${v + 20})`;
        c.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1);
      }
      c.restore();

      // ── DRAWING PRIMITIVES ──────────────────
      function rRect(x, y, w, h, r2, fill, stroke, sw = 1.5) {
        c.beginPath(); c.roundRect(x, y, w, h, r2);
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); }
      }
      function hline(x1, x2, y, color, w = 1) {
        c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y);
        c.strokeStyle = color; c.lineWidth = w; c.stroke();
      }
      function label(str, x, y, font, color, align = 'left') {
        c.font = font; c.fillStyle = color; c.textAlign = align;
        c.fillText(str, x, y);
      }
      function sectionHeader(title, x, y, w) {
        // colored mini-bar + uppercase title
        rRect(x, y, 3, 22, 1.5, P.accent, null);
        label(title, x + 12, y + 17, FONT_TITLE, P.textDim, 'left');
        hline(x + 12 + c.measureText(title).width + 12, x + w, y + 8, P.borderLight, 1.5);
      }

      // Table renderer — returns final Y after last row
      function drawTable(rows, x, y, w, showIndex = false) {
        rows.forEach((row, i) => {
          const ry = y + i * ROW_H;
          if (i % 2 === 1) rRect(x, ry, w, ROW_H, 0, P.rowAlt, null);
          label(row.label, x + CARD_PAD_X, ry + ROW_H * 0.68, FONT_LABEL, P.textSub, 'left');
          label(row.val, x + w - CARD_PAD_X, ry + ROW_H * 0.68, FONT_VALUE, row.color || P.accent, 'right');
        });
        return y + rows.length * ROW_H;
      }

      // ── SECTION Y CURSORS ───────────────────
      let Y = 0;

      // ══════════════════════════════
      //  HEADER
      // ══════════════════════════════
      rRect(0, 0, W, H_HEADER, 0, P.headerBg, null);
      hline(0, W, H_HEADER, P.border, 1.5);

      // Logo pill
      const lmGrad = c.createLinearGradient(PAD, 18, PAD + 56, 74);
      lmGrad.addColorStop(0, P.accent); lmGrad.addColorStop(1, P.accent2);
      rRect(PAD, 18, 56, 56, 13, lmGrad, null);
      label('C', PAD + 28, 62, '800 33px system-ui,sans-serif', '#050d2a', 'center');

      label('CapaFlow', PAD + 68, 58, '800 36px system-ui,sans-serif', P.text, 'left');
      label(t('png.subtitle'), PAD + 68, 82, '400 19px ui-monospace,monospace', P.textSub, 'left');

      const dateStr = new Date().toLocaleDateString(
        currentLang === 'es' ? 'es-MX' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
      label(t('png.generatedBy'), W - PAD, 46, '400 17px ui-monospace,monospace', P.textDim, 'right');
      label(dateStr, W - PAD, 72, '600 19px ui-monospace,monospace', P.textSub, 'right');
      Y = H_HEADER;

      // ══════════════════════════════
      //  TITLE BANNER
      // ══════════════════════════════
      rRect(PAD, Y + 12, W - PAD * 2, H_BANNER - 12, 12, P.headerBg, P.border, 1.5);
      label(t('png.title'), W / 2, Y + 12 + (H_BANNER - 12) / 2 + 10, '800 30px system-ui,sans-serif', P.accent, 'center');
      Y += H_BANNER + VGAP;

      // ══════════════════════════════
      //  3 KPI CARDS  — clean design: no gradient, just colored border+badge
      // ══════════════════════════════
      const kpiDefs = [
        { label: 'Cpk', val: fmt(r.Cpk), verdict: r.Cpk !== null ? classifyCpk(r.Cpk).label : '—', v: r.Cpk },
        { label: 'Cp', val: fmt(r.Cp), verdict: r.Cp !== null ? classifyCpk(r.Cp).label : t('classify.potential'), v: r.Cp },
        { label: 'Ppk', val: fmt(r.Ppk), verdict: r.Ppk !== null ? classifyCpk(r.Ppk).label : '—', v: r.Ppk },
      ];
      kpiDefs.forEach((k, i) => {
        const kx = PAD + i * (COL3 + GAP);
        const ky = Y;
        const kc = cpkColorOf(k.v);
        const kbg = cpkBgOf(k.v);
        const kbd = cpkBdOf(k.v);
        // card: light fill, colored border (2.5px)
        rRect(kx, ky, COL3, H_KPI, 16, P.surface, kbd, 2.5);
        // thin top accent line (not gradient — just solid)
        rRect(kx + 2, ky + 2, COL3 - 4, 4, [2, 2, 0, 0], kc, null);
        // index label
        label(k.label, kx + COL3 / 2, ky + 44, FONT_TITLE, P.textSub, 'center');
        // big value
        label(k.val, kx + COL3 / 2, ky + 112, FONT_KPI, kc, 'center');
        // badge pill — colored background
        c.font = FONT_BADGE; c.textAlign = 'center';
        const bw = c.measureText(k.verdict).width + 36;
        const bx = kx + COL3 / 2 - bw / 2; const by = ky + 126;
        rRect(bx, by, bw, 30, 15, kbg, kbd, 1.5);
        label(k.verdict, kx + COL3 / 2, by + 21, FONT_BADGE, kc, 'center');
      });
      Y += H_KPI + VGAP;

      // ══════════════════════════════
      //  SIGMA BAR + PPM
      // ══════════════════════════════
      rRect(PAD, Y, W - PAD * 2, H_SIGMA, 12, P.surface, P.border, 1.5);
      const sigmaBarInnerY = Y + 14;
      const sigmaLabelX = PAD + CARD_PAD_X;

      // "Sigma level" label
      label(t('png.sigmaLevel'), sigmaLabelX, sigmaBarInnerY + 20, FONT_HEAD, P.textSub, 'left');
      c.font = FONT_HEAD; c.textAlign = 'left';
      const sigLabelW = c.measureText(t('png.sigmaLevel')).width + 10;

      const sigVal = r.sigLvl !== null ? fmt(r.sigLvl, 2) + 'σ' : '—';
      label(sigVal, sigmaLabelX + sigLabelW + 2, sigmaBarInnerY + 20, '700 21px ui-monospace,monospace', cpkColorOf(r.Cpk), 'left');

      // PPM on right
      const ppmRX = W - PAD - CARD_PAD_X;
      label(t('png.ppmCpk') + ':  ' + fmtN(r.ppm), ppmRX, sigmaBarInnerY + 18, '500 17px ui-monospace,monospace', P.textSub, 'right');
      label(t('png.ppmPpk') + ':  ' + fmtN(r.ppmOverall), ppmRX, sigmaBarInnerY + 40, '500 17px ui-monospace,monospace', P.textSub, 'right');

      // Bar
      c.font = '400 15px ui-monospace,monospace';
      c.textAlign = 'center';
      c.fillStyle = P.textDim;
      const ppmLabelW = c.measureText(t('png.ppmCpk') + ':  ' + fmtN(r.ppm)).width + 30;
      const barXS = sigmaLabelX + sigLabelW + 80;
      const barXE = ppmRX - ppmLabelW - 20;
      const barTW = barXE - barXS;
      const barTY = sigmaBarInnerY + 32;

      rRect(barXS, barTY, barTW, 10, 5, isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', null);
      const pct = r.sigLvl !== null ? Math.min(1, r.sigLvl / 6) : 0;
      if (pct > 0) {
        const bg = c.createLinearGradient(barXS, 0, barXE, 0);
        bg.addColorStop(0, P.red); bg.addColorStop(0.5, P.yellow); bg.addColorStop(1, P.green);
        rRect(barXS, barTY, barTW * pct, 10, 5, bg, null);
      }
      // tick labels
      ['1σ', '2σ', '3σ', '4σ', '5σ', '6σ'].forEach((lbl, i) => {
        const tx = barXS + (i + 1) / 6 * barTW;
        label(lbl, tx, barTY + 26, '400 14px ui-monospace,monospace', P.textDim, 'center');
      });
      Y += H_SIGMA + VGAP;

      // ══════════════════════════════
      //  GAUGE  |  HISTOGRAM  (two equal columns)
      // ══════════════════════════════
      const chartY = Y;
      rRect(PAD, chartY, COL2, H_CHARTS, 14, P.surface, P.border, 1.5);
      sectionHeader(t('png.gauge'), PAD + CARD_PAD_X, chartY + CARD_PAD_Y, COL2 - CARD_PAD_X * 2);
      _pngGauge2(c, PAD, chartY, COL2, H_CHARTS, r.Cpk, cpkColorOf(r.Cpk), P, fmt);

      const histX = PAD + COL2 + GAP;
      rRect(histX, chartY, COL2, H_CHARTS, 14, P.surface, P.border, 1.5);
      sectionHeader(t('png.histogram'), histX + CARD_PAD_X, chartY + CARD_PAD_Y, COL2 - CARD_PAD_X * 2);
      _pngHistogram2(c, histX, chartY, COL2, H_CHARTS, r, P, isDark);
      Y += H_CHARTS + VGAP;

      // ══════════════════════════════
      //  CAPABILITY TABLE  |  STATS TABLE
      // ══════════════════════════════
      const tableY = Y;

      // LEFT: capability + performance
      rRect(PAD, tableY, COL2, H_TABLES, 14, P.surface, P.border, 1.5);
      let tY = tableY + CARD_PAD_Y;
      sectionHeader(t('png.capacity'), PAD + CARD_PAD_X, tY, COL2 - CARD_PAD_X * 2);
      tY += SECTION_HEADER_H + 4;
      tY = drawTable(capRows, PAD, tY, COL2);
      // sub-divider + perf header
      hline(PAD + CARD_PAD_X, PAD + COL2 - CARD_PAD_X, tY + 8, P.borderLight, 1);
      tY += 16;
      sectionHeader(t('png.performance'), PAD + CARD_PAD_X, tY, COL2 - CARD_PAD_X * 2);
      tY += SECTION_HEADER_H + 4;
      tY = drawTable(perfRows, PAD, tY, COL2);

      // RIGHT: stats
      rRect(PAD + COL2 + GAP, tableY, COL2, H_TABLES, 14, P.surface, P.border, 1.5);
      let sY = tableY + CARD_PAD_Y;
      sectionHeader(t('png.stats'), PAD + COL2 + GAP + CARD_PAD_X, sY, COL2 - CARD_PAD_X * 2);
      sY += SECTION_HEADER_H + 4;
      sY = drawTable(statsRows.map(row => ({ ...row, color: P.accent })), PAD + COL2 + GAP, sY, COL2);

      // Normality pill
      const normOk = r.adTest.p >= 0.05;
      const npColor = normOk ? P.green : P.yellow;
      const npBg = normOk ? P.greenBg : P.yellowBg;
      const npBd = normOk ? P.greenBorder : P.yellowBorder;
      const npText = t('png.adTest') + ' p=' + fmt(r.adTest.p, 4) + '  ·  ' + (normOk ? t('png.normal') : t('png.notNormal'));
      sY += 14;
      rRect(PAD + COL2 + GAP + CARD_PAD_X, sY, COL2 - CARD_PAD_X * 2, 36, 18, npBg, npBd, 1.5);
      // dot
      c.beginPath(); c.arc(PAD + COL2 + GAP + CARD_PAD_X + 22, sY + 18, 6, 0, Math.PI * 2);
      c.fillStyle = npColor; c.fill();
      label(npText, PAD + COL2 + GAP + CARD_PAD_X + 36, sY + 24, '500 16px ui-monospace,monospace', npColor, 'left');

      Y += H_TABLES + VGAP;

      // ══════════════════════════════
      //  INTERPRETATION
      // ══════════════════════════════
      rRect(PAD, Y, W - PAD * 2, H_INTERP, 14, P.surface, P.border, 1.5);
      // left accent stripe
      rRect(PAD, Y, 4, H_INTERP, [2, 0, 0, 2], P.accent, null);
      let iY = Y + CARD_PAD_Y;
      sectionHeader(t('png.interpretation'), PAD + CARD_PAD_X + 4, iY, W - PAD * 2 - CARD_PAD_X * 2);
      iY += SECTION_HEADER_H + 4;

      c.font = '400 20px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left';
      interpPlain.forEach(line => {
        const words = line.split(' '); let row = '';
        words.forEach(word => {
          const test = row + (row ? ' ' : '') + word;
          if (c.measureText(test).width > WRAP_W && row) {
            c.fillText(row, PAD + CARD_PAD_X + 12, iY);
            row = word; iY += 27;
          } else row = test;
        });
        if (row) { c.fillText(row, PAD + CARD_PAD_X + 12, iY); iY += 27; }
        iY += 8; // paragraph spacing
      });
      Y += H_INTERP + VGAP;

      // ══════════════════════════════
      //  CONTROL CHARTS
      // ══════════════════════════════
      const H_CC_CARD = (H_CC - SECTION_HEADER_H - CARD_PAD_Y * 2 - GAP) / 2;

      rRect(PAD, Y, W - PAD * 2, H_CC, 14, P.surface, P.border, 1.5);
      rRect(PAD, Y, 4, H_CC, [2, 0, 0, 2], P.accent2, null);
      let ccY = Y + CARD_PAD_Y;
      sectionHeader(t('cc.title'), PAD + CARD_PAD_X + 4, ccY, W - PAD * 2 - CARD_PAD_X * 2);
      ccY += SECTION_HEADER_H + 8;

      // Top chart (Xbar or I)
      const topCCH = H_CC_CARD;
      const botCCH = H_CC_CARD;
      rRect(PAD + CARD_PAD_X, ccY, W - PAD * 2 - CARD_PAD_X * 2, topCCH, 10, P.bg, P.borderLight, 1);
      _pngCCChart(c, PAD + CARD_PAD_X, ccY, W - PAD * 2 - CARD_PAD_X * 2, topCCH,
        pngCCData.topPts, pngCCData.topCL, pngCCData.topUCL, pngCCData.topLCL,
        pngCCData.topSigma, pngCCData.topViol, pngCCData.topLabel,
        pngCCData.topOOC, P, isDark, true);
      ccY += topCCH + GAP;

      // Bottom chart (R, S, or MR)
      rRect(PAD + CARD_PAD_X, ccY, W - PAD * 2 - CARD_PAD_X * 2, botCCH, 10, P.bg, P.borderLight, 1);
      _pngCCChart(c, PAD + CARD_PAD_X, ccY, W - PAD * 2 - CARD_PAD_X * 2, botCCH,
        pngCCData.botPts, pngCCData.botCL, pngCCData.botUCL, pngCCData.botLCL,
        pngCCData.botSigma, pngCCData.botViol, pngCCData.botLabel,
        pngCCData.botOOC, P, isDark, false);

      Y += H_CC + VGAP;

      // ══════════════════════════════
      //  RUN CHART  |  Q-Q PLOT
      // ══════════════════════════════
      rRect(PAD, Y, COL2, H_RC_QQ, 14, P.surface, P.border, 1.5);
      rRect(PAD, Y, 4, H_RC_QQ, [2, 0, 0, 2], '#a78bfa', null);
      sectionHeader(t('png.runChart'), PAD + CARD_PAD_X + 4, Y + CARD_PAD_Y, COL2 - CARD_PAD_X * 2);
      _pngRunChart(c, PAD, Y, COL2, H_RC_QQ, r, P, isDark);

      const qqX2 = PAD + COL2 + GAP;
      rRect(qqX2, Y, COL2, H_RC_QQ, 14, P.surface, P.border, 1.5);
      rRect(qqX2, Y, 4, H_RC_QQ, [2, 0, 0, 2], '#fb923c', null);
      sectionHeader(t('png.qqPlot'), qqX2 + CARD_PAD_X + 4, Y + CARD_PAD_Y, COL2 - CARD_PAD_X * 2);
      _pngQQPlot(c, qqX2, Y, COL2, H_RC_QQ, r, P, isDark);
      Y += H_RC_QQ + VGAP;

      // ══════════════════════════════
      //  BOX PLOT
      // ══════════════════════════════
      rRect(PAD, Y, W - PAD * 2, H_BOXPLOT, 14, P.surface, P.border, 1.5);
      rRect(PAD, Y, 4, H_BOXPLOT, [2, 0, 0, 2], '#8b5cf6', null);
      sectionHeader(t('png.boxPlot'), PAD + CARD_PAD_X + 4, Y + CARD_PAD_Y, W - PAD * 2 - CARD_PAD_X * 2);
      _pngBoxPlot(c, PAD, Y, W - PAD * 2, H_BOXPLOT, r, P, isDark);
      Y += H_BOXPLOT + VGAP;

      // ══════════════════════════════
      //  FOOTER
      // ══════════════════════════════
      hline(PAD, W - PAD, Y + 16, P.borderLight, 1);
      label('CapaFlow', PAD, Y + 48, '700 18px ui-monospace,monospace', P.textDim, 'left');
      label(t('png.footNote'), W / 2, Y + 48, '400 16px ui-monospace,monospace', P.textDim, 'center', W - PAD * 2 - 200);
      label(dateStr, W - PAD, Y + 48, '400 16px ui-monospace,monospace', P.textDim, 'right');

      // ── DOWNLOAD / RETURN ───────────────────
      const dataURL = cv.toDataURL('image/png', 1.0);
      if (returnURL) return dataURL;
      const link = document.createElement('a');
      link.download = `CapaFlow_${currentLang === 'es' ? 'Resumen' : 'Report'}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataURL;
      link.click();
      showToast(t('toast.ready'));
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 17/24. Continue: [capaflow-inventory-section-18-of-24.md](capaflow-inventory-section-18-of-24.md).

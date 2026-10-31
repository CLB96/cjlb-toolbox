# CapaFlow inventory — section 15 of 24

**Original inventory lines:** 5669–6122 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 7. Exports / sharing.
**Previous:** [capaflow-inventory-section-14-of-24.md](capaflow-inventory-section-14-of-24.md). **Next:** [capaflow-inventory-section-16-of-24.md](capaflow-inventory-section-16-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Photo with markers PNG — verbatim source [L4444–4502].**

```javascript
    function exportPhotoWithMarkers() {
      if (!_photoImageSrc) return;
      const img = new Image();
      img.onload = () => {
        const W = img.naturalWidth, H = img.naturalHeight;
        const cv2 = document.createElement('canvas');
        cv2.width = W; cv2.height = H;
        const ctx = cv2.getContext('2d');
        ctx.drawImage(img, 0, 0, W, H);

        const radius = Math.max(20, Math.min(W, H) * 0.028);
        const fontSize = radius * 0.9;
        const labelFS  = Math.max(11, radius * 0.72);

        _analysisOrder.forEach(idx => {
          const m = _photoMarkers[idx]; if (!m?.placed) return;
          const r   = _results[idx];
          const pos = _analysisOrder.indexOf(idx) + 1;
          const nm  = r?.pointName || `${pos}`;
          const col = (r?.Cpk != null) ? colorForCpk(r.Cpk) : '#00E5FF';
          const cx  = m.x / 100 * W, cy = m.y / 100 * H;

          /* glow + circle */
          ctx.save();
          ctx.shadowColor = col; ctx.shadowBlur = radius;
          ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2);
          ctx.fillStyle = col; ctx.fill();
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = radius * 0.13; ctx.stroke();

          /* number */
          ctx.font = `800 ${fontSize}px system-ui,sans-serif`;
          ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(pos), cx, cy);

          /* label pill */
          ctx.font = `600 ${labelFS}px ui-monospace,monospace`;
          const tw = ctx.measureText(nm).width;
          const lw = tw + 16, lh = labelFS + 10;
          const lx = cx - lw/2, ly = cy + radius + 5;
          ctx.fillStyle = 'rgba(0,0,0,0.72)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(lx, ly, lw, lh, 5);
          else ctx.rect(lx, ly, lw, lh);
          ctx.fill();
          ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(nm, cx, ly + 5);
          ctx.restore();
        });

        const link = document.createElement('a');
        link.download = `CapaFlow_Plano_${new Date().toISOString().slice(0,10)}.png`;
        link.href = cv2.toDataURL('image/png', 1.0);
        link.click();
        showToast(currentLang === 'es' ? '✓ Plano exportado' : '✓ Drawing exported');
      };
      img.src = _photoImageSrc;
    }
```

**Comparative summary generator — verbatim source [L5460–5646].**

```javascript
    async function generateComparativeSummary(returnURLs = false) {
      const order = _analysisOrder;
      if (!order || order.length === 0) {
        if (!returnURLs) showToast('No hay análisis para resumir');
        return returnURLs ? [] : null;
      }

      const btn = document.getElementById('btnGenerateSummary');
      if (btn && !returnURLs) { btn.disabled = true; btn.textContent = t('summary.generating'); }

      const isDark = currentTheme === 'dark';
      const P = isDark ? {
        bg: '#050d2a', surface: '#0c1a3e', surface2: '#0f2050',
        border: 'rgba(255,255,255,0.11)', borderLight: 'rgba(255,255,255,0.06)',
        text: '#eef2ff', textSub: 'rgba(230,235,255,0.65)', textDim: 'rgba(200,210,255,0.35)',
        accent: '#00E5FF', accent2: '#4FC3F7',
        green: '#4ade80', greenBg: 'rgba(74,222,128,0.1)', greenBorder: 'rgba(74,222,128,0.3)',
        yellow: '#fbbf24', yellowBg: 'rgba(251,191,36,0.1)', yellowBorder: 'rgba(251,191,36,0.3)',
        red: '#f87171', redBg: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.3)',
        barA: 'rgba(79,195,247,0.8)', barB: 'rgba(0,229,255,0.15)',
        curve: '#4ade80', specLine: '#f87171', meanLine: 'rgba(79,195,247,0.75)',
        grid: 'rgba(255,255,255,0.04)', rowAlt: 'rgba(255,255,255,0.025)', headerBg: 'rgba(0,229,255,0.07)',
      } : {
        bg: '#f0f3f8', surface: '#ffffff', surface2: '#f7f9fc',
        border: 'rgba(30,60,120,0.13)', borderLight: 'rgba(30,60,120,0.07)',
        text: '#1a2340', textSub: '#4a5580', textDim: '#9aa5c0',
        accent: '#0067bb', accent2: '#2196F3',
        green: '#16a34a', greenBg: 'rgba(22,163,74,0.08)', greenBorder: 'rgba(22,163,74,0.3)',
        yellow: '#b45309', yellowBg: 'rgba(180,83,9,0.08)', yellowBorder: 'rgba(180,83,9,0.3)',
        red: '#dc2626', redBg: 'rgba(220,38,38,0.08)', redBorder: 'rgba(220,38,38,0.3)',
        barA: 'rgba(33,150,243,0.75)', barB: 'rgba(100,160,240,0.1)',
        curve: '#16a34a', specLine: '#dc2626', meanLine: 'rgba(33,150,243,0.7)',
        grid: 'rgba(30,60,120,0.05)', rowAlt: 'rgba(30,60,120,0.03)', headerBg: 'rgba(0,103,187,0.06)',
      };

      const fmt = (v, d = 3) => v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(d) : '—';
      const cpkColor = v => v === null ? P.accent : v >= 1.33 ? P.green : v >= 1.0 ? P.yellow : P.red;

      // ── Canvas dimensions ─────────────────────────────────────────
      const W = 2400, H = 1440;
      const HEADER_H = 68, FOOTER_H = 32, PAD = 40, GAP = 16;
      const L_X = PAD, L_W = 820;
      const R_X = L_X + L_W + GAP, R_W = W - R_X - PAD; // 1484
      const CONTENT_Y = HEADER_H + 12;
      const CONTENT_H = H - CONTENT_Y - FOOTER_H - PAD;

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

      // Pre-load photo image
      let photoImg = null;
      if (_photoImageSrc) {
        photoImg = await new Promise(resolve => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = _photoImageSrc;
        });
      }

      const dateStr = new Date().toLocaleDateString(
        currentLang === 'es' ? 'es-MX' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
      const projName = document.getElementById('folderNameInput')?.value.trim() || '';
      const dataURLs = [];

      for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
        const pageOrder = perPage[pageIdx];
        const rows = Math.ceil(pageOrder.length / HIST_COLS);
        // Cap cell height to cell width so histograms stay near-square
        const CELL_H = Math.min(Math.floor(CONTENT_H / rows), CELL_W);

        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d');

        // Background
        ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
        const m1 = ctx.createRadialGradient(300, 300, 0, 300, 300, 900);
        m1.addColorStop(0, isDark ? 'rgba(0,80,180,0.13)' : 'rgba(100,160,255,0.08)');
        m1.addColorStop(1, 'transparent');
        ctx.fillStyle = m1; ctx.fillRect(0, 0, W, H);

        // ── HEADER ───────────────────────────────────────────────────
        ctx.fillStyle = P.headerBg; ctx.fillRect(0, 0, W, HEADER_H);
        ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(W, HEADER_H);
        ctx.strokeStyle = P.border; ctx.lineWidth = 1.5; ctx.stroke();

        // Logo pill
        const lg = ctx.createLinearGradient(PAD, 10, PAD + 48, 58);
        lg.addColorStop(0, P.accent); lg.addColorStop(1, P.accent2);
        ctx.beginPath(); ctx.roundRect(PAD, 10, 48, 48, 10); ctx.fillStyle = lg; ctx.fill();
        ctx.font = '800 26px system-ui,sans-serif'; ctx.fillStyle = '#050d2a';
        ctx.textAlign = 'center'; ctx.fillText('C', PAD + 24, 44);

        ctx.font = '700 26px system-ui,sans-serif'; ctx.fillStyle = P.text;
        ctx.textAlign = 'left'; ctx.fillText('CapaFlow', PAD + 62, 38);
        ctx.font = '400 13px ui-monospace,monospace'; ctx.fillStyle = P.textSub;
        ctx.fillText(t('summary.subtitle'), PAD + 62, 57);

        ctx.textAlign = 'right';
        ctx.font = '500 13px ui-monospace,monospace'; ctx.fillStyle = P.textDim;
        ctx.fillText(dateStr, W - PAD, 34);
        if (pages > 1) {
          ctx.font = '700 13px ui-monospace,monospace'; ctx.fillStyle = P.accent;
          ctx.fillText(`${t('summary.page')} ${pageIdx + 1} ${t('summary.page.of')} ${pages}`, W - PAD, 55);
        }
        if (projName) {
          ctx.font = '600 13px ui-monospace,monospace'; ctx.fillStyle = P.textSub;
          ctx.textAlign = 'center'; ctx.fillText(t('summary.project') + ' ' + projName, W / 2, 42);
        }

        // ── LEFT COL: PHOTO ─────────────────────────────────────────
        _summaryDrawPhoto(ctx, L_X, CONTENT_Y, L_W, PHOTO_H, photoImg, P, isDark, order, fmt, cpkColor);

        // ── LEFT COL: TABLE ─────────────────────────────────────────
        _summaryDrawTable(ctx, L_X, TABLE_Y, L_W, TABLE_H, order, P, isDark, fmt, cpkColor);

        // ── RIGHT COL: MINI HISTOGRAMS ───────────────────────────────
        pageOrder.forEach((idx, i) => {
          const r = _results[idx];
          if (!r) return;
          const col = i % HIST_COLS;
          const row = Math.floor(i / HIST_COLS);
          const bx = R_X + col * CELL_W;
          const by = CONTENT_Y + row * CELL_H;
          const posNum = order.indexOf(idx) + 1;
          _summaryDrawMiniHist(ctx, bx, by, CELL_W - 2, CELL_H - 2, r, posNum, P, isDark, fmt, cpkColor);
        });

        // ── FOOTER ──────────────────────────────────────────────────
        const footY = H - FOOTER_H - 4;
        ctx.beginPath(); ctx.moveTo(PAD, footY); ctx.lineTo(W - PAD, footY);
        ctx.strokeStyle = P.borderLight; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '400 12px ui-monospace,monospace'; ctx.fillStyle = P.textDim;
        const _es = currentLang === 'es';
        const _ptLabel = _es
          ? `${order.length} punto${order.length !== 1 ? 's' : ''} de medición`
          : `${order.length} measurement point${order.length !== 1 ? 's' : ''}`;
        ctx.textAlign = 'left'; ctx.fillText(t('summary.footer'), PAD, footY + 18);
        ctx.textAlign = 'right'; ctx.fillText(_ptLabel, W - PAD, footY + 18);

        dataURLs.push(cv.toDataURL('image/png', 1.0));
        await new Promise(res => setTimeout(res, 0));
      }

      if (btn && !returnURLs) {
        btn.disabled = false;
        btn.textContent = t('summary.genBtn');
      }

      if (returnURLs) return dataURLs;

      const _dlEs = currentLang === 'es';
      dataURLs.forEach((url, i) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = url;
          link.download = `CapaFlow_Resumen${pages > 1 ? `_Pag${i + 1}` : ''}.png`;
          link.click();
        }, i * 600);
      });
      const _doneMsg = pages > 1
        ? `${t('summary.done')} (${pages} ${_dlEs ? `página${pages > 1 ? 's' : ''}` : `page${pages > 1 ? 's' : ''}`})`
        : t('summary.done');
      showToast(_doneMsg);
    }
```

**Summary photo renderer — verbatim source [L5649–5722].**

```javascript
    function _summaryDrawPhoto(ctx, x, y, w, h, photoImg, P, isDark, order, fmt, cpkColor) {
      // Card background
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10);
      ctx.fillStyle = P.surface; ctx.fill();
      ctx.strokeStyle = P.border; ctx.lineWidth = 1.5; ctx.stroke();

      // Accent bar on left
      ctx.fillStyle = P.accent;
      ctx.beginPath(); ctx.roundRect(x, y, 3, h, [2, 0, 0, 2]); ctx.fill();

      // Label
      ctx.font = '600 12px ui-monospace,monospace';
      ctx.fillStyle = P.textDim; ctx.textAlign = 'left';
      ctx.fillText(t('summary.photoTitle'), x + 10, y + 19);

      const INNER_Y = y + 26;
      const INNER_H = h - 28;

      if (!photoImg) {
        // Placeholder with dashed border
        ctx.save();
        ctx.beginPath(); ctx.roundRect(x + 8, INNER_Y + 4, w - 16, INNER_H - 8, 8);
        ctx.strokeStyle = P.borderLight; ctx.setLineDash([8, 6]); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.setLineDash([]); ctx.restore();

        ctx.font = '400 15px system-ui,sans-serif';
        ctx.fillStyle = P.textDim; ctx.textAlign = 'center';
        ctx.fillText(t('summary.noPhoto'), x + w / 2, y + h / 2 - 8);
        ctx.font = '400 12px ui-monospace,monospace';
        ctx.fillText(t('summary.noPhotoSub'), x + w / 2, y + h / 2 + 14);
        return;
      }

      // Draw photo to fit
      const imgAR = photoImg.naturalWidth / photoImg.naturalHeight;
      const cellAR = (w - 16) / (INNER_H - 8);
      let iw, ih, ix, iy;
      if (imgAR > cellAR) {
        iw = w - 16; ih = iw / imgAR;
        ix = x + 8; iy = INNER_Y + 4 + (INNER_H - 8 - ih) / 2;
      } else {
        ih = INNER_H - 8; iw = ih * imgAR;
        ix = x + (w - iw) / 2; iy = INNER_Y + 4;
      }

      ctx.save();
      ctx.beginPath(); ctx.roundRect(x + 4, INNER_Y + 2, w - 8, INNER_H - 4, 6); ctx.clip();
      ctx.drawImage(photoImg, ix, iy, iw, ih);
      ctx.restore();

      // Overlay markers
      const mR = Math.max(13, Math.min(20, Math.round(iw / 28)));
      order.forEach((idx, i) => {
        const m = _photoMarkers[idx];
        if (!m || !m.placed) return;
        const mx = ix + (m.x / 100) * iw;
        const my = iy + (m.y / 100) * ih;
        const r = _results[idx];
        const col = cpkColor(r ? r.Cpk : null);

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(mx, my, mR, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();

        const fs = Math.max(9, mR - 3);
        ctx.font = `700 ${fs}px system-ui,sans-serif`;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), mx, my + fs * 0.37);
      });
    }
```

**Summary table renderer — verbatim source [L5725–5838].**

```javascript
    function _summaryDrawTable(ctx, x, y, w, h, order, P, isDark, fmt, cpkColor) {
      // Card background
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10);
      ctx.fillStyle = P.surface; ctx.fill();
      ctx.strokeStyle = P.border; ctx.lineWidth = 1.5; ctx.stroke();

      // Accent bar
      ctx.fillStyle = P.accent2;
      ctx.beginPath(); ctx.roundRect(x, y, 3, h, [2, 0, 0, 2]); ctx.fill();

      // Column definitions — total usable = w - 16 = 804px
      const COLS = [
        { label: '#',      w: 32,  align: 'center' },
        { label: t('summary.colPoint'), w: 170, align: 'left'   },
        { label: 'N',      w: 38,  align: 'center' },
        { label: t('summary.colMean'),  w: 80,  align: 'right'  },
        { label: 'σ Wit',  w: 80,  align: 'right'  },
        { label: 'σ Ovr',  w: 80,  align: 'right'  },
        { label: 'Cp',     w: 60,  align: 'center' },
        { label: 'Cpk',    w: 72,  align: 'center' },
        { label: 'Pp',     w: 60,  align: 'center' },
        { label: 'Ppk',    w: 72,  align: 'center' },
        { label: 'σ Lvl',  w: 60,  align: 'center' },
      ];

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

      // Label
      ctx.font = '600 12px ui-monospace,monospace';
      ctx.fillStyle = P.textDim; ctx.textAlign = 'left';
      ctx.fillText(t('summary.tableTitle'), x + 10, y + 16);

      // Clip to card body
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x + 2, TABLE_START, w - 4, h - LBL_H - 6, 8); ctx.clip();

      // Header background
      ctx.fillStyle = P.headerBg; ctx.fillRect(x, TABLE_START, w, HDR_H);

      // Header text
      ctx.font = '700 11px ui-monospace,monospace'; ctx.fillStyle = P.accent;
      let colX = x + PAD_X;
      COLS.forEach(col => {
        ctx.textAlign = col.align;
        const tx = col.align === 'right' ? colX + col.w - 2
                 : col.align === 'center' ? colX + col.w / 2 : colX + 2;
        ctx.fillText(col.label, tx, TABLE_START + 22);
        colX += col.w;
      });

      // Header separator
      ctx.beginPath(); ctx.moveTo(x, TABLE_START + HDR_H); ctx.lineTo(x + w, TABLE_START + HDR_H);
      ctx.strokeStyle = P.border; ctx.lineWidth = 1; ctx.stroke();

      // Data rows
      const FONT_ROW = `${ROW_H > 22 ? '500' : '400'} ${Math.min(11, ROW_H - 6)}px ui-monospace,monospace`;
      visibleOrder.forEach((idx, i) => {
        const r = _results[idx];
        if (!r) return;
        const ry = TABLE_START + HDR_H + i * ROW_H;

        if (i % 2 === 1) {
          ctx.fillStyle = P.rowAlt; ctx.fillRect(x, ry, w, ROW_H);
        }

        const cells = [
          { val: String(i + 1),                                  col: P.textDim },
          { val: (r.pointName || (currentLang === 'es' ? `Punto ${i+1}` : `Point ${i+1}`)).slice(0, 24), col: P.text },
          { val: String(r.N),                                    col: P.textSub },
          { val: fmt(r.xBar, 4),                                 col: P.textSub },
          { val: fmt(r.sWithin, 4),                              col: P.textSub },
          { val: fmt(r.sOverall, 4),                             col: P.textSub },
          { val: fmt(r.Cp),                                      col: cpkColor(r.Cp)  },
          { val: fmt(r.Cpk),                                     col: cpkColor(r.Cpk) },
          { val: fmt(r.Pp),                                      col: cpkColor(r.Pp)  },
          { val: fmt(r.Ppk),                                     col: cpkColor(r.Ppk) },
          { val: r.sigLvl !== null ? fmt(r.sigLvl, 2) + 'σ' : '—', col: cpkColor(r.Cpk) },
        ];

        const textY = ry + ROW_H * 0.68;
        ctx.font = FONT_ROW;
        let cx = x + PAD_X;
        cells.forEach((cell, ci) => {
          const col = COLS[ci];
          ctx.fillStyle = cell.col;
          ctx.textAlign = col.align;
          const tx = col.align === 'right' ? cx + col.w - 2
                   : col.align === 'center' ? cx + col.w / 2 : cx + 2;
          ctx.fillText(cell.val, tx, textY);
          cx += col.w;
        });
      });

      if (clipped > 0) {
        const clipY = TABLE_START + HDR_H + visibleOrder.length * ROW_H + 4;
        ctx.font = '400 11px ui-monospace,monospace';
        ctx.fillStyle = P.textDim; ctx.textAlign = 'left';
        const _moreLabel = currentLang === 'es'
          ? `… y ${clipped} punto${clipped > 1 ? 's' : ''} más`
          : `… and ${clipped} more point${clipped > 1 ? 's' : ''}`;
        ctx.fillText(_moreLabel, x + PAD_X, clipY + 12);
      }

      ctx.restore();
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 15/24. Continue: [capaflow-inventory-section-16-of-24.md](capaflow-inventory-section-16-of-24.md).

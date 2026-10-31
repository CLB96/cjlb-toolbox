# CapaFlow inventory — section 09 of 24

**Original inventory lines:** 3386–3798 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 5. Charts / visual timeline.
**Previous:** [capaflow-inventory-section-08-of-24.md](capaflow-inventory-section-08-of-24.md). **Next:** [capaflow-inventory-section-10-of-24.md](capaflow-inventory-section-10-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Histogram slider CSS — verbatim source [L1157–1218].**

```css
    .hist-slider-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.65rem;
      padding: 0.5rem 0.75rem;
      background: var(--tag-bg);
      border-radius: 10px;
      border: 1px solid var(--glass-border);
    }

    .hist-slider-label {
      font-size: 0.68rem;
      font-family: 'DM Mono', monospace;
      color: var(--text-secondary);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .hist-slider-label span {
      color: var(--accent);
      font-weight: 600;
    }

    input[type=range].hist-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      background: linear-gradient(to right, var(--accent) 0%, var(--accent) var(--pct, 40%), var(--input-border) var(--pct, 40%), var(--input-border) 100%);
    }

    input[type=range].hist-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      box-shadow: 0 0 6px rgba(0, 229, 255, 0.4);
      transition: transform 0.15s;
    }

    input[type=range].hist-slider::-webkit-slider-thumb:hover {
      transform: scale(1.25);
    }

    input[type=range].hist-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: none;
      background: var(--accent);
      cursor: pointer;
    }

    [data-theme="light"] input[type=range].hist-slider::-webkit-slider-thumb {
      box-shadow: 0 0 6px rgba(0, 119, 204, 0.35);
    }
```

**Gauge CSS — verbatim source [L1804–1829].**

```css
    .gauge-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.25rem 0;
    }

    .gauge-value-display {
      text-align: center;
      margin-top: -0.4rem;
    }

    .gauge-number {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 2.5rem;
      line-height: 1;
    }

    .gauge-sub {
      font-size: 0.72rem;
      color: var(--text-secondary);
      letter-spacing: 0.05em;
      font-family: 'DM Mono', monospace;
      margin-top: 0.25rem;
    }
```

**Control-chart CSS including legends and badges — verbatim source [L1975–2153].**

```css
    .cc-section {
      margin-top: 1.5rem;
    }

    .cc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .cc-title-block {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    /* Chart type toggle pills */
    .cc-type-pills {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      background: var(--tag-bg);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 4px;
    }

    .cc-pill {
      padding: 0.3rem 0.9rem;
      border-radius: 7px;
      font-size: 0.75rem;
      font-family: 'DM Mono', monospace;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      transition: all 0.2s;
      letter-spacing: 0.03em;
    }

    .cc-pill.active {
      background: var(--accent);
      color: #050d2a;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0, 229, 255, 0.2);
    }

    [data-theme="light"] .cc-pill.active {
      color: #fff;
    }

    /* Chart pair layout */
    .cc-pair {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Individual chart card */
    .cc-card {
      background: var(--bg-surface);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      backdrop-filter: var(--blur-amount);
      -webkit-backdrop-filter: var(--blur-amount);
      padding: 1.25rem 1.25rem 1rem;
      box-shadow: var(--glass-shadow);
      transition: background var(--transition-theme), border-color var(--transition-theme);
      position: relative;
      overflow: hidden;
    }

    .cc-card-title {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .cc-card-subtitle {
      font-size: 0.7rem;
      color: var(--text-secondary);
      font-family: 'DM Mono', monospace;
      font-weight: 400;
    }

    .cc-canvas {
      width: 100%;
      display: block;
      border-radius: 8px;
    }

    /* Legend row */
    .cc-legend {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin-top: 0.6rem;
      font-size: 0.7rem;
      font-family: 'DM Mono', monospace;
      color: var(--text-secondary);
      align-items: center;
    }

    .cc-legend-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .cc-legend-line {
      width: 20px;
      height: 2px;
      border-radius: 1px;
      flex-shrink: 0;
    }

    .cc-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Out-of-control badge */
    .cc-ooc-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.65rem;
      border-radius: 50px;
      font-size: 0.68rem;
      font-family: 'DM Mono', monospace;
      font-weight: 500;
    }

    .cc-ooc-badge.ooc {
      background: rgba(255, 82, 82, 0.1);
      border: 1px solid rgba(255, 82, 82, 0.25);
      color: var(--accent-red);
    }

    .cc-ooc-badge.ok {
      background: rgba(105, 240, 174, 0.1);
      border: 1px solid rgba(105, 240, 174, 0.25);
      color: var(--accent-green);
    }

    [data-theme="light"] .cc-ooc-badge.ok {
      color: var(--accent-green);
    }

    [data-theme="light"] .cc-ooc-badge.ooc {
      color: var(--accent-red);
    }

    /* Info note */
    .cc-note {
      font-size: 0.72rem;
      color: var(--text-secondary);
      font-family: 'DM Mono', monospace;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      background: var(--tag-bg);
      border: 1px solid var(--glass-border);
      margin-top: 0.75rem;
      line-height: 1.6;
      transition: all var(--transition-theme);
    }
```

**Shared tooltip placement/show/hide helpers — verbatim source [L3533–3561].**

```javascript
    function showTooltip(text, x, y) {
      tooltip.textContent = text;
      
      // Ajustar posición para que no salga del viewport
      let finalX = x + 15;
      let finalY = y - 10;
      
      tooltip.style.left = finalX + 'px';
      tooltip.style.top = finalY + 'px';
      tooltip.classList.add('visible');
      
      // Reajustar si sale del viewport
      setTimeout(() => {
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          tooltip.style.left = (x - rect.width - 15) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
          tooltip.style.top = (y - rect.height - 10) + 'px';
        }
        if (rect.top < 0) {
          tooltip.style.top = '10px';
        }
      }, 10);
    }

    function hideTooltip() {
      tooltip.classList.remove('visible');
    }
```

**Particle initialization — verbatim source [L3569–3606].**

```javascript
    function initParticles() {
      const canvas = document.getElementById('bgCanvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      particles = [];
      const isDark = currentTheme === 'dark';
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 9000), 180);

      const colorsDark = [
        [79, 195, 247], [0, 229, 255], [105, 240, 174],
        [100, 140, 255], [200, 200, 255]
      ];
      const colorsLight = [
        [100, 150, 210], [80, 120, 200], [150, 180, 230],
        [120, 160, 220], [180, 200, 240]
      ];
      const colors = isDark ? colorsDark : colorsLight;

      for (let i = 0; i < count; i++) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: isDark ? (Math.random() * 3.5 + 1) : (Math.random() * 4.5 + 1.5),
          vx: (Math.random() - 0.5) * (isDark ? 0.4 : 0.25),
          vy: (Math.random() - 0.5) * (isDark ? 0.4 : 0.25) - (isDark ? 0.05 : 0),
          color: c,
          alpha: isDark ? (Math.random() * 0.55 + 0.15) : (Math.random() * 0.4 + 0.25),
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }

      if (animFrame) cancelAnimationFrame(animFrame);
      animateParticles(canvas, ctx);
    }
```

**Particle animation — verbatim source [L3608–3656].**

```javascript
    function animateParticles(canvas, ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = currentTheme === 'dark';

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // wrap
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const pulseR = p.r + Math.sin(p.pulse) * 0.6;
        const [r, g, b] = p.color;

        if (isDark) {
          // Glowing sphere (dark mode — bioluminescent)
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseR * 2.5);
          grad.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b},${p.alpha * 0.5})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        } else {
          // Ceramic sphere (light mode — 3D pearl look)
          const grad = ctx.createRadialGradient(
            p.x - pulseR * 0.3, p.y - pulseR * 0.3, pulseR * 0.1,
            p.x, p.y, pulseR
          );
          grad.addColorStop(0, `rgba(255,255,255,${p.alpha * 1.2})`);
          grad.addColorStop(0.4, `rgba(${r},${g},${b},${p.alpha})`);
          grad.addColorStop(1, `rgba(${r - 30},${g - 30},${b - 30},${p.alpha * 0.6})`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.shadowColor = `rgba(${r},${g},${b},0.2)`;
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animFrame = requestAnimationFrame(() => animateParticles(canvas, ctx));
    }
```

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 09/24. Continue: [capaflow-inventory-section-10-of-24.md](capaflow-inventory-section-10-of-24.md).

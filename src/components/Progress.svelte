<script>
  import { onMount, afterUpdate, tick } from 'svelte';
  import { S, currentAbsPage } from '../lib/store.js';
  import { TOTAL_PAGES } from '../lib/quranData.js';

  let canvas;

  $: cps = $S.checkpoints || [];
  $: absPage = $currentAbsPage;
  $: read = Math.max(0, absPage - $S.startPage);
  $: totalKhatam = TOTAL_PAGES - $S.startPage + 1;
  $: kPct = Math.min(100, Math.round((read / totalKhatam) * 100));
  $: oPct = Math.min(100, Math.round((absPage / TOTAL_PAGES) * 100));
  $: dayN = (() => {
    const start = new Date($S.startDate); start.setHours(0,0,0,0);
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.max(1, Math.floor((now - start) / 86400000) + 1);
  })();

  $: chartData = (() => {
    const start  = new Date($S.startDate);
    const labels = [], actual = [], target = [];
    for (let d = 0; d < Math.min(dayN, $S.targetDays); d++) {
      const dt  = new Date(start);
      dt.setDate(start.getDate() + d);
      const k   = dt.toISOString().split('T')[0];
      const dayCps = cps.filter(c => c.date === k);
      let dayPages = 0;
      if (dayCps.length > 0) {
        const latest  = dayCps[dayCps.length - 1];
        const prevCps = cps.filter(c => c.date < k);
        const prevPg  = prevCps.length > 0 ? prevCps[prevCps.length - 1].page : $S.startPage;
        dayPages = Math.max(0, latest.page - prevPg);
      }
      labels.push('D' + (d + 1));
      actual.push(dayPages);
      target.push(Math.round($S.dailyPages));
    }
    return { labels, actual, target };
  })();

  function drawChart() {
    if (!canvas) return;
    const { labels, actual, target } = chartData;
    const dpr  = window.devicePixelRatio || 1;
    const W0   = canvas.parentElement.clientWidth;
    const H0   = 210;
    canvas.width  = W0 * dpr;
    canvas.height = H0 * dpr;
    canvas.style.width  = W0 + 'px';
    canvas.style.height = H0 + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const W = W0, H = H0;
    const pad = { t: 16, r: 16, b: 32, l: 38 };
    const cW  = W - pad.l - pad.r;
    const cH  = H - pad.t - pad.b;
    const n   = labels.length;
    if (!n) return;

    const maxVal = Math.max(...target, ...actual, 1);
    const step   = cW / n;
    const barW   = Math.max(3, step * 0.55);

    // Grid
    ctx.strokeStyle = '#e0f0e8';
    ctx.lineWidth   = 1;
    ctx.fillStyle   = '#5a7a68';
    ctx.font        = `${10 * Math.min(1, W/320)}px Poppins, sans-serif`;
    ctx.textAlign   = 'right';
    for (let g = 0; g <= 4; g++) {
      const y = pad.t + cH * (1 - g / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillText(Math.round(maxVal * g / 4), pad.l - 4, y + 3);
    }

    // Target bars (light green background)
    ctx.fillStyle = '#d4edd9';
    for (let i = 0; i < n; i++) {
      const x = pad.l + i * step + step / 2 - barW / 2;
      const h = (target[i] / maxVal) * cH;
      ctx.fillRect(x, pad.t + cH - h, barW, h);
    }

    // Actual bars (dark green)
    ctx.fillStyle = '#1a6b3e';
    const bw2 = barW * 0.65;
    for (let i = 0; i < n; i++) {
      if (!actual[i]) continue;
      const x = pad.l + i * step + step / 2 - bw2 / 2;
      const h = (actual[i] / maxVal) * cH;
      ctx.fillRect(x, pad.t + cH - h, bw2, h);
    }

    // X labels
    ctx.fillStyle   = '#5a7a68';
    ctx.textAlign   = 'center';
    const every = Math.max(1, Math.ceil(n / 10));
    for (let i = 0; i < n; i++) {
      if (i % every === 0 || i === n - 1) {
        const x = pad.l + i * step + step / 2;
        ctx.fillText(labels[i], x, H - 8);
      }
    }
  }

  onMount(() => {
    tick().then(drawChart);
  });

  afterUpdate(() => {
    tick().then(drawChart);
  });

  $: reversedCps = [...cps].reverse();
</script>

<div class="card">
  <p class="card-title">📊 Overall Stats</p>
  <div class="stats-grid">
    <div class="stat-box"><div class="stat-val">{kPct}%</div><div class="stat-lbl">Khatam Done</div></div>
    <div class="stat-box"><div class="stat-val">{oPct}%</div><div class="stat-lbl">Quran Overall</div></div>
    <div class="stat-box"><div class="stat-val">{read}</div><div class="stat-lbl">Pages Read</div></div>
    <div class="stat-box"><div class="stat-val">{cps.length}</div><div class="stat-lbl">Updates Saved</div></div>
    <div class="stat-box"><div class="stat-val">{absPage}</div><div class="stat-lbl">Current Page</div></div>
    <div class="stat-box"><div class="stat-val">{dayN}</div><div class="stat-lbl">Days Active</div></div>
  </div>
</div>

<div class="card">
  <p class="card-title">📈 Daily Pages Chart</p>
  <div class="chart-wrap">
    <canvas bind:this={canvas}></canvas>
  </div>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#d4edd9"></div>Target</div>
    <div class="legend-item"><div class="legend-dot" style="background:#1a6b3e"></div>Recorded</div>
  </div>
</div>

<div class="card">
  <p class="card-title">📅 Progress History</p>
  <div style="max-height:320px;overflow-y:auto">
    {#if reversedCps.length === 0}
      <p style="color:var(--text-muted);font-size:.85rem;padding:8px 0">No progress recorded yet.</p>
    {:else}
      {#each reversedCps as cp}
        {@const pagesFromStart = Math.max(0, cp.page - $S.startPage)}
        <div class="history-row">
          <div>
            <div class="history-day">{cp.date}{cp.time ? ' · ' + cp.time : ''}</div>
            <div class="history-date">{cp.label}</div>
          </div>
          <div class="history-right">
            <div class="history-pages">Page {cp.page}</div>
            <div class="history-sessions">{pagesFromStart} pages read</div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

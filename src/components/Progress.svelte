<script>
  import { onMount, afterUpdate } from 'svelte';
  import { S, currentAbsPage, currentPosition } from '../lib/store.js';
  import { TOTAL_PAGES } from '../lib/quranData.js';
  import { isQuranComplete } from '../lib/quranCalc.js';
  import { checkpointPageChanges, daysBetween, startOfLocalDay, todayKey } from '../lib/utils.js';
  import Icon from './Icon.svelte';

  let canvas;

  $: cps = $S.checkpoints || [];
  $: absPage = $currentAbsPage;
  $: pos = $currentPosition;
  $: isComplete = isQuranComplete(pos);
  $: totalKhatam = TOTAL_PAGES - $S.startPage + 1;
  $: read = isComplete ? totalKhatam : Math.max(0, absPage - $S.startPage);
  $: kPct = Math.min(100, Math.round((read / totalKhatam) * 100));
  $: dayN = Math.max(1, daysBetween($S.startDate, todayKey()) + 1);

  $: chartData = (() => {
    const start  = startOfLocalDay($S.startDate);
    const labels = [], actual = [], target = [];
    const lastDay = Math.min(dayN, $S.targetDays);
    const firstDay = Math.max(0, lastDay - 14);
    for (let d = firstDay; d < lastDay; d++) {
      const dt  = new Date(start);
      dt.setDate(start.getDate() + d);
      const k   = todayKey(dt);
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
      target.push(Math.round(dayCps[dayCps.length - 1]?.dailyTarget ?? $S.dailyPages));
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
    requestAnimationFrame(drawChart);
  });

  afterUpdate(drawChart);

  $: historyEntries = checkpointPageChanges(cps, $S.startPage).reverse();
  $: milestoneDays = [...new Set(cps.map(cp => cp.date))].sort().reverse().map(date => {
    const entries = cps.filter(cp => cp.date === date);
    const completed = new Set(entries.filter(cp => cp.prayerIndex !== undefined).map(cp => cp.prayerIndex));
    return { date, completed, manualUpdates: entries.filter(cp => cp.source !== 'prayer').length };
  });
</script>

<div class="card">
  <p class="card-title"><Icon name="chart" size={15}/> Overall Stats</p>
  <div class="stats-grid compact">
    <div class="stat-box"><div class="stat-val">{kPct}%</div><div class="stat-lbl">Khatam Done</div></div>
    <div class="stat-box"><div class="stat-val">{read}</div><div class="stat-lbl">Pages Read</div></div>
    <div class="stat-box"><div class="stat-val">{cps.length}</div><div class="stat-lbl">Updates Saved</div></div>
    <div class="stat-box"><div class="stat-val">{absPage}</div><div class="stat-lbl">Current Page</div></div>
  </div>
</div>

<div class="card">
  <p class="card-title"><Icon name="chart" size={15}/> Recent Daily Reading</p>
  <p class="section-subtitle">Last {chartData.labels.length} days · recorded pages compared with the plan active when saved.</p>
  <div class="chart-wrap" role="img" aria-label="Bar chart of recorded and target pages for the last {chartData.labels.length} days">
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
  </div>
  <details class="chart-data">
    <summary>View daily values</summary>
    <table>
      <thead><tr><th>Day</th><th>Recorded</th><th>Target</th></tr></thead>
      <tbody>{#each chartData.labels as label, i}<tr><th>{label}</th><td>{chartData.actual[i]}</td><td>{chartData.target[i]}</td></tr>{/each}</tbody>
    </table>
  </details>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#d4edd9"></div>Target</div>
    <div class="legend-item"><div class="legend-dot" style="background:#1a6b3e"></div>Recorded</div>
  </div>
</div>

<div class="card">
  <p class="card-title"><Icon name="target" size={15}/> Daily Milestones</p>
  {#if milestoneDays.length === 0}
    <p class="empty-copy">No reading updates yet.</p>
  {:else}
    <div class="milestone-history">
      {#each milestoneDays as day}
        <div class="milestone-history-row">
          <div><strong>{day.date}</strong>{#if day.manualUpdates}<span>{day.manualUpdates} exact update{day.manualUpdates === 1 ? '' : 's'}</span>{/if}</div>
          <div class="dot-row" aria-label={`${day.completed.size} of 5 suggested milestones reached`}>
            {#each ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as prayer, i}
              <span class="dot" class:filled={day.completed.has(i)} title={prayer}></span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<div class="card">
  <p class="card-title"><Icon name="history" size={15}/> Position History</p>
  <div style="max-height:320px;overflow-y:auto">
    {#if historyEntries.length === 0}
      <p style="color:var(--text-muted);font-size:.85rem;padding:8px 0">No progress recorded yet.</p>
    {:else}
      {#each historyEntries as cp}
        <div class="history-row">
          <div>
            <div class="history-day">{cp.date}{cp.time ? ' · ' + cp.time : ''}</div>
            <div class="history-date">{cp.label}</div>
          </div>
          <div class="history-right">
            <div class="history-pages">Page {cp.page}</div>
            <div class="history-sessions">
              {#if cp.pagesAdded > 0}
                +{cp.pagesAdded} page{cp.pagesAdded === 1 ? '' : 's'} since previous
              {:else if cp.positionChanged}
                Advanced within this page
              {:else}
                No position change
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

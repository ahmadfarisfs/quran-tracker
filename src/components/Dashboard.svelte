<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { S, currentAbsPage, effectiveState, saveCheckpoint, getTargetEndDate } from '../lib/store.js';
  import { TOTAL_PAGES, SURAHS, PRAYERS, PRAYERS_AR, PRAYER_ICO } from '../lib/quranData.js';
  import { pageToPos, rangeLabel } from '../lib/quranCalc.js';
  import { fetchPrayerTimes } from '../lib/prayerTimes.js';
  import { todayKey, daysBetween, fmtDate, currentPrayerIdx, fmtPT } from '../lib/utils.js';

  const dispatch = createEventDispatcher();
  const PRAYER_KEYS = ['fajr','dhuhr','asr','maghrib','isha'];

  let prayerTimes = null;
  let cpSurahNum = 0;
  let cpAyat = 1;
  let cpMaxAyat = 286;

  // Reactive computations from store
  $: st = $effectiveState;
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
  $: daysLeft = (() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tgt = getTargetEndDate($S); tgt.setHours(0,0,0,0);
    return Math.max(0, Math.ceil((tgt - today) / 86400000));
  })();
  $: daysSinceBase = daysBetween(st.baseDate, todayKey());
  $: expectedPage = Math.min(TOTAL_PAGES, st.basePage + daysSinceBase * 5 * st.pps);
  $: behindPages = Math.max(0, Math.round(expectedPage - absPage));
  $: behindSess = behindPages > 0 ? Math.max(1, Math.round(behindPages / Math.max(st.pps, 0.1))) : 0;
  $: C = 2 * Math.PI * 45;
  $: ringOffset = C - (oPct / 100) * C;
  $: curPray = currentPrayerIdx();
  $: lastCp = ($S.checkpoints || []).slice(-1)[0] || null;
  $: curPos = pageToPos(absPage);
  $: cpMaxAyat = cpSurahNum ? (SURAHS.find(s => s[0] === cpSurahNum)?.[3] || 286) : 286;
  $: isComplete = read >= totalKhatam;

  $: prayerCards = PRAYERS.map((name, i) => {
    const gSess = daysSinceBase * 5 + i;
    const spg = st.basePage + gSess * st.pps;
    const epg = st.basePage + (gSess + 1) * st.pps;
    return { name, ar: PRAYERS_AR[i], icon: PRAYER_ICO[i], rng: rangeLabel(spg, epg), idx: i };
  });

  onMount(() => {
    // Pre-fill record form with current position
    cpSurahNum = curPos.num;
    cpAyat = curPos.ayat;
    // Fetch prayer times if location is set
    if ($S.location?.lat) {
      fetchPrayerTimes($S.location.lat, $S.location.lng, $S.location.method).then(t => {
        prayerTimes = t;
      });
    }
  });

  function handleSurahChange() {
    const s = SURAHS.find(x => x[0] === cpSurahNum);
    if (s) { cpMaxAyat = s[3]; if (cpAyat > cpMaxAyat) cpAyat = cpMaxAyat; }
  }

  function handleSave() {
    if (!cpSurahNum) { alert('Please select a surah.'); return; }
    saveCheckpoint(cpSurahNum, Math.max(1, Math.min(parseInt(cpAyat) || 1, cpMaxAyat)));
  }

  function newKhatam() {
    S.reset();
  }
</script>

{#if isComplete}
  <div class="completion-wrap">
    <span class="completion-icon">🌙</span>
    <h2 class="completion-title">ماشاء الله!</h2>
    <p class="completion-dua">الحمد لله رب العالمين</p>
    <p class="completion-text">
      Congratulations! You have completed the Holy Quran in <strong>{$S.targetDays} days</strong>.
      May Allah accept your recitation, grant you its blessings, and make it a light for you
      on the Day of Judgement.
    </p>
    <br>
    <button class="btn-primary" style="margin-top:24px" on:click={newKhatam}>
      Start New Khatam 🌙
    </button>
  </div>
{:else}
  <!-- Today header -->
  <div class="today-hdr">
    <div class="today-date">{fmtDate(new Date())}</div>
    <div class="today-day">Day {dayN} of {$S.targetDays}</div>
    <div class="today-pages">{absPage} / {TOTAL_PAGES} pages overall ({oPct}%)</div>
  </div>

  <!-- Warning bar -->
  {#if behindSess > 0}
    <div class="warning-bar">
      ⚠️ You're <strong>&nbsp;~{behindSess} session{behindSess > 1 ? 's' : ''} behind schedule&nbsp;</strong>. Record progress to recalculate!
    </div>
  {/if}

  <!-- Currently Reading card -->
  <div class="current-reading-card">
    <div class="cr-label">📖 Currently Reading</div>
    <div class="cr-surah-ar">{curPos.ar}</div>
    <div class="cr-surah-en">{curPos.en}</div>
    <div class="cr-meta">
      <span class="cr-meta-item">Ayat {curPos.ayat}</span>
      <span class="cr-meta-item">Page {absPage}</span>
      <span class="cr-meta-item">{kPct}% complete</span>
    </div>
    <div class="cr-updated">
      {#if lastCp}
        Last updated {lastCp.date}{lastCp.time ? ' · ' + lastCp.time : ''}
      {:else}
        Not yet recorded — save your first position below
      {/if}
    </div>
  </div>

  <!-- Record Progress card -->
  <div class="card record-card">
    <p class="card-title">📍 Record My Progress</p>
    <p class="record-hint">Where did you stop reading today?</p>
    <div class="record-form-row">
      <select class="form-input" bind:value={cpSurahNum} on:change={handleSurahChange} style="flex:2;padding-right:8px">
        <option value={0}>— Select Surah —</option>
        {#each SURAHS as s}
          <option value={s[0]}>{s[0]}. {s[2]} — {s[1]}</option>
        {/each}
      </select>
      <input type="number" class="form-input" bind:value={cpAyat} min="1" max={cpMaxAyat} placeholder="Ayat (1–{cpMaxAyat})" style="flex:1;min-width:72px">
    </div>
    <button class="btn-primary record-btn" on:click={handleSave}>✓ Save &amp; Update Schedule</button>
  </div>

  <!-- Progress ring + stats -->
  <div class="card">
    <p class="card-title">✦ This Khatam Progress</p>
    <div class="ring-wrap">
      <div class="ring-svg-wrap">
        <svg width="160" height="160" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e0f0e8" stroke-width="9"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a6b3e" stroke-width="9"
            stroke-linecap="round"
            stroke-dasharray="{C.toFixed(2)}"
            stroke-dashoffset="{ringOffset.toFixed(2)}"
            style="transition:stroke-dashoffset 1.2s ease"/>
        </svg>
        <div class="ring-text">
          <div class="ring-pct">{oPct}%</div>
          <div class="ring-lbl">Of Quran</div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-val">{read}</div><div class="stat-lbl">Pages Read</div></div>
        <div class="stat-box"><div class="stat-val">{TOTAL_PAGES - $S.startPage + 1 - read}</div><div class="stat-lbl">Pages Left</div></div>
        <div class="stat-box"><div class="stat-val">{kPct}%</div><div class="stat-lbl">Khatam Done</div></div>
        <div class="stat-box"><div class="stat-val">{daysLeft}</div><div class="stat-lbl">Days Left</div></div>
      </div>
    </div>
  </div>

  <!-- Prayer Schedule card -->
  <div class="card">
    <p class="card-title">🕌 Today's Prayer Schedule</p>
    <div class="ornament">✦ ✦ ✦</div>
    {#if $S.location?.name}
      <div class="location-tag">📍 {$S.location.name}</div>
    {:else}
      <div class="location-tag" style="opacity:.5">
        📍 <button type="button" on:click={() => dispatch('navigate', 'settings')} style="color:var(--green);cursor:pointer;background:none;border:none;font:inherit;padding:0;text-decoration:underline">Set location for prayer times</button>
      </div>
    {/if}
    <p class="schedule-hint">Reading targets for each prayer — for guidance only</p>

    {#each prayerCards as card, i}
      {@const cls = i === curPray ? 'current' : (i < curPray ? 'past' : 'upcoming')}
      <div class="prayer-card {cls}">
        <div class="prayer-icon-wrap">{card.icon}</div>
        <div class="prayer-body">
          <div class="prayer-name-row">
            <span class="prayer-name-en">{card.name}</span>
            <span class="prayer-name-ar">{card.ar}</span>
            {#if prayerTimes}
              <span class="prayer-time-badge">{fmtPT(prayerTimes[PRAYER_KEYS[i]])}</span>
            {/if}
          </div>
          {#if !card.rng}
            <div class="prayer-range">✨ Already khatam!</div>
          {:else if card.rng.startNum === card.rng.endNum}
            <div class="prayer-range">
              <span class="ar">{card.rng.startAr}</span> ({card.rng.startEn})
              ayat <strong>{card.rng.startAyat}</strong> – <strong>{card.rng.endAyat}</strong>
            </div>
            <span class="prayer-pages-tag">📄 Pg {card.rng.startPg}–{card.rng.endPg} · {card.rng.pages} pages</span>
          {:else}
            <div class="prayer-range">
              <span class="ar">{card.rng.startAr}</span> ({card.rng.startEn}) {card.rng.startAyat}
              → <span class="ar">{card.rng.endAr}</span> ({card.rng.endEn}) {card.rng.endAyat}
            </div>
            <span class="prayer-pages-tag">📄 Pg {card.rng.startPg}–{card.rng.endPg} · {card.rng.pages} pages</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

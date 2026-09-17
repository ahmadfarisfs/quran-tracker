<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    S, currentAbsPage, currentPosition, effectiveState, ensureDailySchedule,
    saveCheckpoint, getTargetEndDate, replanFromToday
  } from '../lib/store.js';
  import { TOTAL_PAGES, SURAHS, PRAYERS, PRAYERS_AR, PRAYER_ICO } from '../lib/quranData.js';
  import { isQuranComplete, quranProgressPercent, rangeLabel } from '../lib/quranCalc.js';
  import { fetchPrayerTimes } from '../lib/prayerTimes.js';
  import { todayKey, daysBetween, startOfLocalDay, fmtDate, currentPrayerIdx, fmtPT } from '../lib/utils.js';
  import Icon from './Icon.svelte';

  const dispatch = createEventDispatcher();
  const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  let prayerTimes = null;
  let prayerTimesUnavailable = false;
  let cpSurahNum = 0;
  let cpAyat = 1;
  let cpMaxAyat = 286;
  let saveMsg = '';
  let formError = '';
  let recoveryDays = 30;

  $: st = $effectiveState;
  $: absPage = $currentAbsPage;
  $: curPos = $currentPosition;
  $: isComplete = isQuranComplete(curPos);
  $: trackedPages = Math.max(0, absPage - $S.startPage);
  $: quranPct = quranProgressPercent(absPage, isComplete);
  $: dayN = Math.max(1, daysBetween($S.startDate, todayKey()) + 1);
  $: today = startOfLocalDay();
  $: targetEnd = getTargetEndDate($S);
  $: targetMissed = !isComplete && targetEnd < today;
  $: daysLeft = Math.max(0, daysBetween(todayKey(today), todayKey(targetEnd)));
  $: overdueDays = targetMissed ? Math.max(1, daysBetween(todayKey(targetEnd), todayKey(today))) : 0;
  $: recoveryActive = Boolean($S.planBaseDate);
  $: recoveryDay = recoveryActive ? Math.max(1, daysBetween($S.planBaseDate, todayKey()) + 1) : 0;
  $: recoveryLength = recoveryActive ? Math.max(1, daysBetween($S.planBaseDate, todayKey(targetEnd))) : 0;
  $: daysSinceBase = Math.max(0, daysBetween(st.baseDate, todayKey()));
  $: expectedPage = Math.min(TOTAL_PAGES, st.basePage + Math.max(0, daysSinceBase - 1) * 5 * st.pps);
  $: behindPages = targetMissed ? 0 : Math.max(0, Math.round(expectedPage - absPage));
  $: behindSess = behindPages > 0 ? Math.max(1, Math.round(behindPages / Math.max(st.pps, 0.1))) : 0;
  $: curPray = currentPrayerIdx(prayerTimes);
  $: checkpoints = $S.checkpoints || [];
  $: lastCp = checkpoints[checkpoints.length - 1] || null;
  $: remainingPages = isComplete ? 0 : Math.max(0, TOTAL_PAGES - absPage + 1);
  $: recoveryDaily = remainingPages / Math.max(1, parseInt(recoveryDays) || 1);
  $: todayKeyValue = todayKey();
  $: schedule = $S.dailySchedule?.date === todayKeyValue
    ? $S.dailySchedule
    : {
        basePage: st.basePage,
        pagesPerSession: st.pps,
        startSurahNum: curPos.num,
        startAyat: curPos.ayat
      };
  $: prayerCards = targetMissed ? [] : PRAYERS.map((name, i) => {
    const spg = schedule.basePage + i * schedule.pagesPerSession;
    const epg = schedule.basePage + (i + 1) * schedule.pagesPerSession;
    let rng = rangeLabel(spg, epg);
    if (i === 0 && rng && schedule.startSurahNum && schedule.startAyat) {
      const s = SURAHS.find(item => item[0] === schedule.startSurahNum);
      rng = { ...rng, startNum: s[0], startAr: s[1], startEn: s[2], startAyat: schedule.startAyat };
    }
    const explicitlySaved = checkpoints.some(cp => cp.date === todayKeyValue && cp.prayerIndex === i);
    const reachedByExactUpdate = lastCp?.date === todayKeyValue && rng && positionAtOrAfter(curPos, rng);
    return {
      name, ar: PRAYERS_AR[i], icon: PRAYER_ICO[i], rng, idx: i,
      completed: explicitlySaved || reachedByExactUpdate
    };
  });
  $: completedMilestones = prayerCards.filter(card => card.completed).length;

  function positionAtOrAfter(position, range) {
    return position.num > range.endNum || (position.num === range.endNum && position.ayat >= range.endAyat);
  }

  onMount(() => {
    cpSurahNum = curPos.num;
    cpAyat = curPos.ayat;
    cpMaxAyat = SURAHS.find(s => s[0] === cpSurahNum)?.[3] || 286;
    if (!targetMissed) ensureDailySchedule();
    if ($S.location?.lat) {
      fetchPrayerTimes($S.location.lat, $S.location.lng, $S.location.method).then(times => {
        prayerTimes = times;
        prayerTimesUnavailable = !times;
      });
    }
  });

  function handleSurahChange() {
    const s = SURAHS.find(x => x[0] === cpSurahNum);
    if (s) {
      cpMaxAyat = s[3];
      if (cpAyat > cpMaxAyat) cpAyat = cpMaxAyat;
    }
  }

  function handleSave() {
    formError = '';
    if (!cpSurahNum) { formError = 'Select a Surah.'; return; }
    const parsed = parseInt(cpAyat);
    if (!parsed || parsed < 1 || parsed > cpMaxAyat) {
      formError = `Enter an ayah from 1 to ${cpMaxAyat}.`;
      return;
    }
    if (cpSurahNum === curPos.num && parsed === curPos.ayat) {
      saveMsg = 'This is already your current position.';
      return;
    }
    const movingBackward = cpSurahNum < curPos.num || (cpSurahNum === curPos.num && parsed < curPos.ayat);
    if (movingBackward && !confirm('This position is before your current bookmark. Save it as a correction?')) return;
    saveCheckpoint(cpSurahNum, parsed, { source: 'manual', correction: movingBackward });
    saveMsg = 'Exact position saved.';
    setTimeout(() => saveMsg = '', 2500);
  }

  function markMilestone(card) {
    if (!card.rng || card.completed) return;
    saveCheckpoint(card.rng.endNum, card.rng.endAyat, {
      source: 'prayer', prayerIndex: card.idx, prayerName: card.name
    });
    cpSurahNum = card.rng.endNum;
    cpAyat = card.rng.endAyat;
    cpMaxAyat = SURAHS.find(s => s[0] === cpSurahNum)?.[3] || cpMaxAyat;
    saveMsg = `${card.name} milestone saved.`;
    setTimeout(() => saveMsg = '', 2500);
  }

  function newKhatam() {
    if (confirm('Start a new Khatam? This clears the completed journey and opens setup.')) S.reset();
  }

  function handleReplan() {
    recoveryDays = Math.max(1, Math.min(730, parseInt(recoveryDays) || 30));
    replanFromToday(recoveryDays);
    setTimeout(ensureDailySchedule, 0);
  }
</script>

{#if isComplete}
  <div class="completion-wrap">
    <span class="completion-icon"><Icon name="moon" size={76} strokeWidth={1.4}/></span>
    <h2 class="completion-title">ماشاء الله!</h2>
    <p class="completion-dua">الحمد لله رب العالمين</p>
    <p class="completion-text">You reached An-Nas, ayah 6 and completed this Khatam. May Allah accept your recitation and make it a light for you.</p>
    <button class="btn-primary" style="margin-top:24px" on:click={newKhatam}>Start a New Khatam</button>
  </div>
{:else}
  <section class="today-hdr" aria-labelledby="today-heading">
    <div class="today-date">{fmtDate(new Date())}</div>
    <h2 id="today-heading" class="today-day" class:missed={targetMissed}>
      {#if targetMissed}
        Day {dayN} · target missed
      {:else if recoveryActive}
        Recovery day {recoveryDay} of {recoveryLength}
      {:else}
        Day {dayN} of {$S.targetDays}
      {/if}
    </h2>
    <div class="today-pages">Page {absPage} of {TOTAL_PAGES} · {quranPct}% of Quran</div>
  </section>

  {#if targetMissed}
    <section class="card missed-target-card" aria-labelledby="missed-title">
      <div class="missed-target-heading">
        <Icon name="warning" size={24}/>
        <div>
          <strong id="missed-title">Your target ended {overdueDays} day{overdueDays === 1 ? '' : 's'} ago</strong>
          <span>{remainingPages} pages remain from your current position.</span>
        </div>
      </div>
      <p>Choose a new time frame. Suggestions will restart from page {absPage}; you can still read and update progress at any time.</p>
      <div class="recovery-plan-row">
        <label for="recovery-days">Finish in</label>
        <input id="recovery-days" type="number" class="form-input" bind:value={recoveryDays} min="1" max="730">
        <span>days</span>
      </div>
      <div class="recovery-preview">{recoveryDaily.toFixed(1)} pages/day · {(recoveryDaily / 5).toFixed(1)} per milestone</div>
      <button class="btn-primary icon-button" on:click={handleReplan}><Icon name="refresh" size={18}/> Create Recovery Plan</button>
    </section>
  {:else if behindSess > 0}
    <div class="warning-bar" role="status">
      <Icon name="warning" size={18}/>
      <span><strong>About {behindPages} pages behind plan.</strong> Any progress update recalculates the remaining pace.</span>
    </div>
  {/if}

  <section class="current-reading-card" aria-labelledby="current-reading-title">
    <div class="cr-label" id="current-reading-title"><Icon name="book" size={15}/> Current position</div>
    <div class="cr-surah-row">
      <div>
        <div class="cr-surah-en">{curPos.en}</div>
        <div class="cr-position">Ayah {curPos.ayat} · Page {absPage}</div>
      </div>
      <div class="cr-surah-ar">{curPos.ar}</div>
    </div>
    <div class="progress-track dark" role="progressbar" aria-label="Quran progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={quranPct}><span style="width:{quranPct}%"></span></div>
    <div class="cr-footer">
      <span>{quranPct}% of Quran</span>
      <span>{lastCp ? `Updated ${lastCp.date}${lastCp.time ? ' · ' + lastCp.time : ''}` : 'No updates yet'}</span>
    </div>
    <button id="open-reader" type="button" class="reader-entry-button" on:click={() => dispatch('navigate', 'reader')}>
      <Icon name="book" size={18}/>
      <span><strong>Read from this bookmark</strong><small>Open the Medina Mushaf at page {absPage}</small></span>
      <Icon name="arrow-right" size={18}/>
    </button>
  </section>

  {#if !targetMissed}
    <section class="card today-plan-card" aria-labelledby="plan-heading">
      <div class="section-heading-row">
        <div>
          <h2 class="card-title" id="plan-heading"><Icon name="target" size={16}/> Today's suggested milestones</h2>
          <p class="section-subtitle">Read whenever it suits you. These five stops simply divide today’s target.</p>
        </div>
        <span class="completion-count">{completedMilestones}/5</span>
      </div>
      <div class="schedule-meta">
        {#if $S.location?.name}
          <span><Icon name="map-pin" size={14}/> {$S.location.name}</span>
        {:else}
          <button type="button" class="text-button" on:click={() => dispatch('navigate', 'settings')}><Icon name="map-pin" size={14}/> Add prayer times</button>
        {/if}
        {#if prayerTimesUnavailable}<span class="meta-warning">Times unavailable</span>{/if}
      </div>
      <div class="prayer-list">
        {#each prayerCards as card, i}
          <button
            type="button"
            class="prayer-card"
            class:current={i === curPray && !card.completed}
            class:completed={card.completed}
            disabled={card.completed || !card.rng}
            aria-pressed={card.completed}
            on:click={() => markMilestone(card)}
          >
            <span class="prayer-icon-wrap"><Icon name={card.completed ? 'check' : card.icon} size={23} strokeWidth={1.8}/></span>
            <span class="prayer-body">
              <span class="prayer-name-row">
                <span class="prayer-name-en">{card.name}</span>
                <span class="prayer-name-ar">{card.ar}</span>
                {#if prayerTimes}<span class="prayer-time-badge">{fmtPT(prayerTimes[PRAYER_KEYS[i]])}</span>{/if}
              </span>
              {#if !card.rng}
                <span class="prayer-range">Khatam complete</span>
              {:else if card.rng.startNum === card.rng.endNum}
                <span class="prayer-range"><span class="ar">{card.rng.startAr}</span> ({card.rng.startEn}) {card.rng.startAyat}–{card.rng.endAyat}</span>
              {:else}
                <span class="prayer-range"><span class="ar">{card.rng.startAr}</span> {card.rng.startAyat} → <span class="ar">{card.rng.endAr}</span> {card.rng.endAyat}</span>
              {/if}
              {#if card.rng}<span class="prayer-pages-tag"><Icon name="file" size={13}/> Pages {card.rng.startPg}–{card.rng.endPg}</span>{/if}
            </span>
            <span class="milestone-action">{card.completed ? 'Reached' : 'Mark read'}</span>
          </button>
        {/each}
      </div>
      <p class="schedule-footnote">Stopped between milestones? Save your exact Surah and ayah below.</p>
    </section>
  {/if}

  <section class="card record-card" aria-labelledby="record-heading">
    <h2 class="card-title" id="record-heading"><Icon name="map-pin" size={15}/> Update exact position</h2>
    <p class="record-hint">Use this whenever you read outside the suggested milestones.</p>
    <div class="record-form-row">
      <div class="record-field grow"><label for="progress-surah">Surah</label><select id="progress-surah" class="form-input" bind:value={cpSurahNum} on:change={handleSurahChange}>
        <option value={0}>Select Surah</option>
        {#each SURAHS as s}<option value={s[0]}>{s[0]}. {s[2]} — {s[1]}</option>{/each}
      </select></div>
      <div class="record-field"><label for="progress-ayah">Ayah</label><input id="progress-ayah" type="number" class="form-input" bind:value={cpAyat} min="1" max={cpMaxAyat} aria-describedby={formError ? 'progress-error' : undefined}></div>
    </div>
    {#if formError}<p id="progress-error" class="form-error" role="alert">{formError}</p>{/if}
    <button class="btn-primary record-btn icon-button" on:click={handleSave}><Icon name="check" size={17}/> Save Exact Position</button>
    <div class="status-message" aria-live="polite">{saveMsg}</div>
  </section>

  <section class="card progress-summary" aria-labelledby="progress-heading">
    <div class="section-heading-row">
      <div>
        <h2 class="card-title" id="progress-heading"><Icon name="chart" size={15}/> Quran progress</h2>
        <p class="section-subtitle">Page {absPage} of {TOTAL_PAGES} · {trackedPages} pages recorded since tracking began.</p>
      </div>
      <strong class="summary-percent">{quranPct}%</strong>
    </div>
    <div class="progress-track" role="progressbar" aria-label="Quran progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={quranPct}><span style="width:{quranPct}%"></span></div>
    <div class="stats-grid compact">
      <div class="stat-box"><div class="stat-val">{remainingPages}</div><div class="stat-lbl">Pages left</div></div>
      <div class="stat-box overdue" class:active={targetMissed}><div class="stat-val">{targetMissed ? overdueDays : daysLeft}</div><div class="stat-lbl">{targetMissed ? 'Days overdue' : 'Days left'}</div></div>
    </div>
  </section>
{/if}

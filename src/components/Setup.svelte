<script>
  import { S } from '../lib/store.js';
  import { SURAHS, TOTAL_PAGES } from '../lib/quranData.js';
  import { surahAyatToPage } from '../lib/quranCalc.js';
  import { todayKey } from '../lib/utils.js';

  let mode = 'days'; // 'days' | 'date'
  let inpDays = 30;
  let inpTargetDate = '';
  let targetDateHint = 'Pick the date you want to finish by.';
  let inpStartSurah = '';
  let inpStartAyat = '';
  let inpDate = todayKey();
  let cpMaxAyat = 286;

  // Preview computed values
  $: targetDays = getTargetDays();
  $: startInfo = resolveStart();
  $: pvPages = TOTAL_PAGES - startInfo.startPage + 1;
  $: pvDaily = (pvPages / targetDays).toFixed(1);
  $: pvSession = (pvPages / targetDays / 5).toFixed(1);
  $: pvJuz = (pvPages / targetDays / 20).toFixed(2);

  function getTargetDays() {
    if (mode === 'date' && inpTargetDate && inpDate) {
      return Math.max(1, Math.ceil((new Date(inpTargetDate) - new Date(inpDate)) / 86400000));
    }
    return Math.max(1, parseInt(inpDays) || 30);
  }

  function resolveStart() {
    const sNum = parseInt(inpStartSurah);
    if (!sNum) return { startPage: 1, startSurahNum: null, startAyat: null, label: 'Al-Fatihah : 1' };
    const s = SURAHS.find(x => x[0] === sNum);
    let ayat = parseInt(inpStartAyat) || 1;
    ayat = Math.max(1, Math.min(ayat, s[3]));
    const pg = surahAyatToPage(sNum, ayat);
    return { startPage: pg, startSurahNum: sNum, startAyat: ayat, label: `${s[2]} (${s[1]}) : ${ayat}` };
  }

  function onSurahChange() {
    const sNum = parseInt(inpStartSurah);
    if (!sNum) { cpMaxAyat = 286; return; }
    const s = SURAHS.find(x => x[0] === sNum);
    if (s) {
      cpMaxAyat = s[3];
      if (parseInt(inpStartAyat) > s[3]) inpStartAyat = String(s[3]);
    }
  }

  function onTargetDateChange() {
    if (inpTargetDate && inpDate) {
      const days = Math.max(1, Math.ceil((new Date(inpTargetDate) - new Date(inpDate)) / 86400000));
      inpDays = days;
      const d = new Date(inpTargetDate);
      targetDateHint = `That's ${days} day${days !== 1 ? 's' : ''} from your start date (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).`;
    }
  }

  function startTracker() {
    const days = getTargetDays();
    if (!days || days < 1 || days > 730) {
      alert('Please set a valid target (1–730 days).');
      return;
    }
    const { startPage, startSurahNum, startAyat, label } = resolveStart();
    const pages           = TOTAL_PAGES - startPage + 1;
    const dailyPages      = pages / days;
    const pagesPerSession = dailyPages / 5;
    const targetDate      = mode === 'date' ? inpTargetDate : null;

    S.set({
      targetDays: days,
      targetDate,
      startDate: inpDate || todayKey(),
      startPage,
      startSurahNum: startSurahNum || 1,
      startAyat: startAyat || 1,
      startLabel: label,
      dailyPages,
      pagesPerSession,
      checkpoints: []
    });
  }
</script>

<div class="setup-hero">
  <span class="setup-icon">📖</span>
  <h2 class="setup-title">بسم الله الرحمن الرحيم</h2>
  <p class="setup-sub">Set your goal to complete the Holy Quran.<br>We'll build a personalised prayer schedule for you.</p>
</div>

<div class="card">
  <div class="form-group">
    <label class="form-label">Target completion</label>
    <div class="toggle-row">
      <button class="toggle-btn {mode === 'days' ? 'active' : ''}" on:click={() => { mode = 'days'; }}>📅 In N days</button>
      <button class="toggle-btn {mode === 'date' ? 'active' : ''}" on:click={() => { mode = 'date'; }}>🗓️ By a date</button>
    </div>

    {#if mode === 'days'}
      <input type="number" class="form-input" bind:value={inpDays} min="1" max="730">
      <p class="form-hint">30 days = 1 month · 7 days = 1 week · 3 days = quick khatam</p>
    {:else}
      <input type="date" class="form-input" bind:value={inpTargetDate} on:change={onTargetDateChange}>
      <p class="form-hint">{targetDateHint}</p>
    {/if}
  </div>

  <div class="form-group">
    <label class="form-label">
      Continue from surah &amp; ayat
      <span class="badge">optional</span>
    </label>
    <div style="display:flex;gap:8px;align-items:stretch">
      <select class="form-input" bind:value={inpStartSurah} on:change={onSurahChange} style="flex:2;padding-right:8px">
        <option value="">Al-Fatihah (Start of Quran)</option>
        {#each SURAHS as s}
          <option value={s[0]}>{s[0]}. {s[2]} — {s[1]}</option>
        {/each}
      </select>
      <input type="number" class="form-input" bind:value={inpStartAyat} min="1" max={cpMaxAyat} placeholder="Ayat" style="flex:1;min-width:72px">
    </div>
    <p class="form-hint">Leave blank to start from the very beginning (Al-Fatihah:1).</p>
  </div>

  <div class="preview-box">
    <div class="preview-row"><span>📄 Pages remaining</span><strong>{pvPages}</strong></div>
    <div class="preview-row"><span>📅 Daily pages needed</span><strong>{pvDaily}</strong></div>
    <div class="preview-row"><span>🕌 Pages per prayer session</span><strong>{pvSession}</strong></div>
    <div class="preview-row"><span>📖 Approx. juz per day</span><strong>{pvJuz}</strong></div>
  </div>

  <div class="form-group">
    <label class="form-label">Start date</label>
    <input type="date" class="form-input" bind:value={inpDate}>
  </div>

  <button class="btn-primary" on:click={startTracker}>بسم الله — Start My Journey ✦</button>
</div>

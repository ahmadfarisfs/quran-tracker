<script>
  import { S, getTargetEndDate } from '../lib/store.js';
  import { pageToPos } from '../lib/quranCalc.js';
  import { currentAbsPage } from '../lib/store.js';

  let locName   = $S?.location?.name   || '';
  let locLat    = $S?.location?.lat    || '';
  let locLng    = $S?.location?.lng    || '';
  let locMethod = $S?.location?.method || 'MWL';
  let locStatus = '';

  $: pos = pageToPos($currentAbsPage);
  $: effPPS = (() => {
    if (!$S) return 0;
    const cps = $S.checkpoints || [];
    if (cps.length === 0) return $S.pagesPerSession;
    const last = cps[cps.length - 1];
    const today = new Date(); today.setHours(0,0,0,0);
    const tgt = getTargetEndDate($S); tgt.setHours(0,0,0,0);
    const daysLeft = Math.max(1, Math.ceil((tgt - today) / 86400000));
    return (604 - last.page + 1) / daysLeft / 5;
  })();

  function saveLocation() {
    const name = locName.trim();
    const lat  = parseFloat(locLat);
    const lng  = parseFloat(locLng);
    if (!name || isNaN(lat) || isNaN(lng)) { locStatus = 'Please fill in all fields.'; return; }
    S.update(s => ({ ...s, location: { name, lat, lng, method: locMethod } }));
    locStatus = '✓ Location saved!';
    setTimeout(() => locStatus = '', 2000);
  }

  function detectLoc() {
    if (!navigator.geolocation) { locStatus = 'Geolocation not supported.'; return; }
    locStatus = '📡 Detecting…';
    navigator.geolocation.getCurrentPosition(
      p => {
        locLat = p.coords.latitude.toFixed(4);
        locLng = p.coords.longitude.toFixed(4);
        locStatus = `✓ Coords: ${(+locLat).toFixed(2)}, ${(+locLng).toFixed(2)}`;
      },
      () => { locStatus = 'Could not detect. Enter manually.'; }
    );
  }

  function resetAll() {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    S.reset();
  }
</script>

{#if $S}
  <!-- Your Plan -->
  <div class="card">
    <p class="card-title">⚙️ Your Plan</p>
    <div class="settings-row"><span class="settings-label">Target days</span><span class="settings-val">{$S.targetDays} days</span></div>
    <div class="settings-row"><span class="settings-label">Start date</span><span class="settings-val">{$S.startDate}</span></div>
    {#if $S.targetDate}
      <div class="settings-row"><span class="settings-label">Target finish</span><span class="settings-val">{$S.targetDate}</span></div>
    {/if}
    <div class="settings-row"><span class="settings-label">Starting position</span><span class="settings-val">{$S.startLabel || 'Al-Fatihah : 1'}</span></div>
    <div class="settings-row"><span class="settings-label">Daily pages</span><span class="settings-val">{$S.dailyPages.toFixed(1)} pages</span></div>
    <div class="settings-row"><span class="settings-label">Original pg/session</span><span class="settings-val">{$S.pagesPerSession.toFixed(1)} pages</span></div>
    <div class="settings-row"><span class="settings-label">Current pg/session</span><span class="settings-val">{effPPS.toFixed(1)} pages</span></div>
    <div class="settings-row"><span class="settings-label">Current position</span><span class="settings-val">{pos.ar} : {pos.ayat}</span></div>
    {#if ($S.checkpoints || []).length > 0}
      <div style="margin-top:12px">
        <p style="font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:8px">Position Updates</p>
        {#each $S.checkpoints as cp}
          <div style="font-size:.78rem;padding:6px 0;border-bottom:1px solid var(--green-bg);display:flex;justify-content:space-between">
            <span style="color:var(--text-muted)">{cp.date}{cp.time ? ' · ' + cp.time : ''}</span>
            <span style="color:var(--green);font-weight:600">{cp.label}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Prayer Times Location -->
  <div class="card">
    <p class="card-title">📍 Prayer Times Location</p>
    <p style="font-size:.82rem;color:var(--text-muted);margin-bottom:12px">
      Used to fetch accurate prayer times from AlAdhan.com.
    </p>
    <div class="loc-row">
      <input type="text" class="form-input" bind:value={locName} placeholder="City name (e.g. Kuala Lumpur)" style="flex:2">
      <button class="btn-secondary" on:click={detectLoc} style="white-space:nowrap;padding:0 14px">📡 Auto-detect</button>
    </div>
    <div class="loc-row">
      <input type="number" class="form-input" bind:value={locLat} placeholder="Latitude"  step="0.0001" style="flex:1">
      <input type="number" class="form-input" bind:value={locLng} placeholder="Longitude" step="0.0001" style="flex:1">
    </div>
    <div class="loc-row">
      <select class="form-input" bind:value={locMethod}>
        <option value="MWL">Muslim World League (MWL)</option>
        <option value="ISNA">ISNA (North America)</option>
        <option value="Karachi">Karachi / Hanafi</option>
        <option value="Egypt">Egyptian Authority</option>
        <option value="Makkah">Umm Al-Qura (Makkah)</option>
      </select>
    </div>
    <button class="btn-primary" style="width:100%" on:click={saveLocation}>✓ Save Location</button>
    {#if locStatus}
      <div style="font-size:.78rem;color:var(--green);margin-top:8px">{locStatus}</div>
    {/if}
  </div>

  <!-- Danger Zone -->
  <div class="card">
    <p class="card-title">⚠️ Danger Zone</p>
    <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:14px">This will erase all your progress permanently.</p>
    <button class="btn-danger" on:click={resetAll}>🗑️ Reset All Progress</button>
  </div>
{/if}

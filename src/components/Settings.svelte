<script>
  import { S, currentPosition, effectiveState } from '../lib/store.js';
  import { daysBetween } from '../lib/utils.js';
  import Icon from './Icon.svelte';

  let locName   = $S?.location?.name   || '';
  let locLat    = $S?.location?.lat    || '';
  let locLng    = $S?.location?.lng    || '';
  // Backward compat: old installs stored string keys
  const LEGACY_METHOD = { MWL: 3, ISNA: 2, Egypt: 5, Karachi: 1, Makkah: 4 };
  const rawMethod = $S?.location?.method;
  let locMethod = typeof rawMethod === 'number' ? rawMethod : (LEGACY_METHOD[rawMethod] ?? 3);
  let locStatus = '';

  $: pos = $currentPosition;
  $: effPPS = $effectiveState.expired ? null : $effectiveState.pps;
  $: currentPlanDays = $S?.planBaseDate && $S?.targetDate
    ? Math.max(1, daysBetween($S.planBaseDate, $S.targetDate))
    : $S?.targetDays;

  function saveLocation() {
    const name = locName.trim();
    const lat  = parseFloat(locLat);
    const lng  = parseFloat(locLng);
    if (!name || isNaN(lat) || isNaN(lng)) { locStatus = 'Please fill in all fields.'; return; }
    S.update(s => ({ ...s, location: { name, lat, lng, method: locMethod } }));
    locStatus = 'Location saved.';
    setTimeout(() => locStatus = '', 2000);
  }

  async function detectLoc() {
    if (!navigator.geolocation) { locStatus = 'Geolocation not supported.'; return; }
    locStatus = 'Detecting location…';
    navigator.geolocation.getCurrentPosition(
      async p => {
        locLat = p.coords.latitude.toFixed(4);
        locLng = p.coords.longitude.toFixed(4);
        locStatus = 'Resolving city…';
        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locLat}&longitude=${locLng}&localityLanguage=en`;
          const res  = await fetch(url);
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || '';
          const country = data.countryName || '';
          if (city) {
            locName   = country ? `${city}, ${country}` : city;
            locStatus = locName;
          } else {
            locStatus = `Coordinates: ${(+locLat).toFixed(2)}, ${(+locLng).toFixed(2)}`;
          }
        } catch (_) {
          locStatus = `Coordinates: ${(+locLat).toFixed(2)}, ${(+locLng).toFixed(2)}`;
        }
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
    <p class="card-title"><Icon name="settings" size={15}/> Your Plan</p>
    <div class="settings-row"><span class="settings-label">Current plan</span><span class="settings-val">{currentPlanDays} days{$S.planBaseDate ? ' · recovery' : ''}</span></div>
    <div class="settings-row"><span class="settings-label">Start date</span><span class="settings-val">{$S.startDate}</span></div>
    {#if $S.targetDate}
      <div class="settings-row"><span class="settings-label">Target finish</span><span class="settings-val">{$S.targetDate}</span></div>
    {/if}
    <div class="settings-row"><span class="settings-label">Starting position</span><span class="settings-val">{$S.startLabel || 'Al-Fatihah : 1'}</span></div>
    <div class="settings-row"><span class="settings-label">Planned daily pace</span><span class="settings-val">{$S.dailyPages.toFixed(1)} pages</span></div>
    <div class="settings-row"><span class="settings-label">Current milestone pace</span><span class="settings-val">{effPPS === null ? 'Replan on Today' : `${effPPS.toFixed(1)} pages`}</span></div>
    <div class="settings-row"><span class="settings-label">Current position</span><span class="settings-val">{pos.ar} : {pos.ayat}</span></div>
  </div>

  <!-- Prayer Times Location -->
  <div class="card">
    <p class="card-title"><Icon name="map-pin" size={15}/> Prayer Times Location</p>
    <p class="settings-help">Coordinates are stored on this device and sent to AlAdhan only to fetch prayer times. Auto-detect also uses BigDataCloud to identify the city.</p>
    <div class="loc-row">
      <div class="field-wrap grow-2"><label for="location-name">City label</label><input id="location-name" type="text" class="form-input" bind:value={locName} placeholder="e.g. Bandung"></div>
      <button class="btn-secondary icon-button" on:click={detectLoc} style="white-space:nowrap;padding:0 14px"><Icon name="locate" size={16}/> Auto-detect</button>
    </div>
    <div class="loc-row">
      <div class="field-wrap"><label for="location-lat">Latitude</label><input id="location-lat" type="number" class="form-input" bind:value={locLat} step="0.0001"></div>
      <div class="field-wrap"><label for="location-lng">Longitude</label><input id="location-lng" type="number" class="form-input" bind:value={locLng} step="0.0001"></div>
    </div>
    <div class="loc-row">
      <div class="field-wrap grow-1"><label for="calculation-method">Calculation method</label><select id="calculation-method" class="form-input" bind:value={locMethod}>
        <option value={0}>Shia Ithna-Ansari</option>
        <option value={1}>University of Islamic Sciences, Karachi</option>
        <option value={2}>ISNA (North America)</option>
        <option value={3}>Muslim World League (MWL)</option>
        <option value={4}>Umm Al-Qura University, Makkah</option>
        <option value={5}>Egyptian General Authority of Survey</option>
        <option value={6}>Institute of Geophysics, Tehran</option>
        <option value={7}>Gulf Region</option>
        <option value={8}>Kuwait</option>
        <option value={9}>Qatar</option>
        <option value={10}>Majlis Ugama Islam Singapura (MUIS)</option>
        <option value={11}>Union des Organisations Islamiques de France</option>
        <option value={12}>Diyanet İşleri Başkanlığı, Turkey</option>
        <option value={13}>Spiritual Administration of Muslims of Russia</option>
        <option value={14}>Moonsighting Committee Worldwide</option>
        <option value={15}>Dubai (experimental)</option>
        <option value={16}>JAKIM, Malaysia</option>
        <option value={17}>Tunisia</option>
        <option value={18}>Algeria</option>
        <option value={19}>KEMENAG, Indonesia</option>
        <option value={20}>Morocco</option>
        <option value={21}>Comunidade Islamica de Lisboa</option>
        <option value={22}>Ministry of Awqaf, Jordan</option>
      </select></div>
    </div>
    <button class="btn-primary icon-button" style="width:100%" on:click={saveLocation}><Icon name="check" size={17}/> Save Location</button>
    {#if locStatus}
      <div class="status-message" aria-live="polite">{locStatus}</div>
    {/if}
  </div>

  <!-- Danger Zone -->
  <div class="card">
    <p class="card-title"><Icon name="warning" size={15}/> Reset Tracker</p>
    <p class="settings-help">Clears this Khatam plan and its progress history from this device.</p>
    <button class="btn-danger icon-button" on:click={resetAll}><Icon name="trash" size={16}/> Reset All Progress</button>
  </div>
{/if}

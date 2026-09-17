<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { currentAbsPage, currentPosition, saveCheckpoint } from '../lib/store.js';
  import { lastAyatOnPage, pageToPos } from '../lib/quranCalc.js';
  import { SURAHS, TOTAL_PAGES } from '../lib/quranData.js';
  import Icon from './Icon.svelte';

  const dispatch = createEventDispatcher();
  const ASSET_VERSION = 'v1.1.1';
  const PAGE_BASE = `https://cdn.quran.ws/svg/pages/${ASSET_VERSION}/hafs-kfqc`;
  const META_BASE = `https://raw.githubusercontent.com/quran-ws/quran-svg/${ASSET_VERSION}/mushafs/hafs/kfqc/json`;

  let page = $currentAbsPage;
  let pageMeta = [];
  let selected = null;
  let metadataLoading = true;
  let imageLoading = true;
  let metadataError = '';
  let imageError = '';
  let status = '';
  let requestId = 0;
  let retryKey = 0;
  let closeButton;

  $: bookmark = $currentPosition;
  $: bookmarkPage = $currentAbsPage;
  $: first = pageToPos(page);
  $: last = lastAyatOnPage(page);
  $: pageLabel = formatRange(first, last);
  $: pageKey = String(page).padStart(3, '0');
  $: pageAssetUrl = `${PAGE_BASE}/${pageKey}.svg`;
  $: sameAsBookmark = selected && selected.surahNumber === bookmark.num && selected.ayahNumber === bookmark.ayat;
  $: selectedSurah = selected ? SURAHS.find(s => s[0] === selected.surahNumber) : null;
  $: if (page) loadMetadata(page, retryKey);

  onMount(() => {
    closeButton?.focus();
    return () => { requestId += 1; };
  });

  function formatRange(start, end) {
    if (start.num === end.num) return `${start.en} · ayah ${start.ayat}–${end.ayat}`;
    return `${start.en} ${start.ayat} – ${end.en} ${end.ayat}`;
  }

  async function loadMetadata(targetPage, retry) {
    const id = ++requestId;
    metadataLoading = true;
    metadataError = '';
    pageMeta = [];
    selected = null;
    status = '';
    try {
      const suffix = retry ? `?retry=${retry}` : '';
      const response = await fetch(`${META_BASE}/${String(targetPage).padStart(3, '0')}.json${suffix}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.some(item => !item.polygon || !item.surahNumber || !item.ayahNumber)) {
        throw new Error('Invalid overlay data');
      }
      if (id === requestId) pageMeta = data;
    } catch (_) {
      if (id === requestId) metadataError = 'Ayah selection is unavailable. Check your connection and retry.';
    } finally {
      if (id === requestId) metadataLoading = false;
    }
  }

  function goToPage(nextPage) {
    const safe = Math.min(TOTAL_PAGES, Math.max(1, nextPage));
    if (safe === page) return;
    page = safe;
    imageLoading = true;
    imageError = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function retryPage() {
    retryKey += 1;
    imageLoading = true;
    imageError = '';
  }

  function chooseAyah(item) {
    selected = item;
    status = `${surahName(item.surahNumber)}, ayah ${item.ayahNumber} selected. Progress has not been saved yet.`;
  }

  function activateAyah(event, item) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      chooseAyah(item);
    }
  }

  function surahName(number) {
    return SURAHS.find(s => s[0] === number)?.[2] || `Surah ${number}`;
  }

  function saveSelection() {
    if (!selected || sameAsBookmark) return;
    const movingBackward = selected.surahNumber < bookmark.num ||
      (selected.surahNumber === bookmark.num && selected.ayahNumber < bookmark.ayat);
    if (movingBackward && !confirm('This ayah is before your current bookmark. Save it as a correction?')) return;
    saveCheckpoint(selected.surahNumber, selected.ayahNumber, { source: 'reader', correction: movingBackward });
    status = `Bookmark saved at ${surahName(selected.surahNumber)}, ayah ${selected.ayahNumber}.`;
    selected = null;
  }

  function handleWindowKeydown(event) {
    if (event.key === 'Escape') dispatch('close');
    if (event.altKey && event.key === 'ArrowLeft') goToPage(page - 1);
    if (event.altKey && event.key === 'ArrowRight') goToPage(page + 1);
  }
</script>

<svelte:window on:keydown={handleWindowKeydown}/>

<div class="reader-shell">
  <header class="reader-toolbar">
    <button bind:this={closeButton} type="button" class="reader-close" on:click={() => dispatch('close')}>
      <Icon name="arrow-left" size={20}/><span>Today</span>
    </button>
    <div class="reader-title">
      <strong>Medina Mushaf</strong>
      <span>Page {page} of {TOTAL_PAGES}</span>
    </div>
    <span class="reader-edition-badge">Hafs</span>
  </header>

  <section class="reader-context" aria-labelledby="reader-page-heading">
    <div>
      <h1 id="reader-page-heading">{pageLabel}</h1>
      <p>Tap an ayah to select a new bookmark. Browsing pages never changes your saved progress.</p>
    </div>
    {#if page === bookmarkPage}
      <span class="bookmark-chip"><Icon name="map-pin" size={14}/> Bookmark page</span>
    {/if}
  </section>

  <div class="mushaf-stage" class:is-loading={imageLoading} aria-busy={imageLoading || metadataLoading}>
    {#if imageLoading && !imageError}
      <div class="mushaf-loading" role="status"><span class="loading-spinner"></span>Loading page {page}…</div>
    {/if}

    {#if imageError}
      <div class="reader-error" role="alert">
        <Icon name="warning" size={24}/>
        <strong>Page could not be loaded</strong>
        <span>Check your connection. Previously opened pages remain available offline.</span>
        <button type="button" class="btn-secondary icon-button" on:click={retryPage}><Icon name="refresh" size={16}/> Retry</button>
      </div>
    {:else}
      {#key `${pageAssetUrl}-${retryKey}`}
        <img
          class="mushaf-page"
          class:loaded={!imageLoading}
          src={pageAssetUrl}
          alt={`Medina Mushaf page ${page}: ${pageLabel}`}
          draggable="false"
          on:load={() => imageLoading = false}
          on:error={() => { imageLoading = false; imageError = 'load-failed'; }}
        >
      {/key}

      {#if !metadataLoading && !metadataError}
        <svg class="ayah-overlay" viewBox="0 0 345 550" aria-label={`Selectable ayat on page ${page}`}>
          {#each pageMeta as item}
            <path
              d={item.polygon}
              role="button"
              tabindex="0"
              aria-label={`${surahName(item.surahNumber)}, ayah ${item.ayahNumber}${item.surahNumber === bookmark.num && item.ayahNumber === bookmark.ayat ? ', current bookmark' : ''}`}
              class:current-ayah={item.surahNumber === bookmark.num && item.ayahNumber === bookmark.ayat}
              class:selected-ayah={selected?.surahNumber === item.surahNumber && selected?.ayahNumber === item.ayahNumber}
              on:click={() => chooseAyah(item)}
              on:keydown={event => activateAyah(event, item)}
            ><title>{surahName(item.surahNumber)}, ayah {item.ayahNumber}</title></path>
          {/each}
        </svg>
      {/if}
    {/if}
  </div>

  {#if metadataLoading && !imageError}
    <p class="overlay-status" role="status">Preparing ayah selection…</p>
  {:else if metadataError && !imageError}
    <div class="overlay-error" role="alert">
      <span>{metadataError}</span>
      <button type="button" class="text-button" on:click={retryPage}>Retry selection layer</button>
    </div>
  {/if}

  <div class="reader-legend" aria-label="Highlight legend">
    <span><i class="legend-swatch current"></i>Saved bookmark</span>
    <span><i class="legend-swatch selected"></i>Selected ayah</span>
  </div>

  {#if selected}
    <section class="bookmark-confirm" aria-labelledby="selected-ayah-heading">
      <div>
        <span class="eyebrow">Selected position</span>
        <h2 id="selected-ayah-heading">{selectedSurah?.[2]} <span lang="ar" dir="rtl">{selectedSurah?.[1]}</span> · Ayah {selected.ayahNumber}</h2>
        <p>{sameAsBookmark ? 'This is already your saved bookmark.' : 'Your bookmark changes only after you save.'}</p>
      </div>
      <div class="bookmark-actions">
        <button type="button" class="btn-secondary" on:click={() => { selected = null; status = 'Selection cleared.'; }}>Cancel</button>
        <button type="button" class="btn-primary icon-button" disabled={sameAsBookmark} on:click={saveSelection}><Icon name="map-pin" size={17}/> Save Bookmark</button>
      </div>
    </section>
  {/if}

  <div class="reader-status sr-only" aria-live="polite">{status}</div>

  <nav class="page-controls" aria-label="Mushaf page navigation">
    <button type="button" class="btn-secondary icon-button" disabled={page === 1} on:click={() => goToPage(page - 1)}><Icon name="arrow-left" size={18}/> Previous</button>
    <span>Page <strong>{page}</strong></span>
    <button type="button" class="btn-secondary icon-button" disabled={page === TOTAL_PAGES} on:click={() => goToPage(page + 1)}>Next <Icon name="arrow-right" size={18}/></button>
  </nav>

  <p class="reader-credit">Mushaf artwork and ayah positions: King Fahd Quran Complex via Quran.ws · Tajweed color edition is planned.</p>
</div>

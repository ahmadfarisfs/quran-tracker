import { TOTAL_PAGES, SURAHS, PAGE_MAP } from './quranData.js';

// Return the first surah:ayat on page pg (integer page lookup).
export function pageToPos(pg) {
  const idx = Math.min(TOTAL_PAGES - 1, Math.max(0, Math.floor(pg) - 1));
  const [num, ayat] = PAGE_MAP[idx];
  const s = SURAHS.find(x => x[0] === num);
  return { num, ar: s[1], en: s[2], ayat };
}

function exactPos(surahNum, ayat) {
  const s = SURAHS.find(x => x[0] === Number(surahNum));
  const a = Number(ayat);
  if (!s || !Number.isInteger(a) || a < 1 || a > s[3]) return null;
  return { num: s[0], ar: s[1], en: s[2], ayat: a };
}

export function isQuranComplete(position) {
  return position?.num === 114 && position?.ayat === 6;
}

// A page contains multiple ayat: keep the exact bookmark even with exact pages.
// The label fallback supports bookmarks made by older app versions.
export function checkpointToPos(checkpoint) {
  const saved = exactPos(checkpoint.surahNum, checkpoint.ayat);
  if (saved) return saved;
  const match = String(checkpoint.label || '').match(/^(.*)\s:\s(\d+)$/);
  if (!match) return null;
  const s = SURAHS.find(x => `${x[2]} (${x[1]})` === match[1]);
  return exactPos(s?.[0], Number(match[2]));
}

export function stateToCurrentPos(state) {
  if (!state) return pageToPos(1);

  const checkpoints = state.checkpoints || [];
  const last = checkpoints[checkpoints.length - 1];
  if (last) {
    return checkpointToPos(last) || pageToPos(last.page);
  }

  return exactPos(state.startSurahNum, state.startAyat) || pageToPos(state.startPage);
}

// Repair stored estimates using the original exact positions. Preserve records
// without an exact position rather than guessing what the reader entered.
export function migratePageData(state) {
  if (!state || state.pageDataVersion === 'tanzil-medina-1.0') return state;
  const start = exactPos(state.startSurahNum, state.startAyat);
  const startPage = start ? surahAyatToPage(start.num, start.ayat) : state.startPage;
  const dailyPages = (TOTAL_PAGES - startPage + 1) / state.targetDays;
  return {
    ...state,
    pageDataVersion: 'tanzil-medina-1.0',
    startPage,
    dailyPages,
    pagesPerSession: dailyPages / 5,
    checkpoints: (state.checkpoints || []).map(cp => {
      const pos = checkpointToPos(cp);
      return pos ? { ...cp, surahNum: pos.num, ayat: pos.ayat,
        page: surahAyatToPage(pos.num, pos.ayat) } : cp;
    })
  };
}

// Return the last surah:ayat on page pg.
export function lastAyatOnPage(pg) {
  pg = Math.min(TOTAL_PAGES, Math.max(1, Math.floor(pg)));
  if (pg >= TOTAL_PAGES) {
    const last = SURAHS[SURAHS.length - 1];
    return { num: last[0], ar: last[1], en: last[2], ayat: last[3] };
  }
  const [nNum, nAyat] = PAGE_MAP[pg]; // first ayah of page pg+1
  if (nAyat > 1) {
    const s = SURAHS.find(x => x[0] === nNum);
    return { num: nNum, ar: s[1], en: s[2], ayat: nAyat - 1 };
  }
  // Next page starts a new surah at ayat 1 → last ayah of this page is end of previous surah
  const prev = SURAHS.find(x => x[0] === nNum - 1);
  if (prev) return { num: prev[0], ar: prev[1], en: prev[2], ayat: prev[3] };
  const cur = SURAHS.find(x => x[0] === nNum);
  return { num: cur[0], ar: cur[1], en: cur[2], ayat: 1 };
}

export function rangeLabel(startPg, endPg) {
  startPg = Math.max(1, startPg);
  endPg   = Math.min(TOTAL_PAGES + 1, endPg);
  if (startPg > TOTAL_PAGES) return null;
  // Snap to integer page boundaries; subtract tiny epsilon so exact integer epg
  // is treated as the end of the previous page, not the start of a new one.
  let iStart = Math.min(TOTAL_PAGES, Math.ceil(startPg));
  let iEnd   = Math.max(1, Math.floor(endPg - 1e-9));
  if (iEnd < iStart) iEnd = iStart; // session smaller than one page
  const a = pageToPos(iStart);
  const b = lastAyatOnPage(iEnd);
  return {
    startNum: a.num, startAr: a.ar, startEn: a.en, startAyat: a.ayat,
    endNum:   b.num, endAr:   b.ar, endEn:   b.en, endAyat:   b.ayat,
    startPg: iStart, endPg: iEnd,
    pages: iEnd - iStart + 1
  };
}

// Look up the exact Medina Mushaf page containing this surah and ayah.
export function surahAyatToPage(surahNum, ayat) {
  // Find the last page whose first ayah is at or before surahNum:ayat
  for (let pg = TOTAL_PAGES; pg >= 1; pg--) {
    const [s, a] = PAGE_MAP[pg - 1];
    if (s < surahNum || (s === surahNum && a <= ayat)) return pg;
  }
  return 1;
}

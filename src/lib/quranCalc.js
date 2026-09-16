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

// Return the exact saved reading position. Pages are only an approximation, so
// converting a saved ayah to a page and back can move the displayed ayah
// backwards. The label fallback keeps bookmarks made by older app versions
// accurate after an upgrade.
export function stateToCurrentPos(state) {
  if (!state) return pageToPos(1);

  const checkpoints = state.checkpoints || [];
  const last = checkpoints[checkpoints.length - 1];
  if (last) {
    const saved = exactPos(last.surahNum, last.ayat);
    if (saved) return saved;

    const match = String(last.label || '').match(/^(.*)\s:\s(\d+)$/);
    if (match) {
      const s = SURAHS.find(x => `${x[2]} (${x[1]})` === match[1]);
      const legacy = exactPos(s?.[0], Number(match[2]));
      if (legacy) return legacy;
    }

    return pageToPos(last.page);
  }

  return exactPos(state.startSurahNum, state.startAyat) || pageToPos(state.startPage);
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
  endPg   = Math.min(TOTAL_PAGES, endPg);
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

// Convert surah number + ayat → approximate page number
export function surahAyatToPage(surahNum, ayat) {
  // Find the last page whose first ayah is at or before surahNum:ayat
  for (let pg = TOTAL_PAGES; pg >= 1; pg--) {
    const [s, a] = PAGE_MAP[pg - 1];
    if (s < surahNum || (s === surahNum && a <= ayat)) return pg;
  }
  return 1;
}

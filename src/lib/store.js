import { writable, derived, get } from 'svelte/store';
import { TOTAL_PAGES, SURAHS } from './quranData.js';
import { surahAyatToPage } from './quranCalc.js';
import { todayKey, daysBetween } from './utils.js';

const STORAGE_KEY = 'quranTracker';

function createStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const { subscribe, set, update } = writable(raw ? JSON.parse(raw) : null);

  subscribe(val => {
    if (val !== null) localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  });

  return {
    subscribe, set, update,
    reset() { localStorage.removeItem(STORAGE_KEY); set(null); }
  };
}

export const S = createStore();

// ── Derived helpers ──────────────────────────────────────────────

export const currentAbsPage = derived(S, $S => {
  if (!$S) return 1;
  const cps = $S.checkpoints || [];
  return cps.length > 0 ? cps[cps.length - 1].page : $S.startPage;
});

export const effectiveState = derived(S, $S => {
  if (!$S) return { basePage: 1, pps: 1, baseDate: todayKey() };
  const cps = $S.checkpoints || [];
  if (cps.length === 0) return { basePage: $S.startPage, pps: $S.pagesPerSession, baseDate: $S.startDate };
  const last = cps[cps.length - 1];
  const today = new Date(); today.setHours(0,0,0,0);
  const tgt = getTargetEndDate($S); tgt.setHours(0,0,0,0);
  const daysLeft = Math.max(1, Math.ceil((tgt - today) / 86400000));
  const pps = (TOTAL_PAGES - last.page + 1) / daysLeft / 5;
  return { basePage: last.page, pps, baseDate: last.date };
});

export function getTargetEndDate(state) {
  if (state.targetDate) return new Date(state.targetDate);
  const d = new Date(state.startDate);
  d.setDate(d.getDate() + state.targetDays);
  return d;
}

export function saveCheckpoint(surahNum, ayat) {
  const sData = SURAHS.find(s => s[0] === surahNum);
  const pg = surahAyatToPage(surahNum, ayat);
  S.update(state => ({
    ...state,
    checkpoints: [
      ...(state.checkpoints || []),
      {
        date:  todayKey(),
        time:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        page:  pg,
        label: `${sData[2]} (${sData[1]}) : ${ayat}`
      }
    ]
  }));
}

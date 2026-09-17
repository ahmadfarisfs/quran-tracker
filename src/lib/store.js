import { writable, derived } from 'svelte/store';
import { TOTAL_PAGES, SURAHS } from './quranData.js';
import { migratePageData, stateToCurrentPos, surahAyatToPage } from './quranCalc.js';
import { todayKey, daysBetween, startOfLocalDay } from './utils.js';

const STORAGE_KEY = 'quranTracker';

function createStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const { subscribe, set, update } = writable(raw ? migratePageData(JSON.parse(raw)) : null);

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

// Keep the exact bookmark as well as its Mushaf page.
export const currentPosition = derived(S, $S => stateToCurrentPos($S));

export function calculateEffectiveState(state, now = new Date()) {
  if (!state) return { basePage: 1, pps: 1, baseDate: todayKey(now), expired: false };
  const cps = state.checkpoints || [];
  const last = cps[cps.length - 1];
  const useRecoveryBase = state.planBaseDate && (!last || last.date < state.planBaseDate);
  const basePage = useRecoveryBase ? state.planBasePage : (last?.page ?? state.startPage);
  const baseDate = useRecoveryBase ? state.planBaseDate : (last?.date ?? state.startDate);
  const today = startOfLocalDay(now);
  const target = getTargetEndDate(state);
  if (target < today) return { basePage, baseDate, pps: 0, expired: true };
  // Include today as an available reading day when today is the deadline.
  const daysAvailable = Math.max(1, daysBetween(todayKey(today), todayKey(target)));
  const pps = (TOTAL_PAGES - basePage + 1) / daysAvailable / 5;
  return { basePage, pps, baseDate, expired: false };
}

export const effectiveState = derived(S, $S => calculateEffectiveState($S));

export function getTargetEndDate(state) {
  if (state.targetDate) return startOfLocalDay(state.targetDate);
  const d = startOfLocalDay(state.startDate);
  d.setDate(d.getDate() + state.targetDays);
  return d;
}

export function buildRecoveryPlan(state, days, now = new Date()) {
  const recoveryDays = Math.max(1, Math.min(730, parseInt(days) || 30));
  const checkpoints = state.checkpoints || [];
  const currentPage = checkpoints.length > 0
    ? checkpoints[checkpoints.length - 1].page
    : state.startPage;
  const today = startOfLocalDay(now);
  const target = new Date(today);
  target.setDate(target.getDate() + recoveryDays);
  const elapsedDays = Math.max(1, daysBetween(state.startDate, todayKey(today)) + 1);
  const remainingPages = TOTAL_PAGES - currentPage + 1;
  return {
    ...state,
    targetDate: todayKey(target),
    targetDays: elapsedDays + recoveryDays,
    dailyPages: remainingPages / recoveryDays,
    pagesPerSession: remainingPages / recoveryDays / 5,
    planBaseDate: todayKey(today),
    planBasePage: currentPage,
    dailySchedule: null
  };
}

export function replanFromToday(days) {
  S.update(state => buildRecoveryPlan(state, days));
}

export function buildDailySchedule(state, now = new Date()) {
  if (!state) return state;
  const date = todayKey(now);
  const targetKey = todayKey(getTargetEndDate(state));
  if (state.dailySchedule?.date === date && state.dailySchedule?.targetKey === targetKey) {
    return state;
  }
  const effective = calculateEffectiveState(state, now);
  if (effective.expired) return { ...state, dailySchedule: null };
  // A new day's suggestions must always begin at the saved bookmark. The pace
  // already accounts for the remaining time, so extrapolating the start page
  // would skip unread pages after a day without an update.
  const basePage = effective.basePage;
  const exactStart = stateToCurrentPos(state);
  return {
    ...state,
    dailySchedule: {
      date,
      targetKey,
      basePage,
      pagesPerSession: effective.pps,
      startSurahNum: exactStart?.num ?? null,
      startAyat: exactStart?.ayat ?? null
    }
  };
}

export function ensureDailySchedule() {
  S.update(state => buildDailySchedule(state));
}

export function saveCheckpoint(surahNum, ayat, metadata = {}) {
  const sData = SURAHS.find(s => s[0] === surahNum);
  const pg = surahAyatToPage(surahNum, ayat);
  S.update(state => {
    const checkpoints = state.checkpoints || [];
    if (metadata.prayerIndex !== undefined && checkpoints.some(cp =>
      cp.date === todayKey() && cp.prayerIndex === metadata.prayerIndex
    )) return state;
    return {
      ...state,
      checkpoints: [
        ...checkpoints,
        {
        date:  todayKey(),
        time:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        page:  pg,
        surahNum,
        ayat,
        label: `${sData[2]} (${sData[1]}) : ${ayat}`,
        dailyTarget: state.dailyPages,
        ...metadata
        }
      ]
    };
  });
}

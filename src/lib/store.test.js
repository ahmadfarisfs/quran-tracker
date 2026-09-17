import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const { buildDailySchedule, buildRecoveryPlan, calculateEffectiveState } = await import('./store.js');

const expiredPlan = {
  startDate: '2026-07-10',
  startPage: 179,
  targetDays: 60,
  targetDate: '2026-09-08',
  dailyPages: 7.1,
  pagesPerSession: 1.42,
  checkpoints: [
    { date: '2026-09-15', page: 192, surahNum: 9, ayat: 36 },
    { date: '2026-09-16', page: 192, surahNum: 9, ayat: 36 }
  ]
};

test('an expired target produces no prayer schedule instead of a one-day catch-up', () => {
  const schedule = calculateEffectiveState(expiredPlan, new Date(2026, 8, 17));
  assert.equal(schedule.expired, true);
  assert.equal(schedule.pps, 0);
});

test('a recovery plan restarts at the current page over the chosen number of days', () => {
  const recovered = buildRecoveryPlan(expiredPlan, 30, new Date(2026, 8, 17));
  assert.equal(recovered.planBasePage, 192);
  assert.equal(recovered.planBaseDate, '2026-09-17');
  assert.equal(recovered.targetDate, '2026-10-17');
  assert.equal(recovered.targetDays, 100);
  assert.equal(recovered.dailyPages, 413 / 30);
  assert.equal(recovered.pagesPerSession, 413 / 30 / 5);

  const schedule = calculateEffectiveState(recovered, new Date(2026, 8, 17));
  assert.equal(schedule.expired, false);
  assert.equal(schedule.basePage, 192);
  assert.equal(schedule.baseDate, '2026-09-17');
  assert.equal(schedule.pps, 413 / 30 / 5);
});

test('today’s milestone ranges stay fixed after progress is saved', () => {
  const recovered = buildRecoveryPlan(expiredPlan, 30, new Date(2026, 8, 17));
  const withSchedule = buildDailySchedule(recovered, new Date(2026, 8, 17));
  assert.equal(withSchedule.dailySchedule.basePage, 192);
  assert.equal(withSchedule.dailySchedule.startSurahNum, 9);
  assert.equal(withSchedule.dailySchedule.startAyat, 36);

  const afterReading = {
    ...withSchedule,
    checkpoints: [...withSchedule.checkpoints, { date: '2026-09-17', page: 195, surahNum: 9, ayat: 54 }]
  };
  assert.equal(buildDailySchedule(afterReading, new Date(2026, 8, 17)), afterReading);
});

test('a new day starts at the saved bookmark instead of skipping unread pages', () => {
  const recovered = buildRecoveryPlan(expiredPlan, 30, new Date(2026, 8, 17));
  const afterReading = {
    ...recovered,
    dailySchedule: null,
    checkpoints: [
      ...recovered.checkpoints,
      { date: '2026-09-17', page: 194, surahNum: 9, ayat: 47 }
    ]
  };
  const nextDay = buildDailySchedule(afterReading, new Date(2026, 8, 18));
  assert.equal(nextDay.dailySchedule.basePage, 194);
  assert.equal(nextDay.dailySchedule.startSurahNum, 9);
  assert.equal(nextDay.dailySchedule.startAyat, 47);
});

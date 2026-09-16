import test from 'node:test';
import assert from 'node:assert/strict';

import { pageToPos, lastAyatOnPage, rangeLabel, migratePageData, stateToCurrentPos, surahAyatToPage } from './quranCalc.js';
import { PAGE_MAP, SURAHS } from './quranData.js';

test('keeps the exact ayah instead of reconstructing it from the page start', () => {
  const page = surahAyatToPage(9, 36);

  assert.equal(page, 192);
  assert.equal(pageToPos(page).ayat, 32);
  assert.equal(lastAyatOnPage(page).ayat, 36);
  assert.deepEqual(
    stateToCurrentPos({
      startPage: 1,
      checkpoints: [{
        page,
        surahNum: 9,
        ayat: 36,
        label: 'At-Tawbah (التوبة) : 36'
      }]
    }),
    { num: 9, ar: 'التوبة', en: 'At-Tawbah', ayat: 36 }
  );
});

test('covers every ayah exactly once across 604 contiguous pages', () => {
  const offsets = [0];
  for (const s of SURAHS) offsets.push(offsets.at(-1) + s[3]);
  const ordinal = p => offsets[p.num - 1] + p.ayat;
  assert.equal(PAGE_MAP.length, 604);
  let next = 1;
  for (let page = 1; page <= 604; page++) {
    const first = pageToPos(page);
    const last = lastAyatOnPage(page);
    assert.equal(ordinal(first), next);
    assert.ok(ordinal(last) >= ordinal(first));
    assert.equal(surahAyatToPage(first.num, first.ayat), page);
    assert.equal(surahAyatToPage(last.num, last.ayat), page);
    next = ordinal(last) + 1;
  }
  assert.equal(next - 1, 6236);
  for (const [num, , , count] of SURAHS) {
    for (let ayat = 1; ayat <= count; ayat++) {
      const page = surahAyatToPage(num, ayat);
      const index = ordinal({ num, ayat });
      assert.ok(index >= ordinal(pageToPos(page)) && index <= ordinal(lastAyatOnPage(page)));
    }
  }
});

test('uses real boundaries including surahs starting partway through a page', () => {
  assert.equal(surahAyatToPage(2, 5), 2);
  assert.equal(surahAyatToPage(2, 6), 3);
  assert.equal(surahAyatToPage(9, 37), 193);
  assert.equal(surahAyatToPage(112, 1), 604);
  assert.equal(surahAyatToPage(113, 1), 604);
  assert.equal(surahAyatToPage(114, 6), 604);
  const finalRange = rangeLabel(603, 605);
  assert.equal(finalRange.endPg, 604);
  assert.equal(finalRange.endNum, 114);
  assert.equal(finalRange.endAyat, 6);
});

test('repairs old page estimates without changing bookmark history or dates', () => {
  const state = {
    startSurahNum: 2, startAyat: 6, startPage: 2, targetDays: 30,
    checkpoints: [
      { date: '2026-09-15', time: '07:08 AM', page: 192, label: 'At-Tawbah (التوبة) : 36' },
      { date: '2026-09-16', page: 192, surahNum: 9, ayat: 37 },
      { date: '2026-09-17', page: 200 }
    ]
  };
  const migrated = migratePageData(state);
  assert.equal(migrated.startPage, 3);
  assert.equal(migrated.dailyPages, 602 / 30);
  assert.equal(migrated.pagesPerSession, 602 / 30 / 5);
  assert.deepEqual(migrated.checkpoints[0], { ...state.checkpoints[0], surahNum: 9, ayat: 36 });
  assert.equal(migrated.checkpoints[1].page, 193);
  assert.deepEqual(migrated.checkpoints[2], state.checkpoints[2]);
  assert.equal(state.checkpoints[1].page, 192);
  assert.equal(migratePageData(migrated), migrated);
});

test('recovers the exact ayah from bookmarks saved by older app versions', () => {
  const page = surahAyatToPage(9, 36);

  assert.deepEqual(
    stateToCurrentPos({
      startPage: 1,
      checkpoints: [{ page, label: 'At-Tawbah (التوبة) : 36' }]
    }),
    { num: 9, ar: 'التوبة', en: 'At-Tawbah', ayat: 36 }
  );
});

test('keeps the exact initial position before the first bookmark', () => {
  assert.deepEqual(
    stateToCurrentPos({
      startPage: surahAyatToPage(9, 36),
      startSurahNum: 9,
      startAyat: 36,
      checkpoints: []
    }),
    { num: 9, ar: 'التوبة', en: 'At-Tawbah', ayat: 36 }
  );
});

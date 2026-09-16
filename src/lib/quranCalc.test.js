import test from 'node:test';
import assert from 'node:assert/strict';

import { pageToPos, stateToCurrentPos, surahAyatToPage } from './quranCalc.js';

test('keeps the exact ayah instead of reconstructing it from an approximate page', () => {
  const page = surahAyatToPage(9, 36);

  assert.equal(pageToPos(page).ayat, 31);
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

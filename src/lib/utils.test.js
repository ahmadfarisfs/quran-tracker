import test from 'node:test';
import assert from 'node:assert/strict';

import { checkpointPageChanges, daysBetween, todayKey } from './utils.js';

test('duplicate bookmarks report only pages added by each update', () => {
  const changes = checkpointPageChanges([
    { date: '2026-09-15', page: 192, label: 'At-Tawbah (التوبة) : 36' },
    { date: '2026-09-16', page: 192, label: 'At-Tawbah (التوبة) : 36' }
  ], 179);

  assert.deepEqual(changes.map(entry => entry.pagesAdded), [13, 0]);
});

test('date keys use the local calendar day', () => {
  const earlyMorning = new Date(2026, 8, 17, 5, 48);
  assert.equal(todayKey(earlyMorning), '2026-09-17');
  assert.equal(daysBetween('2026-07-10', '2026-09-17'), 69);
});

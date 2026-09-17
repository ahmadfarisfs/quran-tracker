export function startOfLocalDay(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function todayKey(value = new Date()) {
  const date = startOfLocalDay(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(d1str, d2str) {
  const a = startOfLocalDay(d1str);
  const b = startOfLocalDay(d2str);
  return Math.round((b - a) / 86400000);
}

export function checkpointPageChanges(checkpoints, startPage) {
  return checkpoints.map((checkpoint, index) => {
    const previous = index > 0 ? checkpoints[index - 1] : null;
    const previousPage = previous?.page ?? startPage;
    const positionChanged = !previous || checkpoint.surahNum !== previous.surahNum || checkpoint.ayat !== previous.ayat || checkpoint.label !== previous.label;
    return { ...checkpoint, pagesAdded: Math.max(0, checkpoint.page - previousPage), positionChanged };
  });
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

export function currentPrayerIdx(prayerTimes = null, now = new Date()) {
  if (prayerTimes) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const minutes = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(key => {
      const [hour, minute] = String(prayerTimes[key] || '').match(/^\d{2}:\d{2}/)?.[0].split(':').map(Number) || [];
      return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
    });
    if (minutes.every(Number.isFinite)) {
      for (let i = minutes.length - 1; i >= 0; i--) {
        if (currentMinutes >= minutes[i]) return i;
      }
      return 4;
    }
  }
  const h = now.getHours();
  if (h >= 4  && h < 12) return 0;
  if (h >= 12 && h < 15) return 1;
  if (h >= 15 && h < 18) return 2;
  if (h >= 18 && h < 20) return 3;
  return 4;
}

export function fmtPT(timeStr) {
  // timeStr is "HH:MM" (24h from API)
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

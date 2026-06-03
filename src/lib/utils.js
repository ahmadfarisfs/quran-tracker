export function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function daysBetween(d1str, d2str) {
  const a = new Date(d1str); a.setHours(0,0,0,0);
  const b = new Date(d2str); b.setHours(0,0,0,0);
  return Math.round((b - a) / 86400000);
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

export function currentPrayerIdx() {
  const h = new Date().getHours();
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

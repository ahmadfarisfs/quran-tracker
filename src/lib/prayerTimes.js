const CACHE_KEY = 'ptCache';
const METHOD_MAP = { MWL: 3, ISNA: 2, Egypt: 5, Karachi: 1, Makkah: 4 };

export async function fetchPrayerTimes(lat, lng, method = 'MWL') {
  const dateStr = new Date().toISOString().split('T')[0];
  const cacheId  = `${lat}_${lng}_${method}_${dateStr}`;
  const cache    = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  if (cache[cacheId]) return cache[cacheId];

  try {
    const m   = METHOD_MAP[method] || 3;
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${m}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.code === 200) {
      const t = json.data.timings;
      const result = { fajr: t.Fajr, dhuhr: t.Dhuhr, asr: t.Asr, maghrib: t.Maghrib, isha: t.Isha };
      // Prune cache (keep max 14 entries)
      const keys = Object.keys(cache);
      if (keys.length >= 14) keys.slice(0, keys.length - 13).forEach(k => delete cache[k]);
      cache[cacheId] = result;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return result;
    }
  } catch (_) {}
  return null;
}

const CACHE = 'quran-tracker-v8';
const APP_FALLBACK = '/quran-tracker/index.html';

function isMushafAsset(url) {
  return url.hostname === 'cdn.quran.ws' ||
    (url.hostname === 'raw.githubusercontent.com' &&
      url.pathname.startsWith('/quran-ws/quran-svg/v1.1.1/mushafs/hafs/kfqc/json/'));
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/quran-tracker/', '/quran-tracker/index.html', '/quran-tracker/manifest.json', '/quran-tracker/icon.svg'])
        .catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isAppRequest = url.origin === self.location.origin;
  const isReaderAsset = isMushafAsset(url);
  if (!isAppRequest && !isReaderAsset) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res.ok || res.type === 'opaque') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(async error => {
        if (cached) return cached;
        if (e.request.mode === 'navigate') return caches.match(APP_FALLBACK);
        throw error;
      });
      return cached || fetched;
    })
  );
});

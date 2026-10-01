// 우리집 암기장: 인터넷이 끊겨도 마지막으로 연 내용으로 공부 가능 (항상 새 버전 먼저)
const C = 'study-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (!(u.pathname === '/study.html' || u.pathname.startsWith('/data/study/') || u.pathname.startsWith('/study-'))) return;
  const key = u.origin + u.pathname;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(C).then(x => x.put(key, c)); } return r; }).catch(() => caches.match(key)));
});

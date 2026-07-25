/* =========================================================
   MEDIA STORE — IndexedDB-backed storage for uploaded video
   ---------------------------------------------------------
   localStorage caps out around 5–10MB *per origin, total* —
   nowhere near enough for real video files, which is why
   uploads used to fail even at just a couple of MB (the video
   became a base64 string and got jammed into the same
   localStorage blob as everything else). IndexedDB has no such
   tiny ceiling — browsers grant each origin a share of free
   disk space, typically hundreds of MB up to a few GB — so raw
   video bytes now live here as Blobs, keyed by a short id. Only
   that id (e.g. "idb:vid_172xyz") gets written into the
   portfolio JSON that Store still keeps in localStorage, so
   localStorage stays tiny no matter how large the videos are.
   ========================================================= */
const MediaStore = (function () {
  const DB_NAME = 'mt-portfolio-media';
  const DB_VERSION = 1;
  const STORE = 'media';
  let dbPromise = null;
  const urlCache = new Map(); // id -> already-created object URL

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('IndexedDB unsupported in this browser')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function put(id, blob) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Storage write aborted (disk may be full).'));
    }));
  }

  function get(id) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }

  function remove(id) {
    urlCache.delete(id);
    return openDb().then((db) => new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    })).catch(() => false);
  }

  function newId() {
    return 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // Resolves an id to a playable blob: URL, reusing one already created
  // this session instead of minting a new object URL every render.
  async function resolveUrl(id) {
    if (urlCache.has(id)) return urlCache.get(id);
    const blob = await get(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    return url;
  }

  return {
    put, get, remove, newId, resolveUrl,
    isSupported() { return !!window.indexedDB; }
  };
})();

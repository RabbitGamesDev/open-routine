/* ============================================================
   db.js — Wrapper mínimo de IndexedDB con promesas.
   Capa de bajo nivel: ninguna vista habla con esto directamente.
   ============================================================ */
window.OR = window.OR || {};
OR.db = (function () {
  const NAME = 'openrutine', VER = 1;
  let _db = null;
  const STORES = ['tasks','routines','occurrences','results','academic','kv'];

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((res, rej) => {
      const req = indexedDB.open(NAME, VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('routines')) db.createObjectStore('routines', { keyPath: 'id' });
        /* Clave única routineId+date: previene duplicados por doble pestaña/dispositivo */
        if (!db.objectStoreNames.contains('occurrences')) {
          const os = db.createObjectStore('occurrences', { keyPath: 'id' });
          os.createIndex('byRoutineDate', ['routineId', 'date'], { unique: true });
          os.createIndex('byDate', 'date');
        }
        if (!db.objectStoreNames.contains('results')) db.createObjectStore('results', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('academic')) db.createObjectStore('academic', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'k' });
      };
      req.onsuccess = () => { _db = req.result; res(_db); };
      req.onerror = () => rej(req.error);
    });
  }

  function tx(store, mode, fn) {
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => {
        if (out && typeof out === 'object' && '_done' in out) {
          res(out._v);
        } else {
          res(out && out._v !== undefined ? out._v : out);
        }
      };
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }
  
  const wrap = req => { 
    req._v = undefined; 
    req._done = false;
    req.onsuccess = () => { req._v = req.result; req._done = true; }; 
    return req; 
  };

  return {
    async put(store, val) { 
      const cleanVal = JSON.parse(JSON.stringify(val));
      await tx(store, 'readwrite', os => os.put(cleanVal)); 
      return cleanVal; 
    },
    async get(store, id) { return tx(store, 'readonly', os => wrap(os.get(id))); },
    async del(store, id) { return tx(store, 'readwrite', os => os.delete(id)); },
    async clear(store) { return tx(store, 'readwrite', os => os.clear()); },
    async all(store) { return tx(store, 'readonly', os => wrap(os.getAll())) || []; },
    async query(store, fn) { return (await this.all(store)).filter(fn); },
    async kvGet(k, fallback) {
      const r = await tx('kv', 'readonly', os => wrap(os.get(k)));
      return r === undefined ? fallback : r.v;
    },
    async kvSet(k, v) { return this.put('kv', { k, v }); },
    STORES,
  };
})();
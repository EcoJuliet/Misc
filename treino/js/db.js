const DB_NAME = 'treino-db';
const DB_VERSION = 1;

export const STORES = ['exercises', 'routines', 'routineExercises', 'sessions', 'setLogs', 'meta'];

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('exercises', { keyPath: 'id' });
      db.createObjectStore('routines', { keyPath: 'id' });

      const routineExercises = db.createObjectStore('routineExercises', { keyPath: 'id' });
      routineExercises.createIndex('routineId', 'routineId');

      const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
      sessions.createIndex('routineId', 'routineId');
      sessions.createIndex('startedAt', 'startedAt');

      const setLogs = db.createObjectStore('setLogs', { keyPath: 'id' });
      setLogs.createIndex('sessionId', 'sessionId');
      setLogs.createIndex('exerciseId', 'exerciseId');
      setLogs.createIndex('exerciseId_loggedAt', ['exerciseId', 'loggedAt']);

      db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function getAll(storeName, indexName, query) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const source = indexName ? tx.objectStore(storeName).index(indexName) : tx.objectStore(storeName);
    const req = query !== undefined ? source.getAll(query) : source.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllFromStores(storeNames) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, 'readonly');
    const result = {};
    storeNames.forEach((name) => {
      const req = tx.objectStore(name).getAll();
      req.onsuccess = () => (result[name] = req.result);
    });
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function get(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(storeName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

export async function remove(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// fn deve ser síncrona (sem await) e só enfileirar chamadas na store: uma
// transação IndexedDB se fecha assim que a call stack esvazia sem pedidos pendentes.
export async function runTransaction(storeNames, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const stores = {};
    storeNames.forEach((name) => (stores[name] = tx.objectStore(name)));
    let result;
    try {
      result = fn(stores);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

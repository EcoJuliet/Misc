import { getAllFromStores, runTransaction, get, put, STORES } from './db.js';
import { nowIso, daysSince } from './utils.js';

const REMINDER_DAYS = 7;
const REMINDER_SESSIONS = 5;
const DISMISS_KEY = 'treino:bannerDismissedAt';

export async function getMeta() {
  const meta = await get('meta', 'meta');
  return meta || { key: 'meta', lastBackupAt: null, sessionsSinceBackup: 0 };
}

export async function bumpSessionsSinceBackup() {
  const meta = await getMeta();
  meta.sessionsSinceBackup = (meta.sessionsSinceBackup || 0) + 1;
  await put('meta', meta);
  return meta;
}

async function markBackedUpNow() {
  const meta = await getMeta();
  meta.lastBackupAt = nowIso();
  meta.sessionsSinceBackup = 0;
  await put('meta', meta);
}

export async function exportBackup() {
  const data = await getAllFromStores(STORES);
  const payload = { schemaVersion: 1, exportedAt: nowIso(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateTag = new Date().toISOString().slice(0, 10);

  // O download precisa disparar de forma síncrona dentro do clique do
  // usuário, senão navegadores mobile bloqueiam como pop-up.
  const a = document.createElement('a');
  a.href = url;
  a.download = `treino-backup-${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  await markBackedUpNow();
}

export async function importBackup(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || typeof data.schemaVersion !== 'number') {
    throw new Error('arquivo de backup inválido');
  }
  await runTransaction(STORES, 'readwrite', (stores) => {
    STORES.forEach((name) => {
      stores[name].clear();
      (data[name] || []).forEach((item) => stores[name].put(item));
    });
  });
  await markBackedUpNow();
}

export async function shouldShowReminder() {
  const meta = await getMeta();
  if (!meta.lastBackupAt) {
    return (meta.sessionsSinceBackup || 0) > 0;
  }
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (dismissedAt && daysSince(dismissedAt) < 1) return false;
  return daysSince(meta.lastBackupAt) >= REMINDER_DAYS || (meta.sessionsSinceBackup || 0) >= REMINDER_SESSIONS;
}

export function dismissReminderForToday() {
  localStorage.setItem(DISMISS_KEY, nowIso());
}

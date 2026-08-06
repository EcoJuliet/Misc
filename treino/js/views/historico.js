import { get, getAll } from '../db.js';
import { el, formatDateBR, infoModal } from '../utils.js';
import { navigate } from '../router.js';
import { renderSparkline } from '../charts.js';

export async function renderHistorico(container, { id }) {
  container.innerHTML = '';

  const exercise = await get('exercises', id);
  if (!exercise) {
    navigate('#/');
    return;
  }

  const logs = (await getAll('setLogs', 'exerciseId', id)).sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

  container.appendChild(
    el('header', { class: 'topbar' }, [
      el('button', { class: 'icon-btn', onclick: () => history.back() }, '←'),
      el('h1', {}, exercise.nome),
      exercise.descricao
        ? el('button', { class: 'icon-btn', onclick: () => infoModal(exercise.nome, exercise.descricao) }, 'ℹ️')
        : null,
    ])
  );

  const bySession = new Map();
  logs.forEach((log) => {
    if (!bySession.has(log.sessionId)) bySession.set(log.sessionId, []);
    bySession.get(log.sessionId).push(log);
  });
  const sessionsSorted = [...bySession.values()].sort((a, b) => new Date(a[0].loggedAt) - new Date(b[0].loggedAt));

  const points = sessionsSorted.map((sets) => ({
    date: sets[0].loggedAt,
    value: Math.max(...sets.map((s) => s.peso)),
  }));

  container.appendChild(el('div', { class: 'chart-wrap' }, renderSparkline(points)));

  if (logs.length === 0) {
    container.appendChild(el('p', { class: 'muted' }, 'Nenhum registro ainda para este exercício.'));
    return;
  }

  const list = el('div', { class: 'history-list' });
  [...sessionsSorted].reverse().forEach((sets) => {
    const summary = [...sets]
      .sort((a, b) => a.numeroSerie - b.numeroSerie)
      .map((s) => `${s.reps}x${s.peso}kg`)
      .join(', ');
    list.appendChild(
      el('div', { class: 'history-row' }, [
        el('span', { class: 'history-date' }, formatDateBR(sets[0].loggedAt)),
        el('span', {}, summary),
      ])
    );
  });
  container.appendChild(list);
}

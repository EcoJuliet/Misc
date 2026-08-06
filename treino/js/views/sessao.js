import { get, getAll, put } from '../db.js';
import { el, uuid, nowIso, formatDateTimeBR, clamp, confirmModal, infoModal } from '../utils.js';
import { navigate } from '../router.js';
import { bumpSessionsSinceBackup } from '../backup.js';

const WEIGHT_STEP = 2.5;

export async function renderSessaoAtiva(container, { id: routineId }) {
  container.innerHTML = '';

  const routine = await get('routines', routineId);
  if (!routine) {
    navigate('#/');
    return;
  }

  let items = (await getAll('routineExercises', 'routineId', routineId)).sort((a, b) => a.ordem - b.ordem);
  const exerciseById = new Map(
    (await Promise.all(items.map((item) => get('exercises', item.exerciseId)))).map((ex, i) => [items[i].exerciseId, ex])
  );

  const session = { id: uuid(), routineId, routineNomeSnapshot: routine.nome, startedAt: nowIso(), finishedAt: null };
  await put('sessions', session);

  let wakeLock = null;
  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch (_err) {
      // best-effort: nem todo navegador/contexto suporta Wake Lock
    }
  }
  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => ctx.close();
    } catch (_err) {
      // som é best-effort
    }
  }

  let restTimerHandle = null;
  const timerBar = el('div', { class: 'timer-bar hidden' });

  function stopRestTimer() {
    if (restTimerHandle) {
      clearInterval(restTimerHandle);
      restTimerHandle = null;
    }
    timerBar.classList.add('hidden');
    releaseWakeLock();
  }

  function startRestTimer(seconds) {
    stopRestTimer();
    acquireWakeLock();
    let remaining = seconds;
    timerBar.classList.remove('hidden');
    timerBar.innerHTML = '';
    const label = el('span', { class: 'timer-label' }, `Descanso: ${remaining}s`);
    timerBar.append(
      label,
      el('button', { class: 'btn small ghost', onclick: () => stopRestTimer() }, 'Pular')
    );
    restTimerHandle = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        stopRestTimer();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        playBeep();
        return;
      }
      label.textContent = `Descanso: ${remaining}s`;
    }, 1000);
  }

  container.append(
    el('header', { class: 'topbar' }, [
      el(
        'button',
        {
          class: 'icon-btn',
          onclick: async () => {
            const ok = await confirmModal('Sair sem finalizar o treino? O progresso já registrado fica salvo.', 'Sair');
            if (!ok) return;
            stopRestTimer();
            navigate('#/');
          },
        },
        '←'
      ),
      el('h1', {}, routine.nome),
    ]),
    timerBar
  );

  const cardsWrap = el('div', { class: 'session-cards' });
  container.appendChild(cardsWrap);

  const lastValuesCache = new Map();
  async function getLastValues(exerciseId) {
    if (lastValuesCache.has(exerciseId)) return lastValuesCache.get(exerciseId);
    const logs = await getAll('setLogs', 'exerciseId', exerciseId);
    const previous = logs
      .filter((l) => l.sessionId !== session.id)
      .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];
    const values = previous ? { peso: previous.peso, reps: previous.reps } : { peso: 20, reps: 10 };
    lastValuesCache.set(exerciseId, values);
    return values;
  }

  async function moveItem(index, delta) {
    const other = index + delta;
    if (other < 0 || other >= items.length) return;
    [items[index].ordem, items[other].ordem] = [items[other].ordem, items[index].ordem];
    [items[index], items[other]] = [items[other], items[index]];
    await Promise.all([put('routineExercises', items[index]), put('routineExercises', items[other])]);
    await renderCards();
  }

  async function renderCards() {
    cardsWrap.innerHTML = '';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const exercise = exerciseById.get(item.exerciseId);
      const defaults = await getLastValues(item.exerciseId);
      let peso = defaults.peso;
      let reps = defaults.reps;
      let setNumber = 1;

      const card = el('section', { class: 'session-card' });
      card.append(
        el('div', { class: 'exercise-title-row' }, [
          el(
            'button',
            { class: 'exercise-name-btn', onclick: () => navigate(`#/exercicio/${item.exerciseId}/historico`) },
            exercise ? exercise.nome : '(exercício removido)'
          ),
          exercise && exercise.descricao
            ? el('button', { class: 'icon-btn', onclick: () => infoModal(exercise.nome, exercise.descricao) }, 'ℹ️')
            : null,
          el('button', { class: 'icon-btn', disabled: i === 0, onclick: () => moveItem(i, -1) }, '↑'),
          el('button', { class: 'icon-btn', disabled: i === items.length - 1, onclick: () => moveItem(i, 1) }, '↓'),
        ]),
        el('span', { class: 'muted' }, `Meta: ${item.targetSets}x${item.targetRepsMin}${item.targetRepsMax !== item.targetRepsMin ? '-' + item.targetRepsMax : ''}`)
      );

      const loggedList = el('div', { class: 'set-log-list' });
      card.appendChild(loggedList);

      const pesoValueEl = el('span', { class: 'stepper-value' }, String(peso));
      const repsValueEl = el('span', { class: 'stepper-value' }, String(reps));

      card.appendChild(
        el('div', { class: 'stepper-row' }, [
          el('div', { class: 'stepper' }, [
            el(
              'button',
              {
                class: 'stepper-btn',
                onclick: () => {
                  peso = clamp(peso - WEIGHT_STEP, 0, 500);
                  pesoValueEl.textContent = peso;
                },
              },
              '−'
            ),
            el('div', { class: 'stepper-label' }, [pesoValueEl, el('small', {}, ' kg')]),
            el(
              'button',
              {
                class: 'stepper-btn',
                onclick: () => {
                  peso = clamp(peso + WEIGHT_STEP, 0, 500);
                  pesoValueEl.textContent = peso;
                },
              },
              '+'
            ),
          ]),
          el('div', { class: 'stepper' }, [
            el(
              'button',
              {
                class: 'stepper-btn',
                onclick: () => {
                  reps = clamp(reps - 1, 0, 100);
                  repsValueEl.textContent = reps;
                },
              },
              '−'
            ),
            el('div', { class: 'stepper-label' }, [repsValueEl, el('small', {}, ' reps')]),
            el(
              'button',
              {
                class: 'stepper-btn',
                onclick: () => {
                  reps = clamp(reps + 1, 0, 100);
                  repsValueEl.textContent = reps;
                },
              },
              '+'
            ),
          ]),
        ])
      );

      card.appendChild(
        el(
          'button',
          {
            class: 'btn primary full',
            onclick: async () => {
              const entry = {
                id: uuid(),
                sessionId: session.id,
                exerciseId: item.exerciseId,
                exerciseNomeSnapshot: exercise ? exercise.nome : '',
                numeroSerie: setNumber++,
                peso,
                reps,
                loggedAt: nowIso(),
              };
              await put('setLogs', entry);
              loggedList.appendChild(el('div', { class: 'set-log-row' }, `Série ${entry.numeroSerie}: ${entry.peso}kg × ${entry.reps}`));
              if (item.targetRestSeconds) startRestTimer(item.targetRestSeconds);
            },
          },
          '✓ Registrar série'
        )
      );

      let concluido = false;
      const concluirBtn = el(
        'button',
        {
          class: 'btn ghost full',
          onclick: () => {
            concluido = !concluido;
            card.classList.toggle('session-card-done', concluido);
            concluirBtn.textContent = concluido ? '↺ Reabrir exercício' : '✓ Concluir exercício';
          },
        },
        '✓ Concluir exercício'
      );
      card.appendChild(concluirBtn);

      cardsWrap.appendChild(card);
    }
  }

  await renderCards();

  container.appendChild(
    el(
      'button',
      {
        class: 'btn primary full finish-btn',
        onclick: async () => {
          session.finishedAt = nowIso();
          await put('sessions', session);
          await bumpSessionsSinceBackup();
          stopRestTimer();
          navigate('#/');
        },
      },
      'Finalizar treino'
    )
  );

  return () => stopRestTimer();
}

export async function renderSessaoRecap(container, { id }) {
  container.innerHTML = '';

  const session = await get('sessions', id);
  if (!session) {
    navigate('#/');
    return;
  }

  const logs = (await getAll('setLogs', 'sessionId', id)).sort(
    (a, b) => new Date(a.loggedAt) - new Date(b.loggedAt)
  );

  const grouped = new Map();
  logs.forEach((log) => {
    if (!grouped.has(log.exerciseId)) grouped.set(log.exerciseId, { nome: log.exerciseNomeSnapshot, sets: [] });
    grouped.get(log.exerciseId).sets.push(log);
  });

  container.append(
    el('header', { class: 'topbar' }, [
      el('button', { class: 'icon-btn', onclick: () => navigate('#/') }, '←'),
      el('h1', {}, session.routineNomeSnapshot),
    ]),
    el('p', { class: 'muted' }, formatDateTimeBR(session.startedAt))
  );

  if (grouped.size === 0) {
    container.appendChild(el('p', { class: 'muted' }, 'Nenhuma série registrada neste treino.'));
  }

  grouped.forEach(({ nome, sets }) => {
    container.appendChild(
      el('section', { class: 'session-card' }, [
        el('h3', {}, nome),
        ...sets.map((s) => el('div', { class: 'set-log-row' }, `Série ${s.numeroSerie}: ${s.peso}kg × ${s.reps}`)),
      ])
    );
  });
}

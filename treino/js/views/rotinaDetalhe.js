import { get, getAll, put, remove } from '../db.js';
import { el, uuid, nowIso, openModal, confirmModal } from '../utils.js';
import { navigate } from '../router.js';

function formatMeta(item) {
  const reps = item.targetRepsMax !== item.targetRepsMin ? `${item.targetRepsMin}-${item.targetRepsMax}` : `${item.targetRepsMin}`;
  return `${item.targetSets}x${reps} · descanso ${item.targetRestSeconds || 60}s`;
}

export async function renderRotinaDetalhe(container, { id }) {
  container.innerHTML = '';

  const routine = await get('routines', id);
  if (!routine) {
    navigate('#/');
    return;
  }

  const allExercises = await getAll('exercises');
  const exerciseById = new Map(allExercises.map((e) => [e.id, e]));
  let items = (await getAll('routineExercises', 'routineId', id)).sort((a, b) => a.ordem - b.ordem);

  container.appendChild(
    el('header', { class: 'topbar' }, [
      el('button', { class: 'icon-btn', onclick: () => navigate('#/') }, '←'),
      el('h1', {}, routine.nome),
      el('button', { class: 'icon-btn', onclick: () => renameRoutine() }, '✏️'),
    ])
  );

  if (routine.notas) {
    container.appendChild(el('p', { class: 'muted' }, routine.notas));
  }

  const list = el('div', { class: 'exercise-list' });
  container.appendChild(list);

  const iniciarBtn = el(
    'button',
    { class: 'btn primary full', onclick: () => navigate(`#/rotina/${id}/sessao/nova`) },
    '▶ Iniciar treino'
  );

  function renderList() {
    list.innerHTML = '';
    iniciarBtn.disabled = items.length === 0;
    if (items.length === 0) {
      list.appendChild(el('p', { class: 'muted' }, 'Nenhum exercício ainda. Adicione abaixo.'));
      return;
    }
    items.forEach((item, index) => {
      const exercise = exerciseById.get(item.exerciseId);
      list.appendChild(
        el('div', { class: 'exercise-row' }, [
          el(
            'button',
            { class: 'exercise-name-btn', onclick: () => navigate(`#/exercicio/${item.exerciseId}/historico`) },
            exercise ? exercise.nome : '(exercício removido)'
          ),
          el('span', { class: 'muted' }, formatMeta(item)),
          el('div', { class: 'row-actions' }, [
            el('button', { class: 'icon-btn', disabled: index === 0, onclick: () => move(index, -1) }, '↑'),
            el('button', { class: 'icon-btn', disabled: index === items.length - 1, onclick: () => move(index, 1) }, '↓'),
            el('button', { class: 'icon-btn', onclick: () => editItem(item) }, '✏️'),
            el('button', { class: 'icon-btn danger', onclick: () => deleteItem(item) }, '🗑️'),
          ]),
        ])
      );
    });
  }
  renderList();

  async function move(index, delta) {
    const other = index + delta;
    if (other < 0 || other >= items.length) return;
    [items[index].ordem, items[other].ordem] = [items[other].ordem, items[index].ordem];
    [items[index], items[other]] = [items[other], items[index]];
    await Promise.all([put('routineExercises', items[index]), put('routineExercises', items[other])]);
    renderList();
  }

  async function editItem(item) {
    const result = await openModal({
      title: 'Editar meta',
      fields: [
        { name: 'targetSets', label: 'Séries', type: 'number', value: item.targetSets },
        { name: 'targetRepsMin', label: 'Repetições (mínimo)', type: 'number', value: item.targetRepsMin },
        { name: 'targetRepsMax', label: 'Repetições (máximo)', type: 'number', value: item.targetRepsMax },
        { name: 'targetRestSeconds', label: 'Descanso (segundos)', type: 'number', value: item.targetRestSeconds || 60 },
      ],
      confirmLabel: 'Salvar',
    });
    if (!result) return;
    Object.assign(item, result);
    await put('routineExercises', item);
    renderList();
  }

  async function deleteItem(item) {
    const ok = await confirmModal('Remover este exercício desta rotina? O histórico de treinos já registrados é mantido.', 'Remover');
    if (!ok) return;
    await remove('routineExercises', item.id);
    items = items.filter((i) => i.id !== item.id);
    renderList();
  }

  async function renameRoutine() {
    const result = await openModal({
      title: 'Editar rotina',
      fields: [
        { name: 'nome', label: 'Nome', value: routine.nome },
        { name: 'notas', label: 'Observação (opcional)', value: routine.notas || '' },
      ],
      confirmLabel: 'Salvar',
    });
    if (!result || !result.nome) return;
    routine.nome = result.nome;
    routine.notas = result.notas || undefined;
    routine.updatedAt = nowIso();
    await put('routines', routine);
    renderRotinaDetalhe(container, { id });
  }

  container.appendChild(
    el(
      'button',
      {
        class: 'btn full',
        onclick: async () => {
          const result = await openModal({
            title: 'Adicionar exercício',
            fields: [
              { name: 'nome', label: 'Nome do exercício', list: 'exercicios-catalogo' },
              { name: 'targetSets', label: 'Séries', type: 'number', value: 3 },
              { name: 'targetRepsMin', label: 'Repetições (mínimo)', type: 'number', value: 8 },
              { name: 'targetRepsMax', label: 'Repetições (máximo)', type: 'number', value: 12 },
              { name: 'targetRestSeconds', label: 'Descanso (segundos)', type: 'number', value: 60 },
            ],
            confirmLabel: 'Adicionar',
            datalist: { id: 'exercicios-catalogo', options: allExercises.map((e) => e.nome) },
          });
          if (!result || !result.nome) return;

          let exercise = allExercises.find((e) => e.nome.toLowerCase() === result.nome.toLowerCase());
          if (!exercise) {
            exercise = { id: uuid(), nome: result.nome, createdAt: nowIso() };
            await put('exercises', exercise);
            allExercises.push(exercise);
          }
          exerciseById.set(exercise.id, exercise);

          const item = {
            id: uuid(),
            routineId: id,
            exerciseId: exercise.id,
            ordem: items.length,
            targetSets: result.targetSets,
            targetRepsMin: result.targetRepsMin,
            targetRepsMax: result.targetRepsMax,
            targetRestSeconds: result.targetRestSeconds,
          };
          await put('routineExercises', item);
          items.push(item);
          renderList();
        },
      },
      '+ Adicionar exercício'
    )
  );

  container.appendChild(iniciarBtn);

  container.appendChild(
    el(
      'button',
      {
        class: 'btn ghost full danger-text',
        onclick: async () => {
          const ok = await confirmModal('Excluir esta rotina e seus exercícios? O histórico de treinos já realizados é mantido.', 'Excluir');
          if (!ok) return;
          await Promise.all(items.map((item) => remove('routineExercises', item.id)));
          await remove('routines', id);
          navigate('#/');
        },
      },
      'Excluir rotina'
    )
  );
}

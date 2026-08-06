import { get, getAll, put, remove } from '../db.js';
import { el, uuid, nowIso, openModal, confirmModal, infoModal } from '../utils.js';
import { navigate } from '../router.js';

export async function renderBanco(container) {
  container.innerHTML = '';

  const exercises = (await getAll('exercises')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const routineExercises = await getAll('routineExercises');
  const routines = await getAll('routines');
  const routineById = new Map(routines.map((r) => [r.id, r]));

  function routinesUsing(exerciseId) {
    return routineExercises
      .filter((item) => item.exerciseId === exerciseId)
      .map((item) => routineById.get(item.routineId)?.nome)
      .filter(Boolean);
  }

  container.append(
    el('header', { class: 'topbar' }, [
      el('button', { class: 'icon-btn', onclick: () => navigate('#/') }, '←'),
      el('h1', {}, 'Banco de exercícios'),
    ]),
    el(
      'p',
      { class: 'muted' },
      'Renomeie, apague ou cole uma lista pra criar vários de uma vez. Toque no nome pra ver/editar a descrição.'
    )
  );

  const list = el('div', { class: 'exercise-list' });
  container.appendChild(list);

  function renderList() {
    list.innerHTML = '';
    if (exercises.length === 0) {
      list.appendChild(el('p', { class: 'muted' }, 'Nenhum exercício no banco ainda.'));
      return;
    }
    exercises.forEach((exercise) => {
      list.appendChild(
        el('div', { class: 'exercise-row' }, [
          el(
            'button',
            { class: 'exercise-name-btn', onclick: () => renameExercise(exercise) },
            exercise.nome
          ),
          exercise.descricao ? el('span', { class: 'muted exercise-desc-preview' }, exercise.descricao) : null,
          el('div', { class: 'row-actions' }, [
            el('button', { class: 'icon-btn', onclick: () => renameExercise(exercise) }, '✏️'),
            el('button', { class: 'icon-btn danger', onclick: () => deleteExercise(exercise) }, '🗑️'),
          ]),
        ])
      );
    });
  }
  renderList();

  async function renameExercise(exercise) {
    const result = await openModal({
      title: 'Editar exercício',
      fields: [
        { name: 'nome', label: 'Nome', value: exercise.nome },
        { name: 'descricao', label: 'Descrição (opcional)', value: exercise.descricao || '', multiline: true, rows: 4 },
      ],
      confirmLabel: 'Salvar',
    });
    if (!result || !result.nome) return;
    exercise.nome = result.nome;
    exercise.descricao = result.descricao || undefined;
    await put('exercises', exercise);
    exercises.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    renderList();
  }

  async function deleteExercise(exercise) {
    const usedIn = routinesUsing(exercise.id);
    const message =
      usedIn.length > 0
        ? `Esse exercício está em ${usedIn.length} rotina(s): ${usedIn.join(', ')}. Apagar do banco não remove das rotinas, mas ele vai aparecer como "(exercício removido)". O histórico de treinos é mantido. Continuar?`
        : 'Apagar este exercício do banco?';
    const ok = await confirmModal(message, 'Apagar');
    if (!ok) return;
    await remove('exercises', exercise.id);
    const index = exercises.findIndex((e) => e.id === exercise.id);
    if (index !== -1) exercises.splice(index, 1);
    renderList();
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
              { name: 'nome', label: 'Nome do exercício' },
              { name: 'descricao', label: 'Descrição (opcional)', multiline: true, rows: 4 },
            ],
            confirmLabel: 'Adicionar',
          });
          if (!result || !result.nome) return;
          if (exercises.some((e) => e.nome.toLowerCase() === result.nome.toLowerCase())) {
            await confirmModal('Já existe um exercício com esse nome no banco.', 'Ok');
            return;
          }
          const exercise = { id: uuid(), nome: result.nome, descricao: result.descricao || undefined, createdAt: nowIso() };
          await put('exercises', exercise);
          exercises.push(exercise);
          exercises.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          renderList();
        },
      },
      '+ Adicionar exercício'
    )
  );

  container.appendChild(
    el(
      'button',
      {
        class: 'btn full',
        onclick: async () => {
          const result = await openModal({
            title: 'Colar lista de exercícios',
            fields: [
              {
                name: 'lista',
                label: 'Um por linha — "Nome" ou "Nome | Descrição"',
                multiline: true,
                rows: 10,
              },
            ],
            confirmLabel: 'Criar',
          });
          if (!result || !result.lista) return;

          const entries = result.lista
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [nome, ...rest] = line.split('|');
              return { nome: nome.trim(), descricao: rest.join('|').trim() || undefined };
            });

          const existingLower = new Set(exercises.map((e) => e.nome.toLowerCase()));
          let created = 0;
          let skipped = 0;
          for (const { nome, descricao } of entries) {
            const key = nome.toLowerCase();
            if (existingLower.has(key)) {
              skipped++;
              continue;
            }
            existingLower.add(key);
            const exercise = { id: uuid(), nome, descricao, createdAt: nowIso() };
            await put('exercises', exercise);
            exercises.push(exercise);
            created++;
          }
          exercises.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          renderList();
          await confirmModal(`${created} exercício(s) criado(s), ${skipped} já existiam e foram ignorados.`, 'Ok');
        },
      },
      '📋 Colar lista'
    )
  );
}

import { getAll, put } from '../db.js';
import { el, uuid, nowIso, openModal } from '../utils.js';
import { navigate } from '../router.js';
import { shouldShowReminder, dismissReminderForToday } from '../backup.js';

export async function renderHome(container) {
  container.innerHTML = '';

  const routines = (await getAll('routines')).sort((a, b) => a.ordem - b.ordem);

  container.appendChild(
    el('header', { class: 'topbar' }, [
      el('h1', {}, 'Treino'),
      el('button', { class: 'icon-btn', 'aria-label': 'Banco de exercícios', onclick: () => navigate('#/banco') }, '📚'),
      el('button', { class: 'icon-btn', 'aria-label': 'Backup e configurações', onclick: () => navigate('#/backup') }, '⚙️'),
    ])
  );

  if (await shouldShowReminder()) {
    const banner = el('div', { class: 'banner' }, [
      el('span', {}, 'Faz um tempo que você não faz backup dos seus dados de treino.'),
      el('div', { class: 'banner-actions' }, [
        el('button', { class: 'btn small', onclick: () => navigate('#/backup') }, 'Fazer backup'),
        el(
          'button',
          {
            class: 'btn small ghost',
            onclick: () => {
              dismissReminderForToday();
              banner.remove();
            },
          },
          'Agora não'
        ),
      ]),
    ]);
    container.appendChild(banner);
  }

  const list = el('div', { class: 'routine-list' });
  if (routines.length === 0) {
    list.appendChild(el('p', { class: 'muted' }, 'Nenhuma rotina ainda. Crie a primeira abaixo, ex: "Treino A".'));
  }
  routines.forEach((routine) => {
    list.appendChild(
      el('button', { class: 'routine-card', onclick: () => navigate(`#/rotina/${routine.id}`) }, [
        el('span', { class: 'routine-name' }, routine.nome),
        el('span', { class: 'chevron' }, '›'),
      ])
    );
  });
  container.appendChild(list);

  container.appendChild(
    el(
      'button',
      {
        class: 'btn primary full',
        onclick: async () => {
          const result = await openModal({
            title: 'Nova rotina',
            fields: [{ name: 'nome', label: 'Nome (ex: Treino A)' }],
            confirmLabel: 'Criar',
          });
          if (!result || !result.nome) return;
          const routine = { id: uuid(), nome: result.nome, ordem: routines.length, createdAt: nowIso(), updatedAt: nowIso() };
          await put('routines', routine);
          renderHome(container);
        },
      },
      '+ Nova rotina'
    )
  );
}

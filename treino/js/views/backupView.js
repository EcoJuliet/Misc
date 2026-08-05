import { el, formatDateTimeBR, confirmModal } from '../utils.js';
import { navigate } from '../router.js';
import { exportBackup, importBackup, getMeta } from '../backup.js';

export async function renderBackupView(container) {
  container.innerHTML = '';

  const meta = await getMeta();

  container.append(
    el('header', { class: 'topbar' }, [
      el('button', { class: 'icon-btn', onclick: () => navigate('#/') }, '←'),
      el('h1', {}, 'Backup'),
    ]),
    el(
      'p',
      {},
      meta.lastBackupAt ? `Último backup: ${formatDateTimeBR(meta.lastBackupAt)}` : 'Nenhum backup feito ainda.'
    ),
    el(
      'button',
      {
        class: 'btn primary full',
        onclick: async () => {
          await exportBackup();
          renderBackupView(container);
        },
      },
      '⬇ Fazer backup agora'
    )
  );

  const fileInput = el('input', { type: 'file', accept: 'application/json', class: 'hidden' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const ok = await confirmModal(
      'Isso vai substituir todos os dados atuais pelo conteúdo do backup. Continuar?',
      'Restaurar'
    );
    if (!ok) {
      fileInput.value = '';
      return;
    }
    try {
      await importBackup(file);
      renderBackupView(container);
    } catch (err) {
      await confirmModal(`Não foi possível restaurar o backup: ${err.message}`, 'Ok');
    }
    fileInput.value = '';
  });

  container.append(
    el('button', { class: 'btn full', onclick: () => fileInput.click() }, '⬆ Restaurar backup'),
    fileInput,
    el(
      'p',
      { class: 'muted small' },
      'O backup gera um arquivo .json que você pode salvar no Google Drive, WhatsApp ou onde preferir. Guarde-o em um lugar seguro — restaurar substitui todos os dados atuais do app.'
    )
  );
}

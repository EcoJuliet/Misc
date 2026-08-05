import { openDB } from './db.js';
import { route, startRouter } from './router.js';
import { renderHome } from './views/home.js';
import { renderRotinaDetalhe } from './views/rotinaDetalhe.js';
import { renderSessaoAtiva, renderSessaoRecap } from './views/sessao.js';
import { renderHistorico } from './views/historico.js';
import { renderBackupView } from './views/backupView.js';

const app = document.getElementById('app');

route('/', () => renderHome(app));
route('/rotina/:id/sessao/nova', (params) => renderSessaoAtiva(app, params));
route('/rotina/:id', (params) => renderRotinaDetalhe(app, params));
route('/sessao/:id', (params) => renderSessaoRecap(app, params));
route('/exercicio/:id/historico', (params) => renderHistorico(app, params));
route('/backup', () => renderBackupView(app));

async function boot() {
  await openDB();
  startRouter();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot();

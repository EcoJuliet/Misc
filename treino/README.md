# Treino

App simples de registro de treino de academia. Substitui a lista de exercícios
no bloco de notas: mantém as rotinas (Treino A, Treino B, ...), registra peso,
séries e repetições de cada exercício durante o treino, tem cronômetro de
descanso entre séries e mostra o histórico/evolução de carga por exercício.

100% local no navegador (IndexedDB), sem servidor e sem login. Funciona
offline como PWA (pode ser "instalado" na tela inicial do celular).

## Rodando localmente

Como é só HTML/CSS/JS puro (ES modules), basta servir a pasta com qualquer
servidor estático — abrir o `index.html` direto do disco (`file://`) não
funciona porque módulos ES e Service Workers exigem `http://`/`https://`.

```bash
cd treino
python3 -m http.server 8080
```

Abra `http://localhost:8080` no navegador. Para testar no celular, acesse o
IP da máquina na mesma rede Wi-Fi (`http://<ip-da-maquina>:8080`), ou use o
modo de dispositivo remoto do Chrome DevTools (`chrome://inspect`).

## Checklist manual de teste

- Criar uma rotina, adicionar exercícios com séries/reps/descanso alvo, reordenar.
- Iniciar um treino, registrar séries (peso/reps via steppers), conferir o
  cronômetro de descanso (vibração/som ao zerar) e finalizar o treino.
- Abrir o histórico de um exercício e conferir se o gráfico e a lista batem
  com o que foi registrado.
- Em "Backup": exportar, simular perda de dados (DevTools → Application →
  Clear site data) e importar o arquivo para restaurar.
- Testar modo offline (DevTools → Application → Service Workers → Offline).
- Rodar uma auditoria Lighthouse (PWA) e testar "Adicionar à tela inicial"
  num celular real.

## Deploy (ex: GitHub Pages)

Publicar a pasta `treino/` como arquivos estáticos (ex: GitHub Pages
apontando para essa pasta, Netlify, Vercel etc.) — não há build, é só
servir os arquivos como estão.

Ao alterar qualquer arquivo do "app shell" (HTML/CSS/JS/ícones), atualize a
constante `CACHE_NAME` em `sw.js` (ex: `treino-v1` → `treino-v2`), senão
usuários que já instalaram o app podem continuar vendo a versão em cache.

## Backup dos dados

Os dados ficam só no navegador/celular do usuário. Use a tela de Backup
para exportar um arquivo `.json` periodicamente (o app lembra quando faz
tempo desde o último backup) e guardá-lo em algum lugar seguro (Drive,
WhatsApp, etc.). Importar um backup substitui todos os dados atuais.

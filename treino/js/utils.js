export function uuid() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDateBR(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatDateTimeBR(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function daysSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child === undefined || child === null) return;
    node.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(child) : child);
  });
  return node;
}

// Modais próprios em vez de alert/confirm/prompt nativos, para um visual e
// comportamento consistentes com o resto do app (inclusive quando instalado
// como PWA na tela inicial).
export function openModal({ title, fields = [], confirmLabel = 'OK', cancelLabel = 'Cancelar', datalist }) {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay' });

    const inputs = fields.map((f) => {
      if (f.multiline) {
        const textarea = el('textarea', {
          id: `modal-field-${f.name}`,
          placeholder: f.placeholder ?? '',
          rows: f.rows || 6,
        });
        textarea.value = f.value ?? '';
        return el('label', { class: 'modal-field' }, [f.label, textarea]);
      }
      const attrs = {
        type: f.type || 'text',
        value: f.value ?? '',
        placeholder: f.placeholder ?? '',
        id: `modal-field-${f.name}`,
        inputmode: f.type === 'number' ? 'decimal' : undefined,
        list: f.list,
      };
      return el('label', { class: 'modal-field' }, [f.label, el('input', attrs)]);
    });

    const children = [el('h2', {}, title), ...inputs];

    if (datalist) {
      children.push(el('datalist', { id: datalist.id }, datalist.options.map((opt) => el('option', { value: opt }))));
    }

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    children.push(
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn ghost', onclick: () => close(null) }, cancelLabel),
        el(
          'button',
          {
            class: 'btn primary',
            onclick: () => {
              const values = {};
              fields.forEach((f) => {
                const inputEl = card.querySelector(`#modal-field-${f.name}`);
                values[f.name] = f.type === 'number' ? Number(inputEl.value) : inputEl.value;
              });
              close(values);
            },
          },
          confirmLabel
        ),
      ])
    );

    const card = el('div', { class: 'modal-card' }, children);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const firstInput = card.querySelector('input');
    if (firstInput) firstInput.focus();
  });
}

// Modal com checkboxes pra selecionar vários itens de uma vez (ex: escolher
// vários exercícios do banco pra adicionar numa rotina de uma vez).
export function pickManyModal({ title, options, confirmLabel = 'Adicionar', cancelLabel = 'Cancelar' }) {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay' });
    const selected = new Set();

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    const confirmBtn = el(
      'button',
      { class: 'btn primary', onclick: () => close([...selected]) },
      `${confirmLabel} (0)`
    );
    confirmBtn.disabled = true;

    function updateConfirmLabel() {
      confirmBtn.textContent = `${confirmLabel} (${selected.size})`;
      confirmBtn.disabled = selected.size === 0;
    }

    const listEl = el('div', { class: 'picker-list' });

    function renderOptions(filterText) {
      listEl.innerHTML = '';
      const filtered = filterText
        ? options.filter((opt) => opt.label.toLowerCase().includes(filterText.toLowerCase()))
        : options;
      if (filtered.length === 0) {
        listEl.appendChild(el('p', { class: 'muted' }, 'Nada encontrado.'));
        return;
      }
      filtered.forEach((opt) => {
        const checkbox = el('input', { type: 'checkbox' });
        checkbox.checked = selected.has(opt.id);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selected.add(opt.id);
          else selected.delete(opt.id);
          updateConfirmLabel();
        });
        const row = el('label', { class: 'picker-row' }, [checkbox, el('span', {}, opt.label)]);
        listEl.appendChild(row);
      });
    }
    renderOptions('');

    const search = el('input', { type: 'text', placeholder: 'Buscar...', class: 'picker-search' });
    search.addEventListener('input', () => renderOptions(search.value));

    const card = el('div', { class: 'modal-card' }, [
      el('h2', {}, title),
      options.length > 6 ? search : null,
      listEl,
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn ghost', onclick: () => close(null) }, cancelLabel),
        confirmBtn,
      ]),
    ]);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}

// Modal só de leitura, pra mostrar a descrição de um exercício.
export function infoModal(title, text) {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay' });
    const close = () => {
      overlay.remove();
      resolve();
    };
    const card = el('div', { class: 'modal-card' }, [
      el('h2', {}, title),
      el('p', { class: 'modal-description' }, text),
      el('div', { class: 'modal-actions' }, [el('button', { class: 'btn primary', onclick: close }, 'Fechar')]),
    ]);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}

export function confirmModal(message, confirmLabel = 'Confirmar') {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay' });
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    const card = el('div', { class: 'modal-card' }, [
      el('p', {}, message),
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn ghost', onclick: () => close(false) }, 'Cancelar'),
        el('button', { class: 'btn danger', onclick: () => close(true) }, confirmLabel),
      ]),
    ]);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}

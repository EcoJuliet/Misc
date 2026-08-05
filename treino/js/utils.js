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

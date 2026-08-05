const routes = [];
let currentCleanup = null;

export function route(pattern, handler) {
  const paramNames = [];
  const regexBody = pattern.replace(/:[^/]+/g, (segment) => {
    paramNames.push(segment.slice(1));
    return '([^/]+)';
  });
  routes.push({ regex: new RegExp(`^${regexBody}$`), paramNames, handler });
}

async function resolve() {
  const hash = location.hash.slice(1) || '/';
  for (const r of routes) {
    const match = hash.match(r.regex);
    if (!match) continue;
    const params = {};
    r.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));

    if (typeof currentCleanup === 'function') currentCleanup();
    currentCleanup = null;

    currentCleanup = await r.handler(params);
    return;
  }
  location.hash = '#/';
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function navigate(hash) {
  if (location.hash === hash) {
    resolve();
  } else {
    location.hash = hash;
  }
}

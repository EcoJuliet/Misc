export function renderSparkline(points, { width = 300, height = 80, padding = 10 } = {}) {
  if (points.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Ainda não há dados suficientes para o gráfico.';
    return empty;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? padding + i * stepX : width / 2;
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'sparkline');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Evolução de carga máxima por treino');

  if (coords.length > 1) {
    const polyline = document.createElementNS(svgNS, 'polyline');
    polyline.setAttribute('points', coords.map(([x, y]) => `${x},${y}`).join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', 'currentColor');
    polyline.setAttribute('stroke-width', '2');
    polyline.setAttribute('stroke-linejoin', 'round');
    polyline.setAttribute('stroke-linecap', 'round');
    svg.appendChild(polyline);
  }

  coords.forEach(([x, y]) => {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '3.5');
    circle.setAttribute('fill', 'currentColor');
    svg.appendChild(circle);
  });

  return svg;
}

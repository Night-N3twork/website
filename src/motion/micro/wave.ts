const WAVE_REACH = 2.5;

export function footWave(): void {
  const word = document.querySelector<HTMLElement>('.foot-word');
  if (!word) return;
  const chars = (): NodeListOf<HTMLElement> => word.querySelectorAll<HTMLElement>('.foot-char');
  word.addEventListener('pointermove', (e) =>
    chars().forEach((c) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2)) / r.width;
      c.style.setProperty('--wave', Math.max(0, 1 - d / WAVE_REACH).toFixed(3));
    }),
  );
  word.addEventListener('pointerleave', () => chars().forEach((c) => c.style.setProperty('--wave', '0')));
}

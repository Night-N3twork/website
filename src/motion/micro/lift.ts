const LIFT_FALLOFF = 0.45;

export function liftGroups(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-lift-group]').forEach((group) => {
    if (group.dataset.lifting) return;
    group.dataset.lifting = '';
    const items = (): HTMLElement[] => [...group.querySelectorAll<HTMLElement>('[data-lift]')];
    const lift = (index: number): void =>
      items().forEach((el, i) => {
        el.style.setProperty('--lift', index < 0 ? '0' : (LIFT_FALLOFF ** Math.abs(i - index)).toFixed(3));
        el.dataset.lift = index < 0 ? 'out' : 'in';
      });
    group.addEventListener('pointerover', (e) => {
      const index = items().indexOf((e.target as Element).closest?.('[data-lift]') as HTMLElement);
      if (index >= 0) lift(index);
    });
    group.addEventListener('pointerleave', () => lift(-1));
  });
}

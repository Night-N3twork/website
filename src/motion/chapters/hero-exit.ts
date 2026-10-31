import gsap from 'gsap';

export function heroExit(main: HTMLElement): void {
  const hero = main.querySelector<HTMLElement>('.sec-hero');
  if (!hero) return;
  const kids = [...hero.querySelectorAll<HTMLElement>('.copy > *')];
  const pill = hero.querySelector('.pill');
  const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: 0.5 }, defaults: { ease: 'none' } });
  tl.to(kids.filter((el) => !el.matches('.pill')), { autoAlpha: 0, y: -48, filter: 'blur(6px)', stagger: 0.05 }, 0);
  if (pill) tl.to(pill, { autoAlpha: 0, y: -48 }, 0);
  tl.to(hero.querySelectorAll('.stat, .cue'), { autoAlpha: 0, y: -28, filter: 'blur(4px)' }, 0);
}

let claimed = false;

export function claimFirstLoad(): boolean {
  if (claimed) return false;
  claimed = true;
  return true;
}

let resolveIntro: () => void = () => undefined;
const intro = new Promise<void>((resolve) => (resolveIntro = resolve));

export const introFinished = (): Promise<void> => intro;
export const markIntroFinished = (): void => resolveIntro();

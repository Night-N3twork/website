import type { MouseEvent } from 'react';

export function SkipLink({ label }: { label: string }) {
  const skip = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    document.getElementById('main')?.focus();
  };
  return (
    <a className="skip" href="#main" onClick={skip}>
      {label}
    </a>
  );
}

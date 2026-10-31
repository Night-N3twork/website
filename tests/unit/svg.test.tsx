import { createElement, memo } from 'react';
import { describe, expect, it } from 'vitest';
import { BodyArt } from '@/lib/art/BodyArt';
import { toSvg } from '@/lib/svg';

describe('toSvg', () => {
  it('serialises host elements, kebab-casing only the presentation attributes', () => {
    const svg = toSvg(
      <svg viewBox="0 0 10 10" className="x">
        <mask id="m" maskUnits="userSpaceOnUse">
          <rect width={10} height={10} />
        </mask>
        <circle cx={5} cy={5} r={2} strokeWidth={1.5} fillOpacity="0.5" focusable={false} data-skip={undefined} />
        <filter id="f">
          <feGaussianBlur stdDeviation={2} />
        </filter>
        <text>{'a < b'}</text>
      </svg>,
    );
    expect(svg).toBe(
      '<svg viewBox="0 0 10 10" class="x"><mask id="m" maskUnits="userSpaceOnUse"><rect width="10" height="10"/></mask><circle cx="5" cy="5" r="2" stroke-width="1.5" fill-opacity="0.5"/><filter id="f"><feGaussianBlur stdDeviation="2"/></filter><text>a &lt; b</text></svg>',
    );
  });

  it('expands fragments and function components', () => {
    const Dot = ({ r }: { r: number }) => (
      <>
        <circle r={r} />
        {[1, 2].map((n) => <line key={n} x1={n} />)}
      </>
    );
    expect(toSvg(<Dot r={3} />)).toBe('<circle r="3"/><line x1="1"/><line x1="2"/>');
  });

  it('throws on props and element types it cannot serialise', () => {
    const Memo = memo(function Group() {
      return <g />;
    });
    expect(() => toSvg(<rect style={{ fill: 'red' }} />)).toThrow('style');
    expect(() => toSvg(createElement('rect', { fooBar: 1 }))).toThrow('fooBar');
    expect(() => toSvg(<Memo />)).toThrow('object');
  });

  it('renders a celestial body with literal colours and no CSS variables', () => {
    const svg = toSvg(<BodyArt kind="space" size={200} />);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"')).toBe(true);
    expect(svg).toContain('<radialGradient id="g">');
    expect(svg).toContain('stop-color="#E8C88A"');
    expect(svg).not.toContain('var(--');
  });
});

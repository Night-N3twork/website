import { render, screen } from '@testing-library/react';
import { createRoutesStub, Outlet } from 'react-router';
import { describe, expect, it } from 'vitest';
import { rootLost } from '@/app/head';
import { buildPath, targetAt } from '@/scene/path';
import { Lost, RouteError } from '@/ui/glass/Lost';

const COPY = { title: 'Gone', lede: 'Nothing here.', cta: 'Back' };
const ROOT = { notFound: { meta: 'Missing', ...COPY }, serverError: { meta: 'Broken', title: 'It broke', lede: 'Reload.', cta: 'Back' } };
const NOT_FOUND = { status: 404, statusText: 'Not Found', internal: false, data: null };

function Boom(): never {
  throw new Error('boom');
}

function section(status: number): HTMLElement {
  const Stub = createRoutesStub([{ path: '/', Component: () => <Lost status={status} copy={COPY} /> }]);
  const { container } = render(<Stub initialEntries={['/']} />);
  return container.querySelector('section') as HTMLElement;
}

describe('error pages and the moon', () => {
  it('keeps the moon in the 0 of a 404 but leaves it out of a server error, with the same layout', () => {
    const lost = section(404);
    const fault = section(500);
    expect(lost.dataset.frame).toBe('lost');
    expect(fault.dataset.frame).toBe('fault');
    expect(fault.classList.contains('sec-lost')).toBe(true);
  });

  it('shrinks the moon and its glow to nothing on a server error', () => {
    const target = targetAt(['fault'], buildPath(['fault'], { halfW: 5, halfH: 3, narrow: false }), 0);
    expect(target.s).toBe(0);
    expect(target.g).toBe(0);
  });

  it('tells a server error apart from a missing page', async () => {
    const Stub = createRoutesStub([{ id: 'root', path: '/', loader: () => ROOT, Component: Outlet, ErrorBoundary: RouteError, children: [{ path: 'boom', Component: Boom }] }]);
    render(<Stub initialEntries={['/boom']} />);
    expect(await screen.findByRole('heading', { name: 'It broke' })).toBeTruthy();
    expect(screen.getByText('Reload.')).toBeTruthy();
  });

  it('names a server error in the page title', () => {
    const matches = [{ id: 'root', loaderData: ROOT }];
    expect(rootLost(matches, new Error('boom'))?.meta).toBe('Broken');
    expect(rootLost(matches, NOT_FOUND)?.meta).toBe('Missing');
    expect(rootLost(matches)?.meta).toBe('Missing');
  });
});

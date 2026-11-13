import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chip } from '@/ui/glass/parts';
import { StatusPanel } from '@/ui/glass/projects/StatusPanel';

const STATUS = {
  title: 'Status',
  slug: 'nova',
  stage: 'live' as const,
  stageLabel: 'Live',
  group: 'Platform',
  line: 'Runtimes.',
  partner: null,
  up: 'Up',
  down: 'Down',
  checked: 'Last checked {time}',
  released: 'Released {date}',
};

describe('release numbers', () => {
  it('adds the version to the stage chip of a published package', () => {
    const { container } = render(<Chip stage="building" label="In development" slug="dusk" />);
    expect(container.textContent).toBe('In developmentv1.0.1');
    expect(screen.getByText('v1.0.1')).toHaveClass('chip-version');
  });

  it('leaves the chip alone for projects without a release', () => {
    const { container } = render(<Chip stage="beta" label="Beta" slug="ddx" />);
    expect(container.textContent).toBe('Beta');
  });

  it('shows the release date in the status card', () => {
    const { container } = render(<StatusPanel copy={STATUS} locale="en" monitorId={null} initial={null} />);
    const line = container.querySelector('.status-release');
    expect(line?.textContent).toBe('Released Nov 1, 2026');
    expect(line?.querySelector('time')).toHaveAttribute('datetime', '2026-11-01');
  });

  it('has no release line for an unpublished project', () => {
    render(<StatusPanel copy={{ ...STATUS, slug: 'ddx' }} locale="en" monitorId={null} initial={null} />);
    expect(screen.queryByText(/Released/)).toBeNull();
  });
});

import { useRef } from 'react';
import type { Stage } from '@/content/projects';
import type { StatusMonitor } from '@/lib/data/status-poll';
import { Chip } from '../parts';
import { useLiveStatus } from './useLiveStatus';

export interface StatusCopy {
  title: string;
  stage: Stage;
  stageLabel: string;
  group: string;
  line: string;
  partner: string | null;
  up: string;
  down: string;
  checked: string;
}

interface StatusPanelProps {
  copy: StatusCopy;
  locale: string;
  monitorId: number | null;
  initial: StatusMonitor | null;
}

const CLOCK = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' } as const;

function checkedAt(template: string, iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return template.replace('{time}', new Intl.DateTimeFormat(locale, CLOCK).format(new Date(iso)));
}

function LiveLine({ value, copy, locale }: { value: StatusMonitor | null; copy: StatusCopy; locale: string }) {
  const state = value?.status === 'up' || value?.status === 'down' ? value.status : null;
  const checked = state && value ? checkedAt(copy.checked, value.lastCheck, locale) : null;
  return (
    <div className="status-live" data-state={state ?? undefined}>
      <p className="status-state" aria-live="polite">
        {state ? <span className="status-label">{copy[state]}</span> : null}
      </p>
      <p className="status-checked" suppressHydrationWarning>
        {checked}
      </p>
    </div>
  );
}

export function StatusPanel({ copy, locale, monitorId, initial }: StatusPanelProps) {
  const panel = useRef<HTMLElement>(null);
  const value = useLiveStatus(monitorId, initial, panel);
  return (
    <aside className="detail-status cut" data-reveal="" aria-label={copy.title} ref={panel}>
      <h2 className="eyebrow">{copy.title}</h2>
      <p className="status-stage">
        <Chip stage={copy.stage} label={copy.stageLabel} />
      </p>
      {monitorId === null ? null : <LiveLine value={value} copy={copy} locale={locale} />}
      <p className="status-group">{copy.group}</p>
      <p className="status-line">{copy.line}</p>
      {copy.partner ? <p className="status-partner">{copy.partner}</p> : null}
    </aside>
  );
}

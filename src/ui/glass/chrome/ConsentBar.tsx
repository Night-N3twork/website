import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AnalyticsTags } from '@/lib/analytics';
import { loadAnalytics, stopAnalytics } from '@/lib/analytics-loader';
import { browserStorage, CONSENT_EVENT, readConsent, writeConsent } from '@/lib/consent';
import { TransitionLink } from '@/navigation/TransitionLink';

export type ConsentLabels = { text: string; accept: string; decline: string; privacy: string; region: string };

const UNREAD = 'unread';
const quiet = () => () => {};
const storedConsent = () => readConsent(browserStorage());
const serverConsent = () => UNREAD;

export function ConsentBar({ tags, labels }: { tags: AnalyticsTags; labels: ConsentLabels }) {
  const stored = useSyncExternalStore(quiet, storedConsent, serverConsent);
  const [shown, setShown] = useState<boolean | null>(null);
  const decided = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const { id, loader, setup } = tags;

  useEffect(() => {
    if (decided.current) return;
    if (readConsent(browserStorage()) === 'granted') loadAnalytics({ id, loader, setup });
  }, [id, loader, setup]);

  useEffect(() => {
    const reopen = (): void => {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
      setShown(true);
    };
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  const choose = (value: 'granted' | 'denied'): void => {
    decided.current = true;
    writeConsent(browserStorage(), value);
    if (value === 'granted') loadAnalytics(tags);
    else stopAnalytics(tags);
    setShown(false);
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected) target.focus();
  };

  const visible = shown ?? stored === null;
  if (!visible) return null;
  return (
    <section className="consent cut" aria-label={labels.region}>
      <p className="consent-text">
        {labels.text}{' '}
        <TransitionLink className="consent-link" to="/privacy">
          {labels.privacy}
        </TransitionLink>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-ghost consent-choice" onClick={() => choose('granted')}>
          {labels.accept}
        </button>
        <button type="button" className="btn btn-ghost consent-choice" onClick={() => choose('denied')}>
          {labels.decline}
        </button>
      </div>
    </section>
  );
}

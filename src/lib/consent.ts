export type Consent = 'granted' | 'denied' | null;

export const CONSENT_KEY = 'night-consent';
export const CONSENT_EVENT = 'night:consent-open';

export function readConsent(storage: Pick<Storage, 'getItem'> | null): Consent {
  if (!storage) return null;
  try {
    const value = storage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(storage: Pick<Storage, 'setItem'> | null, value: 'granted' | 'denied'): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CONSENT_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function openConsent(target: EventTarget = window): void {
  target.dispatchEvent(new Event(CONSENT_EVENT));
}

export type Fact<T> = { readonly status: 'open' } | { readonly status: 'resolved'; readonly value: T };

export type LegalFacts = {
  governingState: Fact<string>;
  ticketChannel: Fact<string>;
  responder: Fact<string>;
  captchaFields: Fact<string>;
  noOtherDestinationLogs: Fact<true>;
  appLogs: Fact<string>;
  mullvadLive: Fact<boolean>;
};

export type LegalStage = 'held' | 'preview' | 'live';

export const LEGAL_FACTS: LegalFacts = {
  governingState: { status: 'open' },
  ticketChannel: { status: 'open' },
  responder: { status: 'open' },
  captchaFields: { status: 'open' },
  noOtherDestinationLogs: { status: 'open' },
  appLogs: { status: 'open' },
  mullvadLive: { status: 'open' },
};

const FACT_TOKEN = /\{fact:(\w+)\}/g;

export function legalStage(facts: LegalFacts, preview: boolean): LegalStage {
  if (Object.values(facts).every((fact) => fact.status === 'resolved')) return 'live';
  return preview ? 'preview' : 'held';
}

export function factText(facts: LegalFacts, key: keyof LegalFacts): string {
  const fact = facts[key];
  return fact.status === 'resolved' ? String(fact.value) : `⟦open: ${key}⟧`;
}

export function fillFacts(text: string, facts: LegalFacts): string {
  return text.replace(FACT_TOKEN, (token, key: string) => (Object.hasOwn(facts, key) ? factText(facts, key as keyof LegalFacts) : token));
}
